import {animate,hover,press} from 'motion';
import {APP_SPRING,PRESS_SPRING,FADE,pageFrames,cardTarget} from './motion-presets.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const running=new Map(),gestures=new WeakMap();let previous=null,pending;
function finish(node){const active=running.get(node);if(!active)return;active.stop();running.delete(node);for(const key of ['transform','filter','backdrop-filter','opacity','will-change'])node.style.removeProperty(key);node.removeAttribute('data-motion-entering');}
function reveal(node,blur=false){
 if(!node?.isConnected)return;finish(node);
 const frames=pageFrames(reduced.matches);node.style.willChange="transform, opacity";
 node.dataset.motionEntering='';
 const animation=animate(node,frames,{...APP_SPRING,opacity:FADE,onComplete:()=>{if(running.get(node)!==animation)return;running.delete(node);for(const key of ['transform','filter','backdrop-filter','opacity','will-change'])node.style.removeProperty(key);node.removeAttribute('data-motion-entering')}});
 running.set(node,animation);
}
function navigate(){
 const app=document.getElementById('app'),page=document.body.dataset.page;if(!app||!page)return;
 const key=page+':'+(app.dataset.summaryView||'');if(key===previous)return;const first=previous===null;previous=key;
 // Animate the content plane only. Navigation, fixed actions and modal anchors stay still.
 if(!first)reveal(app,true);
 document.documentElement.classList.remove('login-arrival');
}
function queue(){cancelAnimationFrame(pending);pending=requestAnimationFrame(navigate)}
addEventListener('plan-navigation-change',queue);
function bindCard(node){
 if(gestures.has(node))return;const state={hovered:false,pressed:false};let active;
 const update=()=>{active?.stop();active=animate(node,cardTarget({...state,reduced:reduced.matches}),PRESS_SPRING)};
 const offHover=hover(node,()=>{state.hovered=true;update();return()=>{state.hovered=false;update()}});
 const offPress=press(node,()=>{state.pressed=true;update();return()=>{state.pressed=false;update()}});
 const stop=()=>{active?.stop();node.style.removeProperty('transform')};
 gestures.set(node,{stop});node.dataset.motionCardReady='';
 // Bind only to explicit interactive tax summaries, never plain reading cards.
 node.addEventListener('motion-dispose',()=>{offHover();offPress();stop()},{once:true});
}
function scan(){document.querySelectorAll('[data-tax-summary][role=button],[data-tax-summary]:is(button,a),[data-motion-card=interactive]').forEach(bindCard)}
const observer=new MutationObserver(records=>{
 for(const record of records){if(record.type==='childList')for(const removed of record.removedNodes){if(removed.nodeType!==1||removed.isConnected)continue;for(const card of [removed,...removed.querySelectorAll('[data-motion-card-ready]')])if(gestures.has(card))card.dispatchEvent(new Event('motion-dispose'));}if(record.type==='attributes'){const node=record.target;if(node.matches('dialog.account-overlay')&&node.open)reveal(node);else if(node.matches('.month-picker-dialog')&&node.open)reveal(node);else if(node.matches('#profileMenu')&&!node.hidden)reveal(node);else if(node.matches('#scrim')&&!node.hidden)reveal(node.querySelector('.sheet'));}}
 scan();
});
function initialize(){document.documentElement.dataset.motionReady='';try{sessionStorage.removeItem('plan12-login-entry')}catch{}observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden']});scan();queue()}
reduced.addEventListener('change',()=>{for(const node of [...running.keys()])finish(node);document.querySelectorAll('[data-motion-card-ready]').forEach(node=>gestures.get(node)?.stop())});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();

// Legacy forms require a synchronous commit. Wait for exit before replacing their
// React root, rather than keeping duplicate IDs alive in presence wrappers.
let routeCommit=null,routeLeaving=false,routeTimer;
window.planRouteMotion={run(commit){
 routeCommit=commit;if(routeLeaving)return;
 const app=document.getElementById('app');if(!app){routeCommit=null;commit();return;}
 routeLeaving=true;finish(app);const oldInert=app.inert;app.inert=true;app.style.willChange='transform, opacity';
 let done=false,exit;
 const settle=()=>{if(done)return;done=true;clearTimeout(routeTimer);exit?.stop();for(const key of ['transform','opacity','will-change'])app.style.removeProperty(key);app.inert=oldInert;routeLeaving=false;const next=routeCommit;routeCommit=null;try{next?.()}finally{previous=document.body.dataset.page+':'+(app.dataset.summaryView||'');reveal(app)}};
 try{exit=animate(app,reduced.matches?{opacity:0}:{opacity:0,x:-12,scale:.99},{...APP_SPRING,opacity:FADE,onComplete:settle});routeTimer=setTimeout(settle,350)}catch{settle()}
}};
