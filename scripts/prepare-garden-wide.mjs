// Rebuild offline: node scripts/prepare-garden-wide.mjs
// ART ONLY. Original landscape/pergola/bridge/picnic drawings plus recolored LPC
// crops. Composition and derived art: CC BY-SA 3.0, matching existing garden art.
// LPC attribution: public/assets/garden/source/CREDITS-{trees,plants,furniture}.txt
// Sources: opengameart.org/content/lpc-trees, /lpc-flowers-plants-fungi-wood,
// /lpc-wooden-furniture. No downloaded or copied RPG Maker artwork.
// Visual reference only: https://www.rpgmakerweb.com/blog/resource-spotlight-crescent-wing-studios-mv-tiles
// Landscape reference: https://helenbirch.com/projects/curvy-family-garden/
import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = `${project}public/assets/garden`;
const layout = JSON.parse(await readFile(`${project}data/garden-layout.json`, 'utf8'));
const { width, height, seats } = layout;
if (width !== 1536 || height !== 960) throw new Error('This landscape is designed for 1536 × 960.');
const out = `${root}/sprites/woodland`;
await mkdir(out, { recursive: true });
const seatBoxes = Array.from({ length: seats.columns * seats.rows }, (_, i) => {
  const column = i % seats.columns;
  const x = seats.x + column * seats.spacingX + (column >= seats.columns / 2 ? seats.aisle : 0);
  const y = seats.y + Math.floor(i / seats.columns) * seats.spacingY;
  return { x: x - 18, y: y - 54, w: 84, h: 120 };
});
const intersectsSeat = (x, y, w, h) => seatBoxes.some(b => x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y);
let seed = 73129;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const ellipse = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const svg = (w, h, content) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w / 2}" height="${h / 2}" viewBox="0 0 ${w} ${h}">${content}</svg>`);
async function pixelArt(name, w, h, content) {
  const buffer = await sharp(svg(w, h, content)).png().toBuffer();
  const result = await sharp(buffer).resize(w, h, { kernel: 'nearest' }).png().toBuffer();
  await sharp(result).toFile(`${out}/${name}.png`);
  return result;
}

// Soft, irregular ground masses; paths are continuous curves rather than tile stairs.
let ground = rect(0, 0, width, height, '#789064');
ground += path('M0 0H1536V300Q1360 240 1190 300Q1110 240 1050 260Q780 340 480 258Q300 300 0 330Z', '#566f53');
ground += path('M0 250Q250 220 340 340T350 710Q370 830 620 870L640 960H0Z', '#607b57');
ground += path('M1536 210Q1250 240 1190 350T1220 700Q1140 820 970 870L920 960H1536Z', '#647d55');
ground += path('M435 310Q500 267 650 300Q790 320 945 292Q1080 270 1140 350L1140 755Q1080 835 950 823Q770 802 580 833Q420 825 405 752Z', '#8b9f70');
ground += ellipse(778, 564, 320, 258, '#91a475', 'opacity=".25"');
// Ground flecks stay quiet within the ceremony clearing.
for (let i = 0; i < 12500; i++) {
  const x = Math.floor(random() * width / 2) * 2, y = Math.floor(random() * height / 2) * 2;
  const quiet = x > 410 && x < 1145 && y > 300 && y < 818;
  ground += rect(x, y, random() > .6 ? 4 : 2, 2, i % 2 ? '#c1c394' : '#3d6249', `opacity="${quiet ? '.10' : '.16'}"`);
}
const walks = [
  ['M770 1000 C764 882 775 815 770 734 L770 309', 74],
  ['M770 869 C587 867 477 877 372 788 C310 734 325 662 245 651 C166 640 128 689 90 730', 42],
  ['M770 846 C976 867 1116 829 1201 748 C1260 688 1300 638 1290 568 C1274 475 1220 394 1135 328 C1098 296 1032 274 938 267', 44],
  ['M608 264 C480 258 395 280 337 325 C299 350 269 355 225 351', 36],
];
// Paint each width across the whole network so junctions have no circular caps.
for (const [color, offset] of [['#73855a', 22], ['#a7a77b', 10], ['#c6bb91', 0], ['#d2c7a0', -12]])
  for (const [d, w] of walks) ground += path(d, 'none', `stroke="${color}" stroke-width="${w + offset}" stroke-linecap="round"`);
