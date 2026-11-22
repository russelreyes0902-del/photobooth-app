import { getFilterById, buildComposedFilterString, getInterpolatedTintColor } from './filters.js';
import { getOptimalVideoMimeType } from './capabilities.js';

export { getOptimalVideoMimeType as getSupportedVideoMimeType };

/**
 * Standard Video Resolution Presets
 */
export const VIDEO_RESOLUTIONS = [
  { id: 'match-source', name: 'Match Photos', width: 0, height: 0, desc: 'Original captured photo resolution' },
  { id: 'fhd-portrait', name: 'Portrait Full HD (1080×1920)', width: 1080, height: 1920, desc: '9:16 Instagram Story / TikTok' },
  { id: 'fhd-landscape', name: 'Full HD (1920×1080)', width: 1920, height: 1080, desc: '16:9 standard 1080p video' },
  { id: 'square', name: 'Square (1080×1080)', width: 1080, height: 1080, desc: '1:1 square Instagram feed' },
  { id: 'hd-landscape', name: 'HD (1280×720)', width: 1280, height: 720, desc: '16:9 compact HD video' },
  { id: 'qhd-landscape', name: 'QHD 2K (2560×1440)', width: 2560, height: 1440, desc: '16:9 ultra sharp 1440p video' },
];

/**
 * Calculates optimal target bitrate (bits per second) based on output pixel count
 */
export function calculateTargetBitrate(width, height, fps = 30) {
  const pixels = width * height;
  if (pixels >= 3840 * 2160) return 40_000_000; // 4K: 40 Mbps
  if (pixels >= 2560 * 1440) return 20_000_000; // 1440p: 20 Mbps
  if (pixels >= 1920 * 1080) return 10_000_000; // 1080p: 10 Mbps
  if (pixels >= 1280 * 720) return 5_000_000;   // 720p: 5 Mbps
  return 3_000_000;                             // Standard: 3 Mbps
}

/**
 * Verifies that an encoded video Blob can be decoded and loaded by the browser engine.
 * Inspects actual metadata (width, height, duration) directly from a temporary video element.
 */
export function verifyVideoBlob(blob) {
  return new Promise((resolve, reject) => {
    if (!blob || blob.size === 0) {
      reject(new Error('Encoded video is empty (0 bytes).'));
      return;
    }

    const testUrl = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const timer = setTimeout(() => {
      URL.revokeObjectURL(testUrl);
      reject(new Error('Video verification timed out: media could not be decoded.'));
    }, 6000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const meta = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        sizeBytes: blob.size,
        mimeType: blob.type,
      };
      URL.revokeObjectURL(testUrl);
      resolve(meta);
    };

    video.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(testUrl);
      reject(new Error(`Failed to decode recorded video stream: ${video.error?.message || 'Unsupported format'}`));
    };

    video.src = testUrl;
  });
}

/**
 * Creates an animated video file from the captured photos using HTML5 Canvas & MediaRecorder.
 * Supports configurable resolution (HD, Full HD, Match Source), explicit bitrates,
 * accurate time-based frame scheduling (via performance.now()), and complete verification.
 */
