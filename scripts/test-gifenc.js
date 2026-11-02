import gifencPkg from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifencPkg;

console.log('Testing gifenc import with default pkg...');
const gif = GIFEncoder();
const w = 100, h = 100;
const data = new Uint8Array(w * h * 4);
for (let i = 0; i < data.length; i += 4) {
  data[i] = 255;
  data[i+1] = 100;
  data[i+2] = 50;
  data[i+3] = 255;
}
const palette = quantize(data, 256);
const index = applyPalette(data, palette);
gif.writeFrame(index, w, h, { palette, delay: 500 });
gif.finish();
const bytes = gif.bytes();
console.log('Successfully generated test GIF! Size in bytes:', bytes.length);
