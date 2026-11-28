'use client';
import { useState } from 'react';
import { Avatar as AvatarType, AvatarCategory } from '../lib/types';
import { categories, characterColors, characterItems, itemLabel, itemsFor, normalizeAvatar, skinTones, BodyType } from '../lib/character';
import { Shuffle } from 'lucide-react';
import { AvatarTurntable } from './AvatarTurntable';
import { Avatar } from './Avatar';

export function CharacterCreator({ value, onChange, onBack, onContinue, busy, error }: {value:AvatarType; onChange:(value:AvatarType)=>void; onBack:()=>void; onContinue:()=>void; busy:boolean; error:string}) {
  const [category,setCategory] = useState<AvatarCategory|'body'>('body');
  const [search,setSearch] = useState('');

  const avatar = normalizeAvatar(value);
  const body=avatar.body!;
  const options=category==='body'?[]:itemsFor(category,body).filter(item=>`${itemLabel(item)} ${item.label}`.toLowerCase().includes(search.toLowerCase()));
  const selected=category==='body'?undefined:avatar.parts?.[category];
  const changePart=(id:string,color=selected?.color??'#815137')=>{
    if(category==='body') return;
    onChange({...avatar,parts:{...avatar.parts,[category]:{id,color}}});
  };
  const changeBody=(next:BodyType)=>onChange(normalizeAvatar({...avatar,child:false,body:next}));
  function randomize() {
    const parts={...avatar.parts};
    for(const key of ['hair','top','bottom','shoes'] as AvatarCategory[]) {
      const choices=itemsFor(key,body); const item=choices[Math.floor(Math.random()*choices.length)];
      parts[key]={id:item.id,color:characterColors[Math.floor(Math.random()*characterColors.length)]};
    }
    onChange({...avatar,parts,skinTone:skinTones[Math.floor(Math.random()*7)].id});
  }
  return <section className="character-screen immersive-screen" aria-label="Criador de personagem">
    <header className="experience-header"><button className="text-button" onClick={onBack}>Voltar</button><div><span className="eyebrow">SEU JEITO DE ESTAR PRESENTE</span></div><span className="step-chip">01 · Seu personagem</span></header>
    <div className="creator-workspace"><nav className="creator-categories" aria-label="Categorias do personagem">{categories.map(item=><button key={item.id} aria-pressed={category===item.id} onClick={()=>{setCategory(item.id);setSearch('');}}><svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={item.icon}/></svg>{item.label}<small>{item.id==='body'?skinTones.length:itemsFor(item.id,body).length}</small></button>)}</nav>
      <section className="creator-options"><div className="creator-options-heading"><h2>{categories.find(c=>c.id===category)?.label}</h2><small>{characterItems.filter(item=>item.category!=='cape').length} estilos LPC no catálogo</small></div>
        {category==='body'?<><p>Escolha a base e o tom de pele. Todo mundo tem um lugar por aqui.</p><div className="body-choices">{(['male','female'] as BodyType[]).map(option=><button key={option} aria-pressed={!avatar.child && body===option} onClick={()=>changeBody(option)}><Avatar value={normalizeAvatar({...avatar,child:false,body:option})}/><strong>{option==='male'?'Homem':'Mulher'}</strong></button>)}<button aria-pressed={!!avatar.child} onClick={()=>onChange({...avatar,child:true})}><Avatar value={{...avatar,child:true}}/><strong>Criança</strong></button></div><h3>Tom de pele</h3><div className="skin-choices">{skinTones.map(tone=><button key={tone.id} aria-pressed={avatar.skinTone===tone.id} onClick={()=>onChange({...avatar,skinTone:tone.id})}><i style={{background:tone.color}}/>{tone.label}</button>)}</div></>:<><label className="catalog-search"><span className="sr-only">Buscar em {categories.find(c=>c.id===category)?.label}</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar um estilo…"/></label><fieldset className="catalog-colors"><legend>Cor da peça</legend><div>{characterColors.map((color,i)=><button key={color} aria-label={`Cor ${i+1}`} aria-pressed={selected?.color===color} style={{background:color}} onClick={()=>changePart(selected?.id??options[0]?.id??'',color)}/>)}</div></fieldset><div className="catalog-grid">{!['top','bottom','shoes'].includes(category)&&<button className="catalog-tile" aria-pressed={!selected?.id} onClick={()=>changePart('')}><span className="none-option" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg></span><span>Sem {categories.find(c=>c.id===category)?.label.toLowerCase()}</span></button>}{options.map(item=><button key={item.id} className="catalog-tile" aria-pressed={selected?.id===item.id} onClick={()=>changePart(item.id)}><Avatar value={{...avatar,parts:{...avatar.parts,[category]:{id:item.id,color:selected?.color??'#815137'}}}}/><span>{itemLabel(item)}</span></button>)}</div>{!options.length&&<p>Nenhuma peça encontrada. Tente outro nome.</p>}</>}
      </section>
      <aside className="character-preview"><span className="eyebrow">ESSE É VOCÊ</span><div className="character-podium"><AvatarTurntable value={avatar}/></div><p>Troque peças, combine cores e faça do seu jeito. Na próxima tela você escolhe seu lugar.</p><a href="/creditos" target="_blank" rel="noreferrer">Sprites e créditos LPC</a></aside>
    </div>
    <footer className="experience-footer creator-footer">
      {error && <p role="alert">{error}</p>}
      <button type="button" className="secondary random-look" aria-label="Sortear um visual" disabled={busy} onClick={randomize}>
        <Shuffle size={19} aria-hidden="true" /><span>Sortear<span className="random-detail"> um visual</span></span>
      </button>
      <button className="primary" disabled={busy} onClick={onContinue}>{busy?'Abrindo jardim…':'Escolher meu lugar'}</button>
    </footer>
  </section>;
}
