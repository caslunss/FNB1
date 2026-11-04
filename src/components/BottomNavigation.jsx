import {animate} from 'motion';
import {APP_SPRING} from '../services/motion-presets.js';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {GlassSurface} from './LiquidControls.jsx';
import {useBottomNavigationLayout} from '../services/mobile-layout.js';

export default function BottomNavigation() {
  const mobile=useBottomNavigationLayout(),host=useRef(null);
  const [compact,setCompact]=useState(false);
  const previousSize=useRef(null);
  useLayoutEffect(()=>{
    const nav=host.current?.querySelector('#tabs');if(!nav)return;
    const next={width:nav.offsetWidth,height:nav.offsetHeight,mobile,viewport:innerWidth},previous=previousSize.current;
    previousSize.current=next;
    if(!mobile||!previous||previous.mobile!==mobile||previous.viewport!==innerWidth||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(previous.width===next.width&&previous.height===next.height)return;
    const animation=animate(nav,{scaleX:[previous.width/next.width,1],scaleY:[previous.height/next.height,1]},APP_SPRING);
    return()=>{animation.stop();nav.style.removeProperty('transform')};
  },[compact,mobile]);
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
