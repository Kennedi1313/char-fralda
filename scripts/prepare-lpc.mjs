// Reproduz os recortes a partir de uma revisão fixa do Universal LPC.
// Execute: node scripts/prepare-lpc.mjs (requer rede na primeira execução).
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);

const revision = 'b029f677ca4007830a7ec8e4bdbd717b0d0eb361';
const root = 'public/assets/lpc';
const skins = ['light', 'amber', 'bronze', 'black'];
const hairColors = ['black', 'dark_brown', 'blonde', 'red', 'white'];
const hairStyles = ['plain', 'long', 'curly_short', 'ponytail', 'afro', 'bob'];
const shirts = ['rose', 'forest', 'blue', 'orange', 'lavender'];
const layers = [];
skins.forEach((color, i) => {
  layers.push([`body/bodies/male/universal/${color}.png`, `body-${i}`]);
  layers.push([`head/heads/human_male/universal/${color}.png`, `head-${i}`]);
});
hairStyles.forEach((style, i) => hairColors.forEach((color, j) => layers.push([`hair/${style}/male/${color}.png`, `hair-${i}-${j}`])));
shirts.forEach((color, i) => layers.push([`torso/clothes/shortsleeve/male/${color}.png`, `shirt-${i}`]));
layers.push(['legs/pants/male/charcoal.png', 'pants'], ['feet/shoes/male/brown.png', 'shoes']);

await mkdir(`${root}/source`, { recursive: true });
await mkdir(`${root}/layers`, { recursive: true });
async function obtain(path, destination) {
  try { await access(destination); return; } catch {}
  await execute('curl', ['-L', '--fail', '--silent', '--show-error', '--retry', '3', '--retry-all-errors', '--max-time', '20', `https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/${revision}/${path}`, '-o', destination]);
}
// Limita a concorrência para não sobrecarregar o servidor de origem.
for (let start = 0; start < layers.length; start += 1) {
  await Promise.all(layers.slice(start, start + 1).map(async ([path, name]) => {
    const source = `${root}/source/${name}.png`;
    await obtain(`spritesheets/${path}`, source);
    // Primeira posição de caminhada voltada para baixo, grade universal 64x64.
    await sharp(source).extract({ left: 0, top: 640, width: 64, height: 64 }).png().toFile(`${root}/layers/${name}.png`);
  }));
}
await obtain('CREDITS.csv', `${root}/source/CREDITS.csv`);
const csv = await readFile(`${root}/source/CREDITS.csv`, 'utf8');
const paths = new Set(layers.map(([path]) => path));
const selected = csv.split(/\r?\n/).filter((line, i) => i === 0 || paths.has(line.split(',')[0]));
if (selected.length !== layers.length + 1) throw new Error(`Créditos incompletos: ${selected.length - 1}/${layers.length}`);
await writeFile(`${root}/CREDITS-selected.csv`, selected.join('\n'));
await writeFile(`${root}/source/manifest.json`, JSON.stringify({ revision, layers }, null, 2));
console.log(`${layers.length} camadas LPC preparadas, com créditos individuais.`);
