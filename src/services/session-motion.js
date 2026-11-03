import {animate} from 'motion';
import {iosDefaultSpring,FADE} from './motion-presets.js';
/** Document boundaries cannot share React presence; settle before navigation. */
export function exitSurface(node,{login=false}={}){
 if(!node)return {finished:Promise.resolve(),restore(){}};
 const wasInert=node.inert,oldBusy=node.getAttribute('aria-busy');
 node.inert=true;node.setAttribute('aria-busy','true');node.style.willChange='transform, opacity';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let animation;try{animation=animate(node,reduced?{opacity:0}:{opacity:0,scale:login?1.015:.98},{...iosDefaultSpring,opacity:FADE})}catch{}
 let timer;const finished=new Promise(resolve=>{const finish=()=>{clearTimeout(timer);resolve()};timer=setTimeout(()=>{animation?.complete();finish()},550);if(animation)Promise.resolve(animation).then(finish,finish);else finish()});
 return {finished,restore(){animation?.stop();node.inert=wasInert;if(oldBusy===null)node.removeAttribute('aria-busy');else node.setAttribute('aria-busy',oldBusy);for(const key of ['opacity','transform','will-change'])node.style.removeProperty(key)}};
}
