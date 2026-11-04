import {useEffect} from 'react';
import {useMobileLayout} from '../services/mobile-layout.ts';

// Viewport behavior stays mounted independently from the header actions.
export default function MobileExperience(){
  const mobile=useMobileLayout();
  useEffect(()=>{
    if(!mobile)return;
    let frame=0;
    const viewport=window.visualViewport;
    const scroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>document.documentElement.style.setProperty('--mobile-title-progress',String(Math.min(1,Math.max(0,scrollY/64)))))};
    const keyboard=()=>document.body.classList.toggle('mobile-keyboard-open',!!viewport&&viewport.scale===1&&Math.max(document.documentElement.clientHeight,innerHeight)-viewport.height>160);
    const tabs=document.querySelector<HTMLElement>('#tabs'),observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--mobile-tab-height',`${tabs?.getBoundingClientRect().height||70}px`));
    if(tabs)observer.observe(tabs);
    addEventListener('scroll',scroll,{passive:true});viewport?.addEventListener('resize',keyboard);scroll();keyboard();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('scroll',scroll);viewport?.removeEventListener('resize',keyboard);document.body.classList.remove('mobile-keyboard-open')};
  },[mobile]);
  return null;
}
