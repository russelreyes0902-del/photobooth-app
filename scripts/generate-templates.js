import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIDTH = 1200;
const HEIGHT = 3600;

export const CUTOUTS = [
  { x: 120, y: 200, width: 960, height: 680, radius: 24 },
  { x: 120, y: 950, width: 960, height: 680, radius: 24 },
  { x: 120, y: 1700, width: 960, height: 680, radius: 24 },
  { x: 120, y: 2450, width: 960, height: 680, radius: 24 },
];

function isInsideCutout(x, y, margin = 0) {
  for (const c of CUTOUTS) {
    const minX = c.x + margin;
    const maxX = c.x + c.width - margin;
    const minY = c.y + margin;
    const maxY = c.y + c.height - margin;
    const r = Math.max(0, c.radius - margin);

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      // Check rounded corners
      if (x < minX + r && y < minY + r) {
        const dx = x - (minX + r);
        const dy = y - (minY + r);
        if (dx * dx + dy * dy > r * r) continue;
      }
      if (x > maxX - r && y < minY + r) {
        const dx = x - (maxX - r);
        const dy = y - (minY + r);
        if (dx * dx + dy * dy > r * r) continue;
      }
      if (x < minX + r && y > maxY - r) {
        const dx = x - (minX + r);
        const dy = y - (maxY - r);
        if (dx * dx + dy * dy > r * r) continue;
      }
      if (x > maxX - r && y > maxY - r) {
        const dx = x - (maxX - r);
        const dy = y - (maxY - r);
        if (dx * dx + dy * dy > r * r) continue;
      }
      return true;
    }
  }
  return false;
}

function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const idx = (WIDTH * y + x) << 2;
  if (a >= 255) {
    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = 255;
  } else {
    const srcA = a / 255;
    const dstA = png.data[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      png.data[idx] = Math.round((r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA);
      png.data[idx + 1] = Math.round((g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA);
      png.data[idx + 2] = Math.round((b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA);
      png.data[idx + 3] = Math.round(outA * 255);
    }
  }
}

function fillCircle(png, cx, cy, rad, r, g, b, a = 255) {
  const r2 = rad * rad;
  const x0 = Math.max(0, Math.floor(cx - rad));
  const x1 = Math.min(WIDTH - 1, Math.ceil(cx + rad));
  const y0 = Math.max(0, Math.floor(cy - rad));
  const y1 = Math.min(HEIGHT - 1, Math.ceil(cy + rad));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d2 <= r2) {
        const edge = Math.sqrt(d2) - (rad - 1);
        const alpha = edge > 0 ? a * Math.max(0, 1 - edge) : a;
        setPixel(png, x, y, r, g, b, alpha);
      }
    }
  }
}

function drawStar(png, cx, cy, spikes, outerRadius, innerRadius, r, g, b, a = 255) {
  const step = Math.PI / spikes;
  // Bounding box
  const minX = Math.max(0, Math.floor(cx - outerRadius));
  const maxX = Math.min(WIDTH - 1, Math.ceil(cx + outerRadius));
  const minY = Math.max(0, Math.floor(cy - outerRadius));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + outerRadius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > outerRadius) continue;
      let angle = Math.atan2(dy, dx) - Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;
      const mod = angle % (2 * step);
      const frac = Math.abs(mod - step) / step;
      const rMax = innerRadius + (outerRadius - innerRadius) * (1 - frac);
      if (dist <= rMax) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

function drawHeart(png, cx, cy, size, r, g, b, a = 255) {
  const minX = Math.max(0, Math.floor(cx - size));
  const maxX = Math.min(WIDTH - 1, Math.ceil(cx + size));
  const minY = Math.max(0, Math.floor(cy - size));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + size));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = (x - cx) / (size * 0.5);
      const ny = -(y - cy) / (size * 0.5) + 0.3;
      const f = nx * nx + Math.pow(ny - Math.sqrt(Math.abs(nx)), 2);
      if (f <= 1) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

