import type {WorkspaceEnvelope,SyncRow,SyncOptions,SyncRemote} from '../types/sync';
import type {CloudState,CloudHooks} from '../types/browser';
import type {SupabaseClient} from '@supabase/supabase-js';
import {isSafeInteger} from './type-guards.ts';
import {errorDetails} from './errors.ts';
'use strict';
/* Account-scoped durable outbox. The database owns identity and revision numbers. */

 const WORKSPACE='plan12workspace_v3',META='plan12cloudmeta_v1',BACKUPS='plan12cloudcopies_v1';
 export function recordText(value:unknown){const x=(typeof value==='string'?JSON.parse(value):value) as Partial<WorkspaceEnvelope>|null;if(!x||x.schemaVersion!==3||x.moneyUnit!=='centavos'||!x.data||!(['items','receipts','debts','splits','cart'] as const).every(k=>Array.isArray(x.data![k]))||!x.data.reports||Array.isArray(x.data.reports)||typeof x.data.reports!=='object')throw Error('INVALID_RECORD');return JSON.stringify(x);}
 export function canonical(value:unknown){const x=typeof value==='string'?JSON.parse(recordText(value)):JSON.parse(recordText(value));const sort=(v:unknown):unknown=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort((v as Record<string,unknown>)[k])])):v;return JSON.stringify(sort(x));}
 async function digest(value:unknown){
  const text=canonical(value);
  if(globalThis.crypto?.subtle){const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
  // A cache-change fingerprint, never an authentication or integrity credential.
  let a=0x811c9dc5,b=0x9e3779b9;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}
  return 'cache:'+text.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);
 }
 export function hasData(text:unknown){if(!text)return false;const d=(JSON.parse(recordText(text)) as WorkspaceEnvelope).data;return (['items','receipts','debts','splits','cart','offers','creditCards'] as const).some(k=>d[k]?.length)||Object.keys(d.reports).length>0||d.goal?.v>0||d.limits?.some(x=>Object.values(x||{}).some(v=>v>0))||!!d.profile?.name;}
 export function createFinanceSync({storage,remote,hash=digest,onState=()=>{},schedule=setTimeout,cancel=clearTimeout}:SyncOptions){
  let meta:{revision:number;dirty:boolean;hash:string|null;lastSynced:string|null}={revision:0,dirty:false,hash:null,lastSynced:null},state:CloudState={mode:'loading'},initialized=false,connected=false,stopped=false,timer:ReturnType<typeof setTimeout>|undefined,lastObserved:string|null=null;
  let hooks:CloudHooks={canApply:()=>true,onRemote:()=>{}},chain:Promise<unknown>=Promise.resolve();
  const exclusive=<T>(fn:()=>T|PromiseLike<T>):Promise<T>=>{const p=chain.then(fn);chain=p.catch(()=>{});return p;};
  function emit(mode:string,extra:Partial<CloudState>={}){state={...state,...extra,mode,lastSynced:meta.lastSynced,revision:meta.revision};try{onState({...state});}catch{}return state;}
  function saveMeta(){storage.setItem(META,JSON.stringify(meta));}
  function readLocal(){const value=storage.getItem(WORKSPACE);return value===null?null:recordText(value);}
  function equal(a:unknown,b:unknown){return !!a&&!!b&&canonical(a)===canonical(b);}
  function later(delay=700){if(stopped||state.mode==='conflict')return;cancel(timer);timer=schedule(()=>flush(),delay);}
  function conflict(row:SyncRow|null){meta.dirty=true;saveMeta();emit('conflict',{remoteRevision:row?.revision||0});}
  async function acknowledged(row:SyncRow,snapshot:unknown){meta.revision=row.revision;meta.hash=await hash(snapshot);meta.lastSynced=row.updated_at||new Date().toISOString();const current=readLocal();meta.dirty=!equal(current,snapshot);saveMeta();lastObserved=current;if(meta.dirty){emit('syncing');later();}else emit('synced');}
  function checkRow(row:SyncRow|null){if(!row)return null;if(!isSafeInteger(Number(row.revision))||Number(row.revision)<1)throw Error('INVALID_RECORD');return {...row,revision:Number(row.revision),record:JSON.parse(recordText(row.record))};}
  async function pull(row:SyncRow){const text=recordText(row.record);storage.setItem(WORKSPACE,text);await acknowledged(row,text);if(connected)hooks.onRemote(text);}
  async function reconcile(row:SyncRow|null,allowApply=true){
   row=checkRow(row);const local=readLocal();initialized=true;
   if(!row){if(meta.revision>0){conflict(null);return;}meta.revision=0;meta.dirty=!!local;saveMeta();if(local){emit('syncing');later();}else emit('ready');return;}
   if(equal(local,row.record)){await acknowledged(row,local);return;}
   const clean=!!local&&!!meta.hash&&!meta.dirty&&(await hash(local))===meta.hash;
   if(!local||clean||(!meta.hash&&!meta.dirty&&!hasData(local))){
    if(connected&&(!allowApply||!hooks.canApply())){emit('updates');return;}
    await pull(row);return;
   }
   if(meta.revision===row.revision){meta.dirty=true;saveMeta();emit('syncing');later();return;}
   conflict(row);
  }
  function failed(cause:unknown){const error=errorDetails(cause);const code=String(error.code||error.status||(error.message==='INVALID_RECORD'||error.name==='SyntaxError'?'INVALID_RECORD':''));emit(['401','PGRST301','42501','23514','INVALID_RECORD'].includes(code)?'error':'offline',{reason:code==='INVALID_RECORD'?'invalid':code||'network'});if(!stopped)later(15000);}
  async function prepare(){return exclusive(async()=>{
   try{const raw=storage.getItem(META);if(raw){const x=JSON.parse(raw);if(isSafeInteger(x.revision)&&x.revision>=0)meta={...meta,...x};}lastObserved=readLocal();await reconcile(await remote.read());}
   catch(error){failed(error);}return {...state};
  });}
  function capture(text:string){
   if(stopped)return;
   try{recordText(text);if(equal(lastObserved,text)){if(meta.dirty)later();return;}lastObserved=text;meta.dirty=true;saveMeta();if(state.mode!=='conflict'){emit('syncing');later();}}
   catch(error){emit('error',{reason:'local'});}
  }
  async function writePending(){
   if(stopped)return;if(state.mode==='conflict')return;
   readLocal();
   if(!initialized){await reconcile(await remote.read());if(!initialized||state.mode==='conflict'||state.mode==='updates')return;}
   if(!meta.dirty){if(state.mode!=='updates')emit('synced');return;}
   const text=readLocal();if(!text)return;emit('syncing');
   let result;
   try{result=checkRow(await remote.write(JSON.parse(text),meta.revision));}
   catch(error){if(errorDetails(error).code!=='23505')throw error;result=null;}
   if(!result){const current=checkRow(await remote.read());if(current&&equal(current.record,text)){await acknowledged(current,text);return;}conflict(current);return;}
   await acknowledged(result,text);
  }
  async function flush(){cancel(timer);timer=undefined;return exclusive(async()=>{try{await writePending();}catch(error){failed(error);}return {...state};});}
  async function poll(){return exclusive(async()=>{if(stopped)return;if(meta.dirty&&state.mode!=='conflict'){try{await writePending();}catch(error){failed(error);}return;}try{await reconcile(await remote.read());}catch(error){failed(error);}});}
  function backup(local:string|null,row:SyncRow|null){const raw=storage.getItem(BACKUPS);const previous=raw?JSON.parse(raw):[];if(!Array.isArray(previous))throw Error('BACKUP_INVALID');previous.push({createdAt:new Date().toISOString(),local:local?JSON.parse(local):null,cloud:row?.record||null,cloudRevision:row?.revision||0});storage.setItem(BACKUPS,JSON.stringify(previous));}
  async function resolve(choice:string){return exclusive(async()=>{
   if(!['local','cloud'].includes(choice))throw Error('INVALID_CHOICE');
   if(connected&&!hooks.canApply()){emit('conflict',{reason:'editing'});return {...state};}
   try{const row=checkRow(await remote.read()),local=readLocal();backup(local,row);
    if(choice==='cloud'){if(!row)throw Error('NO_CLOUD_RECORD');await pull(row);}
    else {meta.revision=row?.revision||0;meta.dirty=true;saveMeta();initialized=true;emit('syncing');await writePending();}
   }catch(error){if(state.mode==='conflict')emit('conflict',{reason:'backup-or-network'});else failed(error);}return {...state};
  });}
  function connect(next:CloudHooks){hooks={...hooks,...next};connected=true;}
  function stop(){stopped=true;cancel(timer);return chain;}
  return {prepare,capture,flush,poll,resolve,connect,stop,get state(){return {...state};},get backups(){return storage.getItem(BACKUPS);}};
 }

