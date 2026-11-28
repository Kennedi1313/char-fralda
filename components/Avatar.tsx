'use client';
import { useId } from 'react';
import { Avatar as AvatarType, AvatarCategory } from '../lib/types';
import { findItem, normalizeAvatar } from '../lib/character';

const order:AvatarCategory[]=['cape','shoes','bottom','top','beard','hair','hat','accessory'];
// Recoloração por luminância: conserva o sombreado pixel a pixel das peças LPC.
function colorMatrix(hex:string) {
  const rgb=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)/255);
  return rgb.map(channel=>[.2126*channel*1.3,.7152*channel*1.3,.0722*channel*1.3,0,.015].join(' ')).join(' ')+' 0 0 0 1 0';
}
export function Avatar({ value, seated=false, direction=0 }: {value:AvatarType; seated?:boolean; direction?:number}) {
  const uid=useId().replace(/:/g,'');
  const avatar=normalizeAvatar(value);
  const body=avatar.body!;
  const parts=order.flatMap(category=>{
    const selection=avatar.parts?.[category];
    const image=findItem(selection?.id)?.images[body];
    return selection&&image?[{category,image,color:selection.color}]:[];
  });
  const renderPart=(part:typeof parts[number])=><image key={part.category} href={part.image} x={-direction*64} width="256" height="64" filter={`url(#${uid}-${part.category})`}/>;
  const images=<svg x="0" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">{parts.filter(part=>part.category==='cape').map(renderPart)}<image href={`/assets/lpc/catalog/base-${body}-${avatar.skinTone}.png`} x={-direction*64} width="256" height="64"/>{parts.filter(part=>part.category!=='cape').map(renderPart)}</svg>;
  return <svg className="avatar lpc-avatar" viewBox="0 0 64 64" role="img" aria-label="Personagem LPC personalizado" shapeRendering="crispEdges" overflow="hidden"><defs>{parts.map(part=><filter id={`${uid}-${part.category}`} key={part.category} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={colorMatrix(part.color)}/></filter>)}<clipPath id={`${uid}-upper`}><rect width="64" height="43"/></clipPath><clipPath id={`${uid}-lower`}><rect y="43" width="64" height="21"/></clipPath></defs><g transform={avatar.child ? "translate(7 15) scale(.78 .74)" : undefined}>{seated?<><g transform="translate(0 5)" clipPath={`url(#${uid}-upper)`}>{images}</g><g transform="translate(0 18) scale(1 .7)" clipPath={`url(#${uid}-lower)`}>{images}</g></>:images}</g></svg>;
}
