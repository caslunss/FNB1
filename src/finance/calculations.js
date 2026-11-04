// @ts-check
/** @typedef {import('../types/calculations').FinancialCalculationContext} FinancialCalculationContext */
/** @typedef {import('../types/calculations').PurchasePlan} PurchasePlan */
/** @typedef {import('../types/calculations').DebtModel} DebtModel */
/** @typedef {import('../types/calculations').AmountEntry} AmountEntry */
// Financial selectors and exact-cent calculations. No persistence or DOM effects.
/** @param {FinancialCalculationContext} context @param {[value:unknown]} args */
export function core_toCents(context,...args){
 const {}=context;
/** @param {unknown} value */
function toCents(value){const result=Math.round(Number(value)*100);if(!Number.isSafeInteger(result))throw Error('Valor fora do limite permitido.');return result;}
 return toCents(...args);
}
// end-core:toCents
/** @param {FinancialCalculationContext} context @param {[m:number,extraCategory?:string,extraCents?:number]} args */
export function core_expenseBudgetCents(context,...args){
 const {CATS,canonicalCategory,itemsInMonth,lim,toCents}=context;
/** @param {number} m @param {string} extraCategory @param {number} extraCents */
function expenseBudgetCents(m,extraCategory='',extraCents=0){if(extraCategory)extraCategory=canonicalCategory(extraCategory);const totals=Object.fromEntries(CATS.map(c=>[c,0]));for(const item of itemsInMonth(m))totals[item.c]+=toCents(item.v);if(extraCategory)totals[extraCategory]+=extraCents;return CATS.reduce((n,c)=>n+Math.max(toCents(lim(m,c)),totals[c]),0);}
 return expenseBudgetCents(...args);
}
// end-core:expenseBudgetCents
/** @param {FinancialCalculationContext} context @param {[m:number,extraCategory?:string,extraCents?:number,cutoff?:string]} args */
export function core_monthProjectionCents(context,...args){
 const {CATS,CLOSED_REPORTS,canonicalCategory,debt,expenseBudgetCents,inc,isMonthClosed,itemsInMonth,lim,monthKeyForIndex,receiptsInMonth,toCents}=context;
/** @param {number} m @param {string} extraCategory @param {number} extraCents @param {string} cutoff */
function monthProjectionCents(m,extraCategory='',extraCents=0,cutoff=''){if(extraCategory)extraCategory=canonicalCategory(extraCategory);if(isMonthClosed(m)&&CLOSED_REPORTS[monthKeyForIndex(m)]){const report=CLOSED_REPORTS[monthKeyForIndex(m)];if(!cutoff)return report.balanceCents;const total=/** @param {AmountEntry[]} rows */ (rows)=>rows.filter(x=>!x.date||x.date<=cutoff).reduce((n,x)=>n+toCents(x.v),0);return total(report.receipts)-total(report.expenses)-report.debtCents;}if(!cutoff)return toCents(inc(m))-expenseBudgetCents(m,extraCategory,extraCents)-toCents(debt(m));const income=receiptsInMonth(m).filter(x=>!x.date||x.date<=cutoff).reduce((n,x)=>n+toCents(x.v),0),totals=Object.fromEntries(CATS.map(c=>[c,0]));for(const x of itemsInMonth(m).filter(x=>!x.date||x.date<=cutoff))totals[x.c]+=toCents(x.v);if(extraCategory)totals[extraCategory]+=extraCents;return income-CATS.reduce((n,c)=>n+Math.max(toCents(lim(m,c)),totals[c]),0)-toCents(debt(m));}
 return monthProjectionCents(...args);
}
// end-core:monthProjectionCents
/** @param {FinancialCalculationContext} context @param {[m:number]} args */
export function core_goalInvestedCents(context,...args){
 const {GOAL,itemsInMonth,toCents,todayISO}=context;
/** @param {number} m */
function goalInvestedCents(m){const cutoff=GOAL.date&&GOAL.date<todayISO()?GOAL.date:todayISO(),last=Math.min(m,GOAL.date?GOAL.e:m);let total=0;for(let k=0;k<=last;k++)for(const x of itemsInMonth(k))if(x.c==='Investimentos'&&(!x.date||x.date<=cutoff))total+=toCents(x.v);return total;}
 return goalInvestedCents(...args);
}
// end-core:goalInvestedCents
/** @param {FinancialCalculationContext} context @param {[m:number]} args */
export function core_goalProjection(context,...args){
 const {GOAL,goalMonthProjectionCents}=context;
/** @param {number} m */
function goalProjection(m){let cents=0;const last=GOAL.date?Math.min(m,GOAL.e):m;for(let k=0;k<=last;k++)cents+=goalMonthProjectionCents(k,'',0,GOAL.date&&k===GOAL.e?GOAL.date:'');return cents/100;}
 return goalProjection(...args);
}
// end-core:goalProjection
/** @param {FinancialCalculationContext} context @param {[plan:PurchasePlan]} args */
export function core_planSchedule(context,...args){
 const {MAX_CENTS,monthlyExpenseDate,splitShares}=context;
/** @param {PurchasePlan} plan */
function planSchedule(plan){const total=plan.priceCents+plan.shippingCents;if(!Number.isSafeInteger(total)||total>MAX_CENTS)throw Error('O total ultrapassa o limite permitido.');if(total<plan.installments)throw Error('O total deve permitir pelo menos um centavo por parcela.');let allocated=0;return splitShares(total,plan.installments).map((cents,i)=>{const shareOffset=allocated%(plan.people.length+1),own=splitShares(cents,plan.people.length+1,shareOffset)[0];allocated+=cents;return {date:monthlyExpenseDate(plan.date,i),cents:own,totalCents:cents,shareOffset};});}
 return planSchedule(...args);
}
// end-core:planSchedule
/** @param {FinancialCalculationContext} context @param {[plan:PurchasePlan]} args */
export function core_planProjection(context,...args){
 const {DEBTS,GOAL,debt,debtInstallments,debtPaidCount,expenseBudgetCents,goalMonthProjectionCents,inc,monthIndexFromDate,monthProjectionCents,planSchedule,receiptsInMonth,toCents}=context;
/** @param {PurchasePlan} plan */
function planProjection(plan){
 const schedule=planSchedule(plan),firstMonth=monthIndexFromDate(plan.date),overdueCents=DEBTS.reduce((total,d)=>total+debtInstallments(d).reduce((n,v,j)=>n+(j>=debtPaidCount(d)&&d.s+j<firstMonth?v:0),0),0),rows=schedule.map((x,i)=>{const m=monthIndexFromDate(x.date),income=toCents(inc(m)),commitments=expenseBudgetCents(m)+toCents(debt(m));return {...x,m,income,commitments,after:monthProjectionCents(m,plan.category,x.cents)-(i===0?overdueCents:0),overdueCents:i===0?overdueCents:0,complete:receiptsInMonth(m).length>0};});
 let goalAfter=null;if(GOAL.v>0&&plan.goal){let balance=0;for(let m=0;m<=GOAL.e;m++){const extra=schedule.filter(x=>monthIndexFromDate(x.date)===m&&(!GOAL.date||x.date<=GOAL.date)).reduce((n,x)=>n+x.cents,0);balance+=goalMonthProjectionCents(m,plan.category,extra,GOAL.date&&m===GOAL.e?GOAL.date:'');}goalAfter=balance-toCents(GOAL.v);}
 return {rows,totalCents:schedule.reduce((n,x)=>n+x.cents,0),goalAfter};
}
 return planProjection(...args);
}
// end-core:planProjection
/** @param {FinancialCalculationContext} context @param {[d:DebtModel]} args */
export function core_debtInstallments(context,...args){
 const {splitShares}=context;
/** @param {DebtModel} d */
function debtInstallments(d){return splitShares(Math.round(d.v*100),Math.max(1,Math.round(d.p)));}
 return debtInstallments(...args);
}
// end-core:debtInstallments
/** @param {FinancialCalculationContext} context @param {[d:DebtModel]} args */
export function core_debtPaidCount(context,...args){
 const {}=context;
/** @param {DebtModel} d */
function debtPaidCount(d){return Math.max(0,Math.min(d.p,Math.round(d.paid||0)));}
 return debtPaidCount(...args);
}
// end-core:debtPaidCount
/** @param {FinancialCalculationContext} context @param {[d:DebtModel]} args */
export function core_debtRemainingCents(context,...args){
 const {debtInstallments,debtPaidCount}=context;
/** @param {DebtModel} d */
function debtRemainingCents(d){return debtInstallments(d).slice(debtPaidCount(d)).reduce((a,b)=>a+b,0);}
 return debtRemainingCents(...args);
}
// end-core:debtRemainingCents
/** @param {FinancialCalculationContext} context @param {[cents:number,n:number,offset?:number]} args */
export function core_splitShares(context,...args){
 const {MAX_CENTS,MAX_MONTHS}=context;
/** @param {number} cents @param {number} n @param {number} offset */
function splitShares(cents,n,offset=0){if(!Number.isSafeInteger(cents)||cents<0||cents>MAX_CENTS||!Number.isInteger(n)||n<1||n>MAX_MONTHS||!Number.isInteger(offset)||offset<0||offset>=n)throw Error('Divisão inválida.');const base=Math.floor(cents/n),rest=cents%n;return Array.from({length:n},(_,i)=>base+((i-offset+n)%n<rest?1:0));}
 return splitShares(...args);
}
// end-core:splitShares
