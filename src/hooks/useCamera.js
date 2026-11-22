import { useState, useEffect, useRef, useCallback } from 'react';
import { playCountdownBeep, playShutterSound } from '../utils/audio';
import { LiveSessionRecorder } from '../utils/liveSessionRecorder';
import { calculateViewfinderCrop } from '../utils/geometry';

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
  const cameraRequestIdRef = useRef(0);

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

  // Configurable photoshoot setup
  const [captureCount, setCaptureCount] = useState(4); // 1, 2, 3, 4, 6
  const [captureMode, setCaptureMode] = useState('auto'); // 'auto' | 'manual'
  const [countdownDelay, setCountdownDelay] = useState(3); // 0, 3, 5, 10 seconds

  // Active capture runtime state
  const [isCapturingBurst, setIsCapturingBurst] = useState(false);
  const [activeShotIndex, setActiveShotIndex] = useState(0); // currently taking shot index
  const [burstProgress, setBurstProgress] = useState(0);
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, 'Smile!', null
  const [isFlashing, setIsFlashing] = useState(false);

  const isMobileOrTablet = isMobileOrTabletDevice();

  // Single source of truth for lens optical crop scale:
  // On iPad / tablet front camera:
  // - 1x mode: 1.38x portrait crop (matches native iPad Camera app 1x mode)
  // - 0.5x mode: 1.0x uncropped full 122° wide-angle
  // On laptop / desktop single-lens webcams: strictly 1.0x
  const lensZoomScale = (isMobileOrTablet && lensMode === '1x') ? 1.38 : 1.0;

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
        const targetZoom = mode === '0.5x' ? minZ : Math.min(maxZ, 1.4);
        await track.applyConstraints({
          advanced: [{ zoom: targetZoom }],
        });
      }
    } catch (e) {
      console.debug('Native zoom constraint not applied or unsupported:', e);
    }
  }, []);

  // Start or restart video stream safely without race conditions
  const startCamera = useCallback(async () => {
    const requestId = ++cameraRequestIdRef.current;
    setIsLoading(true);
    setPermissionError(null);
    setIsHttpsNeeded(false);

    // Secure context check for iOS Safari & iPadOS
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecure = window.isSecureContext || isLocalhost || window.location.protocol === 'https:';

      if (!isSecure || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (requestId !== cameraRequestIdRef.current) return;
        setHasPermission(false);
        setIsLoading(false);
        setIsHttpsNeeded(true);
        setPermissionError(
          'Safari & iPadOS block camera access over plain HTTP network addresses. Please open the secure HTTPS URL.'
        );
        return;
      }
    }

    // Safely stop existing stream tracks before opening a new one
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
        streamRef.current = null;
      }
    } catch (e) {}

    let newStream = null;

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

      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facingMode },
        });
      } catch (err2) {
        console.warn('Attempt 2 with facingMode failed, trying generic video...', err2);

        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        } catch (err3) {
          if (requestId !== cameraRequestIdRef.current) return;
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

    // Check if this request is still the newest one
    if (requestId !== cameraRequestIdRef.current) {
      if (newStream) {
        newStream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
      }
      return;
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

      if (streamRef.current) {
        applyNativeZoomIfSupported(streamRef.current, nextLens);
      }
    } catch (err) {
      console.warn('Error toggling lens mode:', err);
    }
  }, [hasHardwareUltraWide, lensMode, applyNativeZoomIfSupported]);

  // Toggle mirror manually
  const toggleMirror = useCallback(() => {
    try {
      setIsMirrored(prev => !prev);
    } catch (err) {
      console.warn('Error toggling mirror:', err);
    }
  }, []);

  // Single frame grab from video element with 100% viewfinder-matched crop
  const grabFrame = useCallback((slotIndex = 0) => {
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

      // Exact crop matching what the user sees in the viewfinder:
      const crop = calculateViewfinderCrop(vw, vh, lensZoomScale);
      ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      return {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        slotIndex,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error('Safe grabFrame caught error:', err);
      return null;
    }
  }, [isMirrored, lensZoomScale]);

  // Run a single countdown and capture snap
  const captureOneShotWithCountdown = useCallback(async (slotIndex, delaySec) => {
    const delay = Math.max(0, delaySec ?? countdownDelay ?? 3);

    if (delay > 0) {
      for (let c = delay; c > 0; c--) {
        setCountdown(c);
        try { playCountdownBeep(false); } catch (e) {}
        await new Promise(r => setTimeout(r, 950));
      }

      setCountdown('Smile!');
      try { playCountdownBeep(true); } catch (e) {}
      await new Promise(r => setTimeout(r, 350));
    }

    // Flash & Shutter
    setIsFlashing(true);
    try { playShutterSound(); } catch (e) {}

    const frame = grabFrame(slotIndex);

    setTimeout(() => {
      setIsFlashing(false);
    }, 220);

    setCountdown(null);
    return frame;
  }, [countdownDelay, grabFrame]);

  // Retake a single photo slot without losing other shots
  const retakeSingleShot = useCallback(async (slotIndex) => {
    if (isCapturingBurst) return null;
    setIsCapturingBurst(true);
    setActiveShotIndex(slotIndex);
    try {
      const photo = await captureOneShotWithCountdown(slotIndex, countdownDelay);
      return photo;
    } finally {
      setIsCapturingBurst(false);
      setCountdown(null);
      setIsFlashing(false);
    }
  }, [isCapturingBurst, countdownDelay, captureOneShotWithCountdown]);

  // Burst capture sequence with LIVE video recording during the entire shoot
  const startBurstCapture = useCallback(async (onPhotoCaptured, onComplete, activeFilterObj = null, totalShotsParam = null) => {
    if (isCapturingBurst) return;

    let liveRecorder = null;
    const totalShots = totalShotsParam || captureCount || 4;

    try {
      setIsCapturingBurst(true);
      setBurstProgress(0);

      // Initialize live session video recorder matching exact camera photo resolution
      if (videoRef.current) {
        const camW = videoRef.current.videoWidth || 1280;
        const camH = videoRef.current.videoHeight || 720;
        liveRecorder = new LiveSessionRecorder({
          videoEl: videoRef.current,
          isMirrored,
          lensZoomScale,
          activeFilter: activeFilterObj,
          width: camW,
          height: camH,
        });
        liveRecorder.start();
      }

      const capturedPhotos = [];

      for (let shot = 0; shot < totalShots; shot++) {
        setActiveShotIndex(shot);
        setBurstProgress(shot);

        // Update recorder with current shot
        if (liveRecorder) {
          liveRecorder.updateState({
            shot: shot + 1,
            countdown: countdownDelay,
            isFlashing: false,
            lensZoomScale,
            isMirrored,
            activeFilter: activeFilterObj,
          });
        }

        // Countdown delay loop
        const delay = Math.max(0, countdownDelay ?? 3);
        if (delay > 0) {
          for (let c = delay; c > 0; c--) {
            setCountdown(c);
            if (liveRecorder) {
              liveRecorder.updateState({ countdown: c, isFlashing: false });
            }
            try { playCountdownBeep(false); } catch (e) {}
            await new Promise(r => setTimeout(r, 950));
          }

          setCountdown('Smile!');
          if (liveRecorder) {
            liveRecorder.updateState({ countdown: 'Smile!', isFlashing: false });
          }
          try { playCountdownBeep(true); } catch (e) {}
          await new Promise(r => setTimeout(r, 350));
        }

        // Screen flash & shutter sound
        setIsFlashing(true);
        if (liveRecorder) {
          liveRecorder.updateState({ isFlashing: true, countdown: null });
        }
        try { playShutterSound(); } catch (e) {}

        // Capture frame safely
        const frame = grabFrame(shot);
        if (frame) {
          capturedPhotos.push(frame);
          if (onPhotoCaptured) {
            try { onPhotoCaptured(frame, shot); } catch (cbErr) {}
          }
        }

        // Flash decay
        setTimeout(() => {
          setIsFlashing(false);
          if (liveRecorder) {
            liveRecorder.updateState({ isFlashing: false });
          }
        }, 220);

        setCountdown(null);

        // Inter-shot breather
        if (shot < totalShots - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      }

      // Brief 500ms tail to show the completed final shot in the recording
      await new Promise(r => setTimeout(r, 500));

      // Stop live video recorder and retrieve the video file
      let recordedVideo = null;
      if (liveRecorder) {
        recordedVideo = await liveRecorder.stop();
      }

      setBurstProgress(totalShots);
      if (onComplete) {
        try {
          onComplete(capturedPhotos, recordedVideo);
        } catch (compErr) {
          console.warn('onComplete callback warning:', compErr);
        }
      }
    } catch (burstErr) {
      console.error('Error during burst capture sequence:', burstErr);
      if (liveRecorder) {
        try { await liveRecorder.stop(); } catch (e) {}
      }
    } finally {
      setIsCapturingBurst(false);
      setCountdown(null);
      setIsFlashing(false);
    }
  }, [isCapturingBurst, captureCount, countdownDelay, grabFrame, isMirrored, lensZoomScale]);

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
    lensZoomScale,
    isLoading,
    hasPermission,
    permissionError,
    isHttpsNeeded,
    retryCamera: startCamera,
    // Photoshoot Configuration
    captureCount,
    setCaptureCount,
    captureMode,
    setCaptureMode,
    countdownDelay,
    setCountdownDelay,
    // Burst & Retake
    isCapturingBurst,
    activeShotIndex,
    burstProgress,
    countdown,
    isFlashing,
    startBurstCapture,
    retakeSingleShot,
    grabFrame,
  };
}