function initializeCloud(root:Window){
 let controller:ReturnType<typeof createFinanceSync>|null=null,uiBound=false;
 const messages:Record<string,string>={loading:'Carregando dados da conta…',ready:'Conta pronta para sincronizar',syncing:'Salvando na conta…',synced:'Sincronizado',offline:'Sem conexão com a nuvem · alterações mantidas neste dispositivo',conflict:'Há versões diferentes dos dados · revise nas configurações',updates:'Novos dados disponíveis · feche os formulários e atualize',error:'Não foi possível sincronizar · sua cópia local foi mantida'};
 function renderState(state:CloudState){
  const message=state.mode==='conflict'&&state.reason==='editing'?'Feche o formulário aberto antes de escolher uma versão.':state.mode==='conflict'&&state.reason==='backup-or-network'?'Não foi possível guardar as cópias ou consultar a conta. Nenhuma versão foi substituída.':messages[state.mode]||'';
  document.querySelectorAll<HTMLElement>('[data-cloud-message]').forEach(e=>e.textContent=message);
  document.querySelectorAll<HTMLElement>('[data-cloud-panel]').forEach(e=>{e.hidden=!controller;e.dataset.sync=state.mode;});
  document.querySelectorAll<HTMLElement>('[data-cloud-conflict]').forEach(e=>e.hidden=state.mode!=='conflict');
  document.querySelectorAll<HTMLElement>('[data-cloud-copy-download]').forEach(e=>e.hidden=!controller?.backups);
  document.querySelectorAll<HTMLElement>('[data-cloud-last]').forEach(e=>e.textContent=state.lastSynced?'Última sincronização: '+new Date(state.lastSynced).toLocaleString('pt-BR'):'');
 }
 function adapter(client:SupabaseClient,userId:string):SyncRemote{
  const timeout=<T>(promise:PromiseLike<T>):Promise<T>=>{let token:ReturnType<typeof setTimeout>|undefined;return Promise.race([promise,new Promise<never>((_,reject)=>{token=setTimeout(()=>reject(Object.assign(Error('Timeout'),{code:'timeout'})),12000);})]).finally(()=>clearTimeout(token));};
  const unwrap=async (promise:PromiseLike<{data:SyncRow|null;error:unknown}>):Promise<SyncRow|null>=>{const {data,error}=await timeout(promise);if(error)throw error;return data;};
  return {read:()=>unwrap(client.from('app_finance_workspaces').select('record,revision,updated_at').eq('user_id',userId).maybeSingle()),write:(record,revision)=>unwrap(revision?client.from('app_finance_workspaces').update({record}).eq('user_id',userId).eq('revision',revision).select('record,revision,updated_at').maybeSingle():client.from('app_finance_workspaces').insert({record}).select('record,revision,updated_at').single())};
 }
 function downloadCopies(){const data=controller?.backups;if(!data)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.href=url;a.download='copias-sincronizacao-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function bindUI(){if(uiBound)return;uiBound=true;
  document.addEventListener('click',async e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-cloud-retry],[data-cloud-resolve],[data-cloud-copy-download]');if(!b||!controller)return;if(b.hasAttribute('data-cloud-copy-download')){downloadCopies();return;}b.disabled=true;try{if(b.dataset.cloudResolve)await controller.resolve(b.dataset.cloudResolve);else {await controller.flush();await controller.poll();}}finally{b.disabled=false;renderState(controller.state);}});
  addEventListener('plan-navigation-change',()=>controller&&renderState(controller.state));
  addEventListener('online',()=>controller?.poll());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)controller?.poll();});
  addEventListener('pagehide',()=>controller?.flush());
  setInterval(()=>{if(!document.hidden)controller?.poll();},30000);
 }
 root.planCloud={async prepare(){if(controller)return controller.state;await root.planAuth.ready;const {user,client,storage}=root.planAuth;if(!user||!client)return {mode:'guest'};controller=createFinanceSync({storage,remote:adapter(client,user.id),onState:renderState});bindUI();return controller.prepare();},stop:()=>controller?.stop(),capture:text=>controller?.capture(text),connect:hooks=>controller?.connect(hooks),flush:()=>controller?.flush(),get state(){return controller?.state||{mode:'guest'};}};

}
if(typeof window!=='undefined')initializeCloud(window);
export const cloud=typeof window!=='undefined'?window.planCloud:undefined;
