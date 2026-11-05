import {animate,hover,press} from 'motion';
import {APP_SPRING,PRESS_SPRING,FADE,pageFrames,cardTarget,PROFILE_ENTER,MOTION} from './motion-presets.ts';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const running=new Map<HTMLElement,ReturnType<typeof animate>>(),gestures=new WeakMap<HTMLElement,{stop:()=>void}>();let previous:string|null=null,pending=0;
function finish(node:HTMLElement){const active=running.get(node);if(!active)return;active.stop();running.delete(node);for(const key of ['transform','filter','backdrop-filter','opacity','will-change'])node.style.removeProperty(key);node.removeAttribute('data-motion-entering');}
function reveal(node:HTMLElement|null){
 if(!node?.isConnected)return;finish(node);
 const settings=node.matches?.('dialog[data-panel=settings]')&&!!node.querySelector('.settings-navigation');
 const frames=settings?{opacity:[0,1]}:node.matches?.('dialog[data-panel=profile]')?(reduced.matches?{opacity:[0,1]}:PROFILE_ENTER):pageFrames(reduced.matches);node.style.willChange="transform, opacity";
 node.dataset.motionEntering='';
 const animation=animate(node,frames,{...APP_SPRING,opacity:FADE,onComplete:()=>{if(running.get(node)!==animation)return;running.delete(node);for(const key of ['transform','filter','backdrop-filter','opacity','will-change'])node.style.removeProperty(key);node.removeAttribute('data-motion-entering')}});
 running.set(node,animation);
}
function navigate(){
 const app=document.getElementById('app'),page=document.body.dataset.page;if(!app||!page)return;
 const key=page+':'+(app.dataset.summaryView||'');if(key===previous)return;const first=previous===null;previous=key;
 // Animate the content plane only. Navigation, fixed actions and modal anchors stay still.
 if(!first)reveal(app);
 document.documentElement.classList.remove('login-arrival');
}
function queue(){cancelAnimationFrame(pending);pending=requestAnimationFrame(navigate)}
addEventListener('plan-navigation-change',queue);
function bindCard(node:HTMLElement){
 if(gestures.has(node))return;const state={hovered:false,pressed:false};let active:ReturnType<typeof animate>|undefined;
 const update=()=>{active?.stop();active=animate(node,cardTarget({...state,reduced:reduced.matches}),PRESS_SPRING)};
 const offHover=hover(node,()=>{state.hovered=true;update();return()=>{state.hovered=false;update()}});
 const offPress=press(node,()=>{state.pressed=true;update();return()=>{state.pressed=false;update()}});
 const stop=()=>{active?.stop();node.style.removeProperty('transform')};
 gestures.set(node,{stop});node.dataset.motionCardReady='';
 // Bind only to explicit interactive tax summaries, never plain reading cards.
 node.addEventListener('motion-dispose',()=>{offHover();offPress();stop()},{once:true});
}
function scan(){document.querySelectorAll<HTMLElement>('[data-tax-summary][role=button],[data-tax-summary]:is(button,a),[data-motion-card=interactive]').forEach(bindCard)}
const observer=new MutationObserver(records=>{
 for(const record of records){if(record.type==='childList')for(const removed of record.removedNodes){if(!(removed instanceof HTMLElement)||removed.isConnected)continue;for(const card of [removed,...removed.querySelectorAll<HTMLElement>('[data-motion-card-ready]')])if(gestures.has(card))card.dispatchEvent(new Event('motion-dispose'));}if(record.type==='attributes'){const node=record.target as HTMLDialogElement;if(node.matches('dialog')&&node.open)reveal(node);else if(node.matches('#scrim')&&!node.hidden)reveal(node.querySelector<HTMLElement>('.sheet'));}}
 for(const record of records)if(record.type==='childList'&&(record.target as HTMLElement).matches?.('#accountOverlayContent')){
  const dialog=document.querySelector<HTMLDialogElement>('#accountOverlay[data-panel=settings]'),body=dialog?.querySelector<HTMLElement>('.account-panel-body');
  if(dialog?.querySelector('.settings-navigation')){
   if(body)finish(body);
   if(dialog.open&&!records.some(change=>change.type==='attributes'&&change.target===dialog&&change.attributeName==='open'))reveal(dialog);
  }else reveal(body||null);
 }
 for(const record of records)if(record.type==='attributes'&&record.attributeName==='aria-selected'&&(record.target as HTMLElement).matches?.('.account-settings-tabs [aria-selected=true]'))reveal(document.querySelector<HTMLElement>('#accountOverlay[data-panel=settings] .account-panel-body'));
 scan();
});
function initialize(){document.documentElement.dataset.motionReady='';try{sessionStorage.removeItem('plan12-login-entry')}catch{}observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','aria-selected']});scan();queue()}
reduced.addEventListener('change',()=>{for(const node of [...running.keys()])finish(node);document.querySelectorAll<HTMLElement>('[data-motion-card-ready]').forEach(node=>gestures.get(node)?.stop())});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();

// Legacy forms require a synchronous commit. Wait for exit before replacing their
// React root, rather than keeping duplicate IDs alive in presence wrappers.
let routeCommit:(()=>void)|null=null,routeLeaving=false,routeTimer:ReturnType<typeof setTimeout>|undefined;
window.planRouteMotion={run(commit){
 routeCommit=commit;if(routeLeaving)return;
 const app=document.getElementById('app');if(!app){routeCommit=null;commit();return;}
 routeLeaving=true;finish(app);const oldInert=app.inert;app.inert=true;app.style.willChange='transform, opacity';
 let done=false,exit:ReturnType<typeof animate>|undefined;
 const settle=()=>{if(done)return;done=true;clearTimeout(routeTimer);exit?.stop();for(const key of ['transform','opacity','will-change'])app.style.removeProperty(key);app.inert=oldInert;routeLeaving=false;const next=routeCommit;routeCommit=null;try{next?.()}finally{previous=document.body.dataset.page+':'+(app.dataset.summaryView||'');reveal(app)}};
 try{exit=animate(app,reduced.matches?{opacity:0}:{opacity:0,x:MOTION.exitX,scale:MOTION.pageScale},{...APP_SPRING,opacity:FADE,onComplete:settle});routeTimer=setTimeout(settle,350)}catch{settle()}
}};
