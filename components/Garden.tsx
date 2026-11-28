'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Avatar as AvatarType, Participation, SEAT_COUNT } from '../lib/types';
import { Avatar } from './Avatar';
import layout from '../data/garden-layout.json';

function seatPosition(index:number) {
  const column=index%layout.seats.columns;
  return {x:layout.seats.x+column*layout.seats.spacingX+(column>=4?layout.seats.aisle:0),y:layout.seats.y+Math.floor(index/layout.seats.columns)*layout.seats.spacingY};
}
export function Garden({pending=false,guests,onSeat,selected,previewAvatar,ownId,canSelect=false,immersive=false,onRefresh}:{
  pending?:boolean;guests:Participation[];onSeat:(seat:number,guest?:Participation)=>void;selected?:number;
  canSelect?:boolean;previewAvatar?:AvatarType;ownId?:string;immersive?:boolean;onRefresh?:()=>void;
}) {
  const [zoom,setZoom]=useState(immersive?1.5:1);
  const maxZoom=5;
  const [fit,setFit]=useState(0);
  const viewport=useRef<HTMLDivElement>(null);
  const anchor=useRef<{x:number;y:number;clientX:number;clientY:number}|null>(null);
  useEffect(()=>{
    const element=viewport.current;
    if (!element) return;
    const map=element.querySelector("svg.game-map")!;
    const points=new Map<number,{x:number;y:number}>();
    let moved=false;
    let lastDistance=0;
    function changeZoom(factor:number,x:number,y:number) {
      const rect=map.getBoundingClientRect();
      if (!rect.width) return;
      anchor.current={x:(x-rect.left)/rect.width,y:(y-rect.top)/rect.height,clientX:x,clientY:y};
      setZoom(current=>Math.max(1,Math.min(maxZoom,current*factor)));
    }
    function wheel(event:WheelEvent) {
      event.preventDefault();
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?element!.clientHeight:1);
      changeZoom(Math.exp(-delta*.002),event.clientX,event.clientY);
    }
    function down(event:PointerEvent) {
      if(event.button!==0) return;
      if(!points.size) moved=false;
      points.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(points.size===2) {
        const [a,b]=Array.from(points.values());
        lastDistance=Math.hypot(a.x-b.x,a.y-b.y); moved=true;
      }
    }
    function move(event:PointerEvent) {
      const old=points.get(event.pointerId);
      if(!old) return;
      const dx=event.clientX-old.x,dy=event.clientY-old.y;
      if(!moved && Math.hypot(dx,dy)<4) return;
      moved=true;
      element!.setPointerCapture(event.pointerId);
      points.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(points.size===1) { element!.scrollBy(-dx,-dy); return; }
      const [a,b]=Array.from(points.values());
      const distance=Math.hypot(a.x-b.x,a.y-b.y);
      if(distance && lastDistance) changeZoom(distance/lastDistance,(a.x+b.x)/2,(a.y+b.y)/2);
      lastDistance=distance;
    }
    function end(event:PointerEvent) { points.delete(event.pointerId); lastDistance=0; }
    function click(event:MouseEvent) { if(moved && event.detail) {event.preventDefault();event.stopPropagation();} }
    element.addEventListener("wheel",wheel,{passive:false});
    element.addEventListener("pointerdown",down);
    element.addEventListener("pointermove",move);
    window.addEventListener("pointerup",end);
    window.addEventListener("pointercancel",end);
    element.addEventListener("click",click,true);
    return ()=>{
      element.removeEventListener("wheel",wheel);
      element.removeEventListener("pointerdown",down);
      element.removeEventListener("pointermove",move);
      window.removeEventListener("pointerup",end);
      window.removeEventListener("pointercancel",end);
      element.removeEventListener("click",click,true);
    };
  },[]);
  const previousScale=useRef<number|null>(null);
  const focusAltar=()=>{const element=viewport.current;if(!element)return;element.scrollLeft=768*fit*zoom-element.clientWidth/2;element.scrollTop=210*fit*zoom-element.clientHeight*.38;};
  useEffect(()=>{
    const media=window.matchMedia('(max-width: 700px)');
    const update=()=>{

      if (immersive) setZoom(media.matches?3:1.5);
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
    if(anchor.current) {
      const target=anchor.current;
      const rect=element.querySelector("svg.game-map")!.getBoundingClientRect();
      element.scrollBy(rect.left+target.x*rect.width-target.clientX,rect.top+target.y*rect.height-target.clientY);
      anchor.current=null;
      previousScale.current=nextScale;
      return;
    }
    element.scrollLeft=x*nextScale-element.clientWidth/2;
    element.scrollTop=y*nextScale-element.clientHeight/2;
    previousScale.current=nextScale;
  },[zoom,fit,immersive]);
  const scale=fit*zoom;
  const previewMove = canSelect && selected !== undefined && previewAvatar &&
    !guests.some(person => person.seat === selected && person.id !== ownId);
  return <section inert={pending} aria-busy={pending} className={`game-panel ${immersive?'game-immersive':''}`} aria-label="Jardim encantado interativo">
    <div className="game-toolbar"><div className="map-controls"><div className="zoom-control" aria-label="Zoom do jardim"><button type="button" aria-label="Diminuir mapa" disabled={zoom<=1} onClick={()=>setZoom(Math.max(1,zoom-.5))}>−</button><output aria-live="polite">{Math.round(zoom*100)}%</output><button type="button" aria-label="Ampliar mapa" disabled={zoom>=maxZoom} onClick={()=>setZoom(Math.min(maxZoom,zoom+.5))}>+</button></div></div></div>
    <div className="game-viewport" ref={viewport}>
      <div className="map-centering" style={{minWidth:layout.width*scale,minHeight:layout.height*scale}}><svg className="game-map" style={{width:layout.width*scale,height:layout.height*scale}} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label="Mapa do jardim com bosque, lago, piquenique e cadeiras">
        <image href="/assets/garden/garden-wide.png" width={layout.width} height={layout.height}/>
        <g className="garden-bunting" aria-hidden="true"><path d="M350 115 Q768 245 1186 115" fill="none" stroke="#b8a66c" strokeWidth="3"/>{Array.from({length:21},(_,i)=>{const x=368+i*40,y=120+Math.sin(i/20*Math.PI)*62;return <g key={i}><path d={`M${x} ${y}l18 0-9 20z`} fill={['#f0d5a0','#c98488','#a8c4a2','#f6ead1'][i%4]}/><circle cx={x+22} cy={y+4} r="3" fill="#fff3bb" className="festoon-light"/></g>;})}</g>
        <g className="map-title" aria-hidden="true"><rect x="656" y="94" width="224" height="60" rx="3" fill="#fff3d7" stroke="#ad865a" strokeWidth="3"/><text x="768" y="117" textAnchor="middle" className="map-eyebrow">UM JARDIM DE CARINHO</text><text x="768" y="145" textAnchor="middle" className="map-name">Estêvão</text></g>
        {Array.from({length:SEAT_COUNT},(_,index)=>{
          const seat=index+1,guest=guests.find(person=>person.seat===seat && !(previewMove && person.id===ownId && seat!==selected)),{x,y}=seatPosition(index);
          const preview=selected===seat&&(!guest||guest.id===ownId)&&previewAvatar;
          const character=preview||guest?.avatar;
          const active=!!guest || canSelect;
          const label=guest?`Cadeira ${seat}: ${guest.name}. Ver recado`:`Escolher cadeira ${seat}, livre`;
          return <g key={seat} className={`game-seat ${guest?'is-occupied':''} ${selected===seat?'is-selected':''}`} transform={`translate(${x} ${y})`} role={active?"button":undefined} tabIndex={active?0:undefined} aria-hidden={!active} aria-label={active?label:undefined} aria-pressed={active?selected===seat:undefined} onClick={active?()=>onSeat(seat,guest):undefined} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSeat(seat,guest);}}}><title>{label}</title><ellipse className="seat-halo" cx="24" cy="39" rx="25" ry="11"/><image href="/assets/garden/sprites/chair.png" x="4" y="8" width="40" height="40"/>{character&&<foreignObject x="-12" y="-30" width="72" height="72"><Avatar value={character} seated/></foreignObject>}<rect className="seat-hit" x="-6" y="-26" width="60" height="88" rx="8" fill="transparent"/><text x="24" y="62" textAnchor="middle" className="map-seat-number">{String(seat).padStart(2,'0')}</text>{guest&&<g className="guest-map-name"><rect x="-44" y="-53" width="136" height="24" rx="4"/><text x="24" y="-37" textAnchor="middle">{guest.name.length>20?guest.name.slice(0,18)+'…':guest.name}</text></g>}</g>;
        })}
        <g className="fireflies" aria-hidden="true">{[[124,460],[820,190],[310,762],[639,255],[1260,600],[170,180],[1190,720],[510,850],[1410,340],[328,585]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" style={{animationDelay:`${i*.7}s`}}/>)}</g>
        <g className="pond-shimmer" aria-hidden="true"><path d="M200 430h20m40 32h24m-52 47h16m70-90h20" stroke="#d5f1d9" strokeWidth="2" fill="none"/></g>
      </svg></div>
    </div>
  </section>;
}
