import * as gifencModule from 'gifenc';
import { buildComposedFilterString, getInterpolatedTintColor } from './filters.js';

function getGifEnc() {
  const mod = gifencModule;
  const GIFEncoder = mod.GIFEncoder || mod.default?.GIFEncoder || (typeof mod.default === 'function' ? mod.default : null);
  const quantize = mod.quantize || mod.default?.quantize;
  const applyPalette = mod.applyPalette || mod.default?.applyPalette;

  if (!GIFEncoder || !quantize || !applyPalette) {
    throw new Error('GIF encoder functions could not be resolved from gifenc module.');
  }

  return { GIFEncoder, quantize, applyPalette };
}

/**
 * Creates an animated looping GIF from the captured photos with active filters and adjustments.
 * Validates expected photos, maintains frame numbering, and handles errors explicitly.
 */
export async function createAnimatedGif({
  photos = [],
  filterId = 'normal',
  filterIntensity = 100,
  adjustments = {},
  width = 540,
  height = 405,
  frameDelayMs = 500,
  onProgress = () => {},
}) {
  try {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      throw new Error('No photos available to create GIF');
    }

    const { GIFEncoder, quantize, applyPalette } = getGifEnc();

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(100, width);
    canvas.height = Math.max(100, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Unable to create canvas 2D context for GIF');
    }

    const cssFilter = buildComposedFilterString(filterId, filterIntensity, adjustments);
    const tintColor = getInterpolatedTintColor(filterId, filterIntensity);

    const gif = GIFEncoder();
    const totalFrames = photos.length;

    // First, decode and validate all images
    const decodedImages = await Promise.all(
      photos.map((photo, idx) => {
        return new Promise((resolve) => {
          if (photo?.img) {
            resolve(photo.img);
          } else if (photo?.dataUrl) {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => {
              console.warn(`Failed to decode image at index ${idx}`);
              resolve(null);
            };
            im.src = photo.dataUrl;
          } else {
            resolve(null);
          }
        });
      })
    );

    const validImages = decodedImages.filter(Boolean);
    if (validImages.length === 0) {
      throw new Error('No valid photos could be loaded for GIF generation.');
    }

    for (let i = 0; i < validImages.length; i++) {
      try {
        onProgress(Math.round((i / validImages.length) * 90));
      } catch (e) {}

      const img = validImages[i];
      ctx.clearRect(0, 0, width, height);

      // Apply composed aesthetic filter
      ctx.save();
      try {
        if (cssFilter && cssFilter !== 'none') {
          ctx.filter = cssFilter;
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
      if (tintColor) {
        ctx.fillStyle = tintColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Add frame indicator badge (e.g. "01 / 04")
      try {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(width - 92, height - 38, 78, 26, 6);
        } else {
          ctx.rect(width - 92, height - 38, 78, 26);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`0${i + 1} / 0${validImages.length}`, width - 53, height - 25);
      } catch (badgeErr) {}

      // Quantize frame & write into GIF
      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;

      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);

      gif.writeFrame(index, width, height, {
        palette,
        delay: frameDelayMs,
        repeat: 0, // 0 = loop forever
      });
    }

    try {
      onProgress(95);
    } catch (e) {}

    gif.finish();
    const bytes = gif.bytes();
    const blob = new Blob([bytes], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    try {
      onProgress(100);
    } catch (e) {}

    return {
      blob,
      url,
      byteSize: bytes.byteLength,
      frameCount: validImages.length,
    };
  } catch (err) {
    console.error('Fatal createAnimatedGif error:', err);
    throw err;
  }
}
