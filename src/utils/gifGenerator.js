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
 * Loads and validates a photo into a drawable Image element.
 * Handles blob URLs, data URLs, and pre-loaded Image objects.
 */
function loadPhotoImage(photo, index) {
  return new Promise((resolve) => {
    if (!photo) {
      resolve(null);
      return;
    }

    // Already a usable Image/HTMLImageElement
    if (photo.img && (photo.img.naturalWidth > 0 || photo.img.width > 0)) {
      resolve(photo.img);
      return;
    }

    const src = photo.dataUrl || (photo.blob ? URL.createObjectURL(photo.blob) : null);
    if (!src) {
      resolve(null);
      return;
    }

    const im = new Image();
    im.crossOrigin = 'anonymous';

    im.onload = () => {
      // Validate the image is actually decodable with real dimensions
      if (im.naturalWidth > 0 && im.naturalHeight > 0) {
        resolve(im);
      } else {
        console.warn(`GIF frame ${index}: Image loaded but has zero dimensions`);
        resolve(null);
      }
    };

    im.onerror = () => {
      console.warn(`GIF frame ${index}: Failed to decode image`);
      resolve(null);
    };

    im.src = src;
  });
}

/**
 * Creates an animated looping GIF from the captured photos with active filters and adjustments.
 * Validates expected photos, maintains frame numbering, and handles errors explicitly.
 *
 * Key improvements:
 * - Per-frame image validation (naturalWidth/Height check)
 * - Robust cover-crop for mixed aspect ratio photos
 * - 256-color palette quantization per frame for best visual fidelity
 * - Accurate frame delay timing (GIF delay is in centiseconds, gifenc uses ms)
 * - Frame number badges scale to canvas size
 * - Skip null/failed photos gracefully
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

    // Clamp dimensions to reasonable bounds
    const w = Math.max(100, Math.min(1200, width));
    const h = Math.max(100, Math.min(1200, height));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Unable to create canvas 2D context for GIF');
    }

    const cssFilter = buildComposedFilterString(filterId, filterIntensity, adjustments);
    const tintColor = getInterpolatedTintColor(filterId, filterIntensity);

    // Clamp frame delay (GIF minimum is 20ms, standard is 100ms+)
    const safeDelay = Math.max(20, frameDelayMs);

    // Load and validate ALL photos before encoding
    try { onProgress(5); } catch (e) {}

    const decodedImages = await Promise.all(
      photos.map((photo, idx) => loadPhotoImage(photo, idx))
    );

    const validImages = decodedImages.filter(Boolean);
    if (validImages.length === 0) {
      throw new Error('No valid photos could be loaded for GIF generation. All frames failed to decode.');
    }

    try { onProgress(15); } catch (e) {}

    const gif = GIFEncoder();

    for (let i = 0; i < validImages.length; i++) {
      try {
        onProgress(15 + Math.round((i / validImages.length) * 75));
      } catch (e) {}

      const img = validImages[i];

      // Clear canvas with black background (prevents transparent artifacts)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Apply composed aesthetic filter
      ctx.save();
      try {
        if (cssFilter && cssFilter !== 'none') {
          ctx.filter = cssFilter;
        }

        // Cover-crop: scale image to fill canvas while preserving aspect ratio
        const imgW = img.naturalWidth || img.width || w;
        const imgH = img.naturalHeight || img.height || h;
        const targetRatio = w / h;
        const imgRatio = imgW / imgH;

        let sx = 0, sy = 0, sw = imgW, sh = imgH;
        if (imgRatio > targetRatio) {
          // Image is wider: crop sides
          sw = imgH * targetRatio;
          sx = (imgW - sw) / 2;
        } else {
          // Image is taller: crop top/bottom
          sh = imgW / targetRatio;
          sy = (imgH - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      } finally {
        ctx.restore();
      }

      // Optional subtle filter tint overlay
      if (tintColor) {
        ctx.fillStyle = tintColor;
        ctx.fillRect(0, 0, w, h);
      }

      // Add frame indicator badge (scales with canvas size)
      try {
        const scaleFactor = Math.max(0.6, Math.min(1.5, w / 540));
        const badgeW = Math.round(78 * scaleFactor);
        const badgeH = Math.round(26 * scaleFactor);
        const badgeX = w - badgeW - Math.round(14 * scaleFactor);
        const badgeY = h - badgeH - Math.round(12 * scaleFactor);
        const fontSize = Math.round(12 * scaleFactor);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, Math.round(6 * scaleFactor));
        } else {
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const frameLabel = validImages.length <= 9
          ? `0${i + 1} / 0${validImages.length}`
          : `${i + 1} / ${validImages.length}`;
        ctx.fillText(frameLabel, badgeX + badgeW / 2, badgeY + badgeH / 2);
      } catch (badgeErr) {}

      // Extract pixel data, quantize to 256 colors, and add frame
      const imageData = ctx.getImageData(0, 0, w, h);
      const { data } = imageData;

      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);

      gif.writeFrame(index, w, h, {
        palette,
        delay: safeDelay,
        repeat: 0, // 0 = loop forever
      });
    }

    try { onProgress(95); } catch (e) {}

    gif.finish();
    const bytes = gif.bytes();

    if (!bytes || bytes.byteLength === 0) {
      throw new Error('GIF encoder produced empty output.');
    }

    const blob = new Blob([bytes], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    try { onProgress(100); } catch (e) {}

    return {
      blob,
      url,
      byteSize: bytes.byteLength,
      frameCount: validImages.length,
      width: w,
      height: h,
      delayMs: safeDelay,
    };
  } catch (err) {
    console.error('Fatal createAnimatedGif error:', err);
    throw err;
  }
}
