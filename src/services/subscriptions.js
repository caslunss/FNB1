import {decimalCents} from './money.js';
export function subscriptionSummary(records,month){
 const groups=new Map();let totalCents=0;
 for(const row of records){
  if(row.subscription!==true||typeof row.d!=='string'||!row.d.trim())continue;
  let cents;try{cents=decimalCents(row.v)}catch{continue}if(cents<=0)continue;
  const date=typeof row.date==='string'?row.date:'';
  // Missing dates cannot establish the billing month or provider contract status.
  const current=date.startsWith(month+'-');
  const key=row.d.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
  const group=groups.get(key)||{name:row.d.trim(),cents:0,count:0,latest:'',record:null};
  if(current){group.cents+=cents;group.count++;totalCents+=cents;}
  if(date>=group.latest){group.latest=date;group.record={id:row.id,type:'g',name:row.d,cents,date};}
  groups.set(key,group);
 }
 return {month,totalCents,groups:[...groups.values()].sort((a,b)=>Number(b.count>0)-Number(a.count>0)||a.name.localeCompare(b.name,'pt-BR'))};
}
