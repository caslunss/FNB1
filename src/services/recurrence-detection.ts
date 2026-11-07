import {addLocalDays,addLocalMonths,validLocalDay} from './dates.ts';
import type {ForecastTransaction} from './balance-forecast.ts';

export type RecurrenceInterval = 'weekly'|'biweekly'|'monthly'|'yearly';
export interface RecurrenceCandidate {
  id:string; name:string; normalized:string; memberIds:string[]; interval:RecurrenceInterval;
  anchorDate:string; latestDate:string; cents:number; previousCents:number; priceIncreased:boolean;
  score:number; confidence:'Alta'|'Moderada'; count:number; duplicate:boolean; similar:boolean;
  variable:boolean; payment:'cash'|'credit'; cardId?:string; materialized:boolean; stopped:boolean;
}
export function normalizeRecurrenceDescription(text:string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();
}
// Gregorian civil-day ordinal: DST-independent, without UTC conversion of due dates.
function ordinal(day:string) {
  const [year,month,date]=day.split('-').map(Number), y=year-1;
  const offsets=[0,31,59,90,120,151,181,212,243,273,304,334];
  return y*365+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)+(offsets[month-1]||0)+date+(month>2&&year%4===0&&(year%100!==0||year%400===0)?1:0);
}
export const recurrenceDayDistance=(a:string,b:string)=>ordinal(b)-ordinal(a);
const distance=recurrenceDayDistance;
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b),half=Math.floor(sorted.length/2);return sorted.length%2?sorted[half]:Math.round((sorted[half-1]+sorted[half])/2)};
export function nextRecurrenceDate(anchor:string,interval:RecurrenceInterval,index:number) {
  return interval==='monthly'?addLocalMonths(anchor,index):interval==='yearly'?addLocalMonths(anchor,index*12):addLocalDays(anchor,index*(interval==='weekly'?7:14));
}
function intervalError(anchor:string,previous:string,current:string,interval:RecurrenceInterval,between:(a:string,b:string)=>number=distance) {
  if(interval==='weekly'||interval==='biweekly')return Math.abs(between(previous,current)-(interval==='weekly'?7:14));
  const months=(Number(current.slice(0,4))-Number(previous.slice(0,4)))*12+Number(current.slice(5,7))-Number(previous.slice(5,7));
  if(months!==(interval==='monthly'?1:12))return Infinity;
  const expected=addLocalMonths(previous.slice(0,7)+'-01',months,Number(anchor.slice(8)));
  return Math.abs(between(expected,current));
}
/** Suggestions only. No I/O, clock reads, ledger mutations or inferred service usage. */
export function detectRecurrences(transactions:readonly ForecastTransaction[],today:string):RecurrenceCandidate[] {
  if(!validLocalDay(today))throw Error('Data de referência inválida.');
  const earliest=addLocalMonths(today,-36),standardStart=addLocalMonths(today,-24),groups=new Map<string,ForecastTransaction[]>(),seen=new Set<string>();
  const validDates=new Map<string,boolean>(),names=new Map<string,string>(),errors=new Map<string,number>();
  const validDate=(day:string)=>{const found=validDates.get(day);if(found!==undefined)return found;const valid=validLocalDay(day);validDates.set(day,valid);return valid};
  const normalized=(text:string)=>{const found=names.get(text);if(found!==undefined)return found;const value=normalizeRecurrenceDescription(text);names.set(text,value);return value};
  const dayNumbers=new Map<string,number>();
  const dayNumber=(day:string)=>{const cached=dayNumbers.get(day);if(cached!==undefined)return cached;const value=ordinal(day);dayNumbers.set(day,value);return value};
  const between=(a:string,b:string)=>dayNumber(b)-dayNumber(a);
  const ids=new Set(transactions.map(row=>row.id));
  for(const row of transactions) {
    if(seen.has(row.id)||row.kind!=='expense'||!validDate(row.date)||row.date<earliest||row.date>today||!Number.isSafeInteger(row.cents)||row.cents<=0||row.duplicateOfId&&ids.has(row.duplicateOfId))continue;
    seen.add(row.id);const name=normalized(row.description);if(!name)continue;
    const key=[name,row.payment||'cash',row.cardId||''].join('|'),group=groups.get(key)||[];group.push(row);groups.set(key,group);
  }
  const candidates:RecurrenceCandidate[]=[];
  for(const [key,all] of groups) {
    all.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.id<b.id?-1:a.id>b.id?1:0);
    const recent=all.filter(row=>row.date>=standardStart),extended=new Set(recent.map(row=>row.date)).size<3;
    // Three annual charges need up to 36 months; other intervals keep the 24-month window.
    const history=extended?all:recent;
    const dates=new Set<string>(),rows=history.filter(row=>{if(dates.has(row.date))return false;dates.add(row.date);return true});
    if(rows.length<3)continue;
    const first=rows[0],last=rows[rows.length-1];
    let best:RecurrenceInterval|undefined,regularity=0;
    for(const interval of ['weekly','biweekly','monthly','yearly'] as const) {
      if(extended&&interval!=='yearly')continue;
      const tolerance={weekly:1,biweekly:2,monthly:3,yearly:7}[interval];
      const ratio=rows.slice(1).filter((row,index)=>{const key=[first.date,rows[index].date,row.date,interval].join('|');let error=errors.get(key);if(error===undefined){error=intervalError(first.date,rows[index].date,row.date,interval,between);errors.set(key,error)}return error<=tolerance}).length/(rows.length-1);
      if(ratio>regularity&&ratio>=.75){regularity=ratio;best=interval;}
      if(regularity===1)break;
    }
    if(!best)continue;
    const amounts=rows.map(row=>row.cents),previous=median(amounts.slice(0,-1)),typical=median(amounts),tolerance=Math.max(100,Math.round(previous*.05));
    const variable=/\b(agua|energia|luz|gas|eletricidade)\b/.test(normalized(first.description));
    const stablePrior=amounts.slice(0,-1).every(value=>Math.abs(value-previous)<=tolerance),priceIncreased=last.cents-previous>tolerance;
    if(!variable&&!amounts.every(value=>Math.abs(value-typical)<=Math.max(100,Math.round(typical*.05)))&&!(stablePrior&&priceIncreased))continue;
    const deviation=median(amounts.map(value=>Math.abs(value-typical))),stability=Math.max(variable?.5:0,1-Math.min(1,deviation/(Math.max(100,Math.round(typical*.05))+1)));
    const duplicate=history.length>rows.length;
    const score=Math.max(0,Math.min(100,Math.round(40*regularity+25*stability+20*Math.min(1,(rows.length-1)/4)+15*.7-(duplicate?20:0)-(variable?8:0)-(typical<500?8:0))));
    if(score<60)continue;
    candidates.push({id:key,name:last.description,normalized:normalized(last.description),memberIds:all.map(row=>row.id),interval:best,anchorDate:first.date,latestDate:last.date,cents:last.cents,previousCents:previous,priceIncreased,score,confidence:score>=80?'Alta':'Moderada',count:rows.length,duplicate,similar:false,variable,payment:last.payment||'cash',cardId:last.cardId,materialized:all.some(row=>!!row.recurrenceId||!!row.recurrenceCount),stopped:all.some(row=>row.recurrenceStopped===true)});
  }
  // Family buckets avoid pairwise comparisons and never merge separate plans.
  const families=new Map<string,RecurrenceCandidate[]>();
  for(const candidate of candidates){const family=candidate.normalized.match(/\b(netflix|spotify|prime|disney|streaming)\b/)?.[0];if(!family)continue;const group=families.get(family)||[];group.push(candidate);families.set(family,group);}
  for(const group of families.values())if(group.length>1)for(const candidate of group)candidate.similar=true;
  const compare=new Intl.Collator('pt-BR').compare;
  return candidates.sort((a,b)=>compare(a.name,b.name)||compare(a.id,b.id));
}
