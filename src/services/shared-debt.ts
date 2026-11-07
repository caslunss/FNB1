import {isSafeInteger} from './type-guards.ts';
export interface SharedDebt {version:number;id:string;name:string;cents:number;collector?:string}
export function validateSharedDebt(value:SharedDebt){
 if(!value||value.version!==1||!/^sd-[a-f0-9-]{36}$/.test(value.id)||typeof value.name!=='string'||!value.name.trim()||value.name.length>240||!isSafeInteger(value.cents)||value.cents<1||value.cents>100000000)throw Error('Link de dívida inválido.');
 if(value.collector!==undefined&&(typeof value.collector!=='string'||!value.collector.trim()||value.collector.length>120||/[\u0000-\u001f\u007f]/.test(value.collector)))throw Error('Informe quem está cobrando.');
 return {version:1,id:value.id,name:value.name.trim(),cents:value.cents,...(value.collector?{collector:value.collector.trim()}:{})};
}
const toBase64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const fromBase64=(text:string)=>Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export function encodeSharedDebt(value:SharedDebt,base:string){
 const debt=validateSharedDebt(value),url=new URL(base);
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Endereço de compartilhamento inválido.');
 const hex=debt.id.slice(3).replaceAll('-','');if(!/^[a-f0-9]{32}$/.test(hex))throw Error('Link de dívida inválido.');
 const id=toBase64(Uint8Array.from(hex.match(/../g)||[],part=>parseInt(part,16)));
 const compact=[id,debt.cents.toString(36),debt.name,...(debt.collector?[debt.collector]:[])];
 url.hash='d='+toBase64(new TextEncoder().encode(JSON.stringify(compact)));return url.href;
}
export function decodeSharedDebt(hash:unknown){
 if(typeof hash!=='string'||hash.length>4000||!/^#(?:debt|d)=[A-Za-z0-9_-]+$/.test(hash))throw Error('Link de dívida inválido.');
 const compact=hash.startsWith('#d='),data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fromBase64(hash.slice(compact?3:6))));
 if(!compact)return validateSharedDebt(data);
 if(!Array.isArray(data)||data.length<3||data.length>4||typeof data[0]!=='string'||!/^[A-Za-z0-9_-]{22}$/.test(data[0])||typeof data[1]!=='string'||!/^[0-9a-z]+$/.test(data[1]))throw Error('Link de dívida inválido.');
 const bytes=fromBase64(data[0]);if(bytes.length!==16)throw Error('Link de dívida inválido.');
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''),id='sd-'+[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
 return validateSharedDebt({version:1,id,cents:parseInt(data[1],36),name:data[2],...(data.length===4?{collector:data[3]}:{})});
}
export function sharedDebtMessage(value:SharedDebt,url:string,{remainingCents,details=''}:{remainingCents?:number;details?:string}={}){
 const debt=validateSharedDebt(value),money=(cents:number)=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 if(!debt.collector)throw Error('Informe quem está cobrando.');
 if(remainingCents!==undefined&&(!isSafeInteger(remainingCents)||remainingCents<debt.cents||remainingCents>100000000))throw Error('A cobrança não pode superar o saldo cadastrado.');
 if(details.length>400)throw Error('Use até 400 caracteres nos detalhes.');
 return [`Olá! ${debt.collector} está enviando uma cobrança.`,`Descrição: ${debt.name}`,...(remainingCents!==undefined?[`Saldo restante cadastrado: ${money(remainingCents)}`]:[]),`Valor solicitado nesta cobrança: ${money(debt.cents)}`,...(details.trim()?[`Detalhes: ${details.trim()}`]:[]),'','Confira os dados antes de adicionar à sua conta:',url,'O link não realiza pagamentos nem confirma quitação.'].join('\n');
}
