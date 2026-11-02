import { getFilterById } from './filters';

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
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
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
 * Creates an animated video file from the 4 photos using HTML5 Canvas & MediaRecorder
 * Produces an MP4 (or WebM fallback) video perfect for Instagram Stories / TikTok / camera roll.
 */
export async function createExportVideo({
  photos = [],
  filterId = 'normal',
  width = 720,
  height = 960,
  durationSec = 4, // 4-second looping video sequence
  onProgress = () => {},
}) {
  return new Promise(async (resolve, reject) => {
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
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create canvas 2D context.');
      }

      const stream = canvas.captureStream(30); // 30 FPS stream
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        reject(err);
      };

      recorder.onstop = () => {
        try {
          const finalMime = recorder.mimeType || mimeType || 'video/mp4';
          const blob = new Blob(chunks, { type: finalMime });
          const url = URL.createObjectURL(blob);
          onProgress(100);
          resolve({ blob, url, ext: extension, mimeType: finalMime });
        } catch (stopErr) {
          reject(stopErr);
        }
      };

      recorder.start();

      const filter = getFilterById(filterId);
      const totalFrames = 30 * durationSec; // 30 fps * 4s = 120 frames
      let currentFrame = 0;

      const renderLoop = () => {
        try {
          if (currentFrame >= totalFrames) {
            recorder.stop();
            return;
          }

          const progressPercent = Math.round((currentFrame / totalFrames) * 95);
          onProgress(progressPercent);

          // Cycle through the photos
          // Each photo gets displayed for ~0.8s
          const photoIndex = Math.floor((currentFrame / (totalFrames / validImages.length))) % validImages.length;
          const currentImg = validImages[photoIndex];

          // Draw background
          ctx.fillStyle = '#0a0b0e';
          ctx.fillRect(0, 0, width, height);

          // Draw photo with filter
          ctx.save();
          if (filter && filter.cssFilter && filter.cssFilter !== 'none') {
            ctx.filter = filter.cssFilter;
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
          if (filter && filter.tintColor) {
            ctx.fillStyle = filter.tintColor;
            ctx.fillRect(0, 0, width, height);
          }

          // Video aesthetic overlays: Vintage frame stamp & timer
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(width - 120, height - 50, 100, 32, 8);
          } else {
            ctx.rect(width - 120, height - 50, 100, 32);
          }
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 14px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`0${photoIndex + 1} / 0${validImages.length}`, width - 70, height - 34);

          // Cute Retro Recording Red Dot
          const isBlink = Math.floor(currentFrame / 15) % 2 === 0;
          if (isBlink) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(36, 36, 7, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 13px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('REC', 52, 37);

          currentFrame++;
          requestAnimationFrame(renderLoop);
        } catch (frameErr) {
          console.error('Video frame error:', frameErr);
          try { recorder.stop(); } catch (e) {}
          reject(frameErr);
        }
      };

      requestAnimationFrame(renderLoop);
    } catch (err) {
      console.error('createExportVideo fatal error:', err);
      reject(err);
    }
  });
}
