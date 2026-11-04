export interface AmountEntry {v:number;date?:string;c?:string}
export interface DebtModel {v:number;p:number;s:number;paid?:number}
export interface GoalModel {v:number;e:number;date?:string}
export interface PurchasePlan {priceCents:number;shippingCents:number;installments:number;people:string[];date:string;category:string;goal:boolean}
export interface ScheduledPayment {date:string;cents:number;totalCents:number;shareOffset:number}
export interface FinancialCalculationContext {
 CATS:string[];MAX_CENTS:number;MAX_MONTHS:number;
 GOAL:GoalModel;DEBTS:DebtModel[];
 CLOSED_REPORTS:Record<string,{balanceCents:number;debtCents:number;receipts:AmountEntry[];expenses:AmountEntry[]}>;
 canonicalCategory(value:string):string;
 itemsInMonth(month:number):(AmountEntry & {c:string})[];
 receiptsInMonth(month:number):AmountEntry[];
 lim(month:number,category:string):number;
 toCents(value:unknown):number;
 inc(month:number):number;
 debt(month:number):number;
 isMonthClosed(month:number):boolean;
 monthKeyForIndex(month:number):string;
 monthIndexFromDate(date:string):number;
 todayISO():string;
 monthlyExpenseDate(date:string,offset:number):string;
 expenseBudgetCents(month:number,category?:string,cents?:number):number;
 goalMonthProjectionCents(month:number,category?:string,cents?:number,cutoff?:string):number;
 monthProjectionCents(month:number,category?:string,cents?:number,cutoff?:string):number;
 splitShares(cents:number,n:number,offset?:number):number[];
 planSchedule(plan:PurchasePlan):ScheduledPayment[];
 debtInstallments(debt:DebtModel):number[];
 debtPaidCount(debt:DebtModel):number;
}
