/**
 * Comprehensive Browser and Device Capability Detection for RetroBooth Studio.
 * Uses strict feature detection rather than brittle user-agent sniffing.
 */

let capabilitiesCache = null;

export function detectCapabilities() {
  if (capabilitiesCache) return capabilitiesCache;

  const isBrowser = typeof window !== 'undefined';
  const isSecure = isBrowser ? (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'https:'
  ) : false;

  const hasMediaDevices = Boolean(isBrowser && navigator?.mediaDevices?.getUserMedia);
  const hasEnumerateDevices = Boolean(isBrowser && navigator?.mediaDevices?.enumerateDevices);
  const hasImageCapture = Boolean(isBrowser && 'ImageCapture' in window);
  const hasMediaRecorder = Boolean(isBrowser && typeof MediaRecorder !== 'undefined');
  const hasCanvasCaptureStream = Boolean(
    isBrowser &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  );
  const hasCreateImageBitmap = Boolean(isBrowser && typeof createImageBitmap === 'function');
  const hasWebShare = Boolean(isBrowser && typeof navigator?.share === 'function');
  const hasWebShareFiles = Boolean(isBrowser && typeof navigator?.canShare === 'function');
  const hasIndexedDB = Boolean(isBrowser && 'indexedDB' in window);
  const hasStorageEstimate = Boolean(isBrowser && navigator?.storage?.estimate);

  // Detect supported video recording MIME types
  const supportedVideoMimes = [];
  if (hasMediaRecorder) {
    const candidateMimes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    for (const mime of candidateMimes) {
      try {
        if (MediaRecorder.isTypeSupported(mime)) {
          supportedVideoMimes.push(mime);
        }
      } catch (e) {}
    }
  }

  // Detect WebP canvas export support
  let canEncodeWebP = false;
  if (isBrowser && typeof document !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      canEncodeWebP = c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) {
      canEncodeWebP = false;
    }
  }

  capabilitiesCache = {
    isSecure,
    hasMediaDevices,
    hasEnumerateDevices,
    hasImageCapture,
    hasMediaRecorder,
    hasCanvasCaptureStream,
    hasCreateImageBitmap,
    hasWebShare,
    hasWebShareFiles,
    hasIndexedDB,
    hasStorageEstimate,
    supportedVideoMimes,
    canEncodeWebP,
  };

  return capabilitiesCache;
}

/**
 * Returns preferred video mime type and matching file extension
 */
export function getOptimalVideoMimeType() {
  const caps = detectCapabilities();
  const mimes = caps.supportedVideoMimes;

  if (mimes.length === 0) {
    return { mime: '', ext: 'mp4', isMp4: true };
  }

  // Prefer MP4 where natively supported (Safari, modern Chrome/Edge)
  const mp4Mime = mimes.find(m => m.startsWith('video/mp4'));
  if (mp4Mime) {
    return { mime: mp4Mime, ext: 'mp4', isMp4: true };
  }

  // Otherwise WebM
  const webmMime = mimes.find(m => m.startsWith('video/webm')) || mimes[0];
  return { mime: webmMime, ext: 'webm', isMp4: false };
}