function drawBow(png, cx, cy, size, r, g, b, a = 255) {
  // Left loop
  drawHeart(png, cx - size * 0.45, cy, size * 0.45, r, g, b, a);
  // Right loop
  drawHeart(png, cx + size * 0.45, cy, size * 0.45, r, g, b, a);
  // Center knot
  fillCircle(png, cx, cy, size * 0.22, Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40), a);
  // Ribbons flowing down
  for (let i = 0; i < size * 0.8; i++) {
    const w = (size * 0.15) * (1 - i / (size * 1.2));
    const ly = cy + size * 0.15 + i;
    const lx1 = cx - size * 0.2 - i * 0.2;
    const rx1 = cx + size * 0.2 + i * 0.2;
    for (let ox = -w; ox <= w; ox++) {
      setPixel(png, Math.round(lx1 + ox), Math.round(ly), r, g, b, a);
      setPixel(png, Math.round(rx1 + ox), Math.round(ly), r, g, b, a);
    }
  }
}

function drawFlower(png, cx, cy, radius, petR, petG, petB, cenR, cenG, cenB) {
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const angle = (i * 2 * Math.PI) / petals;
    const px = cx + Math.cos(angle) * (radius * 0.55);
    const py = cy + Math.sin(angle) * (radius * 0.55);
    fillCircle(png, px, py, radius * 0.42, petR, petG, petB, 245);
  }
  fillCircle(png, cx, cy, radius * 0.32, cenR, cenG, cenB, 255);
}

function drawTape(png, cx, cy, w, h, angleDeg, r, g, b, a = 180) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = w / 2;
  const hh = h / 2;

  const minX = Math.max(0, Math.floor(cx - Math.max(w, h)));
  const maxX = Math.min(WIDTH - 1, Math.ceil(cx + Math.max(w, h)));
  const minY = Math.max(0, Math.floor(cy - Math.max(w, h)));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + Math.max(w, h)));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

function drawBarcode(png, x, y, w, h, r, g, b, a = 240) {
  const pattern = [2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2];
  let curX = x;
  let bar = true;
  for (const p of pattern) {
    const barW = p * 4;
    if (bar) {
      for (let bx = curX; bx < curX + barW; bx++) {
        for (let by = y; by < y + h; by++) {
          setPixel(png, bx, by, r, g, b, a);
        }
      }
    }
    curX += barW;
    bar = !bar;
  }
}

