import {takeQuota} from '../shared/quota.mjs';
export const operations={quotes:'/api/v2/stocks/quote',history:'/api/v2/stocks/historical',dividends:'/api/v2/stocks/dividends',balance:'/api/v2/stocks/balance-sheet',fiis:'/api/v2/fii/indicators',currency:'/api/v2/currency',inflation:'/api/v2/inflation',interest:'/api/v2/prime-rate'};
const cache=new Map();let blockedUntil=0;
export function retryDelay(value,now=Date.now()){if(!value)return 60;const seconds=Number(value);return Number.isFinite(seconds)&&seconds>=0?Math.max(1,Math.ceil(seconds)):Math.max(1,Math.ceil((Date.parse(value)-now)/1000)||60);}
export async function handle(req,env=process.env,net=fetch,quota=takeQuota){
 const reply=(status,data,extra={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...extra}});
 if(req.method!=='GET')return reply(405,{error:'Método não permitido.'});
 const input=new URL(req.url),kind=input.searchParams.get('kind')||'quotes',path=operations[kind];if(!path)return reply(400,{error:'Consulta inválida.'});
 const symbols=[...new Set((input.searchParams.get('symbols')||(kind==='fiis'?'MXRF11,HGLG11':'PETR4,VALE3')).toUpperCase().split(',').map(x=>x.trim()).filter(Boolean))];if(!symbols.length||symbols.length>10||symbols.some(x=>! /^[A-Z0-9^.]{2,15}$/.test(x)))return reply(400,{error:'Informe até 10 códigos válidos, separados por vírgula.'});
 const url=new URL(path,'https://brapi.dev');
 if(['quotes','history','dividends','balance','fiis'].includes(kind))url.searchParams.set('symbols',symbols.join(','));
 if(kind==='history'){const range=input.searchParams.get('range')||'1mo';if(!['1mo','3mo','6mo','1y','5y'].includes(range))return reply(400,{error:'Período inválido.'});url.searchParams.set('range',range);url.searchParams.set('interval','1d');url.searchParams.set('sortOrder','asc');}
 if(kind==='balance')url.searchParams.set('period','annual');
 if(kind==='dividends'){url.searchParams.set('startDate',new Date(Date.now()-366*86400000).toISOString().slice(0,10));url.searchParams.set('sortOrder','desc');}
 if(kind==='currency')url.searchParams.set('currency','USD-BRL,EUR-BRL');
 if(['inflation','interest'].includes(kind))url.searchParams.set('historical','false');
 if(!env.BRAPI_TOKEN)return reply(503,{error:'Consulta de investimentos ainda não ativada. Tente novamente mais tarde.'});
 const key=url.href,saved=cache.get(key);if(saved&&saved.until>Date.now())return reply(200,saved.value);
 if(blockedUntil>Date.now()){const wait=Math.ceil((blockedUntil-Date.now())/1000);return reply(429,{error:'Limite de consultas atingido. Aguarde para tentar novamente.',retryAfter:wait},{'Retry-After':String(wait)});}
 const budget=await quota({subject:'public-market',operation:'investments',limit:60,seconds:60},env,net);if(budget.status!==200)return reply(budget.status,{error:budget.error},budget.retryAfter?{'Retry-After':String(budget.retryAfter)}:{});
 try{
  const response=await net(url,{headers:{Authorization:'Bearer '+env.BRAPI_TOKEN},signal:AbortSignal.timeout(15000)});
  if(response.status===429){const wait=retryDelay(response.headers.get('Retry-After'));blockedUntil=Date.now()+wait*1000;return reply(429,{error:'Limite de consultas atingido. Aguarde para tentar novamente.',retryAfter:wait},{'Retry-After':String(wait)});}
  if(response.status===401)return reply(401,{error:'Não foi possível autenticar a consulta de investimentos.'});
  if(response.status===403)return reply(403,{error:'Estes dados não estão disponíveis no serviço contratado.'});
  if(response.status===404)return reply(404,{error:'Não foram encontrados dados para esta consulta.'});
  if(!response.ok)return reply(502,{error:'Dados de mercado indisponíveis. Tente novamente.'});
  const data=await response.json();const value={kind,source:'Dados de mercado',checkedAt:new Date().toISOString(),data};
  if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,{value,until:Date.now()+(kind==='quotes'?60000:300000)});return reply(200,value);
 }catch{return reply(502,{error:'Não foi possível consultar os dados de mercado. Tente novamente.'});}
}
export default req=>handle(req);
