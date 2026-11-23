// Importa o catálogo de peças vestíveis compatíveis com os dois corpos adultos.
// As animações/armas do editor original não são necessárias para o chá.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
const execute = promisify(execFile);
const revision = 'b029f677ca4007830a7ec8e4bdbd717b0d0eb361';
const root = 'public/assets/lpc';
const extrasOnly = process.argv.includes('--extras-only');
const previous = extrasOnly ? JSON.parse(await readFile('data/lpc-catalog.json', 'utf8')) : {items:[]};
const previousManifest = extrasOnly ? JSON.parse(await readFile(`${root}/catalog-source/manifest.json`, 'utf8')) : {sources:[],failures:[]};
const csv = await readFile(`${root}/source/CREDITS.csv`, 'utf8');
const lines = csv.split(/\r?\n/);
const paths = lines.slice(1).map(line => line.split(',')[0]).filter(path => path.endsWith('.png'));
const sources = new Set(paths);
const used = new Set(previousManifest.sources);
await mkdir(`${root}/catalog`, {recursive:true});
await mkdir(`${root}/catalog-source`, {recursive:true});
const slug = value => value.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
const categories = {hair:/^hair\//,top:/^(torso\/(clothes|armour)|dress)\//,bottom:/^legs\//,shoes:/^feet\//,hat:/^hat\/(?!accessory)/,beard:/^beards\//,accessory:/^(facial|neck|necklace|gloves)\//,cape:/^cape\//};
const groups = new Map();
for (const source of paths) {
  if (extrasOnly) continue;
  if (!/\/(male|female)\/[^/]+\.png$/.test(source)) continue;
  const category = Object.keys(categories).find(key => categories[key].test(source));
  if (!category) continue;
  const body = /\/female\//.test(source) ? 'female' : 'male';
  const folder = source.slice(0, source.lastIndexOf('/'));
  const key = folder.replace(/\/(male|female)$/, '');
  if (!groups.has(key)) groups.set(key, {id:slug(key), category, label:key.split('/').slice(1).join(' / ').replaceAll('_',' '), candidates:{male:[],female:[]}});
  groups.get(key).candidates[body].push(source);
}
// Óculos e outros acessórios compartilhados, publicados sem subpasta de corpo.
for (const source of ['facial/glasses.png','facial/sunglasses.png','facial/monocle.png']) if(!extrasOnly && sources.has(source)) groups.set(source,{id:slug(source),category:'accessory',label:source.includes('sunglasses')?'Óculos de sol':source.includes('monocle')?'Monóculo':'Óculos',candidates:{male:[source],female:[source]}});
// Distinct silhouettes in the same folder must not be reduced to color variants.
for (const [style, filename] of [['hijab','hijab.png'],['hood','hood_white.png'],['cap_leather','leather.png']]) {
  const id = `hat-cloth-${slug(style)}`;
  const candidates = Object.fromEntries(['male','female'].map(body => [body, [`hat/cloth/${body}/${filename}`].filter(path => sources.has(path))]));
  groups.set(id, {id, category:'hat', label:style, candidates});
}
// Curated garment shapes/patterns from the pinned credits, never color-only duplicates.
// A shared sheet is only assigned to the bodies verified during visual review.
const wardrobe = [
  ['torso/aprons/apron', 'top', 'Avental', 'white.png'],
  ['torso/aprons/apron_full', 'top', 'Avental inteiro', 'white.png'],
  ['torso/aprons/apron_half', 'bottom', 'Avental de cintura', 'white.png'],
  ['torso/aprons/overalls', 'top', 'Jardineira', 'white.png'],
  ['torso/bandage', 'top', 'Faixas de tecido', 'white.png'],
  ['torso/chainmail', 'top', 'Camisa de malha metálica', 'gray.png'],
  ['torso/jacket/collared', 'top', 'Casaco com gola', 'white.png'],
  ['torso/jacket/frock', 'top', 'Sobrecasaca', 'white.png'],
  ['torso/jacket/santa', 'top', 'Casaco de Papai Noel', 'white.png'],
  ['torso/jacket/tabard', 'top', 'Tabardo', 'white.png'],
  ['torso/jacket/trench', 'top', 'Sobretudo', 'gray.png'],
  ['torso/clothes/longsleeve', 'top', 'Camisa social', 'formal.png'],
  ['torso/clothes/longsleeve', 'top', 'Camisa social listrada', 'formal_striped.png'],
  ['torso/clothes/vest', 'top', 'Colete listrado', 'gray_striped.png'],
  ['torso/jacket/collared', 'top', 'Casaco com gola listrado', 'brown_striped.png'],
  ['torso/clothes/tunic', 'top', 'Túnica bordada', 'sara.png'],
  ['legs/pantaloons', 'bottom', 'Calça social', 'formal.png'],
  ['legs/pantaloons', 'bottom', 'Calça social listrada', 'formal_striped.png'],
  ['legs/pantaloons', 'bottom', 'Calça com pelúcia', 'furbrown.png'],
  ['torso/waist/belt_belly', 'accessory', 'Cinturão largo', 'white.png'],
  ['torso/waist/belt_double', 'accessory', 'Cinto duplo', 'white.png'],
  ['torso/waist/belt_leather', 'accessory', 'Cinto de couro', 'white.png'],
  ['torso/waist/belt_loose', 'accessory', 'Cinto solto', 'white.png'],
  ['torso/waist/belt_other', 'accessory', 'Cinto fino', 'white.png'],
  ['torso/waist/belt_other', 'accessory', 'Cinto social', 'formal.png'],
  ['torso/waist/sash', 'accessory', 'Faixa de cintura', 'white.png'],
  ['torso/waist/sash_narrow', 'accessory', 'Faixa estreita de cintura', 'white.png'],
];
for (const [folder, category, label, filename] of wardrobe) {
  const id = slug(`${folder}/${filename.replace('.png','')}`);
  const candidates = Object.fromEntries(['male','female'].map(body => [body, [`${folder}/${body}/${filename}`].filter(path => sources.has(path))]));
  groups.set(id, {id, category, label, candidates});
}
for (const [source, label] of [
  ['neck/scarf/white.png', 'Cachecol'],
  ['neck/tie/bow.png', 'Gravata borboleta'],
  ['neck/tie/neck.png', 'Gravata comprida'],
]) {
  if (sources.has(source)) groups.set(source, {id:slug(source), category:'accessory', label, candidates:{male:[source],female:[source]}});
}
const preferred = ['white','blonde','gray','silver','light','brown','black'];
function choose(list) { return [...list].sort((a,b) => score(a)-score(b))[0]; }
function score(path) { const name=path.split('/').pop().replace('.png',''); const i=preferred.indexOf(name); return i<0?99:i; }
async function download(source) {
  const file = `${root}/catalog-source/${slug(source)}.png`;
  try { await access(file); await sharp(file).metadata(); return file; } catch {}
  if (previousManifest.failures.some(failure => failure.source === source && failure.error.includes('404'))) throw new Error('Fonte anteriormente indisponível (404); sem nova tentativa');
  await execute('curl',['-L','--fail','--silent','--show-error','--connect-timeout','5','--max-time','12',`https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/${revision}/spritesheets/${source}`,'-o',file]);
  return file;
}
async function strip(source, destination) {
  const file = await download(source);
  const metadata = await sharp(file).metadata();
  if(metadata.height < 768 || metadata.width < 64) throw new Error('Não possui as quatro vistas universais');
  const frames = await Promise.all([10,9,11,8].map(async(row,index)=>({input:await sharp(file).extract({left:0,top:row*64,width:64,height:64}).toBuffer(),left:index*64,top:0})));
  await sharp({create:{width:256,height:64,channels:4,background:'#00000000'}}).composite(frames).png().toFile(destination);
  used.add(source);
}
const items = previous.items.filter(item => ![...groups.values()].some(group => group.id === item.id)), failures=[...previousManifest.failures];
const jobs = [...groups.values()];
let cursor=0, completed=0;
async function worker() {
  while(cursor<jobs.length) {
    const group=jobs[cursor++]; const images={...previous.items.find(item => item.id === group.id)?.images};
    for(const body of ['male','female']) {
      if(!group.candidates[body].length) continue;
      const source=choose(group.candidates[body]);
      const destination=`${root}/catalog/${group.id}-${body}.png`;
      try { await strip(source,destination); images[body]=`/assets/lpc/catalog/${group.id}-${body}.png`; }
      catch(e) { failures.push({source,error:e.message}); }
    }
    if(Object.keys(images).length) items.push({id:group.id,category:group.category,label:group.label,images});
    completed++; if(completed%20===0) console.log(`Catálogo LPC: ${completed}/${jobs.length} estilos processados`);
  }
}
await Promise.all([worker(),worker()]);
const skins=['light','amber','bronze','black','brown','olive','taupe','lavender','blue','green'];
for(const body of extrasOnly ? [] : ['male','female']) for(const skin of skins) {
  const bodySource=`body/bodies/${body}/universal/${skin}.png`;
  const headSource=`head/heads/human_${body}/universal/${skin}.png`;
  if(!sources.has(bodySource)||!sources.has(headSource)) throw new Error(`Corpo ausente: ${body}/${skin}`);
  const bodyFile=`${root}/catalog/base-${body}-${skin}.png`,headFile=`${root}/catalog/head-${body}-${skin}.png`;
  await strip(bodySource,bodyFile); await strip(headSource,headFile);
  const composed=await sharp(bodyFile).composite([{input:headFile}]).toBuffer();
  await writeFile(bodyFile,composed);
}
items.sort((a,b)=>a.category.localeCompare(b.category)||a.label.localeCompare(b.label));
await writeFile('data/lpc-catalog.json',JSON.stringify({revision,items},null,2));
await writeFile(`${root}/CREDITS-catalog.csv`,lines.filter((line,index)=>index===0||used.has(line.split(',')[0])).join('\n'));
const unresolvedFailures = [...new Map(failures.filter(failure => !used.has(failure.source)).map(failure => [failure.source, failure])).values()];
await writeFile(`${root}/catalog-source/manifest.json`,JSON.stringify({revision,sources:[...used],failures:unresolvedFailures},null,2));
console.log(`Pronto: ${items.length} estilos, ${used.size} fontes, ${unresolvedFailures.length} variantes incompatíveis ou indisponíveis.`);