// -------------------------------------------------------------
// 1. GENERATE DENIM FRAME (denim-frame.png)
// Y2K blue jeans aesthetic with gold stitching, rivets, patches
// -------------------------------------------------------------
function generateDenimFrame() {
  console.log('Generating denim-frame.png...');
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (isInsideCutout(x, y)) continue;

      // Denim twill texture simulation
      const diagonal = (x + y * 2) % 6;
      const noise = ((x ^ y) % 7) * 2;
      let baseR = 45 + noise;
      let baseG = 78 + noise;
      let baseB = 125 + noise;

      if (diagonal === 0 || diagonal === 1) {
        baseR += 14; baseG += 18; baseB += 24;
      }

      // Outer margin vignette
      if (x < 60 || x > WIDTH - 60 || y < 60 || y > HEIGHT - 60) {
        baseR -= 10; baseG -= 12; baseB -= 15;
      }

      setPixel(png, x, y, Math.max(0, baseR), Math.max(0, baseG), Math.max(0, baseB), 255);
    }
  }

  // Draw golden contrast dashed stitching around each photo cutout
  for (const c of CUTOUTS) {
    const stitchMargin = -16; // 16px outside the cutout
    const sx0 = c.x + stitchMargin;
    const sx1 = c.x + c.width - stitchMargin;
    const sy0 = c.y + stitchMargin;
    const sy1 = c.y + c.height - stitchMargin;

    // Top and bottom stitches
    for (let x = sx0; x <= sx1; x++) {
      if ((Math.floor(x / 14)) % 2 === 0) {
        for (let thick = -2; thick <= 2; thick++) {
          setPixel(png, x, sy0 + thick, 235, 175, 45, 255);
          setPixel(png, x, sy1 + thick, 235, 175, 45, 255);
        }
      }
    }
    // Left and right stitches
    for (let y = sy0; y <= sy1; y++) {
      if ((Math.floor(y / 14)) % 2 === 0) {
        for (let thick = -2; thick <= 2; thick++) {
          setPixel(png, sx0 + thick, y, 235, 175, 45, 255);
          setPixel(png, sx1 + thick, y, 235, 175, 45, 255);
        }
      }
    }

    // Brass/copper rivets at corners
    fillCircle(png, sx0, sy0, 14, 185, 130, 45, 255);
    fillCircle(png, sx0, sy0, 8, 245, 215, 110, 255);
    fillCircle(png, sx1, sy0, 14, 185, 130, 45, 255);
    fillCircle(png, sx1, sy0, 8, 245, 215, 110, 255);
    fillCircle(png, sx0, sy1, 14, 185, 130, 45, 255);
    fillCircle(png, sx0, sy1, 8, 245, 215, 110, 255);
    fillCircle(png, sx1, sy1, 14, 185, 130, 45, 255);
    fillCircle(png, sx1, sy1, 8, 245, 215, 110, 255);
  }

  // Header & Footer styling: Leather patch at top
  const patchX = 400, patchY = 50, patchW = 400, patchH = 100;
  for (let py = patchY; py < patchY + patchH; py++) {
    for (let px = patchX; px < patchX + patchW; px++) {
      setPixel(png, px, py, 170, 95, 45, 255);
    }
  }
  // Leather patch stitch
  for (let px = patchX + 6; px < patchX + patchW - 6; px++) {
    if ((Math.floor(px / 10)) % 2 === 0) {
      setPixel(png, px, patchY + 6, 240, 210, 100, 255);
      setPixel(png, px, patchY + patchH - 6, 240, 210, 100, 255);
    }
  }
  for (let py = patchY + 6; py < patchY + patchH - 6; py++) {
    if ((Math.floor(py / 10)) % 2 === 0) {
      setPixel(png, patchX + 6, py, 240, 210, 100, 255);
      setPixel(png, patchX + patchW - 6, py, 240, 210, 100, 255);
    }
  }

  // Cute embroidered star patches between photos
  drawStar(png, 90, 890, 5, 42, 18, 255, 215, 60, 255);
  drawStar(png, 1110, 1640, 5, 38, 16, 255, 215, 60, 255);
  drawHeart(png, 90, 2390, 48, 235, 75, 100, 255);

  // Footer barcode & aesthetic denim tag
  drawBarcode(png, 160, 3260, 380, 75, 240, 245, 255, 255);
  drawStar(png, 1050, 3300, 4, 35, 12, 255, 255, 255, 220);

  return png;
}

