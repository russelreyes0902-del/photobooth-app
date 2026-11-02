import { getFilterById } from './filters';

// In-memory cache for loaded template images to avoid repeated network fetches
const imageCache = new Map();

export function loadTemplateImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Safety timeout: if image hangs longer than 4s, resolve null gracefully
      const timer = setTimeout(() => {
        resolve(null);
      }, 4000);

      img.onload = () => {
        clearTimeout(timer);
        try {
          imageCache.set(src, img);
        } catch (e) {}
        resolve(img);
      };

      img.onerror = (err) => {
        clearTimeout(timer);
        console.warn(`Safe template load warning for ${src}:`, err);
        resolve(null);
      };

      img.src = src;
    } catch (err) {
      console.warn('loadTemplateImage uncaught error:', err);
      resolve(null);
    }
  });
}

/**
 * Draws an image with 'cover' object-fit inside destination rectangle with rounded corners
 */
function drawImageCover(ctx, img, dx, dy, dw, dh, radius = 0) {
  try {
    if (!ctx || !img) return;

    const imgW = img.width || img.videoWidth || 0;
    const imgH = img.height || img.videoHeight || 0;
    if (imgW <= 0 || imgH <= 0 || dw <= 0 || dh <= 0) return;

    const targetRatio = dw / dh;
    const imgRatio = imgW / imgH;

    let sx, sy, sw, sh;
    if (imgRatio > targetRatio) {
      sh = imgH;
      sw = imgH * targetRatio;
      sx = (imgW - sw) / 2;
      sy = 0;
    } else {
      sw = imgW;
      sh = imgW / targetRatio;
      sx = 0;
      sy = (imgH - sh) / 2;
    }

    ctx.save();
    try {
      ctx.beginPath();
      if (radius > 0 && typeof ctx.roundRect === 'function') {
        ctx.roundRect(dx, dy, dw, dh, radius);
      } else if (radius > 0) {
        const r = radius;
        ctx.moveTo(dx + r, dy);
        ctx.lineTo(dx + dw - r, dy);
        ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + r);
        ctx.lineTo(dx + dw, dy + dh - r);
        ctx.quadraticCurveTo(dx + dw, dy + dh, dx + dw - r, dy + dh);
        ctx.lineTo(dx + r, dy + dh);
        ctx.quadraticCurveTo(dx, dy + dh, dx, dy + dh - r);
        ctx.lineTo(dx, dy + r);
        ctx.quadraticCurveTo(dx, dy, dx + r, dy);
      } else {
        ctx.rect(dx, dy, dw, dh);
      }
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    } finally {
      ctx.restore();
    }
  } catch (err) {
    console.error('Safe drawImageCover caught error:', err);
  }
}

/**
 * Composites the full 4-cut photobooth strip onto an HTML5 canvas safely
 */
