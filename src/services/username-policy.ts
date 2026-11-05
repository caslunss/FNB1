import {localMonth} from './dates.ts';

const KEY='plan12usernameChange_v1';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export interface UsernameChangeStatus{allowed:boolean;nextMonth:string|null;unavailable:boolean}
function activeStorage(){return typeof window==='undefined'?undefined:window.planAuth?.storage;}
function changed(){if(typeof window!=='undefined')window.dispatchEvent(new Event('plan-username-policy-change'));}

export function usernameChangeStatus(storage:Store|undefined=activeStorage(),now=new Date()):UsernameChangeStatus{
 try{
  if(!storage)throw Error('Storage unavailable');
  const raw=storage.getItem(KEY);
  if(raw===null)return{allowed:true,nextMonth:null,unavailable:false};
  const saved:unknown=JSON.parse(raw);
  if(!saved||typeof saved!=='object'||!('month' in saved)||typeof saved.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(saved.month))throw Error('Invalid policy record');
  const [year,month]=saved.month.split('-').map(Number),next=new Date(year,month,1);
  if(year<1970||year>9998)throw Error('Invalid policy year');
  return{allowed:saved.month<localMonth(now),nextMonth:localMonth(next),unavailable:false};
 }catch{return{allowed:false,nextMonth:null,unavailable:true};}
}

/** Reserve before the remote write, so a storage failure never permits an untracked change. */
export function reserveUsernameChange(storage:Store|undefined=activeStorage(),now=new Date()){
 const status=usernameChangeStatus(storage,now);
 if(!status.allowed||!storage)throw Error(status.unavailable?'Não foi possível verificar o prazo para alterar seu usuário.':'O nome de usuário só pode ser alterado uma vez por mês.');
 const previous=storage.getItem(KEY),reservation=JSON.stringify({month:localMonth(now),reservationId:crypto.randomUUID()});
 storage.setItem(KEY,reservation);changed();
 return()=>{if(storage.getItem(KEY)!==reservation)return;if(previous===null)storage.removeItem(KEY);else storage.setItem(KEY,previous);changed();};
}

export function subscribeUsernamePolicy(listener:()=>void){
 const storage=(event:StorageEvent)=>{if(event.key===window.planAuth?.key(KEY))listener();};
 window.addEventListener('storage',storage);window.addEventListener('plan-username-policy-change',listener);window.addEventListener('focus',listener);
 return()=>{window.removeEventListener('storage',storage);window.removeEventListener('plan-username-policy-change',listener);window.removeEventListener('focus',listener);};
}
