import React,{useEffect,useRef,useState} from 'react';
import {GlassSurface} from './LiquidControls.jsx';
import {useBottomNavigationLayout} from '../services/mobile-layout.js';

export default function BottomNavigation() {
  const mobile=useBottomNavigationLayout(),host=useRef(null);
  const [compact,setCompact]=useState(false);
  useEffect(()=>{
    setCompact(false);
    if(!mobile)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let anchor=Math.max(0,scrollY),idle;
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
  },[mobile]);
  return <div ref={host} className="navigation-actions" data-compact={compact?'true':'false'}>
    <GlassSurface as="nav" className="tabbar glass" id="tabs" aria-label="Seções"/>
  </div>;
}
