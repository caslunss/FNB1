import type {AuthConfig,AuthService} from '../types/browser';
import type {SupabaseClient,User} from '@supabase/supabase-js';
import {exitSurface} from './session-motion.ts';
import {createClient} from '@supabase/supabase-js';
'use strict';
try{if(location.hash?.startsWith('#debt=')&&location.hash.length<4000)sessionStorage.setItem('plan12-pending-debt',location.hash);}catch{}
export const auth:AuthService = (() => {
  let client:SupabaseClient|undefined,config:AuthConfig|undefined,user:User|null=null,locked=false,signingOut=false;
  const guestName=()=>sessionStorage.getItem("plan12-guest-name")||"";
  const hasAccess=()=>!!user||(sessionStorage.getItem("plan12-access")==="local"&&!!guestName().trim());
  const nativeStorage=window.localStorage;
  const key=(k:string)=>k==='plan12appearance'?k:user?`plan12account:${user.id}:${k}`:`plan12guest:${k}`;
  const storeFor=(k:string)=>k==='plan12appearance'||user?nativeStorage:sessionStorage;
  const storage={getItem:(k:string)=>storeFor(k).getItem(key(k)),removeItem:(k:string)=>storeFor(k).removeItem(key(k)),setItem(k:string,v:string){if(locked)throw Error('Sua sessão terminou. Entre novamente antes de salvar.');storeFor(k).setItem(key(k),v);}};
  async function initialize(){
    const response=await fetch('./assets/auth-config.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Não foi possível carregar o acesso.');
    const loaded:AuthConfig=await response.json();
    config=loaded;
    if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.supabaseUrl)||!config.supabasePublishableKey?.startsWith('sb_publishable_'))throw Error('Configuração de acesso inválida.');
    client=createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{storage:sessionStorage,storageKey:'plan12-auth-session',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    if(sessionStorage.getItem('plan12-access')==='account'){
      const result=await client.auth.getUser();
      if(result.error||!result.data.user){locked=true;throw Error('Entre novamente para acessar sua conta.');}
      user=result.data.user;
    }
    client.auth.onAuthStateChange((event,session)=>{
      if(!signingOut&&user&&(event==='SIGNED_OUT'||session&&session.user.id!==user.id)){
        locked=true;location.replace('./login.html');
      }
    });
    return api;
  }
  function openWorkspace(){
    const navigate=()=>location.assign('./index.html');
    if(typeof window.planLoginTransition!=='function'){navigate();return;}
    try{Promise.resolve(window.planLoginTransition()).then(navigate,navigate);}catch{navigate();}
  }
  async function signIn(credential:string,nonce:string){
    if(typeof credential!=='string'||!credential||!nonce)throw Error('Resposta de login inválida.');
    if(!client)throw Error('Aguarde o serviço de acesso.');
    const result=await client.auth.signInWithIdToken({provider:'google',token:credential,nonce});
    if(result.error)throw result.error;
    const checked=await client.auth.getUser();
    if(checked.error||!checked.data.user)throw Error('Não foi possível validar sua conta.');
    sessionStorage.setItem('plan12-access','account');
    openWorkspace();
  }
  async function signOut(){
    if(signingOut)return;
    signingOut=true;
    const exit=exitSurface(document.getElementById('root'));
    try{
      const result=client?await client.auth.signOut({scope:'local'}):{error:null};
      if(result.error)throw Error('Não foi possível encerrar a sessão. Tente novamente.');
      await exit.finished;
      sessionStorage.removeItem('plan12-access');sessionStorage.removeItem('plan12-guest-name');
      for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k?.startsWith('plan12guest:'))sessionStorage.removeItem(k);}
      locked=true;location.replace('./login.html');
    }catch(error){exit.restore();signingOut=false;throw error;}
  }
  async function forgetDeletedAccount(){
    if(!user||!client)throw Error('Nenhuma conta ativa.');locked=true;client.auth.stopAutoRefresh();
    const prefix=`plan12account:${user.id}:`;
    try{for(let i=nativeStorage.length-1;i>=0;i--){const k=nativeStorage.key(i);if(k?.startsWith(prefix))nativeStorage.removeItem(k);}}catch{}
    for(const k of ['plan12-auth-session','plan12-access','plan12-guest-name']){try{sessionStorage.removeItem(k);}catch{}}location.replace('./login.html');
  }
  function useLocal(name:string){name=String(name||'').trim();if(!name||name.length>60)throw Error('Informe seu nome, com até 60 caracteres.');sessionStorage.setItem('plan12-guest-name',name);sessionStorage.setItem('plan12-access','local');openWorkspace();}
  const api:AuthService={get client(){return client},get config(){return config},get user(){return user},key,storage,signIn,signOut,forgetDeletedAccount,useLocal,hasAccess,guestName,ready:undefined!};
  api.ready=initialize().catch(error=>{if(sessionStorage.getItem('plan12-access')==='account')throw error;return api;});return api;
})();

window.planAuth=auth;
