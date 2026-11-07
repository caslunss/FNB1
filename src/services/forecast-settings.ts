import {calculateBalanceForecast,type ForecastInput,type ForecastResult} from './balance-forecast.ts';
import {validLocalDay} from './dates.ts';
import {confirmedRecurrenceTransactions,type RecurrenceDecision} from './recurrence-decisions.ts';
export type ForecastSource=Pick<ForecastInput,'today'|'transactions'|'cards'|'commitments'|'pending'>;
export interface ForecastSettings{version:1;openingBalanceCents:number|null;asOfDay:string;horizon:30|60|90;marginCents:number;estimateVariable:boolean}
export const FORECAST_KEY='plan12forecast_v1';
export const FORECAST_EVENT='plan-forecast-settings-change';
type Store=Pick<Storage,'getItem'|'setItem'>;
export function readForecastSettings(storage:Pick<Storage,'getItem'>,today:string):ForecastSettings{
 const defaults:ForecastSettings={version:1,openingBalanceCents:null,asOfDay:today,horizon:30,marginCents:10000,estimateVariable:false};
 try{const parsed:unknown=JSON.parse(storage.getItem(FORECAST_KEY)||'null');if(!parsed||typeof parsed!=='object'||!('version'in parsed)||parsed.version!==1)return defaults;
 if('openingBalanceCents'in parsed&&typeof parsed.openingBalanceCents==='number'&&Number.isSafeInteger(parsed.openingBalanceCents)&&Math.abs(parsed.openingBalanceCents)<=100000000000)defaults.openingBalanceCents=parsed.openingBalanceCents;
 if('asOfDay'in parsed&&typeof parsed.asOfDay==='string'&&validLocalDay(parsed.asOfDay))defaults.asOfDay=parsed.asOfDay;
 if('horizon'in parsed&&(parsed.horizon===30||parsed.horizon===60||parsed.horizon===90))defaults.horizon=parsed.horizon;
 if('marginCents'in parsed&&typeof parsed.marginCents==='number'&&Number.isSafeInteger(parsed.marginCents)&&parsed.marginCents>=0&&parsed.marginCents<=100000000000)defaults.marginCents=parsed.marginCents;
 if('estimateVariable'in parsed&&typeof parsed.estimateVariable==='boolean')defaults.estimateVariable=parsed.estimateVariable;return defaults;
 }catch{return defaults}
}
export function saveForecastSettings(storage:Store,next:ForecastSettings){
 if(next.version!==1||![30,60,90].includes(next.horizon)||typeof next.estimateVariable!=='boolean'||!validLocalDay(next.asOfDay)||next.openingBalanceCents!==null&&(!Number.isSafeInteger(next.openingBalanceCents)||Math.abs(next.openingBalanceCents)>100000000000)||!Number.isSafeInteger(next.marginCents)||next.marginCents<0||next.marginCents>100000000000)throw Error('Revise o saldo e a margem.');storage.setItem(FORECAST_KEY,JSON.stringify(next));
}
let cache:{source:ForecastSource;key:string;result:ForecastResult}|undefined;
export function forecastModel(source:ForecastSource,settings:ForecastSettings,decisions:readonly RecurrenceDecision[]=[]){
 const key=JSON.stringify([settings,decisions]);if(cache?.source===source&&cache.key===key)return cache.result;
 const confirmedIds=new Set(decisions.filter(row=>row.status==='confirmed').flatMap(row=>row.candidate.memberIds));
 const transactions=[...source.transactions.map(row=>confirmedIds.has(row.id)?{...row,subscription:true}:row),...confirmedRecurrenceTransactions(source.transactions,source.today,decisions,settings.horizon)];
 const result=calculateBalanceForecast({...source,...settings,transactions,openingBalanceCents:settings.asOfDay===source.today?settings.openingBalanceCents:null});
 if(settings.asOfDay!==source.today)result.issues.push('Atualize o saldo disponível de hoje; o valor salvo é de outra data.');cache={source,key,result};return result;
}
