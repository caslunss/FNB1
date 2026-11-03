import {moneyText} from './domain.js';
export function parseTaxDocument(text,name=''){
 if(new TextEncoder().encode(text).length>1_000_000)throw Error('Use um documento de até 1 MB.');
 if(!text.trim().startsWith('<')){const match=text.match(/(?:tributos?|impostos?)[^\n\d]{0,60}(\d+(?:[.,]\d{2}))/i);return {documentName:name,documentTotalCents:match?moneyText(match[1]):null,items:[],uf:''};}
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML com entidades externas não é aceito.');
 const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('XML inválido.');
 const nodes=(el,tag)=>[...el.getElementsByTagNameNS('*',tag)],value=(el,tag)=>nodes(el,tag)[0]?.textContent?.trim()||'';
 const total=nodes(doc,'ICMSTot')[0],trib=total?value(total,'vTotTrib'):'';
 const items=nodes(doc,'det').slice(0,100).map(det=>{const p=nodes(det,'prod')[0];if(!p)return null;const gross=moneyText(value(p,'vProd')||'0'),discount=moneyText(value(p,'vDesc')||'0'),origin=value(det,'orig');return {kind:'produto',code:value(p,'NCM'),description:value(p,'xProd'),unit:value(p,'uCom')||'UN',unitValueCents:Math.round(Number(value(p,'vUnCom')||0)*100),baseCents:Math.max(0,gross-discount),gtin:value(p,'cEAN'),ex:0,origin:['0','3','4','5','8'].includes(origin)?'nacional':['1','2','6','7'].includes(origin)?'importado':'desconhecida'};}).filter(Boolean);
 const emit=nodes(doc,'emit')[0];return {documentName:name,documentTotalCents:trib?moneyText(trib):null,items,uf:emit?value(emit,'UF'):'',merchantCnpj:emit?value(emit,'CNPJ'):''};
}
