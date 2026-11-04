import type {FinancialExpense,NotificationSnapshot} from './finance';
export interface StoredExpense {id:string;d:string;v:number;c:string;p:string;date:string;creditCardId?:string;creditPaid?:boolean;creditPaidCents?:number;creditChargeCents?:number}
export interface CreditCard {id:string;name:string;active:boolean;limitCents:number;openingUsedCents:number;closingDay:number|null;dueDay:number|null;usedCents?:number;availableCents?:number}
export interface ProductGoal {id:string;name:string;productGoal:boolean;goalMode:'save'|'cash'|'credit';monthlyReserveCents:number;priceCents:number;shippingCents:number;reservedCents:number;date:string;installments:number;creditCardId?:string;category:string;status:'planned'|'purchased'}
export interface FinancialGoal {v:number;e:number;mode?:'months'|'date';date?:string;months?:number;}
export interface GoalState extends FinancialGoal {today:string;readonly:boolean}
export interface TaxState {month:string;today:string;closedMonths:string[];expenses:FinancialExpense[]}
export interface CreditState {cards:CreditCard[];items:StoredExpense[]}
export interface ProductGoalsState {goals:ProductGoal[];cards:CreditCard[];categories:string[];today:string}
export interface MobileState {tab:string;composeDebt:boolean;closed:boolean;sections:Record<string,boolean>}
export interface FinanceServices {
 taxes:{getState():TaxState;addExpense(input:{description:string;value:string;date:string;category:string}):FinancialExpense;importBank(rows:unknown[]):number};
 credit:{getState():CreditState;saveCard(input:Partial<CreditCard>):CreditCard;payInvoice(id:string,month:string,amount:number,date:string,expected:number):void;setPaid(id:string,paid:boolean):void};
 productGoals:{getState():ProductGoalsState;save(input:Partial<ProductGoal>):ProductGoal;remove(id:string):void;context(goal:ProductGoal):unknown;prepare(id:string):void};
 goal:{getState():GoalState;save(input:{amountCents:number;mode:'months'|'date';months:number;date:string},options?:{redraw?:boolean}):FinancialGoal};
 mobile:{getState():MobileState;navigate(key:string):void;open(panel:string,opener?:Element):void;compose():void;rowAction(action:string,kind:string,id:string):void};
 notifications:{getState():NotificationSnapshot;close():void;settings():void};
 isMonthClosed():boolean;
 resetFinancialData():Promise<string>;
 searchRecords(filters:Record<string,unknown>):unknown;
 openSearchResult(row:unknown):void;
 debtSources():{id:string;name:string;cents:number}[];
 actionItems(descriptor:Record<string,unknown>):{label:string;destructive?:boolean;onSelect():void}[];
}
