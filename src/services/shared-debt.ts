import {isSafeInteger} from './type-guards.ts';
export interface SharedDebt {version:number;id:string;name:string;cents:number}
export function validateSharedDebt(value:SharedDebt){
  if(!value||value.version!==1||!/^sd-[a-f0-9-]{36}$/.test(value.id)||typeof value.name!=='string'||!value.name.trim()||value.name.length>240||!isSafeInteger(value.cents)||value.cents<1||value.cents>100000000)throw Error('Link de dívida inválido.');
  return {version:1,id:value.id,name:value.name.trim(),cents:value.cents};
}
export function encodeSharedDebt(value:SharedDebt,base:string){
  const debt=validateSharedDebt(value),url=new URL(base);
  if(url.protocol!=='https:'||url.username||url.password)throw Error('Endereço de compartilhamento inválido.');
  const bytes=new TextEncoder().encode(JSON.stringify(debt));
  url.hash='debt='+btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  return url.href;
}
export function decodeSharedDebt(hash:unknown){
  if(typeof hash!=='string'||hash.length>4000||!/^#debt=[A-Za-z0-9_-]+$/.test(hash))throw Error('Link de dívida inválido.');
  const raw=atob(hash.slice(6).replaceAll('-','+').replaceAll('_','/'));
  return validateSharedDebt(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)))));
}
