import {errorDetails} from './errors.ts';
import {waitWithTimeout,loadGoogleScript} from './login-network.ts';
'use strict';
const byId=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let setupBusy=false,providerObserver:ResizeObserver|undefined;
async function configureGoogle(){
 if(setupBusy)return;setupBusy=true;const retry=byId('loginRetry');retry.hidden=true;
 const host=byId('googleButton'),status=byId('loginStatus');
 function message(text:string){status.textContent=text;status.className='login-error';}
 host.setAttribute('aria-busy','true');
 try{
  // An expired account session must not prevent signing in again.
  try{await waitWithTimeout(planAuth.ready);}catch(error){if(!planAuth.client)throw error;}
  const config=planAuth.config!;
  if(!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(config.googleClientId))throw Error('Client ID inválido.');
  const settings=await fetch(config.supabaseUrl+'/auth/v1/settings',{headers:{apikey:config.supabasePublishableKey},signal:AbortSignal.timeout(10000)});
  if(!settings.ok)throw Error('Não foi possível consultar o serviço de login.');
  if(!(await settings.json()).external?.google){host.querySelector('button')!.title='Login Google aguardando configuração.';message('Google aguardando ativação.');retry.hidden=false;return;}
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
 }catch(error){message(errorDetails(error)?.name==='TimeoutError'||/demorou/.test(errorDetails(error)?.message||'')?'O serviço de login demorou a responder. Tente novamente.':/Client ID|Configuração/.test(errorDetails(error)?.message||'')?'O login Google precisa de configuração no servidor.':'Não foi possível conectar ao Google. Confira sua conexão e tente novamente.');retry.hidden=false;}finally{host.setAttribute('aria-busy','false');setupBusy=false}
}
byId('loginRetry').addEventListener('click',configureGoogle);
configureGoogle();