export async function createExportVideo({
  photos = [],
  filterId = 'clean-original',
  filterIntensity = 100,
  adjustments = {},
  resolutionPreset = 'fhd-portrait',
  targetWidth = 1080,
  targetHeight = 1920,
  durationSec = 4,
  fps = 30,
  onProgress = () => {},
}) {
  return new Promise(async (resolve, reject) => {
    let stream = null;
    let recorder = null;
    let animId = null;

    const cleanup = () => {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (stream) {
        try {
          stream.getTracks().forEach(track => {
            try { track.stop(); } catch (e) {}
          });
        } catch (e) {}
        stream = null;
      }
    };

    try {
      if (!photos || photos.length === 0) {
        throw new Error('No photographs provided for video slideshow generation.');
      }

      if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
        throw new Error('Canvas captureStream is not supported in this browser.');
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser.');
      }

      // Load all photo image objects first
      const loadedImages = await Promise.all(
        photos.map((photo) => {
          return new Promise((res) => {
            if (!photo) return res(null);
            if (photo.img) return res(photo.img);
            if (photo.dataUrl) {
              const im = new Image();
              im.onload = () => res(im);
              im.onerror = () => res(null);
              im.src = photo.dataUrl;
            } else {
              res(null);
            }
          });
        })
      );

      const validImages = loadedImages.filter(Boolean);
      if (validImages.length === 0) {
        throw new Error('No valid images could be decoded for video export.');
      }

      // Compute output dimensions
      let outW = targetWidth;
      let outH = targetHeight;

      if (resolutionPreset === 'match-source' || (!targetWidth && !targetHeight)) {
        outW = validImages[0].naturalWidth || validImages[0].width || 1280;
        outH = validImages[0].naturalHeight || validImages[0].height || 720;
      } else {
        const preset = VIDEO_RESOLUTIONS.find(r => r.id === resolutionPreset);
        if (preset && preset.width > 0 && preset.height > 0) {
          outW = preset.width;
          outH = preset.height;
        }
      }

      // Ensure even dimensions (required by H.264 / VP9 encoders)
      outW = Math.round(outW / 2) * 2;
      outH = Math.round(outH / 2) * 2;

      // Bitrate calculation
      const bitrateBps = calculateTargetBitrate(outW, outH, fps);
      const mimeInfo = getOptimalVideoMimeType();
      const mimeType = mimeInfo.mime || '';
      const extension = mimeInfo.ext;

      // Create recording canvas
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Could not create canvas 2D context for video encoding.');
      }

      stream = canvas.captureStream(fps);

      const recorderOptions = {
        videoBitsPerSecond: bitrateBps,
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      recorder = new MediaRecorder(stream, recorderOptions);

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = (err) => {
        console.error('MediaRecorder encoding error:', err);
        cleanup();
        reject(err);
      };

      recorder.onstop = async () => {
        try {
          const finalMime = recorder?.mimeType || mimeType || (mimeInfo.isMp4 ? 'video/mp4' : 'video/webm');
          const finalBlob = new Blob(chunks, { type: finalMime });
          cleanup();

          onProgress(95);

          // Verify that the recorded output is valid and decodable
          const verified = await verifyVideoBlob(finalBlob);
          const finalUrl = URL.createObjectURL(finalBlob);

          onProgress(100);

          resolve({
            blob: finalBlob,
            url: finalUrl,
            ext: extension,
            mimeType: finalMime,
            width: verified.width || outW,
            height: verified.height || outH,
            durationSec: verified.duration || durationSec,
            sizeBytes: finalBlob.size,
            bitrateBps,
            captureType: 'slideshow',
          });
        } catch (stopErr) {
          cleanup();
          reject(stopErr);
        }
      };

      recorder.start();

      const cssFilterString = buildComposedFilterString(filterId, filterIntensity, adjustments);
      const tintColor = getInterpolatedTintColor(filterId, filterIntensity);

      const targetDurationMs = durationSec * 1000;
      const startTime = performance.now();

      // Time-based render loop independent of display refresh rate
      const render = (now) => {
        try {
          const elapsed = now - startTime;

          if (elapsed >= targetDurationMs) {
            onProgress(95);
            if (recorder && recorder.state !== 'inactive') {
              recorder.stop();
            }
            return;
          }

          const progressPercent = Math.min(90, Math.round((elapsed / targetDurationMs) * 90));
          onProgress(progressPercent);

          const timePerPhoto = targetDurationMs / validImages.length;
          const photoIndex = Math.min(validImages.length - 1, Math.floor(elapsed / timePerPhoto));
          const currentImg = validImages[photoIndex];

          // Dark backing fill
          ctx.fillStyle = '#0a0b0e';
          ctx.fillRect(0, 0, outW, outH);

          // Draw photo with filter
          ctx.save();
          if (cssFilterString && cssFilterString !== 'none') {
            ctx.filter = cssFilterString;
          }

          const imgW = currentImg.naturalWidth || currentImg.width || 1;
          const imgH = currentImg.naturalHeight || currentImg.height || 1;
          const targetRatio = outW / outH;
          const imgRatio = imgW / imgH;

          let sx = 0, sy = 0, sw = imgW, sh = imgH;
          if (imgRatio > targetRatio) {
            sw = imgH * targetRatio;
            sx = (imgW - sw) / 2;
          } else {
            sh = imgW / targetRatio;
            sy = (imgH - sh) / 2;
          }

          ctx.drawImage(currentImg, sx, sy, sw, sh, 0, 0, outW, outH);
          ctx.restore();

          // Subtle filter tint overlay
          if (tintColor) {
            ctx.fillStyle = tintColor;
            ctx.fillRect(0, 0, outW, outH);
          }

          // Photobooth HUD Overlays (Scale with resolution)
          const scaleFactor = Math.max(0.6, Math.min(2.0, outW / 1080));

          // Top Left: Blinking Red REC Badge
          const isBlink = Math.floor(elapsed / 500) % 2 === 0;
          if (isBlink) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(36 * scaleFactor, 38 * scaleFactor, 7 * scaleFactor, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#ffffff';
          ctx.font = `700 ${Math.round(14 * scaleFactor)}px system-ui, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(`REC ${(elapsed / 1000).toFixed(1)}s`, 52 * scaleFactor, 38 * scaleFactor);

          // Top Right: Shot counter badge
          const badgeW = 120 * scaleFactor;
          const badgeH = 34 * scaleFactor;
          const badgeX = outW - badgeW - 24 * scaleFactor;
          const badgeY = 22 * scaleFactor;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8 * scaleFactor);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `700 ${Math.round(13 * scaleFactor)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`SHOT 0${photoIndex + 1} / 0${validImages.length}`, badgeX + badgeW / 2, badgeY + badgeH / 2);

          animId = requestAnimationFrame(render);
        } catch (frameErr) {
          console.error('Video slideshow rendering error:', frameErr);
          cleanup();
          try {
            if (recorder && recorder.state !== 'inactive') recorder.stop();
          } catch (e) {}
          reject(frameErr);
        }
      };

      animId = requestAnimationFrame(render);
    } catch (err) {
      console.error('createExportVideo fatal error:', err);
      cleanup();
      reject(err);
    }
  });
}
