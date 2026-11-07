import type {FinanceServices} from '../types/finance-runtime';
// One command registry. Only the controller installs implementations; components import it.
export const finance = {} as FinanceServices;
type SnapshotKey='taxes'|'credit'|'productGoals'|'goal'|'mobile'|'forecast'|'friends';
type State<K extends SnapshotKey>=ReturnType<FinanceServices[K]['getState']>;
const snapshots=new Map<SnapshotKey,{json:string;value:unknown;revision:number;reader:unknown}>();
let revision=0;
let registrationEpoch=0,publishQueued=false;
const listeners=new Set<()=>void>();
export function getFinanceSnapshot<K extends SnapshotKey>(key:K):State<K>{
 const reader=finance[key].getState,previous=snapshots.get(key);
 if(previous?.revision===revision&&previous.reader===reader)return previous.value as State<K>;
 const value=reader(),json=JSON.stringify(value);
 const next=previous?.json===json?previous.value:JSON.parse(json);
 snapshots.set(key,{json,value:next,revision,reader});return next as State<K>;
}
export function subscribeFinance(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener)}}
export function publishFinance(){revision++;for(const listener of listeners)listener()}

/** Batch domain publications without relying on compatibility globals. */
export function requestFinancePublish(){
 if(publishQueued)return;
 publishQueued=true;const epoch=registrationEpoch;
 queueMicrotask(()=>{if(epoch!==registrationEpoch)return;publishQueued=false;publishFinance()});
}

/** A session restores its registrations when startup fails or the app unmounts. */
export function captureFinanceRegistration(){
 const previous=Object.getOwnPropertyDescriptors(finance);
 return()=>{
  for(const key of Object.keys(finance))Reflect.deleteProperty(finance,key);
  Object.defineProperties(finance,previous);
  snapshots.clear();
  registrationEpoch++;publishQueued=false;
  revision++;
 };
}

/** Fail before rendering a financial page if an integration has an incomplete contract. */
export function assertFinanceReady(){
 const services:Record<string,string[]>={taxes:['getState','addExpense','importBank'],credit:['getState','saveCard','payInvoice','setPaid'],productGoals:['getState','save','remove','context','prepare'],goal:['getState','save'],mobile:['getState','navigate','open','compose','rowAction'],notifications:['getState','close','clear','settings']};
 const registry=finance as unknown as Record<string,Record<string,unknown>|((...args:unknown[])=>unknown)>;
 for(const [name,methods]of Object.entries(services))for(const method of methods){const service=registry[name];if(!service||typeof (service as Record<string,unknown>)[method]!=='function')throw Error(`Finance service ${name}.${method} is not registered`)}
 for(const name of ['isMonthClosed','resetFinancialData','searchRecords','openSearchResult','debtSources','actionItems'])if(typeof registry[name]!=='function')throw Error(`Finance command ${name} is not registered`);
}
