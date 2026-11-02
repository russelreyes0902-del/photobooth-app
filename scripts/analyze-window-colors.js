import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../public/templates');
for (const f of ['1.png', '2.png', '3.png']) {
  const png = PNG.sync.read(fs.readFileSync(path.join(templateDir, f)));
  console.log(`\nAnalyzing ${f}:`);

  // Photo 1 window: y from 100 to 400, x from 100 to 500
  const colorMap = new Map();
  for (let y = 100; y <= 400; y += 10) {
    for (let x = 100; x <= 500; x += 10) {
      const idx = (png.width * y + x) << 2;
      const key = `${png.data[idx]},${png.data[idx+1]},${png.data[idx+2]}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
  }
  const sorted = [...colorMap.entries()].sort((a,b) => b[1] - a[1]).slice(0, 5);
  console.log(`Top colors inside photo 1 window:`, sorted);
}