const walkMask = walks.map(([d, w]) => path(d, 'none', `stroke="white" stroke-width="${w + 14}" stroke-linecap="round"`)).join('');
const walkCore = walks.map(([d, w]) => path(d, 'none', `stroke="black" stroke-width="${w - 5}" stroke-linecap="round"`)).join('');
ground += `<defs><mask id="walks">${walkMask}</mask><mask id="verge">${walkMask}${walkCore}</mask></defs>`;
let grit = '', verge = '';
for (let i = 0; i < 17000; i++) {
  const x = Math.floor(random() * width / 2) * 2, y = Math.floor(random() * height / 2) * 2;
  grit += rect(x, y, 2 + (i % 3) * 2, 2, i % 2 ? '#a9a079' : '#e3d7b3', 'opacity=".4"');
  verge += rect(x, y, 2 + (i % 4) * 2, 2 + (i % 2) * 2, i % 2 ? '#8a9a69' : '#bdba8b');
}
ground += `<g mask="url(#walks)">${grit}</g><g mask="url(#verge)">${verge}</g>`;
ground += ellipse(770, 262, 192, 65, '#a4a078');
ground += ellipse(770, 257, 182, 60, '#cec4a3');
ground += path('M1204 484Q1238 441 1290 453Q1364 432 1396 500Q1423 553 1378 590Q1341 632 1276 621Q1208 629 1191 579Q1164 524 1204 484Z', '#9a9c6d');
ground += path('M1210 491Q1243 449 1290 463Q1359 442 1387 506Q1412 550 1370 584Q1337 620 1276 612Q1219 621 1200 575Q1176 526 1210 491Z', '#b4af82');
// Stream continues beyond the foreground; the bridge crosses it on the left walk.
const stream = 'M244 530 C216 591 229 631 248 674 C278 747 175 778 193 850 C205 900 267 918 251 980';
for (const [color, stroke] of [['#536e53', 66], ['#98a37a', 54], ['#537c79', 42], ['#6e9991', 28]]) ground += path(stream, 'none', `stroke="${color}" stroke-width="${stroke}"`);
const pond = 'M146 396 C153 357 207 355 238 369 C280 343 347 369 355 411 C386 455 345 479 357 521 C371 568 312 596 272 579 C226 608 167 581 168 541 C130 523 117 483 139 454 C123 433 126 410 146 396Z';
ground += path(pond, '#638c86', 'stroke="#455f4b" stroke-width="20"');
ground += path(pond, '#638c86', 'stroke="#a4ae83" stroke-width="10"');
ground += path('M160 409Q210 373 247 397T333 409M152 475Q161 548 221 563M287 560Q334 553 339 522', 'none', 'stroke="#a3c1a5" stroke-width="4"');
ground += path('M183 420h30m61 23h38m-149 38h33m53 39h41m-89 29h26', 'none', 'stroke="#bad0b1" stroke-width="2" opacity=".65"');
for (let i = 0; i < 12; i++) {
  const x = 177 + random() * 150, y = 405 + random() * 140;
  ground += ellipse(x, y, 6, 2, i % 2 ? '#a5c3aa' : '#4e7f7b');
}
// Weathered limestone stage, with a broad open approach to the central aisle.
ground += path('M628 232H912L930 279L912 299H628L610 279Z', '#8b8e73');
ground += path('M628 224H912L930 270L912 287H628L610 270Z', '#ddd1ac');
ground += path('M628 226H912L921 251H620Z', '#e8ddbb');
ground += path('M625 270H917M652 229L642 269M706 229L703 269M766 229V269M825 229L829 269M884 229L894 269', 'none', 'stroke="#b8ad8b" stroke-width="2"');

