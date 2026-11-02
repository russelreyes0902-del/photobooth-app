import { useState, useEffect, useRef, useCallback } from 'react';
import { playCountdownBeep, playShutterSound } from '../utils/audio';

export function isMobileOrTabletDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAndroid = /Android/i.test(ua);
  return isIOS || isIPadOS || isAndroid;
}

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [isMirrored, setIsMirrored] = useState(true);
  const [lensMode, setLensMode] = useState('1x'); // '1x' | '0.5x'
  const [hasHardwareUltraWide, setHasHardwareUltraWide] = useState(false);
  const [ultraWideDeviceId, setUltraWideDeviceId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isHttpsNeeded, setIsHttpsNeeded] = useState(false);

  // Burst capture state
  const [isCapturingBurst, setIsCapturingBurst] = useState(false);
  const [burstProgress, setBurstProgress] = useState(0); // 0 to 4
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, null
  const [isFlashing, setIsFlashing] = useState(false);
  const [countdownDelay, setCountdownDelay] = useState(3); // 3s or 5s delay

  const isMobileOrTablet = isMobileOrTabletDevice();

  // Enumerate video devices and detect actual hardware ultra-wide camera
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setHasHardwareUltraWide(false);
        return;
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);

      // Check for hardware ultra-wide camera label
      const ultraWide = videoInputs.find(d => {
        const lbl = (d.label || '').toLowerCase();
        return (
          lbl.includes('ultra') ||
          lbl.includes('0.5') ||
          lbl.includes('wide-angle') ||
          lbl.includes('ultrawide') ||
          lbl.includes('fov')
        );
      });

      const frontCameras = videoInputs.filter(d => {
        const lbl = (d.label || '').toLowerCase();
        return lbl.includes('front') || lbl.includes('user');
      });

      if (ultraWide) {
        setHasHardwareUltraWide(true);
        setUltraWideDeviceId(ultraWide.deviceId);
      } else if (frontCameras.length > 1) {
        setHasHardwareUltraWide(true);
        setUltraWideDeviceId(frontCameras[1].deviceId);
      } else if (isMobileOrTablet) {
        // Modern iPads have a single 12MP ultra-wide front sensor (122° FOV)
        // WebKit streams the raw 0.5x ultra-wide view, which can be cropped to 1x
        setHasHardwareUltraWide(true);
        setUltraWideDeviceId(null);
      } else {
        // Desktop / Laptop webcams are fixed 1x standard lenses
        setHasHardwareUltraWide(false);
        setUltraWideDeviceId(null);
        setLensMode('1x');
      }
    } catch (err) {
      console.warn('Error enumerating devices safely:', err);
      setHasHardwareUltraWide(false);
    }
  }, [isMobileOrTablet]);

  // Apply native WebRTC zoom constraint if supported by browser/hardware
  const applyNativeZoomIfSupported = useCallback(async (mediaStream, mode) => {
    try {
      if (!mediaStream) return;
      const track = mediaStream.getVideoTracks()?.[0];
      if (!track || typeof track.getCapabilities !== 'function') return;

      const capabilities = track.getCapabilities();
      if (capabilities.zoom) {
        const minZ = capabilities.zoom.min || 1.0;
        const maxZ = capabilities.zoom.max || 3.0;
        // 0.5x = full wide (min zoom); 1x = standard crop (e.g. 1.4x)
        const targetZoom = mode === '0.5x' ? minZ : Math.min(maxZ, 1.4);
        await track.applyConstraints({
          advanced: [{ zoom: targetZoom }],
        });
      }
    } catch (e) {
      console.debug('Native zoom constraint not applied or unsupported:', e);
    }
  }, []);

  // Start or restart video stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setPermissionError(null);
    setIsHttpsNeeded(false);

    // Secure context check for iOS Safari & iPadOS
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecure = window.isSecureContext || isLocalhost || window.location.protocol === 'https:';

      if (!isSecure || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasPermission(false);
        setIsLoading(false);
        setIsHttpsNeeded(true);
        setPermissionError(
          'Safari & iPadOS block camera access over plain HTTP network addresses. Please open the secure HTTPS URL on your iPad.'
        );
        return;
      }
    }

    // Safely stop existing stream tracks
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
        streamRef.current = null;
      }
    } catch (e) {}

    let newStream = null;

    // Attempt 1: Try specific requested deviceId or facingMode
    try {
      let targetDeviceId = selectedDeviceId;
      if (lensMode === '0.5x' && ultraWideDeviceId) {
        targetDeviceId = ultraWideDeviceId;
      }

      const constraints = {
        audio: false,
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : {
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      };

      newStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err1) {
      console.warn('Attempt 1 with optimal constraints failed, trying fallback...', err1);

      // Attempt 2: Fall back to basic facingMode without resolution constraints
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facingMode },
        });
      } catch (err2) {
        console.warn('Attempt 2 with facingMode failed, trying generic video...', err2);

        // Attempt 3: Fall back to any available video stream
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        } catch (err3) {
          console.error('All camera initialization attempts failed:', err3);
          setHasPermission(false);
          if (err3.name === 'NotAllowedError') {
            setPermissionError('Camera permission was denied. Please allow camera permissions in Safari / browser settings.');
          } else if (err3.name === 'NotFoundError' || err3.name === 'DevicesNotFoundError') {
            setPermissionError('No camera device was detected on your system.');
          } else if (err3.name === 'NotReadableError' || err3.name === 'TrackStartError') {
            setPermissionError('Camera is already in use by another app. Please close other camera apps and retry.');
          } else {
            setPermissionError(err3.message || 'Unable to access camera.');
          }
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      streamRef.current = newStream;
      setStream(newStream);

      // Apply zoom if device driver supports it
      await applyNativeZoomIfSupported(newStream, lensMode);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.debug('Autoplay initiated on stream attach', playErr);
        }
      }

      setHasPermission(true);
      setIsLoading(false);
      await refreshDevices();
    } catch (postAttachErr) {
      console.warn('Post-stream attach error:', postAttachErr);
      setIsLoading(false);
    }
  }, [selectedDeviceId, facingMode, lensMode, ultraWideDeviceId, refreshDevices, applyNativeZoomIfSupported]);

  // Initial mount lifecycle
  useEffect(() => {
    startCamera();

    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => {
            try { t.stop(); } catch (e) {}
          });
        }
      } catch (e) {}
    };
  }, [startCamera]);

  // Flip front / back camera safely
  const toggleFacingMode = useCallback(() => {
    try {
      const nextMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(nextMode);
      setSelectedDeviceId('');
      setIsMirrored(nextMode === 'user');
    } catch (err) {
      console.warn('Error toggling facing mode:', err);
    }
  }, [facingMode]);

  // Toggle lens mode (1x vs 0.5x)
  const toggleLensMode = useCallback(() => {
    try {
      if (!hasHardwareUltraWide) {
        setLensMode('1x');
        return;
      }
      const nextLens = lensMode === '1x' ? '0.5x' : '1x';
      setLensMode(nextLens);

      // If hardware deviceId switching is available
      if (ultraWideDeviceId) {
        // Trigger camera restart with new deviceId
      } else if (streamRef.current) {
        applyNativeZoomIfSupported(streamRef.current, nextLens);
      }
    } catch (err) {
      console.warn('Error toggling lens mode:', err);
    }
  }, [hasHardwareUltraWide, lensMode, ultraWideDeviceId, applyNativeZoomIfSupported]);

  // Toggle mirror manually
  const toggleMirror = useCallback(() => {
    try {
      setIsMirrored(prev => !prev);
    } catch (err) {
      console.warn('Error toggling mirror:', err);
    }
  }, []);

  // Single frame grab from video element with full safety guards and accurate lens crop
  const grabFrame = useCallback(() => {
    try {
      const video = videoRef.current;
      if (!video) return null;

      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      if (vw <= 0 || vh <= 0) return null;

      const canvas = document.createElement('canvas');
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.save();
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      // On iPad/iPhone:
      // The physical front camera is a 122° ultra-wide sensor (0.5x).
      // In 1x mode, standard portrait crop (1.38x) is applied to match the viewfinder.
      // In 0.5x mode, the full uncropped wide frame is captured.
      const shouldCrop1x = isMobileOrTablet && lensMode === '1x' && !ultraWideDeviceId;
      if (shouldCrop1x) {
        const cropScale = 1.38;
        const sw = vw / cropScale;
        const sh = vh / cropScale;
        const sx = (vw - sw) / 2;
        const sy = (vh - sh) / 2;
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      return { dataUrl, width: canvas.width, height: canvas.height };
    } catch (err) {
      console.error('Safe grabFrame caught error:', err);
      return null;
    }
  }, [isMirrored, isMobileOrTablet, lensMode, ultraWideDeviceId]);

  // Burst capture sequence with robust error isolation & cleanup
  const startBurstCapture = useCallback(async (onPhotoCaptured, onComplete) => {
    if (isCapturingBurst) return;

    try {
      setIsCapturingBurst(true);
      setBurstProgress(0);

      const capturedPhotos = [];
      const totalShots = 4;

      for (let shot = 0; shot < totalShots; shot++) {
        setBurstProgress(shot);

        // Countdown delay loop
        const delay = Math.max(1, countdownDelay || 3);
        for (let c = delay; c > 0; c--) {
          setCountdown(c);
          try {
            playCountdownBeep(false);
          } catch (e) {}
          await new Promise(r => setTimeout(r, 950));
        }

        // Final smile cue
        setCountdown('Smile!');
        try {
          playCountdownBeep(true);
        } catch (e) {}
        await new Promise(r => setTimeout(r, 300));

        // Screen flash & shutter sound
        setIsFlashing(true);
        try {
          playShutterSound();
        } catch (e) {}

        // Capture frame safely
        const frame = grabFrame();
        if (frame) {
          capturedPhotos.push(frame);
          if (onPhotoCaptured) {
            try {
              onPhotoCaptured(frame, shot);
            } catch (cbErr) {
              console.warn('onPhotoCaptured callback warning:', cbErr);
            }
          }
        }

        setTimeout(() => setIsFlashing(false), 250);
        setCountdown(null);

        // Inter-shot breather
        if (shot < totalShots - 1) {
          await new Promise(r => setTimeout(r, 850));
        }
      }

      setBurstProgress(totalShots);
      if (onComplete) {
        try {
          onComplete(capturedPhotos);
        } catch (compErr) {
          console.warn('onComplete callback warning:', compErr);
        }
      }
    } catch (burstErr) {
      console.error('Error during burst capture sequence:', burstErr);
    } finally {
      setIsCapturingBurst(false);
      setCountdown(null);
      setIsFlashing(false);
    }
  }, [isCapturingBurst, countdownDelay, grabFrame]);

  return {
    videoRef,
    stream,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    facingMode,
    toggleFacingMode,
    isMirrored,
    toggleMirror,
    lensMode,
    setLensMode,
    toggleLensMode,
    hasHardwareUltraWide,
    isMobileOrTablet,
    isLoading,
    hasPermission,
    permissionError,
    isHttpsNeeded,
    retryCamera: startCamera,
    // Burst capture
    isCapturingBurst,
    burstProgress,
    countdown,
    isFlashing,
    countdownDelay,
    setCountdownDelay,
    startBurstCapture,
    grabFrame,
  };
}
