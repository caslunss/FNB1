// SGS units are intentionally kept separate: annual interest vs monthly inflation.
export const ECONOMY_SERIES=[{code:432,key:'selic',name:'Selic',unit:'% a.a.'},{code:4389,key:'cdi',name:'CDI',unit:'% a.a.'},{code:433,key:'ipca',name:'IPCA',unit:'% no mês'}];
export function normalizeObservations(rows,today=new Date().toISOString().slice(0,10)){
 if(!Array.isArray(rows))throw Error('Série inválida.');
 const dates=new Map();for(const row of rows){if(!/^\d{2}\/\d{2}\/\d{4}$/.test(row?.data||''))continue;const [d,m,y]=row.data.split('/'),date=`${y}-${m}-${d}`,value=Number(String(row.valor).replace(',','.'));if(!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>today||!String(row.valor??'').trim()||!Number.isFinite(value)||value < -100||value>1000)continue;dates.set(date,{date,value});}return [...dates.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function monthlyObservations(rows){const months=new Map();for(const row of rows)months.set(row.date.slice(0,7),row);return [...months.values()].slice(-12);}
export function accumulatedInflation(rows){const months=monthlyObservations(rows);if(months.length!==12)return null;for(let i=1;i<12;i++){const a=new Date(months[i-1].date.slice(0,7)+'-01T12:00:00Z');a.setUTCMonth(a.getUTCMonth()+1);if(a.toISOString().slice(0,7)!==months[i].date.slice(0,7))return null;}return (months.reduce((n,x)=>n*(1+x.value/100),1)-1)*100;}
export function buildEconomySeries(spec,rows,today){const observations=normalizeObservations(rows,today);if(!observations.length)throw Error('Série sem observações.');return {...spec,latest:observations.at(-1),history:monthlyObservations(observations),...(spec.key==='ipca'?{accumulated12:accumulatedInflation(observations)}:{})};}
