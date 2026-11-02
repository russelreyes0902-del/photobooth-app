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
  console.log(`\n=================== ${f} ===================`);

  // Scan down the center column x = 353
  const cx = Math.floor(png.width / 2);
  let runs = [];
  let currentRun = null;

  for (let y = 0; y < png.height; y++) {
    const idx = (png.width * y + cx) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];

    // Check if it's the light photo window color (e.g. r > 220, g > 220, b > 210)
    const isPhotoWindow = r > 210 && g > 210 && b > 200;
    if (isPhotoWindow) {
      if (!currentRun) {
        currentRun = { startY: y };
      }
    } else {
      if (currentRun) {
        currentRun.endY = y - 1;
        currentRun.height = currentRun.endY - currentRun.startY + 1;
        runs.push(currentRun);
        currentRun = null;
      }
    }
  }
  if (currentRun) {
    currentRun.endY = png.height - 1;
    currentRun.height = currentRun.endY - currentRun.startY + 1;
    runs.push(currentRun);
  }

  console.log(`Candidate vertical segments (at x=${cx}):`, runs.filter(r => r.height > 50));

  // For the major segments, find the horizontal extent
  const photoWindows = [];
  for (const seg of runs.filter(r => r.height > 100)) {
    const midY = Math.floor((seg.startY + seg.endY) / 2);
    let minX = cx, maxX = cx;
    while (minX > 0) {
      const idx = (png.width * midY + (minX - 1)) << 2;
      const r = png.data[idx], g = png.data[idx + 1], b = png.data[idx + 2];
      if (r > 210 && g > 210 && b > 200) {
        minX--;
      } else {
        break;
      }
    }
    while (maxX < png.width - 1) {
      const idx = (png.width * midY + (maxX + 1)) << 2;
      const r = png.data[idx], g = png.data[idx + 1], b = png.data[idx + 2];
      if (r > 210 && g > 210 && b > 200) {
        maxX++;
      } else {
        break;
      }
    }
    photoWindows.push({
      x: minX,
      y: seg.startY,
      width: maxX - minX + 1,
      height: seg.height,
    });
  }
  console.log(`Detected Photo Windows:`, photoWindows);
}
