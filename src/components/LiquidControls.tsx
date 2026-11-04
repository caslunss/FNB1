import {finance} from '../services/finance-runtime.ts';
import DatePicker from './DatePicker.tsx';
import FinanceSelect from './FinanceSelect.tsx';
import IOSButton from './motion/IOSButton.tsx';
import {useMobileLayout,useBottomNavigationLayout} from '../services/mobile-layout.ts';
import React, {useEffect,useLayoutEffect,useId, useRef, useState, useSyncExternalStore} from 'react';
import {GlassCard,GlassMenu,GlassSwitch as LibrarySwitch, GlassSegmented, useRefraction, usePress} from '@zakisheriff/liquid-glass';
import {getLayout,subscribeLayout} from '../services/layout-preferences.ts';

const useLayout=()=>useSyncExternalStore(subscribeLayout,getLayout);
export function FinanceGlassButton({className='',shimmer=true,...props}:React.ComponentProps<typeof IOSButton>){const layout=useLayout();return <IOSButton {...props} className={`te-glass-button ${className}`} shimmer={shimmer} intensity={layout.intensity}/>}
// Calendar choices paint one selected state, without refractive copies of dates.
export function FinanceCalendarButton({className='',...props}:React.ComponentProps<'button'>){
 return <button {...props} type="button" className={`finance-calendar-choice ${className}`}/>;
}
export function FinanceGlassSwitch({className='',...props}:React.ComponentProps<typeof LibrarySwitch>){
 return <LibrarySwitch {...props} className={`te-glass-switch ${className}`}/>;
}
// A single outer glass surface owns the material for tabs and field triggers.
export function FinanceFieldButton({children,className='',...props}:React.ComponentProps<'button'>){
 return <button {...props} type={props.type||'button'} className={`lg-button te-glass-button finance-field-button ${className}`}><span className="lg-button__label">{children}</span></button>;
}
export function FinanceTabButton({children,className='',...props}:Omit<React.ComponentProps<'button'>,'onDrag'|'onDragStart'|'onDragEnd'|'onAnimationStart'>){
 const bottom=useBottomNavigationLayout();
 if(!bottom)return <FinanceGlassButton {...props} className={className}>{children}</FinanceGlassButton>;
 return <button {...props} type="button" className={`lg-button te-glass-button nav-icon-button ${className}`}><span className="lg-button__label">{children}</span></button>;
}
const SurfaceRim=()=> <span className="te-surface-rim" aria-hidden="true"/>;
export function FinanceGlassCard({children,className='',...props}:React.ComponentProps<typeof GlassCard>){const layout=useLayout();return <GlassCard {...props} className={`te-glass-surface ${className}`} intensity={Math.min(layout.intensity,2)}>{children}<SurfaceRim/></GlassCard>}

// Custom surfaces preserve the app's vertical navigation and semantic sections.
// Both hooks are the public extension API documented by the library.
export function GlassSurface({as:Tag='section',className='',children,...props}:React.HTMLAttributes<HTMLElement>&{as?:React.ElementType}){
  // A single CSS backdrop avoids cloning interactive descendants into nested mirrors.
  return <Tag className={`lg-glass lg-glass--host te-glass-surface ${className}`} data-liquid-glass="" {...props}>{children}<SurfaceRim/></Tag>;
}

// These hosts receive React-rendered icons from the existing controllers.
export function GlassActionHost({className='',...props}:React.ComponentProps<'button'>){
  const ref=useRef<HTMLButtonElement>(null!);
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
  function change(checked:boolean){
    window.dispatchEvent(new CustomEvent('plan-theme-request',{detail:checked?'dark':'light'}));
    setDark(document.documentElement.dataset.theme==='dark');
  }
  return <div className="te-theme-control"><span>Modo escuro</span><FinanceGlassSwitch checked={dark} onChange={change} aria-label="Modo escuro"/></div>;
}

export function FinanceSegments({items,label,className=''}:{items:{kind:string;value:string;label:string;selected:boolean}[];label:string;className?:string}){
  const mobile=useMobileLayout();
  const selected=Math.max(0,items.findIndex(x=>x.selected));
  const [index,setIndex]=useState(selected);
  useEffect(()=>setIndex(selected),[selected]);
  const layout=useLayout();
  return <GlassSegmented className={`te-glass-segments ${className.replace(/\bsegments\b/g,'')}`} options={items.map(x=>mobile&&x.kind==='data-summary-mode'?({overview:'Resumo',behavior:'Hábitos',entries:'Lançamentos'}[x.value]||x.label):x.label)} value={index} intensity={layout.intensity} aria-label={label} onChange={next=>{
    if(!Number.isInteger(next)||!items[next])return;
    setIndex(next);
    // Let the library finish its gesture before the controller replaces the view.
    queueMicrotask(()=>{window.dispatchEvent(new CustomEvent('plan-segment-request',{detail:items[next]}));requestAnimationFrame(()=>{const bar=[...document.querySelectorAll('[role=tablist]')].find(el=>el.getAttribute('aria-label')===label);bar?.querySelector<HTMLElement>('[role=tab][aria-selected=true]')?.focus({preventScroll:true});});});
  }}/>;
}