const pieces = [{ input: await pixelArt('landscape', width, height, ground), left: 0, top: 0 }];
const crops = {
  oak: ['trees-green.png', 320, 96, 96, 128],
  willow: ['trees-green.png', 864, 352, 160, 160],
  round: ['trees-green.png', 128, 352, 96, 160],
  birch: ['trees-pale.png', 64, 96, 64, 128],
  bush: ['plants.png', 256, 704, 64, 64],
  lavender: ['plants.png', 192, 128, 32, 64],
  lily: ['plants.png', 0, 480, 32, 32],
  bench: ['furniture.png', 320, 256, 96, 32],
};
for (const [name, [file, left, top, w, h]] of Object.entries(crops)) {
  await sharp(`${root}/source/${file}`).extract({ left, top, width: w, height: h })
    .modulate({ saturation: .48, brightness: 1.08 }).png().toFile(`${out}/${name}.png`);
}
const cached = new Map();
async function place(name, x, y, scale = 1, checkSeats = true) {
  const key = `${name}:${scale}`;
  if (!cached.has(key)) {
    const m = await sharp(`${out}/${name}.png`).metadata();
    const w = Math.round(m.width * scale), h = Math.round(m.height * scale);
    cached.set(key, { input: await sharp(`${out}/${name}.png`).resize(w, h, { kernel: 'nearest' }).png().toBuffer(), w, h });
  }
  const { input, w, h } = cached.get(key);
  if (checkSeats && intersectsSeat(x, y, w, h)) throw new Error(`Art overlaps seating: ${name} at ${x},${y}`);
  // Crop at map edges, allowing the woodland to continue naturally off-canvas.
  const left = Math.max(0, Math.round(x)), top = Math.max(0, Math.round(y));
  const sx = Math.max(0, -Math.round(x)), sy = Math.max(0, -Math.round(y));
  const cw = Math.min(w - sx, width - left), ch = Math.min(h - sy, height - top);
  if (cw <= 0 || ch <= 0) return;
  pieces.push({ input: await sharp(input).extract({ left: sx, top: sy, width: cw, height: ch }).toBuffer(), left, top });
}

// Original timber pergola: open roof, braced posts, linen swags and a small altar.
let pergola = ellipse(170, 188, 142, 12, '#51634d', 'opacity=".28"');
pergola += rect(31, 43, 12, 136, '#685343') + rect(293, 43, 12, 136, '#685343');
pergola += rect(34, 45, 4, 132, '#b69361') + rect(296, 45, 4, 132, '#b69361');
pergola += path('M37 85L74 47H87L41 99ZM299 85L262 47H249L295 99Z', '#96754e');
pergola += rect(18, 27, 304, 14, '#564b3c') + rect(18, 25, 304, 7, '#bc9b69');
pergola += rect(10, 53, 320, 12, '#6b5540') + rect(10, 51, 320, 5, '#c7a875');
for (let x = 28; x < 320; x += 27) pergola += path(`M${x} 17h9l-15 41h-9Z`, '#8e704d') + path(`M${x} 17h9v4h-9Z`, '#d3b882');
pergola += path('M40 64Q170 123 300 64L300 77Q170 148 40 77Z', '#d8cdb0');
pergola += path('M40 64Q170 111 300 64L300 72Q170 132 40 72Z', '#f5ecd1');
pergola += path('M40 65L65 70Q59 117 47 136L62 175L33 175Q46 135 40 65Z', '#efe5c8');
pergola += path('M300 65L275 70Q281 117 293 136L278 175L307 175Q294 135 300 65Z', '#efe5c8');
pergola += path('M48 77Q52 120 43 137L49 168M292 77Q288 120 297 137L291 168', 'none', 'stroke="#c4b896" stroke-width="3"');
pergola += rect(37, 134, 18, 4, '#b7995d') + rect(285, 134, 18, 4, '#b7995d');
pergola += rect(131, 157, 78, 9, '#836343') + rect(138, 164, 7, 22, '#72593f') + rect(195, 164, 7, 22, '#72593f');
pergola += path('M130 155H210V174L198 171L185 175L169 172L154 175L130 171Z', '#f2e9d0');
pergola += rect(162, 145, 16, 10, '#a7ac83') + path('M170 146V132m0 8-9-6m9 2 8-7', 'none', 'stroke="#567553" stroke-width="3"');
for (const [x, y] of [[162, 133], [170, 129], [180, 129]]) pergola += ellipse(x, y, 4, 3, '#eee3ba');
// Ivy rests on the corners; the roof silhouette and drapery remain legible.
for (let i = 0; i < 45; i++) {
  const side = i % 2, x = side ? 264 + random() * 51 : 22 + random() * 56, y = 34 + random() * 30;
  pergola += ellipse(x, y, 5 + random() * 4, 3 + random() * 3, ['#55744f', '#789363', '#9aa776'][i % 3]);
}
await pixelArt('pergola', 340, 204, pergola);
await place('pergola', 600, 84);

