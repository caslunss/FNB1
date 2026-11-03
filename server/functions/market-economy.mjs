import {ECONOMY_SERIES,buildEconomySeries} from '../../src/services/economy.js';
let cached;
export default async function handler(req){
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':status===200?'public, max-age=3600':'no-store'}});
 if(req.method!=='GET')return reply(405,{error:'Método inválido.'});
 const now=new Date(),today=now.toISOString().slice(0,10);
 if(cached&&cached.day===today&&Date.now()-cached.time<3600000)return reply(200,cached.value);
 const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-13,1)),format=d=>`${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
 const results=await Promise.allSettled(ECONOMY_SERIES.map(async spec=>{const url=new URL(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${spec.code}/dados`);url.searchParams.set('formato','json');url.searchParams.set('dataInicial',format(start));url.searchParams.set('dataFinal',format(now));const response=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('BCB indisponível.');return buildEconomySeries(spec,await response.json(),today);}));
 const series=results.filter(x=>x.status==='fulfilled').map(x=>x.value),unavailable=ECONOMY_SERIES.filter((_,i)=>results[i].status==='rejected').map(x=>x.key);
 if(!series.length)return reply(503,{error:'Banco Central indisponível. Tente novamente.'});
 const value={source:'Banco Central · SGS',checkedAt:now.toISOString(),series,unavailable};if(!unavailable.length)cached={day:today,time:Date.now(),value};return reply(200,value);
}
