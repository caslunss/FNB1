import type { TaxInput } from '../../types/taxes';
import {moneyText,amount} from './domain.ts';
export function documentMoney(token:string){
 const normalized=/^\d{1,3}(?:\.\d{3})+,\d{2}$/.test(token)?token.replaceAll('.',''):token;
 return moneyText(normalized);
}
export function unitCents(value:string){
 if(!/^\d+(?:\.\d{1,10})?$/.test(value))throw Error('Valor unitário inválido.');
 const [whole,fraction='']=value.split('.'),denominator=10n**BigInt(fraction.length);
 return amount(Number((BigInt(whole+fraction)*100n+denominator/2n)/denominator));
}
export function parseTaxDocument(text:string,name=''):Partial<TaxInput>{
 if(new TextEncoder().encode(text).length>1_000_000)throw Error('Use um documento de até 1 MB.');
 if(!text.trim().startsWith('<')){const match=text.match(/(?:tributos?|impostos?)[^\n\d]{0,60}(\d[\d.,]*\d|\d)/i);return {documentName:name,documentTotalCents:match?documentMoney(match[1]):null,items:[],uf:''};}
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML com entidades externas não é aceito.');
 const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('XML inválido.');
 const nodes=(el:Document|Element,tag:string)=>[...el.getElementsByTagNameNS('*',tag)],value=(el:Document|Element,tag:string)=>nodes(el,tag)[0]?.textContent?.trim()||'';
 const total=nodes(doc,'ICMSTot')[0],trib=total?value(total,'vTotTrib'):'';
 const details=nodes(doc,'det');if(details.length>100)throw Error('Esta nota possui mais de 100 itens. Nenhum item foi importado.');
 const items=details.map(det=>{const p=nodes(det,'prod')[0];if(!p)return null;const gross=moneyText(value(p,'vProd')||'0'),discount=moneyText(value(p,'vDesc')||'0'),origin=value(det,'orig');return {kind:'produto' as const,code:value(p,'NCM'),description:value(p,'xProd'),unit:value(p,'uCom')||'UN',unitValueCents:unitCents(value(p,'vUnCom')||'0'),baseCents:Math.max(0,gross-discount),gtin:value(p,'cEAN'),ex:0,origin:['0','3','4','5','8'].includes(origin)?'nacional':['1','2','6','7'].includes(origin)?'importado':'desconhecida'};}).filter(item=>item!==null);
 const emit=nodes(doc,'emit')[0];return {documentName:name,documentTotalCents:trib?moneyText(trib):null,items,uf:emit?value(emit,'UF'):'',merchantCnpj:emit?value(emit,'CNPJ'):''};
}
