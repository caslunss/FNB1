import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FinanceGlassButton as Button} from './LiquidControls.jsx';
import {useMobileLayout} from '../services/mobile-layout.js';

function Icon({kind}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{kind==='close'?<path d="m6 6 12 12M18 6 6 18"/>:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>}</svg>}

export default function MobileExperience(){
  const mobile=useMobileLayout(),sheet=useRef(null),trigger=useRef(null),handoff=useRef(false);
  const [state,setState]=useState({tab:'r',closed:false,sections:{}}),[opened,setOpened]=useState(false);
  useEffect(()=>{const sync=()=>setState(window.planMobile?.getState()||{tab:'r',closed:false,sections:{}});sync();addEventListener('plan-navigation-change',sync);addEventListener('plan-sections-change',sync);return()=>{removeEventListener('plan-navigation-change',sync);removeEventListener('plan-sections-change',sync)}},[]);
  useEffect(()=>{
    if(!mobile){sheet.current?.close();setOpened(false);return;}
    let frame;
    const viewport=window.visualViewport;
    const scroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>document.documentElement.style.setProperty('--mobile-title-progress',Math.min(1,Math.max(0,scrollY/64))))};
    const keyboard=()=>document.body.classList.toggle('mobile-keyboard-open',!!viewport&&viewport.scale===1&&Math.max(document.documentElement.clientHeight,innerHeight)-viewport.height>160);
    const tabs=document.querySelector('#tabs'),observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--mobile-tab-height',`${tabs?.getBoundingClientRect().height||70}px`));
    if(tabs)observer.observe(tabs);
    addEventListener('scroll',scroll,{passive:true});viewport?.addEventListener('resize',keyboard);scroll();keyboard();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('scroll',scroll);viewport?.removeEventListener('resize',keyboard);document.body.classList.remove('mobile-keyboard-open')};
  },[mobile]);
  if(!mobile)return null;
  const close=()=>sheet.current?.close();
  function choose(panel){handoff.current=true;close();requestAnimationFrame(()=>window.planMobile?.open(panel,trigger.current));}
  return <>
    <div className="mobile-utility"><Button ref={trigger} className="ib" aria-label="Atalhos" aria-haspopup="dialog" aria-controls="mobileShortcuts" aria-expanded={opened} onClick={()=>{handoff.current=false;sheet.current.showModal();setOpened(true)}}><Icon/></Button></div>

    {createPortal(<dialog id="mobileShortcuts" ref={sheet} className="mobile-shortcuts-sheet" aria-labelledby="mobileShortcutsTitle" onClose={()=>{setOpened(false);if(!handoff.current)trigger.current?.focus({preventScroll:true});handoff.current=false}} onClick={e=>{if(e.target!==sheet.current)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}}>
      <div className="mobile-shortcuts-handle" aria-hidden="true"><span/></div>
      <header><h2 id="mobileShortcutsTitle">Atalhos</h2><Button autoFocus className="ib" aria-label="Fechar atalhos" onClick={close}><Icon kind="close"/></Button></header>
      <div className="mobile-shortcut-list">{state.sections.calendar!==false?<Button onClick={()=>choose('calendar')}>Calendário</Button>:<p className="foot">Nenhum atalho disponível.</p>}</div>
    </dialog>,document.body)}
  </>;
}
