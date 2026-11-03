import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FinanceGlassButton as Button} from './LiquidControls.jsx';
import {useMobileLayout} from '../services/mobile-layout.js';

function Icon({kind}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{kind==='search'?<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>:kind==='plus'?<path d="M12 5v14M5 12h14"/>:kind==='close'?<path d="m6 6 12 12M18 6 6 18"/>:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>}</svg>}

export default function MobileExperience(){
  const mobile=useMobileLayout(),sheet=useRef(null),trigger=useRef(null),gesture=useRef(null),dragged=useRef(false);
  const [state,setState]=useState({tab:'r',closed:false,sections:{}}),[expanded,setExpanded]=useState(false);
  useEffect(()=>{const sync=()=>setState(window.planMobile?.getState()||{tab:'r',closed:false,sections:{}});sync();addEventListener('plan-navigation-change',sync);addEventListener('plan-sections-change',sync);return()=>{removeEventListener('plan-navigation-change',sync);removeEventListener('plan-sections-change',sync)}},[]);
  useEffect(()=>{
    if(!mobile){sheet.current?.close();return;}
    let frame;
    const scroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>document.documentElement.style.setProperty('--mobile-title-progress',Math.min(1,Math.max(0,scrollY/64))))};
    const keyboard=()=>document.body.classList.toggle('mobile-keyboard-open',visualViewport?.scale===1&&innerHeight-visualViewport.height>160);
    const tabs=document.querySelector('#tabs'),observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--mobile-tab-height',`${tabs?.getBoundingClientRect().height||70}px`));
    if(tabs)observer.observe(tabs);
    addEventListener('scroll',scroll,{passive:true});visualViewport?.addEventListener('resize',keyboard);scroll();keyboard();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('scroll',scroll);visualViewport?.removeEventListener('resize',keyboard);document.body.classList.remove('mobile-keyboard-open')};
  },[mobile]);
  if(!mobile)return null;
  const close=()=>sheet.current?.close();
  function choose(panel){close();requestAnimationFrame(()=>panel==='carbon'||panel==='taxes'?window.planMobile?.navigate(panel==='taxes'?'f':'e'):window.planMobile?.open(panel));}
  return <>
    <div className="mobile-utility"><Button ref={trigger} className="ib" aria-label="Atalhos" aria-haspopup="dialog" onClick={()=>{setExpanded(false);sheet.current.showModal()}}><Icon/></Button></div>
    <div className="mobile-bottom-actions" aria-label="Ações rápidas"><Button className="mobile-search-action ib" aria-label="Pesquisar" onClick={()=>dispatchEvent(new Event('plan-mobile-search'))}><Icon kind="search"/></Button>{!state.closed&&['r','i','d'].includes(state.tab)&&<Button className="mobile-compose-action ib" aria-label={state.tab==='d'?'Adicionar dívida':'Novo lançamento'} onClick={()=>window.planMobile?.compose()}><Icon kind="plus"/></Button>}</div>
    {createPortal(<dialog ref={sheet} className={`mobile-shortcuts-sheet ${expanded?'is-expanded':''}`} aria-labelledby="mobileShortcutsTitle" onClose={()=>trigger.current?.focus({preventScroll:true})} onClick={e=>{if(e.target===sheet.current)close()}}>
      <button type="button" className="mobile-sheet-grabber" aria-label="Expandir ou recolher atalhos" aria-expanded={expanded} onClick={()=>{if(!dragged.current)setExpanded(x=>!x);dragged.current=false}} onPointerDown={e=>{gesture.current=e.clientY;dragged.current=false;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={e=>{if(gesture.current===null)return;const delta=e.clientY-gesture.current;gesture.current=null;dragged.current=Math.abs(delta)>12;if(delta>70)close();else if(delta<-35)setExpanded(true)}} onPointerCancel={()=>{gesture.current=null}}><span/></button>
      <header><h2 id="mobileShortcutsTitle">Atalhos</h2><Button className="ib" aria-label="Fechar atalhos" onClick={close}><Icon kind="close"/></Button></header>
      <div className="mobile-shortcut-list">{[[state.sections.calendar!==false,'calendar','Calendário'],[true,'friends','Amigos'],[true,'reports','Relatórios'],[true,'integrations','Integrações'],[state.sections.carbon!==false,'carbon','Carbono'],[true,'settings','Configurações']].filter(([visible])=>visible).map(([,panel,label])=><Button key={panel} onClick={()=>choose(panel)}>{label}</Button>)}</div>
    </dialog>,document.body)}
  </>;
}
