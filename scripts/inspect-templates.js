import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../public/templates');
const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.png'));

console.log('Inspecting templates in:', templateDir);

for (const file of files) {
  const filePath = path.join(templateDir, file);
  const data = fs.readFileSync(filePath);
  const png = PNG.sync.read(data);
  console.log(`\n--- Template: ${file} ---`);
  console.log(`Dimensions: ${png.width} x ${png.height}`);

  // Sample vertical transparency profile
  // Check transparency: find transparent regions along vertical center line
  const centerX = Math.floor(png.width / 2);
  let transparentSegments = [];
  let inTrans = false;
  let startY = 0;

  for (let y = 0; y < png.height; y++) {
    const idx = (png.width * y + centerX) << 2;
    const alpha = png.data[idx + 3];
    const isTrans = alpha < 50;

    if (isTrans && !inTrans) {
      inTrans = true;
      startY = y;
    } else if (!isTrans && inTrans) {
      inTrans = false;
      transparentSegments.push({ startY, endY: y - 1, height: y - startY });
    }
  }
  if (inTrans) {
    transparentSegments.push({ startY, endY: png.height - 1, height: png.height - startY });
  }

  console.log(`Transparent cutouts detected along vertical center (x=${centerX}):`, transparentSegments);

  // If transparent segments detected, find their bounding box (minX, maxX)
  if (transparentSegments.length > 0) {
    const boxes = [];
    for (const seg of transparentSegments) {
      const midY = Math.floor((seg.startY + seg.endY) / 2);
      let minX = png.width, maxX = 0;
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * midY + x) << 2;
        if (png.data[idx + 3] < 50) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      boxes.push({ x: minX, y: seg.startY, width: maxX - minX + 1, height: seg.height });
    }
    console.log(`Detected Cutout Windows for ${file}:`, boxes);
  }
}
