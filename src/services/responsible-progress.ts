import {isSafeInteger} from './type-guards.ts';
export interface ResponsibleMonth {key:string;expenseCount:number;incomeCount:number;income:number;expenses:number;debts:number;categories:{limit:number;spent:number}[]}
// Only completed, recorded months earn a star. Amounts are integer cents.
export function responsibleProgress(months:ResponsibleMonth[],currentMonth:string){
  const responsible=new Set();
  for(const m of months){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(m.key)||m.key>=currentMonth||!m.expenseCount||!m.incomeCount)continue;
    if(![m.income,m.expenses,m.debts].every(n=>isSafeInteger(n)&&n>=0)||m.income<=0||m.expenses+m.debts>m.income)continue;
    const limits=m.categories.filter(c=>isSafeInteger(c.limit)&&c.limit>0);
    if(!limits.length||limits.some(c=>!isSafeInteger(c.spent)||c.spent<0||c.spent>c.limit))continue;
    responsible.add(m.key);
  }
  return {stars:Math.min(5,responsible.size),months:responsible.size};
}
