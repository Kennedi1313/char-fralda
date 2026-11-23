// Recortes e composição de tiles LPC. As fontes e licenças acompanham os PNGs.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const root = 'public/assets/garden';
await mkdir(`${root}/sprites`, { recursive: true });
const rectangles = {
  oak: ['trees-green.png', 320, 96, 96, 128],
  willow: ['trees-green.png', 864, 352, 160, 160],
  round: ['trees-green.png', 128, 352, 96, 160],
  birch: ['trees-pale.png', 64, 96, 64, 128],
  bush: ['plants.png', 256, 704, 64, 64],
  flowers: ['plants.png', 128, 160, 64, 64],
  lavender: ['plants.png', 192, 128, 32, 64],
  hedge: ['plants.png', 256, 896, 64, 64],
  chair: ['furniture.png', 384, 544, 32, 32],
  bench: ['furniture.png', 320, 256, 96, 32],
  table: ['furniture.png', 224, 224, 64, 64],
  grass: ['terrain-v7.png', 0, 384, 32, 32],
  path: ['terrain-v7.png', 32, 96, 32, 32],
  pond: ['terrain-v7.png', 0, 512, 96, 96],
};
for (const [name, [file, left, top, width, height]] of Object.entries(rectangles)) {
  await sharp(`${root}/source/${file}`).extract({ left, top, width, height }).png().toFile(`${root}/sprites/${name}.png`);
}
const width = 960, height = 864;
const pieces = [];
async function place(name, left, top, scale = 1) {
  let sprite = sharp(`${root}/sprites/${name}.png`);
  if (scale !== 1) { const m = await sprite.metadata(); sprite = sprite.resize(Math.round(m.width * scale), Math.round(m.height * scale), { kernel: 'nearest' }); }
  pieces.push({ input: await sprite.toBuffer(), left, top });
}
for (let y = 0; y < height; y += 32) for (let x = 0; x < width; x += 32) await place('grass', x, y);
// Clareira e caminho até a entrada; os assentos ficam sobre o gramado.
for (let y = 128; y < 256; y += 32) for (let x = 288; x < 672; x += 32) await place('path', x, y);
for (let y = 256; y < height; y += 32) for (let x = 448; x < 512; x += 32) await place('path', x, y);
for (let x = 0; x < width; x += 64) { await place('hedge', x, 0); await place('hedge', x, 800); }
for (let y = 96; y < 768; y += 96) { await place('bush', 20, y); await place('bush', 876, y); }
await place('pond', 64, 512, 1.5);
await place('bench', 720, 664);
await place('bench', 144, 664);
await place('table', 368, 156);
await place('table', 528, 156);
for (const x of [224, 672]) for (const y of [144, 208]) await place('flowers', x, y);
for (const y of [280, 408, 536, 664]) { await place('lavender', 176, y); await place('lavender', 752, y); }
// Ordre de profondeur : les feuillages de premier plan recouvrent le sol.
for (const [name, x, y] of [
  ['oak', 12, 0], ['round', 100, 0], ['oak', 196, 0],
  ['round', 680, 0], ['oak', 776, 0], ['oak', 864, 0],
  ['oak', 0, 200], ['birch', 88, 256], ['willow', 784, 224],
  ['oak', 0, 384], ['round', 840, 432], ['birch', 64, 664],
  ['willow', 0, 704], ['oak', 128, 736], ['round', 736, 704], ['oak', 864, 736],
]) await place(name, x, y);
await sharp({ create: { width, height, channels: 4, background: '#558b3a' } }).composite(pieces).png().toFile(`${root}/garden-map.png`);
console.log('Mapa LPC 960×864 e sprites preparados.');
