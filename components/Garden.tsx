'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Avatar as AvatarType, Participation, SEAT_COUNT } from '../lib/types';
import { Avatar } from './Avatar';
import layout from '../data/garden-layout.json';

function seatPosition(index:number) {
  const column=index%layout.seats.columns;
  return {x:layout.seats.x+column*layout.seats.spacingX+(column>=4?layout.seats.aisle:0),y:layout.seats.y+Math.floor(index/layout.seats.columns)*layout.seats.spacingY};
}
export function Garden({guests,onSeat,selected,previewAvatar,ownId,immersive=false,onRefresh}:{
  guests:Participation[];onSeat:(seat:number,guest?:Participation)=>void;selected?:number;
  previewAvatar?:AvatarType;ownId?:string;immersive?:boolean;onRefresh?:()=>void;
}) {
  const [zoom,setZoom]=useState(immersive?1.5:1);
  const [maxZoom,setMaxZoom]=useState(1.5);
  const [fit,setFit]=useState(0);
  const viewport=useRef<HTMLDivElement>(null);
  const drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const previousScale=useRef<number|null>(null);
  const focusAltar=()=>{const element=viewport.current;if(!element)return;element.scrollLeft=768*fit*zoom-element.clientWidth/2;element.scrollTop=210*fit*zoom-element.clientHeight*.38;};
  useEffect(()=>{
    const media=window.matchMedia('(max-width: 700px)');
    const update=()=>{
      const nextMax=media.matches?4:1.5;
      setMaxZoom(nextMax);
      if (immersive) setZoom(media.matches?4:1.5);
    };
    update();
    media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>setZoom(current=>Math.min(current,maxZoom)),[maxZoom]);
  useEffect(()=>{
    const element=viewport.current;if(!element)return;
    const measure=()=>setFit(Math.min(element.clientWidth/layout.width,element.clientHeight/layout.height));
    const observer=new ResizeObserver(measure);observer.observe(element);measure();return()=>observer.disconnect();
  },[]);
  useLayoutEffect(()=>{
    const element=viewport.current;if(!element||!fit)return;
    const nextScale=fit*zoom,oldScale=previousScale.current;
    const x=oldScale?(element.scrollLeft+element.clientWidth/2)/oldScale:768;
    const y=oldScale?(element.scrollTop+element.clientHeight/2)/oldScale:(immersive?210:layout.height/2);
    element.scrollLeft=x*nextScale-element.clientWidth/2;
    element.scrollTop=y*nextScale-element.clientHeight/2;
    previousScale.current=nextScale;
  },[zoom,fit,immersive]);
  const scale=fit*zoom;
  return <section className={`game-panel ${immersive?'game-immersive':''}`} aria-label="Jardim encantado interativo">
    <div className="game-toolbar"><div className="map-controls"><div className="zoom-control" aria-label="Zoom do jardim"><button type="button" aria-label="Diminuir mapa" disabled={zoom<=1} onClick={()=>setZoom(Math.max(1,zoom-.5))}>−</button><output aria-live="polite">{Math.round(zoom*100)}%</output><button type="button" aria-label="Ampliar mapa" disabled={zoom>=maxZoom} onClick={()=>setZoom(Math.min(maxZoom,zoom+.5))}>+</button></div></div></div>
    <div className="game-viewport" ref={viewport} onPointerDown={event=>{if((event.target as Element).closest('[role="button"]')||event.pointerType==='touch')return;const element=viewport.current!;drag.current={x:event.clientX,y:event.clientY,left:element.scrollLeft,top:element.scrollTop};element.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(!drag.current)return;const element=viewport.current!;element.scrollLeft=drag.current.left-(event.clientX-drag.current.x);element.scrollTop=drag.current.top-(event.clientY-drag.current.y);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <div className="map-centering" style={{minWidth:layout.width*scale,minHeight:layout.height*scale}}><svg className="game-map" style={{width:layout.width*scale,height:layout.height*scale}} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label="Mapa do jardim com bosque, lago, piquenique e cadeiras">
        <image href="/assets/garden/garden-wide.png" width={layout.width} height={layout.height}/>
        <g className="garden-bunting" aria-hidden="true"><path d="M350 115 Q768 245 1186 115" fill="none" stroke="#b8a66c" strokeWidth="3"/>{Array.from({length:21},(_,i)=>{const x=368+i*40,y=120+Math.sin(i/20*Math.PI)*62;return <g key={i}><path d={`M${x} ${y}l18 0-9 20z`} fill={['#f0d5a0','#c98488','#a8c4a2','#f6ead1'][i%4]}/><circle cx={x+22} cy={y+4} r="3" fill="#fff3bb" className="festoon-light"/></g>;})}</g>
        <g className="map-title" aria-hidden="true"><rect x="656" y="94" width="224" height="60" rx="3" fill="#fff3d7" stroke="#ad865a" strokeWidth="3"/><text x="768" y="117" textAnchor="middle" className="map-eyebrow">UM JARDIM DE CARINHO</text><text x="768" y="145" textAnchor="middle" className="map-name">Estevão</text></g>
        {Array.from({length:SEAT_COUNT},(_,index)=>{
          const seat=index+1,guest=guests.find(person=>person.seat===seat),{x,y}=seatPosition(index);
          const preview=selected===seat&&(!guest||guest.id===ownId)&&previewAvatar;
          const character=preview||guest?.avatar;
          const label=guest?`Cadeira ${seat}: ${guest.name}. Ver recado`:`Escolher cadeira ${seat}, livre`;
          return <g key={seat} className={`game-seat ${guest?'is-occupied':''} ${selected===seat?'is-selected':''}`} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={label} aria-pressed={selected===seat} onClick={()=>onSeat(seat,guest)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSeat(seat,guest);}}}><title>{label}</title><ellipse className="seat-halo" cx="24" cy="39" rx="25" ry="11"/><image href="/assets/garden/sprites/chair.png" x="4" y="8" width="40" height="40"/>{character&&<foreignObject x="-12" y="-30" width="72" height="72"><Avatar value={character} seated/></foreignObject>}<rect className="seat-hit" x="-6" y="-26" width="60" height="88" rx="8" fill="transparent"/><text x="24" y="62" textAnchor="middle" className="map-seat-number">{String(seat).padStart(2,'0')}</text>{guest&&<g className="guest-map-name"><rect x="-44" y="-53" width="136" height="24" rx="4"/><text x="24" y="-37" textAnchor="middle">{guest.name.length>20?guest.name.slice(0,18)+'…':guest.name}</text></g>}</g>;
        })}
        <g className="fireflies" aria-hidden="true">{[[124,460],[820,190],[310,762],[639,255],[1260,600],[170,180],[1190,720],[510,850],[1410,340],[328,585]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" style={{animationDelay:`${i*.7}s`}}/>)}</g>
        <g className="pond-shimmer" aria-hidden="true"><path d="M200 430h20m40 32h24m-52 47h16m70-90h20" stroke="#d5f1d9" strokeWidth="2" fill="none"/></g>
      </svg></div>
    </div><div className="game-legend"><span>Arraste para explorar · Toque em uma cadeira para escolher ou ver quem está lá.</span><a href="/creditos" target="_blank" rel="noreferrer">Arte e créditos LPC</a></div>
  </section>;
}
