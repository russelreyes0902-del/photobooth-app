import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../public/templates');
for (const f of ['1.png', '2.png', '3.png']) {
  const filePath = path.join(templateDir, f);
  const data = fs.readFileSync(filePath);
  const png = PNG.sync.read(data);
  console.log(`\n=== File: ${f} (${png.width}x${png.height}) ===`);
  
  // Sample a grid of pixels
  let alphaCount = 0;
  let whiteCount = 0;
  let nonWhiteCount = 0;
  const samples = [];
  
  for (let y = 0; y < png.height; y += 100) {
    for (let x = 0; x < png.width; x += 100) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (a < 255) alphaCount++;
      if (r > 245 && g > 245 && b > 245) whiteCount++;
      else nonWhiteCount++;
    }
  }
  console.log(`Grid samples: Alpha < 255 count: ${alphaCount}, Pure white count: ${whiteCount}, Other: ${nonWhiteCount}`);

  // Let's print out what colors are at center points where 4 photos usually sit
  // If 4 photos in 2000 height:
  // e.g. y = 250, 700, 1150, 1600
  const checkPoints = [250, 700, 1150, 1600];
  for (const cp of checkPoints) {
    const idx = (png.width * cp + Math.floor(png.width / 2)) << 2;
    console.log(`Pixel at (${Math.floor(png.width / 2)}, ${cp}): R=${png.data[idx]}, G=${png.data[idx+1]}, B=${png.data[idx+2]}, A=${png.data[idx+3]}`);
  }

  // Also check top-left, border pixels
  const cornerIdx = (png.width * 10 + 10) << 2;
  console.log(`Pixel at (10, 10): R=${png.data[cornerIdx]}, G=${png.data[cornerIdx+1]}, B=${png.data[cornerIdx+2]}, A=${png.data[cornerIdx+3]}`);
}
