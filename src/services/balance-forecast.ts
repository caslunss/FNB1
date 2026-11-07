import {addLocalDays,addLocalMonths,validLocalDay} from './dates.ts';
export type ForecastKind='income'|'expense'|'transfer'|'refund';
export interface ForecastTransaction{id:string;description:string;cents:number;date:string;kind:ForecastKind;payment?:'cash'|'credit';cardId?:string;paidCents?:number;chargeCents?:number;subscription?:boolean;recurrenceId?:string;recurrenceCount?:number;recurrenceStopped?:boolean;duplicateOfId?:string}
export interface ForecastCard{id:string;name:string;closingDay:number|null;dueDay:number|null;openingUsedCents:number;openingPaidCents?:number}
export interface ForecastCommitment{id:string;date:string;cents:number;kind:'income'|'expense';description:string}
export interface ForecastInput{today:string;horizon:30|60|90;openingBalanceCents:number|null;marginCents?:number;estimateVariable?:boolean;transactions:readonly ForecastTransaction[];cards?:readonly ForecastCard[];commitments?:readonly ForecastCommitment[];pending?:readonly string[];excludedIds?:readonly string[]}
export interface ForecastDay{date:string;incomeCents:number;expenseCents:number;estimatedCents:number;balanceCents:number}
export interface ForecastResult{ready:boolean;days:ForecastDay[];lowestCents:number|null;lowestDate:string|null;firstNegativeDate:string|null;daysUntilNegative:number|null;risk:'ok'|'atenção'|'risco'|null;issues:string[];estimatedDailyCents:number;coverageDays:number}
const cents=(n:number)=>{if(!Number.isSafeInteger(n)||Math.abs(n)>Number.MAX_SAFE_INTEGER/2)throw Error('Valor fora do limite da previsão.');return n};
const sum=(a:number,b:number)=>cents(a+b);
export function invoiceDueDate(date:string,closingDay:number,dueDay:number){
 if(!validLocalDay(date)||![closingDay,dueDay].every(n=>Number.isInteger(n)&&n>=1&&n<=31))throw Error('Revise as datas do cartão.');
 let month=date.slice(0,7)+'-01';if(date>addLocalMonths(month,0,closingDay))month=addLocalMonths(month,1,1);
 const closing=addLocalMonths(month,0,closingDay),due=addLocalMonths(month,0,dueDay);return due<=closing?addLocalMonths(month,1,dueDay):due;
}
/** No I/O or clock reads; original transactions and materialized schedules stay immutable. */
export function calculateBalanceForecast(input:ForecastInput):ForecastResult{
 if(!validLocalDay(input.today)||![30,60,90].includes(input.horizon))throw Error('Período inválido.');
 const margin=cents(input.marginCents??10000);if(margin<0)throw Error('A margem deve ser positiva ou zero.');
 const issues=new Set(input.pending||[]),empty:ForecastResult={ready:false,days:[],lowestCents:null,lowestDate:null,firstNegativeDate:null,daysUntilNegative:null,risk:null,issues:[...issues],estimatedDailyCents:0,coverageDays:0};
 if(input.openingBalanceCents===null)return empty;
 const days=Array.from({length:input.horizon+1},(_,i)=>({date:addLocalDays(input.today,i),incomeCents:0,expenseCents:0,estimatedCents:0,balanceCents:0})),index=new Map(days.map((day,i)=>[day.date,i]));
 const sourceIds=new Set(input.transactions.map(row=>row.id));
 const cards=new Map((input.cards||[]).map(card=>[card.id,card])),seen=new Set<string>(),excluded=new Set(input.excludedIds||[]),fingerprints=new Map<string,ForecastTransaction>(),bills=new Map<string,{date:string;cents:number}>();
 const history=Array<number>(90).fill(0),histStart=addLocalDays(input.today,-90),histIndex=new Map(Array.from({length:90},(_,i)=>[addLocalDays(histStart,i),i])),knownVariable=new Map<string,number>();
 const put=(date:string,value:number,kind:'income'|'expense')=>{const i=index.get(date);if(i===undefined||i===0)return;const key=kind==='income'?'incomeCents':'expenseCents';days[i][key]=sum(days[i][key],value)};
 for(const row of input.transactions){
  if(seen.has(row.id)||excluded.has(row.id))continue;seen.add(row.id);
  if(!validLocalDay(row.date)||!Number.isSafeInteger(row.cents)||row.cents<0){issues.add('Há lançamentos inválidos que precisam de revisão.');continue;}
  if(row.duplicateOfId&&sourceIds.has(row.duplicateOfId))continue;
  if(row.kind==='transfer')continue;
  const signature=[row.description.trim().toLocaleLowerCase('pt-BR'),row.date,row.cents,row.kind].join('|'),peer=fingerprints.get(signature);
  if(peer&&peer.id!==row.id&&(peer.id.startsWith('of-')!==row.id.startsWith('of-')))issues.add('Há possível duplicidade entre registro manual e bancário. Revise antes de confiar no saldo.');else fingerprints.set(signature,row);
  if(row.kind==='expense'&&row.payment==='credit'){
   const card=row.cardId?cards.get(row.cardId):undefined,remaining=cents(Math.max(0,(row.chargeCents??row.cents)-(row.paidCents??0)));
   if(!remaining)continue;
   if(!card?.closingDay||!card.dueDay){issues.add('Há compras no crédito sem fechamento ou vencimento informado.');continue;}
   let date=invoiceDueDate(row.date,card.closingDay,card.dueDay);if(date<=input.today){date=addLocalDays(input.today,1);issues.add('Fatura vencida não quitada: saída considerada amanhã, com data estimada.');}
   const key=card.id+':'+date,previous=bills.get(key);bills.set(key,{date,cents:sum(previous?.cents||0,remaining)});continue;
  }
  if(row.kind==='expense'&&!row.subscription&&!row.recurrenceId){const h=histIndex.get(row.date);if(h!==undefined)history[h]=sum(history[h],row.cents);if(row.date>input.today)knownVariable.set(row.date,sum(knownVariable.get(row.date)||0,row.cents));}
  if(row.date>input.today)put(row.date,row.cents,row.kind==='expense'?'expense':'income');
 }
 for(const bill of bills.values())put(bill.date,bill.cents,'expense');
 for(const card of cards.values()){
  const opening=cents(Math.max(0,card.openingUsedCents-(card.openingPaidCents||0)));if(!opening)continue;
  if(!card.dueDay){issues.add('Saldo inicial do cartão sem vencimento: revise o compromisso.');continue;}
  let date=addLocalMonths(input.today.slice(0,7)+'-01',0,card.dueDay);if(date<=input.today)date=addLocalMonths(date,1,card.dueDay);put(date,opening,'expense');issues.add('O vencimento do saldo inicial do cartão é estimado.');
 }
 for(const event of input.commitments||[]){if(seen.has(event.id))continue;seen.add(event.id);if(!validLocalDay(event.date)||event.cents<0)throw Error('Compromisso inválido.');put(event.date,cents(event.cents),event.kind);}
 const coverageDays=new Set(input.transactions.filter(row=>row.date>=histStart&&row.date<input.today).map(row=>row.date)).size;
 let estimatedDailyCents=0;if(input.estimateVariable){const sorted=[...history].sort((a,b)=>a-b);estimatedDailyCents=cents(Math.floor(sum(sorted[44]??0,sorted[45]??0)/2+.5));if(coverageDays<30)issues.add('Poucos dias com registros: confirme a cobertura do histórico antes de usar a estimativa variável.');}
 let balance=cents(input.openingBalanceCents),lowest=balance,lowestDate=input.today,firstNegativeDate:string|null=balance<0?input.today:null,daysUntilNegative:number|null=balance<0?0:null;
 for(let i=0;i<days.length;i++){const day=days[i];if(i>0){day.estimatedCents=input.estimateVariable?Math.max(0,estimatedDailyCents-(knownVariable.get(day.date)||0)):0;balance=sum(sum(balance,day.incomeCents),-sum(day.expenseCents,day.estimatedCents));}day.balanceCents=balance;if(balance<lowest){lowest=balance;lowestDate=day.date}if(balance<0&&firstNegativeDate===null){firstNegativeDate=day.date;daysUntilNegative=i}}
 const risk=lowest<0?'risco':lowest<margin||issues.size>0?'atenção':'ok';return {ready:true,days,lowestCents:lowest,lowestDate,firstNegativeDate,daysUntilNegative,risk,issues:[...issues],estimatedDailyCents,coverageDays};
}