export function GlassTextField({children,className='',nativeSelect=false}:{children?:React.ReactNode;className?:string;nativeSelect?:boolean}){
  if(React.isValidElement<React.ComponentProps<'input'>>(children)&&children.type==='input'&&children.props.type==='date')return <DatePicker {...children.props}/>;
  if(React.isValidElement<React.ComponentProps<'select'>>(children)&&children.type==='select')children=<FinanceSelect {...children.props} nativeControl={nativeSelect}/>;
  return <GlassSurface as="span" className={`lg-input__field te-text-field ${className}`}>{children}</GlassSurface>;
}

export function FinanceActionMenu({descriptor,label,icon,className='',items:givenItems,disabled=false}:{descriptor?:Parameters<typeof finance.actionItems>[0];label?:string;icon?:React.ReactNode;className?:string;items?:ReturnType<typeof finance.actionItems>;disabled?:boolean}){
  disabled=disabled||!!(finance.isMonthClosed?.()&&descriptor?.kind!=='summary'&&descriptor?.a!=='addmonth');
  const ref=useRef<HTMLDivElement>(null!);const [placement,setPlacement]=useState<{align:'start'|'end';width:number}>({align:'end',width:220});
  useLayoutEffect(()=>{const measure=()=>{const r=ref.current?.getBoundingClientRect();if(!r)return;const align=r.right>=232?'end':'start';setPlacement({align,width:Math.max(140,Math.min(220,align==='start'?innerWidth-r.left-12:r.right-12))});};measure();const observer=new ResizeObserver(measure);if(ref.current)observer.observe(ref.current);window.addEventListener('resize',measure);return()=>{observer.disconnect();window.removeEventListener('resize',measure)}},[]);
  const items=givenItems||finance.actionItems?.(descriptor||{})||[];
  const labeled=descriptor?.kind==='ledger';
  return <span ref={ref} className={`te-action-menu ${className}${labeled?' action-menu-labeled':''}`} data-actions-menu="" inert={disabled||undefined} aria-disabled={disabled||undefined}><GlassMenu icon={labeled?<span className="action-trigger-label">{icon}</span>:icon} aria-label={label||'Ações'} align={placement.align} width={placement.width} items={items.map(item=>({...item,onSelect:()=>{ref.current?.querySelector('button')?.focus();item.onSelect?.();}}))}/></span>;
}

export function GlassActionEditor({label,icon,children,className='',initialOpen=false,showLabel=false}:{label:string;icon?:React.ReactNode;children?:React.ReactNode;className?:string;initialOpen?:boolean;showLabel?:boolean}){
  const [open,setOpen]=useState(initialOpen),ref=useRef<HTMLDetailsElement>(null!),trigger=useRef<HTMLButtonElement>(null!),id=useId();
  function toggle(){const next=!open;setOpen(next);if(next)requestAnimationFrame(()=>ref.current?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea')?.focus({preventScroll:true}));else trigger.current?.focus();}
  const minus=<svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>;
  const plus=<svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>;
  return <div className="te-action-editor"><FinanceGlassButton ref={trigger} type="button" className={showLabel?"te-editor-toggle te-editor-pill":"ib te-editor-toggle"} aria-label={open?`Fechar ${label.toLowerCase()}`:label} aria-expanded={open} aria-controls={id} title={open?'Fechar':label} onClick={toggle}>{open?minus:(icon||plus)}{showLabel&&<span>{open?'Fechar':label}</span>}</FinanceGlassButton><details id={id} ref={ref} className={className} open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary hidden>{label}</summary>{children}</details></div>;
}

export function SettingsOption({label,id,children}:{label:string;id?:string;children?:React.ReactNode}){
  const [open,setOpen]=useState(false);
  return <FinanceGlassCard className={`card settings-option${open?' is-open':''}`}><button type="button" className="settings-option-trigger" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><span>{label}</span><span aria-hidden="true">{open?'−':'+'}</span></button><div id={id} className={`settings-option-body${open?' is-open':''}`} inert={!open||undefined} aria-hidden={!open}><div>{children}</div></div></FinanceGlassCard>;
}