// -------------------------------------------------------------
// 2. GENERATE PURPLE FRAME (purple-frame.png)
// Cyber-dreamy Y2K aesthetic, lavender gradient, ribbons & sparkles
// -------------------------------------------------------------
function generatePurpleFrame() {
  console.log('Generating purple-frame.png...');
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let y = 0; y < HEIGHT; y++) {
    const t = y / HEIGHT;
    for (let x = 0; x < WIDTH; x++) {
      if (isInsideCutout(x, y)) continue;

      // Soft lilac to dreamy orchid purple gradient with subtle shimmer
      const r = Math.round(230 - t * 45 + Math.sin(x * 0.02) * 8);
      const g = Math.round(205 - t * 65 + Math.cos(y * 0.02) * 8);
      const b = Math.round(250 - t * 25);

      setPixel(png, x, y, r, g, b, 255);
    }
  }

  // Soft pearlescent inner borders around cutouts
  for (const c of CUTOUTS) {
    const border = 12;
    for (let bx = c.x - border; bx <= c.x + c.width + border; bx++) {
      for (let thick = 0; thick < border; thick++) {
        setPixel(png, bx, c.y - border + thick, 255, 255, 255, 220);
        setPixel(png, bx, c.y + c.height + thick, 255, 255, 255, 220);
      }
    }
    for (let by = c.y - border; by <= c.y + c.height + border; by++) {
      for (let thick = 0; thick < border; thick++) {
        setPixel(png, c.x - border + thick, by, 255, 255, 255, 220);
        setPixel(png, c.x + c.width + thick, by, 255, 255, 255, 220);
      }
    }

    // Cute satin bows perched right on top corner of photos (overlapping photo edge!)
    drawBow(png, c.x + 24, c.y + 12, 54, 255, 110, 165, 255);
    drawBow(png, c.x + c.width - 24, c.y + 12, 54, 255, 110, 165, 255);
  }

  // 4-pointed sparkle stars (✦)
  const stars = [
    { x: 160, y: 100, s: 36 },
    { x: 1040, y: 110, s: 42 },
    { x: 60, y: 910, s: 28 },
    { x: 1130, y: 920, s: 32 },
    { x: 70, y: 1660, s: 30 },
    { x: 1120, y: 1670, s: 36 },
    { x: 60, y: 2410, s: 28 },
    { x: 1140, y: 2420, s: 34 },
    { x: 220, y: 3250, s: 40 },
    { x: 1000, y: 3240, s: 48 },
  ];
  for (const st of stars) {
    drawStar(png, st.x, st.y, 4, st.s, st.s * 0.22, 255, 255, 255, 255);
    fillCircle(png, st.x, st.y, 5, 255, 215, 120, 255);
  }

  // Cute chrome hearts in margins
  drawHeart(png, 600, 100, 60, 255, 140, 190, 240);
  drawHeart(png, 600, 3280, 70, 255, 140, 190, 240);
  drawBarcode(png, 420, 3400, 360, 60, 140, 90, 180, 230);

  return png;
}

// -------------------------------------------------------------
// 3. GENERATE COTTAGECORE FRAME (cottagecore-frame.png)
// Warm botanical, wildflower illustrations, washi tape, kraft paper
// -------------------------------------------------------------
function generateCottagecoreFrame() {
  console.log('Generating cottagecore-frame.png...');
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (isInsideCutout(x, y)) continue;

      // Creamy textured watercolor paper
      const fiber = ((x * 13 ^ y * 7) % 19) - 9;
      const r = Math.min(255, 248 + fiber);
      const g = Math.min(255, 242 + fiber);
      const b = Math.min(255, 228 + fiber);

      setPixel(png, x, y, r, g, b, 255);
    }
  }

  // Subtle natural border
  for (const c of CUTOUTS) {
    // Elegant warm brown hairline border
    for (let bx = c.x - 4; bx <= c.x + c.width + 4; bx++) {
      for (let t = 0; t < 4; t++) {
        setPixel(png, bx, c.y - 4 + t, 165, 135, 105, 200);
        setPixel(png, bx, c.y + c.height + t, 165, 135, 105, 200);
      }
    }
    for (let by = c.y - 4; by <= c.y + c.height + 4; by++) {
      for (let t = 0; t < 4; t++) {
        setPixel(png, c.x - 4 + t, by, 165, 135, 105, 200);
        setPixel(png, c.x + c.width + t, by, 165, 135, 105, 200);
      }
    }

    // Cute washi tape across the top-right and bottom-left corners (overlapping photo!)
    drawTape(png, c.x + c.width - 20, c.y + 10, 140, 44, 25, 220, 185, 165, 210);
    drawTape(png, c.x + 20, c.y + c.height - 10, 140, 44, -25, 195, 210, 185, 210);
  }

  // Wildflower bouquets and pressed daisy blossoms
  const flowerPositions = [
    { x: 140, y: 90, r: 38 },
    { x: 1060, y: 95, r: 42 },
    { x: 60, y: 880, r: 34 },
    { x: 1140, y: 930, r: 36 },
    { x: 60, y: 1640, r: 35 },
    { x: 1135, y: 1680, r: 36 },
    { x: 65, y: 2380, r: 34 },
    { x: 1135, y: 2430, r: 36 },
    { x: 200, y: 3260, r: 45 },
    { x: 1000, y: 3260, r: 45 },
  ];
  for (const f of flowerPositions) {
    drawFlower(png, f.x, f.y, f.r, 255, 250, 240, 240, 180, 50);
  }

  // Cute olive leaves & sprigs
  for (let i = 0; i < 4; i++) {
    const sprigY = 560 + i * 750;
    fillCircle(png, 45, sprigY, 18, 125, 155, 105, 230);
    fillCircle(png, 55, sprigY + 25, 15, 125, 155, 105, 230);
    fillCircle(png, 1155, sprigY, 18, 125, 155, 105, 230);
    fillCircle(png, 1145, sprigY + 25, 15, 125, 155, 105, 230);
  }

  // Vintage postage stamp in footer
  drawTape(png, 600, 3320, 200, 120, 0, 235, 225, 205, 240);
  drawFlower(png, 600, 3320, 32, 220, 120, 130, 240, 200, 60);

  return png;
}

