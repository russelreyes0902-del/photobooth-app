import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../public/templates');

const WINDOW_BOUNDS = [
  { minX: 43, maxX: 664, minY: 71, maxY: 444 },
  { minX: 43, maxX: 664, minY: 469, maxY: 842 },
  { minX: 43, maxX: 664, minY: 866, maxY: 1240 },
  { minX: 43, maxX: 664, minY: 1264, maxY: 1638 },
];

function isCreamColor(r, g, b) {
  const isBright = r >= 215 && g >= 210 && b >= 200;
  const lowSaturation = Math.abs(r - g) <= 16 && Math.abs(g - b) <= 16;
  return isBright && lowSaturation;
}

function processTemplate(srcName, dstName) {
  const srcPath = path.join(templateDir, srcName);
  if (!fs.existsSync(srcPath)) return;
  const data = fs.readFileSync(srcPath);
  const png = PNG.sync.read(data);
  let transparentPixels = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      let inWindow = false;
      for (const w of WINDOW_BOUNDS) {
        if (x >= w.minX && x <= w.maxX && y >= w.minY && y <= w.maxY) {
          inWindow = true;
          break;
        }
      }

      if (inWindow) {
        const idx = (png.width * y + x) << 2;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];

        if (isCreamColor(r, g, b)) {
          png.data[idx + 3] = 0;
          transparentPixels++;
        }
      }
    }
  }

  const dstPath = path.join(templateDir, dstName);
  fs.writeFileSync(dstPath, PNG.sync.write(png));
  console.log(`Processed ${srcName} -> ${dstName}: Made ${transparentPixels} pixels transparent inside photo cutouts.`);
}

processTemplate('1.png', 'denim-frame.png');
processTemplate('2.png', 'purple-frame.png');
processTemplate('3.png', 'cottagecore-frame.png');
processTemplate('1.png', 'user-denim.png');
processTemplate('2.png', 'user-purple.png');
processTemplate('3.png', 'user-cottagecore.png');
