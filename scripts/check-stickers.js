import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../public/templates');

// Let's inspect 1.png at the 4th photo window (y: 1264 to 1637)
const png = PNG.sync.read(fs.readFileSync(path.join(templateDir, '1.png')));
console.log('Inspecting 1.png bottom window:');
let nonCreamPixelsInWindow = 0;
for (let y = 1264; y <= 1637; y++) {
  for (let x = 43; x <= 43 + 621; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx], g = png.data[idx+1], b = png.data[idx+2];
    const isCream = (r > 210 && g > 210 && b > 200);
    if (!isCream) nonCreamPixelsInWindow++;
  }
}
console.log(`Non-cream pixels inside 4th window of 1.png: ${nonCreamPixelsInWindow}`);

// Check what those non-cream pixels are
for (let y = 1600; y <= 1637; y += 5) {
  for (let x = 43; x <= 43 + 621; x += 50) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx], g = png.data[idx+1], b = png.data[idx+2];
    if (r <= 210 || g <= 210 || b <= 200) {
      console.log(`Sticker/border pixel at (${x}, ${y}): rgb(${r},${g},${b})`);
    }
  }
}
