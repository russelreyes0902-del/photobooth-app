import { useState, useEffect, useRef, useCallback } from 'react';
import { playCountdownBeep, playShutterSound } from '../utils/audio.js';
import { LiveSessionRecorder } from '../utils/liveSessionRecorder.js';
import { calculateViewfinderCrop } from '../utils/geometry.js';
import { detectCapabilities } from '../utils/capabilities.js';

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraRequestIdRef = useRef(0);
  const activeSessionAbortRef = useRef(false);

  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [isMirrored, setIsMirrored] = useState(true);
  const [framingMode, setFramingMode] = useState('1x'); // '1x' | '0.5x'
  const [hasHardwareUltraWide, setHasHardwareUltraWide] = useState(false);
  const [hasNativeZoomSupport, setHasNativeZoomSupport] = useState(false);
  const [ultraWideDeviceId, setUltraWideDeviceId] = useState(null);

  // Quality profile
  const [captureQuality, setCaptureQuality] = useState('high'); // 'auto' | 'high' | 'max'
  const [activeResolution, setActiveResolution] = useState(null); // { width, height }

  // Lifecycle & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null); // { type, message }

  // Photoshoot setup
  const [captureCount, setCaptureCount] = useState(4); // 1, 2, 3, 4, 6
  const [captureMode, setCaptureMode] = useState('auto'); // 'auto' | 'manual'
  const [countdownDelay, setCountdownDelay] = useState(3); // 0, 3, 5, 10 seconds

  // Runtime capture state
  const [isCapturingBurst, setIsCapturingBurst] = useState(false);
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const [burstProgress, setBurstProgress] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Framing scale calculation:
  // If user selected 0.5x (wide) framing: scale 1.0 (uncropped full FOV)
  // If user selected 1x framing: crop 1.38x to match standard portrait framing
  const lensZoomScale = framingMode === '1x' ? 1.38 : 1.0;

  // Enumerate video devices and detect physical capabilities
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setHasHardwareUltraWide(false);
        return;
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);

      // Check for explicit hardware ultra-wide label
      const ultraWide = videoInputs.find(d => {
        const lbl = (d.label || '').toLowerCase();
        return (
          lbl.includes('ultra') ||
          lbl.includes('0.5') ||
          lbl.includes('wide-angle') ||
          lbl.includes('ultrawide')
        );
      });

      if (ultraWide) {
        setHasHardwareUltraWide(true);
        setUltraWideDeviceId(ultraWide.deviceId);
      } else {
        setHasHardwareUltraWide(false);
        setUltraWideDeviceId(null);
      }
    } catch (err) {
      console.warn('Error enumerating devices safely:', err);
      setHasHardwareUltraWide(false);
    }
  }, []);

  // Apply native WebRTC hardware zoom constraint if supported
  const applyNativeZoomIfSupported = useCallback(async (mediaStream, mode) => {
    try {
      if (!mediaStream) return;
      const track = mediaStream.getVideoTracks()?.[0];
      if (!track || typeof track.getCapabilities !== 'function') return;

      const capabilities = track.getCapabilities();
      if (capabilities.zoom) {
        setHasNativeZoomSupport(true);
        const minZ = capabilities.zoom.min || 1.0;
        const maxZ = capabilities.zoom.max || 3.0;
        const targetZoom = mode === '0.5x' ? minZ : Math.min(maxZ, 1.4);
        await track.applyConstraints({
          advanced: [{ zoom: targetZoom }],
        });
      } else {
        setHasNativeZoomSupport(false);
      }
    } catch (e) {
      setHasNativeZoomSupport(false);
    }
  }, []);

  // Start or restart camera stream
  const startCamera = useCallback(async () => {
    const requestId = ++cameraRequestIdRef.current;
    setIsLoading(true);
    setErrorDetails(null);

    const caps = detectCapabilities();

    // Check secure context
    if (!caps.isSecure) {
      if (requestId !== cameraRequestIdRef.current) return;
      setHasPermission(false);
      setIsLoading(false);
      setErrorDetails({
        type: 'insecure_context',
        message: 'Camera access requires a secure HTTPS connection or localhost.',
      });
      return;
    }

    if (!caps.hasMediaDevices) {
      if (requestId !== cameraRequestIdRef.current) return;
      setHasPermission(false);
      setIsLoading(false);
      setErrorDetails({
        type: 'unsupported_api',
        message: 'Camera API (navigator.mediaDevices.getUserMedia) is not supported in this browser.',
      });
      return;
    }

    // Safely stop previous stream tracks before allocating a new one
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
        streamRef.current = null;
      }
    } catch (e) {}

    let newStream = null;

    // Quality resolution profile
    let idealWidth = 1920;
    let idealHeight = 1080;
    if (captureQuality === 'max') {
      idealWidth = 3840;
      idealHeight = 2160;
    } else if (captureQuality === 'auto') {
      idealWidth = 1920;
      idealHeight = 1080;
    }

    try {
      let targetDeviceId = selectedDeviceId;
      if (framingMode === '0.5x' && ultraWideDeviceId) {
        targetDeviceId = ultraWideDeviceId;
      }

      const constraints = {
        audio: false,
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: idealWidth }, height: { ideal: idealHeight } }
          : {
              facingMode,
              width: { ideal: idealWidth },
              height: { ideal: idealHeight },
            },
      };

      newStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err1) {
      // Fallback 1: Try without exact resolution constraints
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode },
        });
      } catch (err2) {
        // Fallback 2: Basic generic video constraint
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        } catch (err3) {
          if (requestId !== cameraRequestIdRef.current) return;

          let errType = 'unknown';
          let errMsg = err3.message || 'Unable to access camera device.';

          if (err3.name === 'NotAllowedError' || err3.name === 'PermissionDeniedError') {
            errType = 'permission_denied';
            errMsg = 'Camera permission was denied. Please allow camera permissions in browser settings.';
          } else if (err3.name === 'NotFoundError' || err3.name === 'DevicesNotFoundError') {
            errType = 'not_found';
            errMsg = 'No camera device was detected on your system.';
          } else if (err3.name === 'NotReadableError' || err3.name === 'TrackStartError') {
            errType = 'in_use';
            errMsg = 'Camera is already in use by another application. Please close other camera apps and retry.';
          } else if (err3.name === 'OverconstrainedError') {
            errType = 'overconstrained';
            errMsg = 'The requested camera resolution is not supported by your camera hardware.';
          }

          setHasPermission(false);
          setIsLoading(false);
          setErrorDetails({ type: errType, message: errMsg });
          return;
        }
      }
    }

    // Verify this is still the active request
    if (requestId !== cameraRequestIdRef.current) {
      if (newStream) {
        newStream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
      }
      return;
    }

    try {
      streamRef.current = newStream;
      setStream(newStream);

      const track = newStream.getVideoTracks()?.[0];
      if (track) {
        const settings = track.getSettings?.() || {};
        if (settings.width && settings.height) {
          setActiveResolution({ width: settings.width, height: settings.height });
        }
      }

      await applyNativeZoomIfSupported(newStream, framingMode);

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
  }, [selectedDeviceId, facingMode, framingMode, ultraWideDeviceId, captureQuality, refreshDevices, applyNativeZoomIfSupported]);

  // Initial mount lifecycle
  useEffect(() => {
    startCamera();

    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => {
            try { t.stop(); } catch (e) {}
          });
          streamRef.current = null;
        }
      } catch (e) {}
    };
  }, [startCamera]);

  // Flip front / rear camera
  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setSelectedDeviceId('');
    setIsMirrored(nextMode === 'user');
  }, [facingMode]);

  // Toggle framing mode (1x vs 0.5x)
  const toggleFramingMode = useCallback(() => {
    const nextFraming = framingMode === '1x' ? '0.5x' : '1x';
    setFramingMode(nextFraming);

    if (streamRef.current) {
      applyNativeZoomIfSupported(streamRef.current, nextFraming);
    }
  }, [framingMode, applyNativeZoomIfSupported]);

  // Toggle mirror
  const toggleMirror = useCallback(() => {
    setIsMirrored(prev => !prev);
  }, []);

  /**
   * HIGH-FIDELITY STILL CAPTURE
   * Preferred: Native ImageCapture.takePhoto() when supported by the active track.
   * Fallback: High-resolution video frame grab onto Canvas.
   */
  const capturePhoto = useCallback(async (slotIndex = 0) => {
    const video = videoRef.current;
    const track = streamRef.current?.getVideoTracks()?.[0];

    // PATH 1: Native ImageCapture API (Highest Photographic Quality)
    if (typeof window !== 'undefined' && 'ImageCapture' in window && track && track.readyState === 'live') {
      try {
        const imageCapture = new ImageCapture(track);
        const photoBlob = await imageCapture.takePhoto();

        if (photoBlob && photoBlob.size > 0) {
          const blobUrl = URL.createObjectURL(photoBlob);
          const img = await new Promise((res, rej) => {
            const im = new Image();
            im.onload = () => res(im);
            im.onerror = rej;
            im.src = blobUrl;
          });

          const nw = img.naturalWidth || img.width;
          const nh = img.naturalHeight || img.height;

          // If mirrored or lensZoomScale is applied (e.g. 1x framing crop vs 0.5x wide),
          // render to high-res canvas at native sensor resolution so the photo matches
          // the exact framing shown in the viewfinder!
          if (isMirrored || (lensZoomScale && lensZoomScale !== 1.0)) {
            const highResCanvas = document.createElement('canvas');
            highResCanvas.width = nw;
            highResCanvas.height = nh;
            const hrCtx = highResCanvas.getContext('2d', { willReadFrequently: true });

            if (hrCtx) {
              hrCtx.save();
              if (isMirrored) {
                hrCtx.translate(nw, 0);
                hrCtx.scale(-1, 1);
              }
              const crop = calculateViewfinderCrop(nw, nh, lensZoomScale);
              hrCtx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, nw, nh);
              hrCtx.restore();

              const processedBlob = await new Promise((resolve) => {
                highResCanvas.toBlob((b) => resolve(b), photoBlob.type || 'image/jpeg', 0.98);
              });

              if (processedBlob) {
                URL.revokeObjectURL(blobUrl);
                const processedUrl = URL.createObjectURL(processedBlob);
                return {
                  id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  slotIndex,
                  blob: processedBlob,
                  dataUrl: processedUrl,
                  width: nw,
                  height: nh,
                  mimeType: processedBlob.type || 'image/jpeg',
                  captureMethod: 'image-capture-framed',
                  timestamp: Date.now(),
                  cameraLabel: track.label || '',
                };
              }
            }
          }

          return {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            slotIndex,
            blob: photoBlob,
            dataUrl: blobUrl,
            width: nw,
            height: nh,
            mimeType: photoBlob.type || 'image/jpeg',
            captureMethod: 'image-capture',
            timestamp: Date.now(),
            cameraLabel: track.label || '',
          };
        }
      } catch (nativeErr) {
        console.debug('Native ImageCapture.takePhoto not available or failed, falling back to frame grab:', nativeErr);
      }
    }

    // PATH 2: Native-resolution Canvas Frame Grab
    try {
      if (!video) return null;
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;
      if (vw <= 0 || vh <= 0) return null;

      const canvas = document.createElement('canvas');
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;

      ctx.save();
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      // Exact crop matching viewfinder
      const crop = calculateViewfinderCrop(vw, vh, lensZoomScale);
      ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.96);
      });

      if (!blob) return null;
      const blobUrl = URL.createObjectURL(blob);

      return {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        slotIndex,
        blob,
        dataUrl: blobUrl,
        width: canvas.width,
        height: canvas.height,
        mimeType: 'image/jpeg',
        captureMethod: 'canvas-frame',
        timestamp: Date.now(),
        cameraLabel: track?.label || '',
      };
    } catch (err) {
      console.error('Safe capturePhoto caught error:', err);
      return null;
    }
  }, [isMirrored, lensZoomScale]);

  // Backward compatibility alias for capturePhoto
  const grabFrame = capturePhoto;

  // Countdown & snap sequence for a single photo slot
  const captureOneShotWithCountdown = useCallback(async (slotIndex, delaySec) => {
    const delay = Math.max(0, delaySec ?? countdownDelay ?? 3);

    if (delay > 0) {
      for (let c = delay; c > 0; c--) {
        if (activeSessionAbortRef.current) return null;
        setCountdown(c);
        try { playCountdownBeep(false); } catch (e) {}
        await new Promise(r => setTimeout(r, 950));
      }

      if (activeSessionAbortRef.current) return null;
      setCountdown('Smile!');
      try { playCountdownBeep(true); } catch (e) {}
      await new Promise(r => setTimeout(r, 350));
    }

    if (activeSessionAbortRef.current) return null;

    // Flash & Shutter
    setIsFlashing(true);
    try { playShutterSound(); } catch (e) {}

    const photo = await capturePhoto(slotIndex);

    setTimeout(() => {
      setIsFlashing(false);
    }, 220);

    setCountdown(null);
    return photo;
  }, [countdownDelay, capturePhoto]);

  // Cancel an active capture session cleanly
  const cancelCaptureSession = useCallback(() => {
    activeSessionAbortRef.current = true;
    setIsCapturingBurst(false);
    setCountdown(null);
    setIsFlashing(false);
  }, []);

  // Retake an individual shot without losing the other slots
  const retakeSingleShot = useCallback(async (slotIndex) => {
    if (isCapturingBurst) return null;
    setIsCapturingBurst(true);
    activeSessionAbortRef.current = false;
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

  // Burst capture sequence with Live Video Recording
  const startBurstCapture = useCallback(async (onPhotoCaptured, onComplete, activeFilterObj = null, totalShotsParam = null) => {
    if (isCapturingBurst) return;

    let liveRecorder = null;
    const totalShots = totalShotsParam || captureCount || 4;
    activeSessionAbortRef.current = false;

    try {
      setIsCapturingBurst(true);
      setBurstProgress(0);

      // Initialize live session video recorder matching exact camera resolution
      if (videoRef.current) {
        const camW = videoRef.current.videoWidth || 1920;
        const camH = videoRef.current.videoHeight || 1080;
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

      // Fixed-size slot array initialized with nulls
      const capturedPhotos = new Array(totalShots).fill(null);

      for (let shot = 0; shot < totalShots; shot++) {
        if (activeSessionAbortRef.current) break;

        setActiveShotIndex(shot);
        setBurstProgress(shot);

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
            if (activeSessionAbortRef.current) break;
            setCountdown(c);
            if (liveRecorder) {
              liveRecorder.updateState({ countdown: c, isFlashing: false });
            }
            try { playCountdownBeep(false); } catch (e) {}
            await new Promise(r => setTimeout(r, 950));
          }

          if (activeSessionAbortRef.current) break;
          setCountdown('Smile!');
          if (liveRecorder) {
            liveRecorder.updateState({ countdown: 'Smile!', isFlashing: false });
          }
          try { playCountdownBeep(true); } catch (e) {}
          await new Promise(r => setTimeout(r, 350));
        }

        if (activeSessionAbortRef.current) break;

        // Screen flash & shutter sound
        setIsFlashing(true);
        if (liveRecorder) {
          liveRecorder.updateState({ isFlashing: true, countdown: null });
        }
        try { playShutterSound(); } catch (e) {}

        // Capture photo
        const photo = await capturePhoto(shot);
        if (photo) {
          capturedPhotos[shot] = photo;
          if (onPhotoCaptured) {
            try { onPhotoCaptured(photo, shot); } catch (cbErr) {}
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
        if (shot < totalShots - 1 && !activeSessionAbortRef.current) {
          await new Promise(r => setTimeout(r, 800));
        }
      }

      // Stop live video recorder
      let recordedVideo = null;
      if (liveRecorder) {
        await new Promise(r => setTimeout(r, 500));
        recordedVideo = await liveRecorder.stop();
      }

      setBurstProgress(totalShots);

      if (onComplete && !activeSessionAbortRef.current) {
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
      activeSessionAbortRef.current = false;
    }
  }, [isCapturingBurst, captureCount, countdownDelay, capturePhoto, isMirrored, lensZoomScale]);

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
    framingMode,
    setFramingMode,
    toggleFramingMode,
    lensMode: framingMode, // alias
    setLensMode: setFramingMode,
    toggleLensMode: toggleFramingMode,
    hasHardwareUltraWide,
    hasNativeZoomSupport,
    lensZoomScale,
    activeResolution,
    captureQuality,
    setCaptureQuality,
    isLoading,
    hasPermission,
    errorDetails,
    permissionError: errorDetails?.message || null,
    isHttpsNeeded: errorDetails?.type === 'insecure_context',
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
    cancelCaptureSession,
    retakeSingleShot,
    capturePhoto,
    grabFrame,
  };
}