// -------------------------------------------------------------
// 4. GENERATE CLASSIC FILM FRAME (classic-film.png)
// Minimalist matte noir 35mm film strip with sprockets & gold font
// -------------------------------------------------------------
function generateClassicFilmFrame() {
  console.log('Generating classic-film.png...');
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (isInsideCutout(x, y)) continue;

      // Deep matte obsidian/film base
      setPixel(png, x, y, 18, 19, 23, 255);
    }
  }

  // 35mm film sprocket holes along left and right margins
  const sprocketHoleW = 44;
  const sprocketHoleH = 64;
  const sprocketStep = 105;

  for (let y = 80; y < HEIGHT - 60; y += sprocketStep) {
    // Left sprocket
    for (let sy = y; sy < y + sprocketHoleH; sy++) {
      for (let sx = 35; sx < 35 + sprocketHoleW; sx++) {
        setPixel(png, sx, sy, 245, 245, 245, 240);
      }
    }
    // Right sprocket
    for (let sy = y; sy < y + sprocketHoleH; sy++) {
      for (let sx = WIDTH - 35 - sprocketHoleW; sx < WIDTH - 35; sx++) {
        setPixel(png, sx, sy, 245, 245, 245, 240);
      }
    }
  }

  // Clean thin inner borders
  for (let i = 0; i < CUTOUTS.length; i++) {
    const c = CUTOUTS[i];
    // Gold frame line
    for (let bx = c.x - 3; bx <= c.x + c.width + 3; bx++) {
      for (let t = 0; t < 3; t++) {
        setPixel(png, bx, c.y - 3 + t, 215, 175, 95, 220);
        setPixel(png, bx, c.y + c.height + t, 215, 175, 95, 220);
      }
    }
    for (let by = c.y - 3; by <= c.y + c.height + 3; by++) {
      for (let t = 0; t < 3; t++) {
        setPixel(png, c.x - 3 + t, by, 215, 175, 95, 220);
        setPixel(png, c.x + c.width + t, by, 215, 175, 95, 220);
      }
    }

    // Vintage frame index markers (e.g., 01, 02, 03, 04)
    fillCircle(png, c.x + 30, c.y - 45, 16, 215, 175, 95, 255);
  }

  // Footer barcode & film markings
  drawBarcode(png, 400, 3290, 400, 65, 230, 235, 240, 230);

  return png;
}

// -------------------------------------------------------------
// SAVE ALL TEMPLATES
// -------------------------------------------------------------
const templates = [
  { name: 'denim-frame.png', generator: generateDenimFrame },
  { name: 'purple-frame.png', generator: generatePurpleFrame },
  { name: 'cottagecore-frame.png', generator: generateCottagecoreFrame },
  { name: 'classic-film.png', generator: generateClassicFilmFrame },
];

const targetDir = path.resolve(__dirname, '../public/templates');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

for (const t of templates) {
  const png = t.generator();
  const filePath = path.join(targetDir, t.name);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved ${t.name} (${(buffer.length / 1024 / 1024).toFixed(2)} MB) to ${filePath}`);
}

console.log('All custom photobooth templates generated successfully!');