export async function renderPhotoStrip({
  canvas,
  template,
  photos = [],
  filterId = 'normal',
  paperColor = '#ffffff',
  dateStamp = true,
  customFooterText = '',
}) {
  try {
    if (!canvas || !template) return null;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const exportW = template.exportWidth || 1200;
    const exportH = template.exportHeight || 3600;

    // Set canvas physical buffer dimensions
    if (canvas.width !== exportW || canvas.height !== exportH) {
      canvas.width = exportW;
      canvas.height = exportH;
    }

    ctx.clearRect(0, 0, exportW, exportH);

    // -------------------------------------------------------------
    // STEP 1: DRAW BACKGROUND PAPER LAYER
    // -------------------------------------------------------------
    ctx.fillStyle = paperColor || template.defaultPaper || '#ffffff';
    ctx.fillRect(0, 0, exportW, exportH);

    // Subtle paper grain simulation
    ctx.save();
    try {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
      for (let y = 0; y < exportH; y += 12) {
        for (let x = 0; x < exportW; x += 12) {
          if ((x ^ y) % 3 === 0) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    } finally {
      ctx.restore();
    }

    // -------------------------------------------------------------
    // STEP 2: DRAW THE 4 CAPTURED PHOTOS INTO DESIGNATED CUTOUTS
    // -------------------------------------------------------------
    const scaleX = exportW / (template.baseWidth || 1200);
    const scaleY = exportH / (template.baseHeight || 3600);

    const filter = getFilterById(filterId);

    const cutouts = Array.isArray(template.cutouts) ? template.cutouts : [];

    for (let i = 0; i < cutouts.length; i++) {
      const rawCutout = cutouts[i];
      const cutout = {
        x: rawCutout.x * scaleX,
        y: rawCutout.y * scaleY,
        width: rawCutout.width * scaleX,
        height: rawCutout.height * scaleY,
        radius: (rawCutout.radius || 12) * scaleX,
      };

      const photoItem = photos[i];

      if (photoItem && (photoItem.img || photoItem.dataUrl)) {
        let imgObj = photoItem.img;
        if (!imgObj && photoItem.dataUrl) {
          imgObj = await new Promise((res) => {
            try {
              const im = new Image();
              im.onload = () => res(im);
              im.onerror = () => res(null);
              im.src = photoItem.dataUrl;
            } catch (e) {
              res(null);
            }
          });
        }

        if (imgObj) {
          ctx.save();
          try {
            // Apply filter to photo
            if (filter && filter.cssFilter && filter.cssFilter !== 'none') {
              ctx.filter = filter.cssFilter;
            }
            drawImageCover(ctx, imgObj, cutout.x, cutout.y, cutout.width, cutout.height, cutout.radius);
          } finally {
            ctx.restore();
          }

          // Optional subtle filter tint
          if (filter && filter.tintColor) {
            ctx.save();
            try {
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(cutout.x, cutout.y, cutout.width, cutout.height, cutout.radius);
              } else {
                ctx.rect(cutout.x, cutout.y, cutout.width, cutout.height);
              }
              ctx.clip();
              ctx.fillStyle = filter.tintColor;
              ctx.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
            } finally {
              ctx.restore();
            }
          }
        }
      } else {
        // Empty placeholder window
        ctx.save();
        try {
          ctx.fillStyle = 'rgba(235, 230, 222, 0.55)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(cutout.x, cutout.y, cutout.width, cutout.height, cutout.radius);
          } else {
            ctx.rect(cutout.x, cutout.y, cutout.width, cutout.height);
          }
          ctx.fill();

          ctx.fillStyle = 'rgba(120, 110, 100, 0.4)';
          ctx.font = `600 ${Math.round(42 * scaleX)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `Shot 0${i + 1}`,
            cutout.x + cutout.width / 2,
            cutout.y + cutout.height / 2
          );
        } finally {
          ctx.restore();
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 3: DRAW CUSTOM TEMPLATE PNG OVERLAY IMAGE ON TOP
    // -------------------------------------------------------------
    ctx.save();
    try {
      ctx.filter = 'none';

      let overlayImg = await loadTemplateImage(template.src);
      if (!overlayImg && template.fallbackSrc) {
        overlayImg = await loadTemplateImage(template.fallbackSrc);
      }

      if (overlayImg) {
        ctx.drawImage(overlayImg, 0, 0, exportW, exportH);
      } else {
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 16 * scaleX;
        ctx.strokeRect(0, 0, exportW, exportH);
      }
    } finally {
      ctx.restore();
    }

    // -------------------------------------------------------------
    // FOOTER TIMESTAMP & BRANDING
    // -------------------------------------------------------------
    if (dateStamp || customFooterText) {
      ctx.save();
      try {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        const text = customFooterText || `${formattedDate}  •  RETROBOOTH STUDIO`;

        ctx.fillStyle = template.id === 'classic-film' ? 'rgba(220, 185, 120, 0.85)' : 'rgba(50, 50, 60, 0.75)';
        ctx.font = `700 ${Math.round(26 * scaleX)}px 'Space Grotesk', 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText(text, exportW / 2, exportH - Math.round(55 * scaleY));
      } finally {
        ctx.restore();
      }
    }

    return canvas;
  } catch (err) {
    console.error('Fatal safe renderPhotoStrip caught error:', err);
    return canvas;
  }
}
