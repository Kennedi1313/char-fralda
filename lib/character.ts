import catalog from '../data/lpc-catalog.json';
import { Avatar, AvatarCategory, palette } from './types';

export type BodyType = 'male' | 'female';
export type CharacterItem = { id: string; category: AvatarCategory; label: string; images: Partial<Record<BodyType, string>> };
export const characterItems = (catalog.items as CharacterItem[]).filter(item => item.id !== "feet-boots");
export const categories: { id: Exclude<AvatarCategory, 'cape'> | 'body'; label: string; icon: string }[] = [
  {id:'body',label:'Corpo e pele',icon:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2'},
  {id:'hair',label:'Cabelos',icon:'M4 20V10a8 8 0 0 1 16 0v10M4 11c4 0 7-3 8-6 1 4 4 6 8 6M8 13v2a4 4 0 0 0 8 0v-2'},
  {id:'top',label:'Roupas e vestidos',icon:'m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z'},
  {id:'bottom',label:'Calças e saias',icon:'M6 3h12l2 18h-6l-2-12-2 12H4L6 3Zm0 4h12'},
  {id:'shoes',label:'Calçados',icon:'M4 4h7v9l8 3a3 3 0 0 1 2 3v2H3V9Zm-1 14h18'},
  {id:'hat',label:'Chapéus e fantasias',icon:'m7 15 2-11h6l2 11M3 15h18v4H3v-4Zm5-4h8'},
  {id:'beard',label:'Barbas',icon:'M4 8v6c0 4 5 7 8 8 3-1 8-4 8-8V8l-4 4-4-2-4 2-4-4Zm5 7h6'},
  {id:'accessory',label:'Acessórios',icon:'M10 14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm12 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM10 14h4M2 14V7h3m17 7V7h-3'},
];
export const characterColors = ['#372a29','#815137','#d9aa52','#aa535e','#ddd5cb','#f5ede1','#262d3b','#616c75','#c78351','#883c39','#ce766b','#dfaf9a','#cead52','#8e9c49','#597c65','#367c78','#74ada5','#637eac','#385884','#8d6eae','#ba8fb7','#b56c81','#793951','#c4c6bc'];
export const skinTones = [
  {id:'light',label:'Claro',color:'#f6d0af'}, {id:'amber',label:'Âmbar',color:'#dcaa7a'},
  {id:'bronze',label:'Bronze',color:'#ab7049'}, {id:'black',label:'Escuro',color:'#70432e'},
  {id:'brown',label:'Marrom',color:'#995b43'}, {id:'olive',label:'Oliva',color:'#c7ad78'},
  {id:'taupe',label:'Bege acinzentado',color:'#ac9986'}, {id:'lavender',label:'Lavanda fantasia',color:'#b6a6cf'},
  {id:'blue',label:'Azul fantasia',color:'#84acbe'}, {id:'green',label:'Verde fantasia',color:'#7eb67b'},
];
const labels: Record<string,string> = { plain:'Clássico', long:'Comprido', curly_short:'Cacheado curto', curly_long:'Cacheado longo', ponytail:'Rabo de cavalo', afro:'Afro', bob:'Chanel', braid:'Trança', braid2:'Trança dupla', pigtails:'Maria-chiquinha', dreadlocks_long:'Dreads longos', dreadlocks_short:'Dreads curtos', bangs:'Franja', bangs_bun:'Coque com franja', shortsleeve:'Camiseta', longsleeve:'Manga longa', sleeveless:'Regata', vest:'Colete', vest_open:'Colete aberto', pants:'Calça', pantaloons:'Calça ampla', shoes:'Sapatos', boots:'Botas', slippers:'Sapatilhas', sandals:'Sandálias', beard:'Barba', mustache:'Bigode', gentleman:'Social', formal:'Social', crown:'Coroa', wizard:'Mago', pirate:'Pirata', solid:'Clássica', tattered:'Desgastada', glasses:'Óculos', sunglasses:'Óculos de sol' };
// Translate the complete path so different garments do not share ambiguous names.
const styleLabels: Record<string, string> = {
  '':'Luvas', capeclip:'Broche de capa', capetie:'Laço de capa', cravat:'Gravata de lenço', earring:'Brinco', eyepatch:'Tapa-olho', jabot:'Gravata com babados', necklace:'Colar', bigstache:'Bigode volumoso', winter:'Barba longa',
  armour:'Armadura', plate:'Placas de metal', leggings:'Calça justa', skirts:'Saia', belle:'Rodada', legion:'Legionária', overskirt:'Sobreposta', slit:'Com fenda', straight:'Reta', trim:'Com borda',
  balding:'Entradas', bangslong:'Franja longa', bangslong2:'Franja longa lateral', bangsshort:'Franja curta', bedhead:'Despenteado', bob_side_part:'Chanel de lado', bunches:'Rabos laterais', buzzcut:'Raspado', cornrows:'Tranças rentes', cowlick:'Topete', cowlick_tall:'Topete alto', curtains:'Repartido ao meio', curtains_long:'Comprido repartido ao meio', flat_top_fade:'Topo reto com degradê', flat_top_straight:'Topo reto', half_up:'Semipreso', halfmessy:'Semipreso bagunçado', high_and_tight:'Curto com laterais raspadas', high_ponytail:'Rabo de cavalo alto', idol:'Franja de estrela', jewfro:'Cachos volumosos', lob:'Chanel longo', long_band:'Comprido com faixa', long_center_part:'Comprido com risca central', long_messy:'Comprido bagunçado', long_messy2:'Comprido desalinhado', long_tied:'Comprido amarrado', longhawk:'Moicano longo', longknot:'Coque longo', loose:'Solto', messy1:'Bagunçado curto', messy2:'Bagunçado médio', messy3:'Bagunçado volumoso', mop:'Franja cheia', natural:'Natural', page:'Corte pajem', page2:'Pajem arredondado', part2:'Risca lateral marcada', parted:'Repartido de lado', pigtails_bangs:'Maria-chiquinha com franja', pixie:'Curtinho', ponytail2:'Rabo de cavalo baixo', princess:'Princesa', sara:'Sara', shorthawk:'Moicano curto', shortknot:'Coque curto', shoulderl:'Sobre o ombro esquerdo', shoulderr:'Sobre o ombro direito', single:'Mecha única', spiked:'Espetado', spiked2:'Espetado curto', spiked_beehive:'Espetado alto', spiked_liberty:'Pontas em leque', spiked_liberty2:'Pontas em leque longo', spiked_porcupine:'Pontas de porco-espinho', swoop:'Franja de lado', twists_fade:'Torcidos com degradê', twists_straight:'Torcidos retos', unkempt:'Desalinhado', wavy:'Ondulado', xlong:'Muito comprido',
  cloth:'Bandana de tecido', elf:'Chapéu de elfo', head_band_tied:'Faixa amarrada', helmet:'Elmo', armet:'Articulado', armet_simple:'Articulado simples', barbarian:'Bárbaro', barbarian_nasal:'Bárbaro com proteção nasal', barbarian_viking:'Bárbaro viking', barbuta:'Aberto em T', barbuta_simple:'Aberto simples', bascinet:'Bacinete', bascinet_pigface:'Bacinete com bico', bascinet_pigface_raised:'Bacinete com bico levantado', bascinet_round:'Bacinete arredondado', bascinet_round_raised:'Bacinete arredondado aberto', close:'Fechado', flattop:'Topo plano', greathelm:'Grande elmo', horned:'Com chifres', kettle:'Aba larga', mail:'Cota de malha', maximus:'Gladiador', morion:'Crista alta', nasal:'Proteção nasal', norman:'Normando', pointed:'Pontudo', spangenhelm:'Segmentado', spangenhelm_viking:'Segmentado viking', sugarloaf:'Cônico', sugarloaf_simple:'Cônico simples', xeon:'Guerreiro futurista', magic:'Chapéu de mago',
  bandana:'Bandana', bandana_skull:'Bandana com caveira', bicorne_athwart:'Bicorne transversal', bicorne_athwart_admiral:'Bicorne de almirante', bicorne_athwart_admiral_cockade:'Bicorne de almirante com insígnia', bicorne_athwart_commodore:'Bicorne transversal de comandante', bicorne_athwart_pirate:'Bicorne transversal de pirata', bicorne_foreaft:'Bicorne longitudinal', bicorne_foreaft_commodore:'Bicorne longitudinal de comandante', bonnie:'Chapéu de aba caída', bonnie_feather:'Chapéu de aba caída com pena', cavalier:'Chapéu de cavaleiro', cavalier_feather:'Chapéu de cavaleiro com pena', kerchief:'Lenço de cabeça', tricorne:'Tricorne', tricorne_captain:'Tricorne de capitão', tricorne_captain_pirate:'Tricorne de capitão pirata', tricorne_captain_pirate_skull:'Tricorne de capitão com caveira', tricorne_lieutenant:'Tricorne de tenente', tricorne_stitched:'Tricorne costurado', tricorne_thatch:'Tricorne de palha', reptile:'Bandana de réptil', santa:'Gorro de Papai Noel', tiara:'Tiara', visor:'Viseira', grated:'Gradeada', grated_narrow:'Gradeada estreita', pigface:'Com bico', pigface_raised:'Com bico levantado', round:'Arredondada', round_raised:'Arredondada aberta', slit_narrow:'Fenda estreita',
  ghillies:'Sapatilhas de amarrar', hoofs:'Cascos', leather:'Couro', bodice:'Vestido com corpete', clothes:'Roupa', blouse:'Blusa', blouse_longsleeve:'Blusa de manga longa', corset:'Espartilho', longsleeve_laced:'Manga longa com laços', robe:'Túnica longa', scoop_shirt:'Blusa de gola redonda', sleeveless_laced:'Regata com laços', sleeveless_striped:'Regata listrada', tanktop:'Regata de alças', tunic:'Túnica', sash:'Vestido com faixa',
  hijab:'Hijab', hood:'Capuz', cap_leather:'Chapéu de couro com pena',
};
export function itemLabel(item: CharacterItem) {
  return item.label.split(' / ').map(segment => {
    const key = segment.replaceAll(' ', '_');
    return styleLabels[key] ?? labels[key] ?? segment;
  }).join(' · ');
}
export function itemsFor(category: AvatarCategory, body: BodyType) { return characterItems.filter(item => item.category === category && item.images[body]); }
export function findItem(id: string | undefined) { return characterItems.find(item => item.id === id); }

export function normalizeAvatar(value: Avatar): Avatar {
  const body = value.body ?? 'male';
  const legacyHair = ['hair-plain','hair-long','hair-curly-short','hair-ponytail','hair-afro','hair-bob'];
  const defaults: NonNullable<Avatar['parts']> = {
    hair:{id:legacyHair[value.style] ?? 'hair-plain',color:value.hair},
    top:{id:'torso-clothes-shortsleeve',color:value.shirt},
    bottom:{id:'legs-pants',color:'#385884'}, shoes:{id:'feet-shoes',color:'#815137'},
  };
  const parts = {...defaults,...value.parts};
  if (parts.shoes?.id === "feet-boots") parts.shoes = {...parts.shoes, id:"feet-shoes"};
  for(const category of Object.keys(parts) as AvatarCategory[]) {
    const part = parts[category];
    if(part?.id && !findItem(part.id)?.images[body]) {
      parts[category] = ['top','bottom','shoes'].includes(category) ? {id:itemsFor(category,body)[0]?.id ?? '',color:part.color} : {id:'',color:part.color};
    }
  }
  return {...value,body,skinTone:value.skinTone ?? skinTones[Math.max(0,palette.skin.indexOf(value.skin))].id,parts};
}

export function isValidAvatar(value: unknown): value is Avatar {
  if(!value || typeof value !== 'object') return false;
  const avatar = value as Avatar;
  if(!palette.skin.includes(avatar.skin) || !palette.hair.includes(avatar.hair) || !palette.shirt.includes(avatar.shirt) || !Number.isInteger(avatar.style) || avatar.style<0 || avatar.style>5) return false;
  if(avatar.child !== undefined && typeof avatar.child !== "boolean") return false;
  if(avatar.body !== undefined && !['male','female'].includes(avatar.body)) return false;
  if(avatar.skinTone !== undefined && !skinTones.some(tone=>tone.id===avatar.skinTone)) return false;
  if(avatar.parts !== undefined) {
    if(!avatar.parts || typeof avatar.parts !== 'object' || Array.isArray(avatar.parts)) return false;
    for(const [category,part] of Object.entries(avatar.parts)) {
      if(!(category==='cape' || categories.some(c=>c.id===category && c.id!=='body')) || !part || typeof part.id!=='string' || typeof part.color!=='string' || !/^#[0-9a-f]{6}$/i.test(part.color)) return false;
      if(part.id && (!findItem(part.id)?.images[avatar.body??'male'] || findItem(part.id)?.category!==category)) return false;
    }
    if(!avatar.parts.top?.id || !avatar.parts.bottom?.id || !avatar.parts.shoes?.id) return false;
  }
  return true;
}
