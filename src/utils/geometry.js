/**
 * Unified geometry, crop, and layout calculation utilities for RetroBooth Studio.
 * Ensures consistent rendering across viewfinder, capture, canvas preview, and final export.
 */

/**
 * Calculates source cropping rectangle to achieve 'cover' object-fit inside a target rectangle.
 * Supports pan offset (-1 to 1), zoom (>= 1.0), and rotation (in degrees).
 */
export function calculateCoverCrop({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  zoom = 1.0,
  panX = 0, // normalized offset -1 to +1
  panY = 0, // normalized offset -1 to +1
  rotate = 0, // 0, 90, 180, 270 degrees
}) {
  const sw = Math.max(1, sourceWidth || 1);
  const sh = Math.max(1, sourceHeight || 1);
  const tw = Math.max(1, targetWidth || 1);
  const th = Math.max(1, targetHeight || 1);

  // If rotated 90 or 270 deg, effective source aspect ratio is inverted
  const is90or270 = Math.abs(rotate % 180) === 90;
  const effectiveSW = is90or270 ? sh : sw;
  const effectiveSH = is90or270 ? sw : sh;

  const targetRatio = tw / th;
  const sourceRatio = effectiveSW / effectiveSH;

  let baseCropW, baseCropH;
  if (sourceRatio > targetRatio) {
    baseCropH = effectiveSH;
    baseCropW = effectiveSH * targetRatio;
  } else {
    baseCropW = effectiveSW;
    baseCropH = effectiveSW / targetRatio;
  }

  // Apply user zoom (cannot zoom out past cover)
  const safeZoom = Math.max(1.0, zoom || 1.0);
  const cropW = baseCropW / safeZoom;
  const cropH = baseCropH / safeZoom;

  // Maximum allowed pan offset in source coordinates
  const maxPanX = Math.max(0, (effectiveSW - cropW) / 2);
  const maxPanY = Math.max(0, (effectiveSH - cropH) / 2);

  const clampedPanX = Math.max(-1, Math.min(1, panX || 0));
  const clampedPanY = Math.max(-1, Math.min(1, panY || 0));

  const centerSX = (effectiveSW - cropW) / 2 + clampedPanX * maxPanX;
  const centerSY = (effectiveSH - cropH) / 2 + clampedPanY * maxPanY;

  return {
    sx: Math.max(0, Math.min(effectiveSW - cropW, centerSX)),
    sy: Math.max(0, Math.min(effectiveSH - cropH, centerSY)),
    sw: cropW,
    sh: cropH,
    effectiveSW,
    effectiveSH,
    rotate: (rotate || 0) % 360,
  };
}

/**
 * Calculates the viewfinder crop rectangle matching what the camera shows on screen.
 * Handles iPad 1.38x crop on 1x mode and 1.0x wide-angle on 0.5x mode.
 */
export function calculateViewfinderCrop(videoW, videoH, lensZoomScale = 1.0) {
  const vw = Math.max(1, videoW || 1280);
  const vh = Math.max(1, videoH || 720);
  const scale = Math.max(1.0, lensZoomScale || 1.0);

  const sw = vw / scale;
  const sh = vh / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;

  return { sx, sy, sw, sh, vw, vh, scale };
}

/**
 * Dynamically generates cutout slots for any number of cuts (1, 2, 3, 4, 6, 8)
 * for customizable layouts (vertical strip, 2x2 grid, 2x3 grid, postcard).
 */
export function generateCutoutSlots({
  count = 4,
  baseWidth = 1200,
  baseHeight = 3600,
  layout = 'strip', // 'strip' | 'grid' | 'postcard'
  paddingX = 80,
  paddingY = 120,
  footerHeight = 240,
  gap = 60,
  radius = 16,
}) {
  const slots = [];
  const availableW = baseWidth - paddingX * 2;
  const availableH = baseHeight - paddingY - footerHeight;

  if (layout === 'grid' || count === 4 && layout === 'square') {
    // 2 columns
    const cols = 2;
    const rows = Math.ceil(count / cols);
    const slotW = (availableW - gap * (cols - 1)) / cols;
    const slotH = (availableH - gap * (rows - 1)) / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      slots.push({
        index: i,
        x: Math.round(paddingX + col * (slotW + gap)),
        y: Math.round(paddingY + row * (slotH + gap)),
        width: Math.round(slotW),
        height: Math.round(slotH),
        radius,
      });
    }
  } else if (count === 6 && layout === 'grid') {
    const cols = 2;
    const rows = 3;
    const slotW = (availableW - gap * (cols - 1)) / cols;
    const slotH = (availableH - gap * (rows - 1)) / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      slots.push({
        index: i,
        x: Math.round(paddingX + col * (slotW + gap)),
        y: Math.round(paddingY + row * (slotH + gap)),
        width: Math.round(slotW),
        height: Math.round(slotH),
        radius,
      });
    }
  } else {
    // Vertical strip (1, 2, 3, 4, or 6 stacked)
    const slotW = availableW;
    const slotH = (availableH - gap * (count - 1)) / count;

    for (let i = 0; i < count; i++) {
      slots.push({
        index: i,
        x: Math.round(paddingX),
        y: Math.round(paddingY + i * (slotH + gap)),
        width: Math.round(slotW),
        height: Math.round(slotH),
        radius,
      });
    }
  }

  return slots;
}
