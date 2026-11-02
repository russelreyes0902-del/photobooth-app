import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../public/templates');
for (const f of ['1.png', '2.png', '3.png']) {
  const png = PNG.sync.read(fs.readFileSync(path.join(templateDir, f)));
  // Sample top margin (y=30), center (y=455 between photo 1 & 2), and bottom margin (y=1800)
  const topColor = `rgb(${png.data[(png.width * 30 + 353) << 2]}, ${png.data[((png.width * 30 + 353) << 2) + 1]}, ${png.data[((png.width * 30 + 353) << 2) + 2]})`;
  const midColor = `rgb(${png.data[(png.width * 455 + 353) << 2]}, ${png.data[((png.width * 455 + 353) << 2) + 1]}, ${png.data[((png.width * 455 + 353) << 2) + 2]})`;
  const botColor = `rgb(${png.data[(png.width * 1800 + 353) << 2]}, ${png.data[((png.width * 1800 + 353) << 2) + 1]}, ${png.data[((png.width * 1800 + 353) << 2) + 2]})`;
  console.log(`${f} -> Top: ${topColor}, Mid: ${midColor}, Bot: ${botColor}`);
}