let bridge = ellipse(65, 64, 64, 13, '#354f47', 'opacity=".3"');
bridge += path('M5 34Q65 11 125 34V67Q65 43 5 67Z', '#705a42');
bridge += path('M5 29Q65 8 125 29V59Q65 37 5 59Z', '#b59868');
for (let x = 10; x < 126; x += 10) bridge += path(`M${x} ${29 - Math.sin(x / 130 * Math.PI) * 16}v29`, 'none', 'stroke="#7c674a" stroke-width="2"');
for (const y of [12, 49]) {
  bridge += path(`M6 ${y + 16}Q65 ${y - 7} 124 ${y + 16}`, 'none', 'stroke="#604d3c" stroke-width="5"');
  bridge += path(`M6 ${y + 14}Q65 ${y - 9} 124 ${y + 14}`, 'none', 'stroke="#d0b385" stroke-width="3"');
  for (const x of [6, 35, 95, 124]) bridge += rect(x - 2, y + 6, 5, 25, '#8b704c');
}
await pixelArt('bridge', 132, 90, bridge);
await place('bridge', 184, 619);

let picnic = ellipse(80, 100, 73, 15, '#5c7051', 'opacity=".3"');
picnic += path('M10 45L111 29L151 88L49 108Z', '#e4d6ae', 'stroke="#a99775" stroke-width="3"');
for (let i = 0; i < 6; i++) picnic += path(`M${18 + i * 17} ${44 - i * 2.6}l38 60`, 'none', 'stroke="#b77f6d" stroke-width="8" opacity=".7"');
for (let i = 0; i < 4; i++) picnic += path(`M${17 + i * 10} ${53 + i * 14}l101-16`, 'none', 'stroke="#b77f6d" stroke-width="6" opacity=".55"');
picnic += ellipse(76, 68, 15, 9, '#f8efd7') + ellipse(76, 68, 10, 6, '#cec09d');
picnic += rect(99, 55, 23, 16, '#9c794e') + path('M103 56V49Q111 41 118 49V56', 'none', 'stroke="#6d583e" stroke-width="3"');
picnic += ellipse(51, 69, 5, 7, '#eee6c6') + ellipse(103, 84, 5, 7, '#eee6c6');
picnic += ellipse(75, 67, 5, 3, '#d7ab68') + ellipse(82, 69, 4, 3, '#c18c53');
await pixelArt('picnic', 164, 124, picnic);
await place('picnic', 1214, 468);
await place('bench', 1190, 653, 1.15);
await place('bench', 302, 745);
await place('lily', 178, 429);
await place('lily', 290, 522);

