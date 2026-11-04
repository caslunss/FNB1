import {waitWithTimeout,loadGoogleScript} from './login-network.js';
'use strict';
// Visitor access must remain available even when the Google service fails.
const guestToggle=document.getElementById('guestToggle'),guestForm=document.getElementById('guestForm');
guestToggle.addEventListener('click',()=>{const open=guestForm.hidden;guestForm.hidden=!open;guestToggle.setAttribute('aria-expanded',String(open));if(open)document.getElementById('guestName').focus();});
guestForm.addEventListener('submit',event=>{event.preventDefault();try{planAuth.useLocal(document.getElementById('guestName').value);}catch(error){document.getElementById('guestStatus').textContent=error.message||'Não foi possível entrar como visitante.';}});
let setupBusy=false,providerObserver;
async function configureGoogle(){
 if(setupBusy)return;setupBusy=true;const retry=document.getElementById('loginRetry');retry.hidden=true;
 const host=document.getElementById('googleButton'),status=document.getElementById('loginStatus');
 function message(text){status.textContent=text;status.className='login-error';}
 host.setAttribute('aria-busy','true');
 try{
  // An expired account session must not prevent signing in again.
  try{await waitWithTimeout(planAuth.ready);}catch(error){if(!planAuth.client)throw error;}
  const config=planAuth.config;
  if(!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(config.googleClientId))throw Error('Client ID inválido.');
  const settings=await fetch(config.supabaseUrl+'/auth/v1/settings',{headers:{apikey:config.supabasePublishableKey},signal:AbortSignal.timeout(10000)});
  if(!settings.ok)throw Error('Não foi possível consultar o serviço de login.');
  if(!(await settings.json()).external?.google){host.querySelector('button').title='Login Google aguardando configuração.';message('Google aguardando ativação.');retry.hidden=false;return;}
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(nonce));
  const hashed=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  await loadGoogleScript();
  let busy=false;
  google.accounts.id.initialize({client_id:config.googleClientId,nonce:hashed,auto_select:false,use_fedcm_for_button:true,callback:async response=>{
   if(busy)return;busy=true;host.style.pointerEvents='none';
   try{await planAuth.signIn(response.credential,nonce);}catch{message('Não foi possível entrar. Confira a configuração do Google ou tente novamente.');busy=false;host.style.pointerEvents='';}
  }});
  function render(){host.replaceChildren();google.accounts.id.renderButton(host,{type:'standard',theme:'outline',size:'large',shape:'pill',text:'signin_with',locale:'pt-BR',width:Math.max(200,Math.min(320,Math.floor(host.getBoundingClientRect().width)))});}
  render();status.textContent='';let width=Math.floor(host.getBoundingClientRect().width),scheduled=false;
  providerObserver?.disconnect();providerObserver=new ResizeObserver(()=>{const next=Math.floor(host.getBoundingClientRect().width);if(Math.abs(width-next)>1&&!scheduled){width=next;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render();});}});providerObserver.observe(host);
 }catch(error){message(error?.name==='TimeoutError'||/demorou/.test(error?.message||'')?'O serviço de login demorou a responder. Tente novamente.':/Client ID|Configuração/.test(error?.message||'')?'O login Google precisa de configuração no servidor.':'Não foi possível conectar ao Google. Confira sua conexão e tente novamente.');retry.hidden=false;}finally{host.setAttribute('aria-busy','false');setupBusy=false}
}
document.getElementById('loginRetry').addEventListener('click',configureGoogle);
configureGoogle();
