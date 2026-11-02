import gifencPkg from 'gifenc';
import { getFilterById } from './filters';

const { GIFEncoder, quantize, applyPalette } = gifencPkg;

/**
 * Creates an animated looping GIF from the 4 captured photos with the active filter safely
 */
export async function createAnimatedGif({
  photos = [],
  filterId = 'normal',
  width = 600,
  height = 450,
  frameDelayMs = 450,
  onProgress = () => {},
}) {
  try {
    if (!photos || photos.length === 0) {
      throw new Error('No photos available to create GIF');
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(100, width);
    canvas.height = Math.max(100, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Unable to create canvas context for GIF');
    }

    const filter = getFilterById(filterId);
    const gif = GIFEncoder();
    const totalFrames = photos.length;

    for (let i = 0; i < totalFrames; i++) {
      try {
        onProgress(Math.round(((i) / totalFrames) * 90));
      } catch (e) {}

      const photo = photos[i];
      let img = photo?.img;
      if (!img && photo?.dataUrl) {
        img = await new Promise((resolve) => {
          try {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = photo.dataUrl;
          } catch (e) {
            resolve(null);
          }
        });
      }

      if (!img) continue;

      ctx.clearRect(0, 0, width, height);

      // Apply filter
      ctx.save();
      try {
        if (filter && filter.cssFilter && filter.cssFilter !== 'none') {
          ctx.filter = filter.cssFilter;
        }

        const imgW = img.width || img.videoWidth || width;
        const imgH = img.height || img.videoHeight || height;
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

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      } finally {
        ctx.restore();
      }

      // Optional subtle filter tint
      if (filter && filter.tintColor) {
        ctx.fillStyle = filter.tintColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Add frame indicator badge
      try {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(width - 92, height - 38, 76, 26, 6);
        } else {
          ctx.rect(width - 92, height - 38, 76, 26);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`0${i + 1} / 0${totalFrames}`, width - 54, height - 25);
      } catch (badgeErr) {}

      // Quantize and write frame
      const imageData = ctx.getImageData(0, 0, width, height);
      const rgba = imageData.data;

      const palette = quantize(rgba, 256);
      const index = applyPalette(rgba, palette);

      gif.writeFrame(index, width, height, {
        palette,
        delay: frameDelayMs,
        repeat: 0,
      });
    }

    try { onProgress(95); } catch (e) {}
    gif.finish();
    const bytes = gif.bytes();
    const blob = new Blob([bytes], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    try { onProgress(100); } catch (e) {}
    return { blob, url, byteLength: bytes.length };
  } catch (fatalGifErr) {
    console.error('Safe createAnimatedGif error:', fatalGifErr);
    throw fatalGifErr;
  }
}
