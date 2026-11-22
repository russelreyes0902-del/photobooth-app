import { buildComposedFilterString, getInterpolatedTintColor } from './filters.js';
import { calculateCoverCrop } from './geometry.js';
import { getStickerById, loadStickerImage } from './stickers.js';

// Cache for loaded images by URL or source
const imageCache = new Map();

/**
 * Loads and caches an image source with safety timeout
 */
export function loadTemplateImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

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
 * Draws background pattern on canvas
 */
function drawBackgroundPattern(ctx, pattern, width, height) {
  if (!pattern || pattern === 'none') return;
  ctx.save();
  try {
    if (pattern === 'dots') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      const step = 28;
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'grid') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.035)';
      ctx.lineWidth = 1.5;
      const step = 36;
      ctx.beginPath();
      for (let x = 0; x < width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (pattern === 'stripes') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.lineWidth = 4;
      const step = 24;
      ctx.beginPath();
      for (let x = -height; x < width + height; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
      }
      ctx.stroke();
    } else if (pattern === 'grain') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
      for (let y = 0; y < height; y += 10) {
        for (let x = 0; x < width; x += 10) {
          if ((x * 7 + y * 13) % 4 === 0) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    }
  } finally {
    ctx.restore();
  }
}

/**
 * Composites the photobooth strip onto an HTML5 canvas.
 * Handles flexible templates (1, 2, 3, 4, 6 cuts), per-photo adjustments,
 * transform (pan, zoom, rotate, mirror), stickers, multiple text layers, and borders.
 * Uses per-canvas sequence IDs to prevent cross-canvas rendering race conditions.
 */
