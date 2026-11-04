import React,{useEffect,useId,useRef,useState} from 'react';
import {FinanceGlassButton as GlassButton} from './LiquidControls.tsx';

export default function ProgressiveFields({basic,advanced=[],actions}:{basic:React.ReactNode;advanced?:React.ReactNode;actions?:React.ReactNode}){
  const [open,setOpen]=useState(false),id=useId(),root=useRef<HTMLDivElement>(null!),hasAdvanced=React.Children.count(advanced)>0;
  useEffect(()=>{const node=root.current,expand=()=>setOpen(true);node.addEventListener('plan-expand-details',expand);return()=>node.removeEventListener('plan-expand-details',expand)},[]);
  return <div ref={root} className="progressive-fields" onInvalidCapture={event=>{if(!open&&(event.target as HTMLElement).closest('.progressive-advanced')){event.preventDefault();const field=event.target as HTMLInputElement;setOpen(true);requestAnimationFrame(()=>{field.focus();field.reportValidity?.()});}}}>
    <div className="progressive-main"><div className="progressive-basics">{basic}</div>{hasAdvanced&&<GlassButton type="button" className="progressive-toggle" aria-label={open?'Recolher opções':'Mais opções'} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill={open?'none':'currentColor'} stroke={open?'currentColor':'none'} strokeWidth="1.7">{open?<path d="M5 12h14"/>:<><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></>}</svg></GlassButton>}</div>
    {hasAdvanced&&<div id={id} className="progressive-advanced" hidden={!open}>{advanced}</div>}
    {React.Children.count(actions)>0&&<div className="progressive-actions">{actions}</div>}
  </div>;
}
