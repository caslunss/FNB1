import {normalizeInput,documentCalculation,fingerprint} from './domain.js';
const KEY='plan12taxes_v1',cooldowns=new Map();
export const isTaxAccount=()=>!!(window.planAuth?.user&&window.planAuth?.client);
export async function taxRequest(action,payload={}){
 const owner=window.planAuth?.user?.id;if(action==='save'&&(cooldowns.get(owner)||0)>Date.now())throw Error('Aguarde até '+new Date(cooldowns.get(owner)).toLocaleTimeString('pt-BR')+' para consultar novamente.');
 const client=window.planAuth?.client;const {data,error}=await client.auth.getSession();if(error||!data.session?.access_token)throw Error('Entre novamente para sincronizar.');
 const response=await fetch('/api/taxes',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(120000)});
 let result;try{result=await response.json()}catch{throw Error('Servidor tributário indisponível. Tente novamente.')}if(!response.ok){const e=Error(result.error||'Não foi possível concluir a análise.');e.retryAfter=response.headers.get('Retry-After');if(response.status===429){const value=e.retryAfter,until=/^\d+$/.test(value||'')?Date.now()+Number(value)*1000:Date.parse(value);cooldowns.set(owner,Number.isFinite(until)?until:Date.now()+60000);}throw e}return result;
}
function storage(){return window.planAuth?.storage||localStorage}
export async function readTaxes(){if(isTaxAccount())return (await taxRequest('list')).records;const raw=JSON.parse(storage().getItem(KEY)||'[]');if(!Array.isArray(raw))throw Error('As análises locais precisam de recuperação. Exporte os dados antes de continuar.');return raw;}
export async function saveTax(expense,input,revision=0){
 const state=window.planTaxes.getState();if(expense.date>state.today||expense.date?.slice(0,7)!==state.today.slice(0,7)||state.closedMonths.includes(expense.date.slice(0,7)))throw Error('Período somente para visualização.');
 if(isTaxAccount()){const state=await window.planCloud?.flush();if(state&&state.mode!=='synced')throw Error('Aguarde a sincronização do gasto antes de analisar.');return (await taxRequest('save',{itemId:expense.id,input,expectedRevision:revision})).record;}
 const normalized=normalizeInput(input,expense.cents),rows=await readTaxes(),current=rows.find(x=>x.itemId===expense.id);if((current?.revision||0)!==revision)throw Error('A análise mudou. Atualize antes de salvar.');
 const record={itemId:expense.id,fingerprint:fingerprint(expense),input:normalized,calculation:documentCalculation(normalized,expense.cents)||{method:'ibpt_item',status:'pending',totalCents:null,coveredCents:0,baseCents:expense.cents,pending:[{reason:'Entre com sua conta para consultar a referência tributária.'}]},date:expense.date,description:expense.description,source:'manual',revision:revision+1,updatedAt:new Date().toISOString()};
 storage().setItem(KEY,JSON.stringify([...rows.filter(x=>x.itemId!==expense.id),record]));return record;
}
export async function deleteTax(record){const state=window.planTaxes.getState();if(record.date?.slice(0,7)!==state.today.slice(0,7)||state.closedMonths.includes(record.date.slice(0,7)))throw Error('Período somente para visualização.');if(isTaxAccount())return taxRequest('delete',{itemId:record.itemId,expectedRevision:record.revision});const rows=await readTaxes();storage().setItem(KEY,JSON.stringify(rows.filter(x=>x.itemId!==record.itemId)));}
export async function clearTaxes(){if(isTaxAccount())return taxRequest('clear');storage().removeItem(KEY);}
export async function exportTaxData(){const records=await readTaxes(),url=URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),taxes:records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='analises-tributarias.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

window.planClearTaxData=clearTaxes;
