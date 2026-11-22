import { getFilterById, buildComposedFilterString, getInterpolatedTintColor } from './filters.js';

/**
 * Checks supported video mime type across browsers (iOS Safari, Chrome, Firefox, Edge)
 */
export function getSupportedVideoMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }

  const candidateTypes = [
    { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];

  for (const candidate of candidateTypes) {
    try {
      if (MediaRecorder.isTypeSupported(candidate.mime)) {
        return candidate;
      }
    } catch (e) {}
  }

  return { mime: '', ext: 'mp4' };
}

/**
 * Creates an animated video file from captured photos using HTML5 Canvas & MediaRecorder.
 * Uses exact time-based frame scheduling (via performance.now()) so the output duration
 * does NOT depend on the monitor refresh rate (60Hz, 120Hz, 144Hz).
 */
export async function createExportVideo({
  photos = [],
  filterId = 'normal',
  filterIntensity = 100,
  adjustments = {},
  width = 720,
  height = 960,
  durationSec = 4, // Exact duration in seconds
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
        throw new Error('No photos provided for video generation.');
      }

      if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
        throw new Error('Canvas captureStream is not supported in this browser.');
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser.');
      }

      const mimeInfo = getSupportedVideoMimeType();
      const mimeType = mimeInfo?.mime || '';
      const extension = mimeInfo?.ext || 'mp4';

      // Load all photo image objects first
      const loadedImages = await Promise.all(
        photos.map((photo) => {
          return new Promise((res) => {
            if (photo.img) {
              res(photo.img);
            } else if (photo.dataUrl) {
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
        throw new Error('No valid images could be decoded for video.');
      }

      // Create recording canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Could not create canvas 2D context.');
      }

      stream = canvas.captureStream(fps);
      const options = mimeType ? { mimeType } : undefined;
      recorder = new MediaRecorder(stream, options);

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        cleanup();
        reject(err);
      };

      recorder.onstop = () => {
        try {
          const finalMime = recorder?.mimeType || mimeType || 'video/mp4';
          const blob = new Blob(chunks, { type: finalMime });
          const url = URL.createObjectURL(blob);
          onProgress(100);
          cleanup();
          resolve({ blob, url, ext: extension, mimeType: finalMime, durationSec });
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

      const render = (now) => {
        try {
          const elapsed = now - startTime;

          if (elapsed >= targetDurationMs) {
            onProgress(100);
            if (recorder && recorder.state !== 'inactive') {
              recorder.stop();
            }
            return;
          }

          const progressPercent = Math.min(98, Math.round((elapsed / targetDurationMs) * 100));
          onProgress(progressPercent);

          // Cycle through the photos based on elapsed time (independent of monitor refresh rate)
          const timePerPhoto = targetDurationMs / validImages.length;
          const photoIndex = Math.min(validImages.length - 1, Math.floor(elapsed / timePerPhoto));
          const currentImg = validImages[photoIndex];

          // Draw background
          ctx.fillStyle = '#0a0b0e';
          ctx.fillRect(0, 0, width, height);

          // Draw photo with composed filter
          ctx.save();
          if (cssFilterString && cssFilterString !== 'none') {
            ctx.filter = cssFilterString;
          }

          const imgW = currentImg.width || 1;
          const imgH = currentImg.height || 1;
          const targetRatio = width / height;
          const imgRatio = imgW / imgH;

          let sx = 0, sy = 0, sw = imgW, sh = imgH;
          if (imgRatio > targetRatio) {
            sw = imgH * targetRatio;
            sx = (imgW - sw) / 2;
          } else {
            sh = imgW / targetRatio;
            sy = (imgH - sh) / 2;
          }

          ctx.drawImage(currentImg, sx, sy, sw, sh, 0, 0, width, height);
          ctx.restore();

          // Subtle filter tint
          if (tintColor) {
            ctx.fillStyle = tintColor;
            ctx.fillRect(0, 0, width, height);
          }

          // Video aesthetic overlays: Vintage frame stamp & timer
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(width - 120, height - 50, 100, 32, 8);
          } else {
            ctx.rect(width - 120, height - 50, 100, 32);
          }
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 13px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`0${photoIndex + 1} / 0${validImages.length}`, width - 70, height - 34);

          // Blinking REC badge
          const isBlink = Math.floor(elapsed / 500) % 2 === 0;
          if (isBlink) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(36, 36, 7, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 13px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`REC ${(elapsed / 1000).toFixed(1)}s`, 52, 37);

          animId = requestAnimationFrame(render);
        } catch (frameErr) {
          console.error('Video frame error:', frameErr);
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
