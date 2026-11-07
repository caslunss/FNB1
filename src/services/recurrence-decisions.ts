import {detectRecurrences,nextRecurrenceDate,normalizeRecurrenceDescription,recurrenceDayDistance,type RecurrenceCandidate} from './recurrence-detection.ts';
import {addLocalDays,validLocalDay} from './dates.ts';
import type {ForecastTransaction} from './balance-forecast.ts';

export type RecurrenceStatus='confirmed'|'ignored'|'cancelled';
export interface RecurrenceDecision {id:string; status:RecurrenceStatus; reviewedAt:string; candidate:RecurrenceCandidate; endDate?:string}
export interface RecurrenceReview {candidate:RecurrenceCandidate; decision?:RecurrenceDecision}
export const RECURRENCE_KEY='plan12recurrenceDecisions_v1';
export const RECURRENCE_EVENT='plan-recurrence-decisions-change';

function candidateValue(value:unknown):RecurrenceCandidate|null {
  if(!value||typeof value!=='object')return null;
  const v=value;
  if(!('id'in v)||typeof v.id!=='string'||!('name'in v)||typeof v.name!=='string'||!('normalized'in v)||typeof v.normalized!=='string'||!('memberIds'in v)||!Array.isArray(v.memberIds)||!v.memberIds.every((id:unknown)=>typeof id==='string'))return null;
  if(!('interval'in v)||(v.interval!=='weekly'&&v.interval!=='biweekly'&&v.interval!=='monthly'&&v.interval!=='yearly')||!('anchorDate'in v)||typeof v.anchorDate!=='string'||!validLocalDay(v.anchorDate)||!('latestDate'in v)||typeof v.latestDate!=='string'||!validLocalDay(v.latestDate))return null;
  if(!('cents'in v)||typeof v.cents!=='number'||!Number.isSafeInteger(v.cents)||v.cents<=0||v.cents>100000000000||!('previousCents'in v)||typeof v.previousCents!=='number'||!Number.isSafeInteger(v.previousCents)||!('count'in v)||typeof v.count!=='number'||v.count<3)return null;
  const payment='payment'in v&&v.payment==='credit'?'credit':'cash';
  return {id:v.id,name:v.name,normalized:v.normalized,memberIds:v.memberIds,interval:v.interval,anchorDate:v.anchorDate,latestDate:v.latestDate,cents:v.cents,previousCents:v.previousCents,count:v.count,score:0,confidence:'confidence'in v&&v.confidence==='Alta'?'Alta':'Moderada',priceIncreased:'priceIncreased'in v&&v.priceIncreased===true,duplicate:'duplicate'in v&&v.duplicate===true,similar:'similar'in v&&v.similar===true,variable:'variable'in v&&v.variable===true,materialized:'materialized'in v&&v.materialized===true,stopped:'stopped'in v&&v.stopped===true,payment,cardId:'cardId'in v&&typeof v.cardId==='string'?v.cardId:undefined};
}
export function readRecurrenceDecisions(storage:Pick<Storage,'getItem'>):RecurrenceDecision[] {
  try {
    const data:unknown=JSON.parse(storage.getItem(RECURRENCE_KEY)||'null');
    if(!data||typeof data!=='object'||!('version'in data)||data.version!==1||!('decisions'in data)||!Array.isArray(data.decisions))return [];
    return data.decisions.flatMap((row:unknown)=>{
      if(!row||typeof row!=='object'||!('id'in row)||typeof row.id!=='string'||!('status'in row)||(row.status!=='confirmed'&&row.status!=='ignored'&&row.status!=='cancelled')||!('reviewedAt'in row)||typeof row.reviewedAt!=='string'||!validLocalDay(row.reviewedAt)||!('candidate'in row))return [];
      const candidate=candidateValue(row.candidate);if(!candidate)return [];
      return [{id:row.id,status:row.status,reviewedAt:row.reviewedAt,candidate,endDate:'endDate'in row&&typeof row.endDate==='string'&&validLocalDay(row.endDate)?row.endDate:undefined}];
    });
  }catch{return []}
}
export function recordRecurrenceDecision(storage:Pick<Storage,'getItem'|'setItem'>,candidate:RecurrenceCandidate,status:RecurrenceStatus,today:string,endDate?:string) {
  if(!validLocalDay(today)||!candidateValue(candidate)||endDate!==undefined&&(!validLocalDay(endDate)||endDate<today))throw Error('Revise os dados da recorrência.');
  const previous=readRecurrenceDecisions(storage),ids=new Set(candidate.memberIds);
  const index=previous.findIndex(row=>row.candidate.id===candidate.id||row.candidate.memberIds.some(id=>ids.has(id)));
  const existing=index>=0?previous[index]:undefined;
  const decision:RecurrenceDecision={id:existing?.id||candidate.id,status,reviewedAt:today,candidate:{...candidate,memberIds:[...new Set([...(existing?.candidate.memberIds||[]),...candidate.memberIds])]},endDate:status==='cancelled'?today:endDate};
  if(index>=0)previous[index]=decision;else previous.push(decision);
  storage.setItem(RECURRENCE_KEY,JSON.stringify({version:1,decisions:previous}));return decision;
}
/** Identity follows evidence IDs as well as descriptions, surviving renamed records. */
export function reviewRecurrences(transactions:readonly ForecastTransaction[],today:string,decisions:readonly RecurrenceDecision[]):RecurrenceReview[] {
  const byMember=new Map<string,RecurrenceDecision>(),byKey=new Map<string,RecurrenceDecision>();
  for(const decision of decisions){byKey.set(decision.candidate.id,decision);for(const id of decision.candidate.memberIds)byMember.set(id,decision)}
  const used=new Set<string>(),rows:RecurrenceReview[]=detectRecurrences(transactions,today).map(candidate=>{
    const decision=byKey.get(candidate.id)||candidate.memberIds.map(id=>byMember.get(id)).find(Boolean);if(decision)used.add(decision.id);return {candidate,decision};
  });
  for(const decision of decisions)if(!used.has(decision.id))rows.push({candidate:decision.candidate,decision});
  return rows;
}
/** Virtual inputs only. Finite materialized series never extend past their stored schedule. */
export function confirmedRecurrenceTransactions(transactions:readonly ForecastTransaction[],today:string,decisions:readonly RecurrenceDecision[],horizon:30|60|90):ForecastTransaction[] {
  if(!decisions.some(row=>row.status==='confirmed'))return [];
  const rows=reviewRecurrences(transactions,today,decisions),byId=new Map(transactions.map(row=>[row.id,row])),future:ForecastTransaction[]=[];
  const futureGroups=new Map<string,ForecastTransaction[]>(),projected=new Set<string>();
  for(const row of transactions)if(row.kind==='expense'&&row.date>today){const key=[normalizeRecurrenceDescription(row.description),row.payment||'cash',row.cardId||''].join('|'),group=futureGroups.get(key)||[];group.push(row);futureGroups.set(key,group)}
  const end=addLocalDays(today,horizon);
  for(const {candidate,decision} of rows) {
    if(decision?.status!=='confirmed'||candidate.stopped||candidate.materialized||projected.has(decision.id))continue;
    projected.add(decision.id);
    const evidence=candidate.memberIds.flatMap(id=>{const row=byId.get(id);return row?[row]:[]});
    evidence.push(...(futureGroups.get([candidate.normalized,candidate.payment,candidate.cardId||''].join('|'))||[]));
    if(evidence.some(row=>row.recurrenceId||row.recurrenceCount||row.recurrenceStopped))continue;
    const schedule=decision.candidate;
    // Use the original confirmed anchor/value, not an unreviewed price increase.
    const existingDates=new Set(evidence.map(row=>row.date));
    for(let index=1;index<=2000;index++) {
      const date=nextRecurrenceDate(schedule.anchorDate,schedule.interval,index);
      if(date>end||decision.endDate&&date>decision.endDate)break;
      if(date<=today||existingDates.has(date))continue;
      // A near-by materialized charge occupies that cycle even with date drift.
      if(evidence.some(row=>row.date>today&&validLocalDay(row.date)&&Math.abs(recurrenceDayDistance(date,row.date))<=3))continue;
      future.push({id:`recurrence:${decision.id}:${date}`,description:schedule.name,date,cents:schedule.cents,kind:'expense',payment:schedule.payment,cardId:schedule.cardId,subscription:true});
    }
  }
  // The forecast itself clips 30/60/90 days and moves credit charges to bill dates.
  return future;
}
