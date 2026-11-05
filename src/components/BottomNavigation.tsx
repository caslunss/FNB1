import {animate} from 'motion';
import {APP_SPRING} from '../services/motion-presets.ts';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import {FinanceOptionBar} from './LiquidControls.tsx';
import {useBottomNavigationLayout} from '../services/mobile-layout.ts';
import {getLayout,subscribeLayout} from '../services/layout-preferences.ts';
import DockMount from './DockMount';

export default function BottomNavigation() {
  const mobile=useBottomNavigationLayout(),host=useRef<HTMLDivElement>(null);
  const style=useSyncExternalStore(subscribeLayout,()=>getLayout().dockStyle);
  const [compact,setCompact]=useState(false),[blocked,setBlocked]=useState(false);
  const displayCompact=style==='mini'||style==='default'&&compact;
  useEffect(()=>{
    let frame=0;
    const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setBlocked(!!document.querySelector('dialog[open],#scrim:not([hidden]),.pluggy-connect-host,#app .credit-editor,#app .product-goal-editor,#app .goal-planner,#app .invoice-payment-form,#app .tax-bank,#app .purchase-review,#app .te-action-editor>details[open]')))};
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden']});sync();
    return()=>{cancelAnimationFrame(frame);observer.disconnect()};
  },[]);
  const previousSize=useRef<{width:number;height:number;mobile:boolean;viewport:number}|null>(null);
  useLayoutEffect(()=>{
    const nav=host.current?.querySelector<HTMLElement>('#tabs');if(!nav)return;
    if(blocked){previousSize.current=null;return;}
    const next={width:nav.offsetWidth,height:nav.offsetHeight,mobile,viewport:innerWidth},previous=previousSize.current;
    if(!next.width||!next.height){previousSize.current=null;return;}
    previousSize.current=next;
    if(!mobile||!previous||previous.mobile!==mobile||previous.viewport!==innerWidth||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(previous.width===next.width&&previous.height===next.height)return;
    const animation=animate(nav,{scaleX:[previous.width/next.width,1],scaleY:[previous.height/next.height,1]},APP_SPRING);
    return()=>{animation.stop();nav.style.removeProperty('transform')};
  },[displayCompact,mobile,blocked,style]);
  useEffect(()=>{
    setCompact(false);
    if(!mobile||style!=='default')return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let anchor=Math.max(0,scrollY),idle:ReturnType<typeof setTimeout>|undefined;
    const expand=()=>{clearTimeout(idle);anchor=Math.max(0,scrollY);setCompact(false)};
    const scroll=()=>{
      const y=Math.max(0,Math.min(scrollY,document.documentElement.scrollHeight-innerHeight));
      clearTimeout(idle);
      if(reduced.matches||y<24||host.current?.querySelector(':focus-visible')){setCompact(false);anchor=y;return;}
      if(Math.abs(y-anchor)>=10){setCompact(y>anchor);anchor=y;}
      idle=setTimeout(()=>setCompact(false),650);
    };
    addEventListener('scroll',scroll,{passive:true});
    reduced.addEventListener('change',expand);
    const nav=host.current;
    nav?.addEventListener('focusin',expand);
    return()=>{clearTimeout(idle);removeEventListener('scroll',scroll);reduced.removeEventListener('change',expand);nav?.removeEventListener('focusin',expand)};
  },[mobile,style]);
  return <DockMount pinned={style==='pinned'}><div ref={host} className="navigation-actions" hidden={(mobile||style==='pinned')&&blocked} data-dock-style={style} data-compact={displayCompact?'true':'false'}>
    <FinanceOptionBar as="nav" className="tabbar glass" id="tabs" aria-label="Seções"/>
  </div></DockMount>;
}