export async function renderPhotoStrip({
  canvas,
  template,
  photos = [],
  filterId = 'clean-original',
  filterIntensity = 100,
  adjustments = {},
  photoTransforms = {},
  paperColor = '#ffffff',
  paperPattern = 'none',
  borders = { width: 0, color: '#ffffff', radius: 14 },
  stickers = [],
  texts = [],
  dateStamp = true,
  customFooterText = '',
  isPreview = false,
  cancelToken = null,
}) {
  if (!canvas || !template) return null;

  // Track per-canvas sequence ID to avoid cross-canvas invalidation
  canvas._renderSeqId = (canvas._renderSeqId || 0) + 1;
  const currentSeq = canvas._renderSeqId;

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to acquire canvas 2D rendering context');

    let exportW = template.exportWidth || 1200;
    let exportH = template.exportHeight || 3600;

    // In preview mode, scale down buffer slightly for high-performance responsive redraws
    if (isPreview) {
      exportW = Math.round(exportW * 0.5);
      exportH = Math.round(exportH * 0.5);
    }

    if (canvas.width !== exportW || canvas.height !== exportH) {
      canvas.width = exportW;
      canvas.height = exportH;
    }

    ctx.clearRect(0, 0, exportW, exportH);

    // -------------------------------------------------------------
    // STEP 1: BACKGROUND COLOR & PATTERN
    // -------------------------------------------------------------
    ctx.fillStyle = paperColor || template.defaultPaper || '#ffffff';
    ctx.fillRect(0, 0, exportW, exportH);

    drawBackgroundPattern(ctx, paperPattern, exportW, exportH);

    // -------------------------------------------------------------
    // STEP 2: DRAW PHOTOS INTO CUTOUT SLOTS
    // -------------------------------------------------------------
    const scaleX = exportW / (template.baseWidth || 1200);
    const scaleY = exportH / (template.baseHeight || 3600);

    const cutouts = Array.isArray(template.cutouts) && template.cutouts.length > 0
      ? template.cutouts
      : [];

    const slotCount = template.slotCount || cutouts.length || 4;

    for (let i = 0; i < slotCount; i++) {
      if (cancelToken?.isCancelled || canvas._renderSeqId !== currentSeq) return null;

      const rawCutout = cutouts[i] || {
        x: 80,
        y: 120 + i * 700,
        width: 1040,
        height: 640,
        radius: 14,
      };

      const cutout = {
        x: rawCutout.x * scaleX,
        y: rawCutout.y * scaleY,
        width: rawCutout.width * scaleX,
        height: rawCutout.height * scaleY,
        radius: (borders?.radius ?? (rawCutout.radius || 12)) * scaleX,
      };

      const photoItem = photos[i];

      if (photoItem && (photoItem.img || photoItem.dataUrl || photoItem.blob)) {
        let imgObj = photoItem.img;
        if (!imgObj && photoItem.dataUrl) {
          if (imageCache.has(photoItem.dataUrl)) {
            imgObj = imageCache.get(photoItem.dataUrl);
          } else {
            imgObj = await new Promise((res) => {
              try {
                const im = new Image();
                im.onload = () => {
                  imageCache.set(photoItem.dataUrl, im);
                  res(im);
                };
                im.onerror = () => res(null);
                im.src = photoItem.dataUrl;
              } catch (e) {
                res(null);
              }
            });
          }
        }

        if (imgObj) {
          const transform = photoTransforms[i] || {};
          const slotAdj = { ...adjustments, ...(transform.adjustments || {}) };

          const cssFilter = buildComposedFilterString(filterId, filterIntensity, slotAdj);
          const tintColor = getInterpolatedTintColor(filterId, filterIntensity);

          ctx.save();
          try {
            // Clip to cutout path with rounded corners
            ctx.beginPath();
            if (cutout.radius > 0 && typeof ctx.roundRect === 'function') {
              ctx.roundRect(cutout.x, cutout.y, cutout.width, cutout.height, cutout.radius);
            } else {
              ctx.rect(cutout.x, cutout.y, cutout.width, cutout.height);
            }
            ctx.closePath();
            ctx.clip();

            // Apply unified filter
            if (cssFilter && cssFilter !== 'none') {
              ctx.filter = cssFilter;
            }

            // Calculate precise cover crop with pan, zoom, rotate
            const crop = calculateCoverCrop({
              sourceWidth: imgObj.naturalWidth || imgObj.width || imgObj.videoWidth,
              sourceHeight: imgObj.naturalHeight || imgObj.height || imgObj.videoHeight,
              targetWidth: cutout.width,
              targetHeight: cutout.height,
              zoom: transform.zoom || 1.0,
              panX: transform.panX || 0,
              panY: transform.panY || 0,
              rotate: transform.rotate || 0,
            });

            // Mirror & rotation handling
            if (transform.mirror || transform.rotate) {
              ctx.save();
              ctx.translate(cutout.x + cutout.width / 2, cutout.y + cutout.height / 2);
              if (transform.mirror) ctx.scale(-1, 1);
              if (transform.rotate) ctx.rotate((transform.rotate * Math.PI) / 180);
              ctx.drawImage(
                imgObj,
                crop.sx,
                crop.sy,
                crop.sw,
                crop.sh,
                -cutout.width / 2,
                -cutout.height / 2,
                cutout.width,
                cutout.height
              );
              ctx.restore();
            } else {
              ctx.drawImage(
                imgObj,
                crop.sx,
                crop.sy,
                crop.sw,
                crop.sh,
                cutout.x,
                cutout.y,
                cutout.width,
                cutout.height
              );
            }

            // Filter tint
            if (tintColor) {
              ctx.fillStyle = tintColor;
              ctx.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
            }

            // Vignette effect
            if (slotAdj.vignette && slotAdj.vignette > 0) {
              const vigFactor = Math.min(1, slotAdj.vignette / 100);
              const cx = cutout.x + cutout.width / 2;
              const cy = cutout.y + cutout.height / 2;
              const rad = Math.max(cutout.width, cutout.height) / 1.4;
              const vigGrad = ctx.createRadialGradient(cx, cy, rad * 0.4, cx, cy, rad);
              vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
              vigGrad.addColorStop(1, `rgba(0, 0, 0, ${(0.65 * vigFactor).toFixed(2)})`);
              ctx.fillStyle = vigGrad;
              ctx.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
            }

            // Film Grain effect
            if (slotAdj.grain && slotAdj.grain > 0) {
              const grainFactor = Math.min(1, slotAdj.grain / 100);
              ctx.fillStyle = `rgba(0, 0, 0, ${(0.08 * grainFactor).toFixed(3)})`;
              const gStep = 6;
              for (let gy = cutout.y; gy < cutout.y + cutout.height; gy += gStep) {
                for (let gx = cutout.x; gx < cutout.x + cutout.width; gx += gStep) {
                  if ((gx * 3 + gy * 7) % 5 === 0) {
                    ctx.fillRect(gx, gy, 1.5, 1.5);
                  }
                }
              }
            }
          } finally {
            ctx.restore();
          }

          // Photo slot border
          if (borders?.width && borders.width > 0) {
            ctx.save();
            try {
              ctx.strokeStyle = borders.color || '#ffffff';
              ctx.lineWidth = borders.width * scaleX;
              ctx.beginPath();
              if (cutout.radius > 0 && typeof ctx.roundRect === 'function') {
                ctx.roundRect(cutout.x, cutout.y, cutout.width, cutout.height, cutout.radius);
              } else {
                ctx.rect(cutout.x, cutout.y, cutout.width, cutout.height);
              }
              ctx.stroke();
            } finally {
              ctx.restore();
            }
          }
        }
      } else {
        // Empty placeholder slot
        ctx.save();
        try {
          ctx.fillStyle = 'rgba(235, 230, 222, 0.45)';
          ctx.beginPath();
          if (cutout.radius > 0 && typeof ctx.roundRect === 'function') {
            ctx.roundRect(cutout.x, cutout.y, cutout.width, cutout.height, cutout.radius);
          } else {
            ctx.rect(cutout.x, cutout.y, cutout.width, cutout.height);
          }
          ctx.fill();

          ctx.fillStyle = 'rgba(120, 110, 100, 0.35)';
          ctx.font = `600 ${Math.round(36 * scaleX)}px 'Plus Jakarta Sans', sans-serif`;
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
    // STEP 3: TEMPLATE OVERLAY (Frame PNG if available)
    // -------------------------------------------------------------
    if (template.src || template.fallbackSrc) {
      ctx.save();
      try {
        ctx.filter = 'none';
        let overlayImg = await loadTemplateImage(template.src);
        if (!overlayImg && template.fallbackSrc) {
          overlayImg = await loadTemplateImage(template.fallbackSrc);
        }

        if (overlayImg) {
          ctx.drawImage(overlayImg, 0, 0, exportW, exportH);
        }
      } finally {
        ctx.restore();
      }
    }

    // -------------------------------------------------------------
    // STEP 4: STICKERS & DECORATIONS LAYER
    // -------------------------------------------------------------
    if (Array.isArray(stickers) && stickers.length > 0) {
      const sortedStickers = [...stickers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      for (const st of sortedStickers) {
        if (!st || !st.type) continue;
        const stickerDef = getStickerById(st.type);
        if (!stickerDef) continue;

        const stickerImg = await loadStickerImage(stickerDef);
        if (stickerImg) {
          ctx.save();
          try {
            const posX = (st.x ?? 0.5) * exportW;
            const posY = (st.y ?? 0.5) * exportH;
            const size = (st.size ?? 120) * scaleX;
            const rot = ((st.rotation ?? 0) * Math.PI) / 180;
            const opacity = st.opacity ?? 1.0;

            ctx.globalAlpha = opacity;
            ctx.translate(posX, posY);
            if (rot !== 0) ctx.rotate(rot);

            ctx.drawImage(stickerImg, -size / 2, -size / 2, size, size);
          } finally {
            ctx.restore();
          }
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 5: CUSTOM TEXT ELEMENTS
    // -------------------------------------------------------------
    if (Array.isArray(texts) && texts.length > 0) {
      for (const txt of texts) {
        if (!txt || !txt.text) continue;
        ctx.save();
        try {
          const posX = (txt.x ?? 0.5) * exportW;
          const posY = (txt.y ?? 0.9) * exportH;
          const fontSz = Math.round((txt.fontSize ?? 32) * scaleX);
          const fontFam = txt.fontFamily || 'Plus Jakarta Sans';
          const weight = txt.fontWeight || '700';
          const rot = ((txt.rotation ?? 0) * Math.PI) / 180;

          ctx.translate(posX, posY);
          if (rot !== 0) ctx.rotate(rot);

          ctx.font = `${weight} ${fontSz}px '${fontFam}', sans-serif`;
          ctx.textAlign = txt.align || 'center';
          ctx.textBaseline = 'middle';

          if (txt.shadowColor) {
            ctx.shadowColor = txt.shadowColor;
            ctx.shadowBlur = 8 * scaleX;
            ctx.shadowOffsetX = 2 * scaleX;
            ctx.shadowOffsetY = 2 * scaleX;
          }

          if (txt.outlineColor && txt.outlineWidth) {
            ctx.strokeStyle = txt.outlineColor;
            ctx.lineWidth = txt.outlineWidth * scaleX;
            ctx.strokeText(txt.text, 0, 0);
          }

          ctx.fillStyle = txt.color || '#1e293b';
          ctx.fillText(txt.text, 0, 0);
        } finally {
          ctx.restore();
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 6: FOOTER TIMESTAMP & BRANDING
    // -------------------------------------------------------------
    if (dateStamp || customFooterText) {
      ctx.save();
      try {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        const text = customFooterText || `${formattedDate}  •  RETROBOOTH STUDIO`;

        ctx.fillStyle = template.id === 'classic-film' ? 'rgba(220, 185, 120, 0.85)' : 'rgba(50, 50, 60, 0.75)';
        ctx.font = `700 ${Math.round(24 * scaleX)}px 'Space Grotesk', 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(text, exportW / 2, exportH - Math.round(55 * scaleY));
      } finally {
        ctx.restore();
      }
    }

    return canvas;
  } catch (err) {
    console.error('Fatal renderPhotoStrip error:', err);
    throw err;
  }
}
