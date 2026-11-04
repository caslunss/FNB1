import type {NotificationRow} from '../types/finance';
export function notificationDateKey(value?:string){
 if(!value)return '';
 const date=new Date(value.length===10?value+'T12:00:00':value);
 return Number.isNaN(+date)?'':`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
export function groupsFor(rows:NotificationRow[],now=new Date()){
 const yesterday=new Date(now);yesterday.setDate(now.getDate()-1);
 const groups=new Map<string,{key:string;label:string;rows:NotificationRow[]}>();
 for(const row of [...rows].sort((a,b)=>(Date.parse(b.date||'')||0)-(Date.parse(a.date||'')||0))){
  const key=notificationDateKey(row.date),raw=row.date||'';
  if(!groups.has(key))groups.set(key,{key,label:!key?'Sem data':key===notificationDateKey(now.toISOString())?'Hoje':key===notificationDateKey(yesterday.toISOString())?'Ontem':new Date(raw.length===10?raw+'T12:00:00':raw).toLocaleDateString('pt-BR'),rows:[]});
  groups.get(key)!.rows.push(row);
 }
 return [...groups.values()];
}