// Small original stone/fern/reed accents, reused in natural clusters.
let rocks = ellipse(30, 26, 29, 10, '#536b51', 'opacity=".5"');
rocks += path('M4 23L11 11L27 7L41 16L39 29L15 32Z', '#7e8978');
rocks += path('M11 11L27 7L36 17L19 21L4 23Z', '#b2b39a');
rocks += path('M34 29L40 18L52 17L60 26L56 34H39Z', '#949d85');
rocks += path('M40 18L52 17L55 23L42 25Z', '#c0bfa4');
await pixelArt('stones', 64, 40, rocks);
let fern = '';
for (let i = 0; i < 7; i++) {
  const dx = (i - 3) * 6;
  fern += path(`M26 42Q${26 + dx} 29 ${26 + dx} ${14 + Math.abs(i - 3) * 4}`, 'none', 'stroke="#526e4c" stroke-width="2"');
  for (let j = 0; j < 4; j++) {
    const x = 26 + dx * (1 - j / 6), y = 19 + j * 5 + Math.abs(i - 3) * 3;
    fern += ellipse(x - 3, y, 4, 2, j % 2 ? '#8fa778' : '#69875b', `transform="rotate(30 ${x - 3} ${y})"`);
    fern += ellipse(x + 3, y - 1, 4, 2, j % 2 ? '#8fa778' : '#69875b', `transform="rotate(-30 ${x + 3} ${y - 1})"`);
  }
}
await pixelArt('fern', 56, 48, fern);
let reeds = '';
for (let i = 0; i < 9; i++) {
  const x = 10 + i * 4, y = 9 + (i % 3) * 7;
  reeds += path(`M30 60Q${x} 30 ${x} ${y}`, 'none', 'stroke="#687a4f" stroke-width="2"');
  if (i % 2) reeds += rect(x - 2, y, 4, 11, '#89714b');
}
await pixelArt('reeds', 60, 64, reeds);
for (const [x, y] of [[127, 366], [319, 365], [119, 513], [309, 562], [173, 730], [1320, 700], [1128, 263]]) await place('stones', x, y);
for (const [x, y] of [[142, 373], [316, 474], [191, 556], [167, 802]]) await place('reeds', x, y);
for (const [x, y] of [[354, 302], [98, 542], [322, 578], [291, 718], [1128, 690], [1190, 318], [1350, 611], [538, 248], [959, 250]]) await place('fern', x, y);

// Depth-sorted woodland: staggered groves, mixed canopies and cropped edges.
const trees = [];
for (let row = 0; row < 3; row++) {
  for (let x = -70; x < width; x += 81 + Math.floor(random() * 33)) {
    if (row === 2 && x > 470 && x < 1000) continue;
    trees.push([['oak', 'round', 'birch'][Math.floor(random() * 3)], x, -130 + row * 83 + Math.floor(random() * 25), 1 + random() * .25]);
  }
}
for (let y = 175; y < 800; y += 109) {
  trees.push(['oak', -48 + random() * 26, y, 1.25], ['round', 1430 + random() * 35, y - 30, 1.2]);
}
trees.push(['willow', 31, 185, 1.35], ['oak', 251, 150, 1.2], ['birch', 355, 181, .9], ['willow', 1190, 142, 1.3], ['oak', 1375, 235, 1.25]);
for (let x = -70; x < 1490; x += 83 + Math.floor(random() * 31)) {
  if (x > 620 && x < 870) continue;
  trees.push([x % 2 ? 'round' : 'oak', x, 835 + random() * 40, 1.3]);
}
trees.push(['willow', -30, 720, 1.3], ['birch', 325, 796, 1], ['willow', 1350, 766, 1.3]);
// Low understory fills gaps at the woodland edge without repetitive flower rows.
for (const [x, y] of [[80, 285], [294, 270], [345, 242], [485, 202], [1000, 202], [1110, 245], [1315, 295], [1390, 382], [68, 638], [350, 680], [1370, 664], [1140, 744], [440, 838], [1020, 835]]) {
  await place('bush', x, y, .9);
  await place('fern', x + 24, y + 39);
}
for (const [x, y] of [[360, 678], [1380, 636], [1160, 725], [540, 234], [978, 230], [102, 310]]) await place('lavender', x, y, .85);
trees.sort((a, b) => a[2] + crops[a[0]][4] * a[3] - b[2] - crops[b[0]][4] * b[3]);
for (const [name, x, y, scale] of trees) await place(name, x, y, scale);

await sharp({ create: { width, height, channels: 4, background: '#789064' } }).composite(pieces).png().toFile(`${root}/garden-wide.png`);
console.log(`Woodland garden ${width} × ${height}; ${seatBoxes.length} seat envelopes protected; ${pieces.length} art layers.`);
