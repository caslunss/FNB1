import {isSafeInteger,isInteger} from '../services/type-guards.ts';
import type {FinancialCalculationContext,PurchasePlan,DebtModel,AmountEntry} from '../types/calculations';
// Financial selectors and exact-cent calculations. No persistence or DOM effects.
export function core_toCents(context:FinancialCalculationContext,...args:[value:unknown]){
 const {}=context;
function toCents(value:unknown){const result=Math.round(Number(value)*100);if(!isSafeInteger(result))throw Error('Valor fora do limite permitido.');return result;}
 return toCents(...args);
}
// end-core:toCents
export function core_expenseBudgetCents(context:FinancialCalculationContext,...args:[m:number,extraCategory?:string,extraCents?:number]){
 const {CATS,canonicalCategory,itemsInMonth,lim,toCents}=context;
function expenseBudgetCents(m:number,extraCategory:string='',extraCents:number=0){if(extraCategory)extraCategory=canonicalCategory(extraCategory);const totals=Object.fromEntries(CATS.map(c=>[c,0]));for(const item of itemsInMonth(m))totals[item.c]+=toCents(item.v);if(extraCategory)totals[extraCategory]+=extraCents;return CATS.reduce((n,c)=>n+Math.max(toCents(lim(m,c)),totals[c]),0);}
 return expenseBudgetCents(...args);
}
// end-core:expenseBudgetCents
export function core_monthProjectionCents(context:FinancialCalculationContext,...args:[m:number,extraCategory?:string,extraCents?:number,cutoff?:string]){
 const {CATS,CLOSED_REPORTS,canonicalCategory,debt,expenseBudgetCents,inc,isMonthClosed,itemsInMonth,lim,monthKeyForIndex,receiptsInMonth,toCents}=context;
function monthProjectionCents(m:number,extraCategory:string='',extraCents:number=0,cutoff:string=''){if(extraCategory)extraCategory=canonicalCategory(extraCategory);if(isMonthClosed(m)&&CLOSED_REPORTS[monthKeyForIndex(m)]){const report=CLOSED_REPORTS[monthKeyForIndex(m)];if(!cutoff)return report.balanceCents;const total=(rows:AmountEntry[])=>rows.filter(x=>!x.date||x.date<=cutoff).reduce((n,x)=>n+toCents(x.v),0);return total(report.receipts)-total(report.expenses)-report.debtCents;}if(!cutoff)return toCents(inc(m))-expenseBudgetCents(m,extraCategory,extraCents)-toCents(debt(m));const income=receiptsInMonth(m).filter(x=>!x.date||x.date<=cutoff).reduce((n,x)=>n+toCents(x.v),0),totals=Object.fromEntries(CATS.map(c=>[c,0]));for(const x of itemsInMonth(m).filter(x=>!x.date||x.date<=cutoff))totals[x.c]+=toCents(x.v);if(extraCategory)totals[extraCategory]+=extraCents;return income-CATS.reduce((n,c)=>n+Math.max(toCents(lim(m,c)),totals[c]),0)-toCents(debt(m));}
 return monthProjectionCents(...args);
}
// end-core:monthProjectionCents
export function core_goalInvestedCents(context:FinancialCalculationContext,...args:[m:number]){
 const {GOAL,itemsInMonth,toCents,todayISO}=context;
function goalInvestedCents(m:number){const cutoff=GOAL.date&&GOAL.date<todayISO()?GOAL.date:todayISO(),last=Math.min(m,GOAL.date?GOAL.e:m);let total=0;for(let k=0;k<=last;k++)for(const x of itemsInMonth(k))if(x.c==='Investimentos'&&(!x.date||x.date<=cutoff))total+=toCents(x.v);return total;}
 return goalInvestedCents(...args);
}
// end-core:goalInvestedCents
export function core_goalProjection(context:FinancialCalculationContext,...args:[m:number]){
 const {GOAL,goalMonthProjectionCents}=context;
function goalProjection(m:number){let cents=0;const last=GOAL.date?Math.min(m,GOAL.e):m;for(let k=0;k<=last;k++)cents+=goalMonthProjectionCents(k,'',0,GOAL.date&&k===GOAL.e?GOAL.date:'');return cents/100;}
 return goalProjection(...args);
}
// end-core:goalProjection
export function core_planSchedule(context:FinancialCalculationContext,...args:[plan:PurchasePlan]){
 const {MAX_CENTS,monthlyExpenseDate,splitShares}=context;
function planSchedule(plan:PurchasePlan){const total=plan.priceCents+plan.shippingCents;if(!isSafeInteger(total)||total>MAX_CENTS)throw Error('O total ultrapassa o limite permitido.');if(total<plan.installments)throw Error('O total deve permitir pelo menos um centavo por parcela.');let allocated=0;return splitShares(total,plan.installments).map((cents,i)=>{const shareOffset=allocated%(plan.people.length+1),own=splitShares(cents,plan.people.length+1,shareOffset)[0];allocated+=cents;return {date:monthlyExpenseDate(plan.date,i),cents:own,totalCents:cents,shareOffset};});}
 return planSchedule(...args);
}
// end-core:planSchedule
export function core_planProjection(context:FinancialCalculationContext,...args:[plan:PurchasePlan]){
 const {DEBTS,GOAL,debt,debtInstallments,debtPaidCount,expenseBudgetCents,goalMonthProjectionCents,inc,monthIndexFromDate,monthProjectionCents,planSchedule,receiptsInMonth,toCents}=context;
function planProjection(plan:PurchasePlan){
 const schedule=planSchedule(plan),firstMonth=monthIndexFromDate(plan.date),overdueCents=DEBTS.reduce((total,d)=>total+debtInstallments(d).reduce((n,v,j)=>n+(j>=debtPaidCount(d)&&d.s+j<firstMonth?v:0),0),0),rows=schedule.map((x,i)=>{const m=monthIndexFromDate(x.date),income=toCents(inc(m)),commitments=expenseBudgetCents(m)+toCents(debt(m));return {...x,m,income,commitments,after:monthProjectionCents(m,plan.category,x.cents)-(i===0?overdueCents:0),overdueCents:i===0?overdueCents:0,complete:receiptsInMonth(m).length>0};});
 let goalAfter:number|null=null;if(GOAL.v>0&&plan.goal){let balance=0;for(let m=0;m<=GOAL.e;m++){const extra=schedule.filter(x=>monthIndexFromDate(x.date)===m&&(!GOAL.date||x.date<=GOAL.date)).reduce((n,x)=>n+x.cents,0);balance+=goalMonthProjectionCents(m,plan.category,extra,GOAL.date&&m===GOAL.e?GOAL.date:'');}goalAfter=balance-toCents(GOAL.v);}
 return {rows,totalCents:schedule.reduce((n,x)=>n+x.cents,0),goalAfter};
}
 return planProjection(...args);
}
// end-core:planProjection
export function core_debtInstallments(context:FinancialCalculationContext,...args:[d:DebtModel]){
 const {splitShares}=context;
function debtInstallments(d:DebtModel){return splitShares(Math.round(d.v*100),Math.max(1,Math.round(d.p)));}
 return debtInstallments(...args);
}
// end-core:debtInstallments
export function core_debtPaidCount(context:FinancialCalculationContext,...args:[d:DebtModel]){
 const {}=context;
function debtPaidCount(d:DebtModel){return Math.max(0,Math.min(d.p,Math.round(d.paid||0)));}
 return debtPaidCount(...args);
}
// end-core:debtPaidCount
export function core_debtRemainingCents(context:FinancialCalculationContext,...args:[d:DebtModel]){
 const {debtInstallments,debtPaidCount}=context;
function debtRemainingCents(d:DebtModel){return debtInstallments(d).slice(debtPaidCount(d)).reduce((a,b)=>a+b,0);}
 return debtRemainingCents(...args);
}
// end-core:debtRemainingCents
export function core_splitShares(context:FinancialCalculationContext,...args:[cents:number,n:number,offset?:number]){
 const {MAX_CENTS,MAX_MONTHS}=context;
function splitShares(cents:number,n:number,offset:number=0){if(!isSafeInteger(cents)||cents<0||cents>MAX_CENTS||!isInteger(n)||n<1||n>MAX_MONTHS||!isInteger(offset)||offset<0||offset>=n)throw Error('Divisão inválida.');const base=Math.floor(cents/n),rest=cents%n;return Array.from({length:n},(_,i)=>base+((i-offset+n)%n<rest?1:0));}
 return splitShares(...args);
}
// end-core:splitShares
