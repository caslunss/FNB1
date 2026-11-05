import type {TaxResponses,TaxInput,TaxRecord,TaxPreview} from '../../types/taxes';
import type {FinancialExpense,TaxPreviewOptions} from '../../types/finance';
import {finance} from '../finance-runtime.ts';
import {TAX_REQUEST_TIMEOUT_MS} from './limits.ts';
import {normalizeInput,documentCalculation,fingerprint,moneyText as normalizeMoney} from './domain.ts';
const KEY='plan12taxes_v1',cooldowns=new Map<string|undefined,number>();
export const isTaxAccount=()=>!!(window.planAuth?.user&&window.planAuth?.client);
export async function taxRequest<A extends keyof TaxResponses>(action:A,payload:Record<string,unknown>={}, {signal}:{signal?:AbortSignal}={}):Promise<TaxResponses[A]>{
 const owner=window.planAuth?.user?.id;if(['save','preview'].includes(action)&&(cooldowns.get(owner)||0)>Date.now())throw Error('Aguarde até '+new Date(cooldowns.get(owner)!).toLocaleTimeString('pt-BR')+' para consultar novamente.');
 signal?.throwIfAborted();const client=window.planAuth?.client;if(!client)throw Error('Entre novamente para sincronizar.');const {data,error}=await client.auth.getSession();if(error||!data.session?.access_token)throw Error('Entre novamente para sincronizar.');
 const response=await fetch('/api/taxes',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,...payload}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(TAX_REQUEST_TIMEOUT_MS)]):AbortSignal.timeout(TAX_REQUEST_TIMEOUT_MS)});
 let result;try{result=await response.json()}catch{throw Error('Servidor tributário indisponível. Tente novamente.')}if(!response.ok){const e=Object.assign(Error(result.error||'Não foi possível concluir a análise.'),{retryAfter:response.headers.get('Retry-After')});if(response.status===429){const value=e.retryAfter,until=/^\d+$/.test(value||'')?Date.now()+Number(value)*1000:Date.parse(value!);cooldowns.set(owner,Number.isFinite(until)?until:Date.now()+60000);}throw e}return result;
}
function storage(){return window.planAuth?.storage||localStorage}
export async function readTaxes():Promise<TaxRecord[]>{if(isTaxAccount()){const rows:TaxRecord[]=[];let after:string|undefined;do{const page=await taxRequest('list',{after});if(!Array.isArray(page.records))throw Error('Resposta tributária inválida.');rows.push(...page.records);if(page.nextCursor&&page.nextCursor===after)throw Error('Paginação tributária inválida.');after=page.nextCursor;}while(after);return rows;}const raw=JSON.parse(storage().getItem(KEY)||'[]');if(!Array.isArray(raw))throw Error('As análises locais precisam de recuperação. Exporte os dados antes de continuar.');return raw;}
export async function saveTax(expense:FinancialExpense,input:TaxInput,revision=0):Promise<TaxRecord>{
 const state=finance.taxes.getState();if(expense.date>state.today||expense.date?.slice(0,7)!==state.today.slice(0,7)||state.closedMonths.includes(expense.date.slice(0,7)))throw Error('Período somente para visualização.');
 if(isTaxAccount()){const state=await window.planCloud?.flush();if(state&&state.mode!=='synced')throw Error('Aguarde a sincronização do gasto antes de analisar.');return (await taxRequest('save',{itemId:expense.id,input,expectedRevision:revision})).record;}
 const normalized=normalizeInput(input,expense.cents),rows=await readTaxes(),current=rows.find(x=>x.itemId===expense.id);if((current?.revision||0)!==revision)throw Error('A análise mudou. Atualize antes de salvar.');
 const record:TaxRecord={itemId:expense.id,fingerprint:fingerprint(expense),input:normalized,calculation:documentCalculation(normalized,expense.cents)||{method:'ibpt_item',status:'pending',totalCents:null,coveredCents:0,baseCents:expense.cents,pending:[{reason:'Entre com sua conta para consultar a referência tributária.'}]},date:expense.date,description:expense.description,source:'manual',revision:revision+1,updatedAt:new Date().toISOString()};
 storage().setItem(KEY,JSON.stringify([...rows.filter(x=>x.itemId!==expense.id),record]));return record;
}
export async function deleteTax(record:TaxRecord){const state=finance.taxes.getState();if(record.date?.slice(0,7)!==state.today.slice(0,7)||state.closedMonths.includes(record.date.slice(0,7)))throw Error('Período somente para visualização.');if(isTaxAccount())return taxRequest('delete',{itemId:record.itemId,expectedRevision:record.revision});const rows=await readTaxes();storage().setItem(KEY,JSON.stringify(rows.filter(x=>x.itemId!==record.itemId)));}
export async function clearTaxes(){if(isTaxAccount())return taxRequest('clear');storage().removeItem(KEY);}
export async function exportTaxData(){const records=await readTaxes(),url=URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),taxes:records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='analises-tributarias.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

window.planClearTaxData=clearTaxes;

// Preview never creates an expense or persists a tax record.
export async function previewTax(expense:Pick<FinancialExpense,'cents'>&Partial<FinancialExpense>,input:TaxInput,{reviewed=false,configured=false,revision=0,signal}:TaxPreviewOptions={}):Promise<TaxPreview>{
 signal?.throwIfAborted();const normalized=normalizeInput(input,expense.cents),document=documentCalculation(normalized,expense.cents);
 if(document)return document;
 if(!expense.id)return {status:'pending',totalCents:null,note:'Vincule a um gasto existente para consultar os itens. O novo gasto só será criado ao salvar.'};
 if(!reviewed)return {status:'pending',totalCents:null,note:'Revise os itens e marque a autorização abaixo para calcular automaticamente.'};
 if(!isTaxAccount()||!configured)return {status:'pending',totalCents:null,note:'Consulta por itens depende de conta conectada e configuração IBPT no servidor.'};
 const state=await window.planCloud?.flush();if(state&&state.mode!=='synced')throw Error('Aguarde a sincronização do gasto antes de analisar.');
 return (await taxRequest('preview',{itemId:expense.id,input:normalized,expectedRevision:revision},{signal})).record.calculation;
}

export function taxPayload(input:TaxInput,taxText:string):TaxInput{
 return {...input,documentTotalCents:taxText.trim()?Number(normalizeMoney(taxText)):null,items:input.items.map(x=>({...x,baseCents:x.draftBase===undefined?x.baseCents:normalizeMoney(x.draftBase),unitValueCents:x.draftUnit!==undefined?normalizeMoney(x.draftUnit):x.unitValueCents||normalizeMoney(x.draftBase??(x.baseCents/100).toFixed(2))}))};
}
