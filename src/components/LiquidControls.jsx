import IOSButton from './motion/IOSButton.tsx';
import {useMobileLayout} from '../services/mobile-layout.js';
import React, {useEffect,useLayoutEffect,useId, useRef, useState, useSyncExternalStore} from 'react';
import {GlassButton,GlassCard,GlassMenu,GlassSwitch, GlassSegmented, useRefraction, usePress} from '@zakisheriff/liquid-glass';
import {getLayout,subscribeLayout} from '../services/layout-preferences.js';

const useLayout=()=>useSyncExternalStore(subscribeLayout,getLayout);
export function FinanceGlassButton({className='',shimmer=true,...props}){const layout=useLayout();return <IOSButton {...props} className={`te-glass-button ${className}`} shimmer={shimmer} intensity={layout.intensity}/>}
const SurfaceRim=()=> <span className="te-surface-rim" aria-hidden="true"/>;
export function FinanceGlassCard({children,className='',...props}){const layout=useLayout();return <GlassCard {...props} className={`te-glass-surface ${className}`} intensity={Math.min(layout.intensity,2)}>{children}<SurfaceRim/></GlassCard>}

// Custom surfaces preserve the app's vertical navigation and semantic sections.
// Both hooks are the public extension API documented by the library.
export function GlassSurface({as:Tag='section',className='',children,...props}){
  // A single CSS backdrop avoids cloning interactive descendants into nested mirrors.
  return <Tag className={`lg-glass lg-glass--host te-glass-surface ${className}`} data-liquid-glass="" {...props}>{children}<SurfaceRim/></Tag>;
}

// These hosts receive React-rendered icons from the existing controllers.
export function GlassActionHost({className='',...props}){
  const ref=useRef(null);
  const layout=useLayout();
  useRefraction(ref,{kind:'surface',strength:layout.intensity/5,bezel:12},!/(app-symbol|notification-button|calendar-button|friends-button)/.test(className));
  usePress(ref,{grow:0,lean:0,stretch:0});
  return <button ref={ref} className={`lg-glass te-glass-host ${className}`} data-liquid-glass="" {...props}/>;
}

export function ThemeSwitch(){
  const [dark,setDark]=useState(()=>document.documentElement.dataset.theme==='dark');
  useEffect(()=>{
    const observer=new MutationObserver(()=>setDark(document.documentElement.dataset.theme==='dark'));
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    return ()=>observer.disconnect();
  },[]);
  function change(checked){
    window.dispatchEvent(new CustomEvent('plan-theme-request',{detail:checked?'dark':'light'}));
    setDark(document.documentElement.dataset.theme==='dark');
  }
  return <div className="te-theme-control"><span>Modo escuro</span><GlassSwitch checked={dark} onChange={change} aria-label="Modo escuro"/></div>;
}

export function FinanceSegments({items,label,className=''}){
  const mobile=useMobileLayout();
  const selected=Math.max(0,items.findIndex(x=>x.selected));
  const [index,setIndex]=useState(selected);
  useEffect(()=>setIndex(selected),[selected]);
  const layout=useLayout();
  return <GlassSegmented className={`te-glass-segments ${className.replace(/\bsegments\b/g,'')}`} options={items.map(x=>mobile&&x.kind==='data-summary-mode'?({overview:'Resumo',behavior:'Hábitos',entries:'Entradas'}[x.value]||x.label):x.label)} value={index} intensity={layout.intensity} aria-label={label} onChange={next=>{
    if(!Number.isInteger(next)||!items[next])return;
    setIndex(next);
    // Let the library finish its gesture before the controller replaces the view.
    queueMicrotask(()=>{window.dispatchEvent(new CustomEvent('plan-segment-request',{detail:items[next]}));requestAnimationFrame(()=>{const bar=[...document.querySelectorAll('[role=tablist]')].find(el=>el.getAttribute('aria-label')===label);bar?.querySelector('[role=tab][aria-selected=true]')?.focus({preventScroll:true});});});
  }}/>;
}

export function GlassTextField({children,className=''}){
  return <GlassSurface as="span" className={`lg-input__field te-text-field ${className}`}>{children}</GlassSurface>;
}

export function FinanceActionMenu({descriptor,label,icon,className='',items:givenItems,disabled=false}){
  disabled=disabled||!!(window.planIsMonthClosed?.()&&descriptor?.kind!=='summary'&&descriptor?.a!=='addmonth');
  const ref=useRef(null);const [placement,setPlacement]=useState({align:'end',width:220});
  useLayoutEffect(()=>{const measure=()=>{const r=ref.current?.getBoundingClientRect();if(!r)return;const align=r.right>=232?'end':'start';setPlacement({align,width:Math.max(140,Math.min(220,align==='start'?innerWidth-r.left-12:r.right-12))});};measure();const observer=new ResizeObserver(measure);if(ref.current)observer.observe(ref.current);window.addEventListener('resize',measure);return()=>{observer.disconnect();window.removeEventListener('resize',measure)}},[]);
  const items=givenItems||window.planActionItems?.(descriptor)||[];
  return <span ref={ref} className={`te-action-menu ${className}`} data-actions-menu="" inert={disabled||undefined} aria-disabled={disabled||undefined}><GlassMenu icon={icon} aria-label={label||'Ações'} align={placement.align} width={placement.width} items={items.map(item=>({...item,onSelect:()=>{ref.current?.querySelector('button')?.focus();item.onSelect?.();}}))}/></span>;
}

export function GlassActionEditor({label,icon,children,className='',initialOpen=false,showLabel=false}){
  const [open,setOpen]=useState(initialOpen),ref=useRef(null),trigger=useRef(null),id=useId();
  function toggle(){const next=!open;setOpen(next);if(next)requestAnimationFrame(()=>ref.current?.querySelector('input:not([type=hidden]),select,textarea')?.focus({preventScroll:true}));else trigger.current?.focus();}
  const minus=<svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>;
  const plus=<svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>;
  return <div className="te-action-editor"><FinanceGlassButton ref={trigger} type="button" className={showLabel?"te-editor-toggle te-editor-pill":"ib te-editor-toggle"} aria-label={open?`Fechar ${label.toLowerCase()}`:label} aria-expanded={open} aria-controls={id} title={open?'Fechar':label} onClick={toggle}>{open?minus:(icon||plus)}{showLabel&&<span>{open?'Fechar':label}</span>}</FinanceGlassButton><details id={id} ref={ref} className={className} open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary hidden>{label}</summary>{children}</details></div>;
}

export function SettingsOption({label,id,children}){
  const [open,setOpen]=useState(false);
  return <FinanceGlassCard className={`card settings-option${open?' is-open':''}`}><button type="button" className="settings-option-trigger" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><span>{label}</span><span aria-hidden="true">{open?'−':'+'}</span></button><div id={id} className={`settings-option-body${open?' is-open':''}`} inert={!open||undefined} aria-hidden={!open}><div>{children}</div></div></FinanceGlassCard>;
}
