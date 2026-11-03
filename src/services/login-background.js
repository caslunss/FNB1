"use strict";
(()=>{
 const video=document.getElementById('loginBackground');
 if(!video)return;
 const system=matchMedia('(prefers-color-scheme: dark)'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let selected='';
 const canPlay=()=>!document.hidden&&!reducedMotion.matches&&!document.body.classList.contains('login-leaving');
 function play(){
  if(!canPlay())return;
  video.muted=true;video.defaultMuted=true;video.defaultPlaybackRate=.6;video.playbackRate=.6;
  // A blocked autoplay is retried on the next genuine user interaction.
  try{video.play()?.catch(()=>{});}catch{}
 }
 function update(){
  const theme=document.documentElement.dataset.theme==='dark'?'dark':document.documentElement.dataset.theme==='light'?'light':system.matches?'dark':'light';
  const poster='./assets/login-'+theme+'.jpg';video.poster=poster;video.style.backgroundImage='url("'+poster+'")';
  if(selected!==theme){selected=theme;video.src='./assets/login-'+theme+'-loop.mp4';video.load();}
  if(!canPlay())video.pause();else play();
 }
 video.addEventListener('loadeddata',play);video.addEventListener('canplay',play);
 const resume=()=>{if(video.paused)play();};
 document.addEventListener('pointerdown',resume,{passive:true});document.addEventListener('keydown',resume);
 window.addEventListener('pageshow',update);window.addEventListener('focus',resume);
 new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 system.addEventListener('change',update);reducedMotion.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 update();
})();
