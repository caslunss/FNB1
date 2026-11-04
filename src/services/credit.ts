import {isSafeInteger,isInteger} from './type-guards.ts';
import type {CreditCard,StoredExpense} from "../types/finance-runtime";
type CreditCharge=Pick<StoredExpense,'v'|'p'|'creditCardId'|'creditPaid'|'creditPaidCents'|'creditChargeCents'>;
export interface CardBalance extends CreditCard {linkedCents:number;usedCents:number;availableCents:number;excessCents:number}
export interface CardCalendarEvent {id:string;cardId:string;date:string;kind:string;label:string;amountCents?:number|null}

export const CARD_MAX=100000000000;
export function normalizeCreditCard(input:Partial<CreditCard>):CreditCard{
 input={openingUsedCents:0,closingDay:null,dueDay:null,...input};
 if(!input||typeof input.id!=='string'||!/^[-\w]{1,100}$/.test(input.id)||typeof input.name!=='string'||!input.name.trim()||input.name.length>60||/\d{13,19}/.test(input.name.replace(/[ -]/g,'')))throw Error('Informe o banco, com até 60 caracteres e sem o número do cartão.');
 if(!isSafeInteger(input.limitCents)||input.limitCents<1||input.limitCents>CARD_MAX||!isSafeInteger(input.openingUsedCents)||input.openingUsedCents<0||input.openingUsedCents>CARD_MAX)throw Error('Revise o limite e o valor comprometido.');
 for(const key of ['closingDay','dueDay'] as const)if(input[key]!=null&&(!isInteger(input[key])||input[key]<1||input[key]>31))throw Error('Use dias de 1 a 31.');
 const card:CreditCard={id:input.id,name:input.name.trim(),limitCents:input.limitCents,openingUsedCents:input.openingUsedCents,closingDay:input.closingDay!,dueDay:input.dueDay!,active:input.active!==false};
 if(input.openingPaidCents!==undefined){if(!isSafeInteger(input.openingPaidCents)||input.openingPaidCents<0||input.openingPaidCents>card.openingUsedCents)throw Error('Pagamento do saldo inicial inválido.');card.openingPaidCents=input.openingPaidCents;}
 if(input.payments!==undefined){if(!Array.isArray(input.payments)||input.payments.length>1000)throw Error('Histórico de pagamentos inválido.');const ids=new Set();card.payments=input.payments.map(p=>{if(!p||!/^[-\w]{1,100}$/.test(p.id||'')||ids.has(p.id)||!isoDate(p.date)||!validMonth(p.invoiceMonth)||!isSafeInteger(p.amountCents)||p.amountCents<1||p.amountCents>CARD_MAX)throw Error('Pagamento inválido.');ids.add(p.id);return {id:p.id,date:p.date,invoiceMonth:p.invoiceMonth,amountCents:p.amountCents};});}
 return card;
}
export const chargeCents=(item:CreditCharge):number=>isSafeInteger(item.creditChargeCents)&&item.creditChargeCents!>0?item.creditChargeCents!:Math.round(item.v*100);
export function paidCents(item:CreditCharge):number{const charge=chargeCents(item);return item.creditPaid?charge:Math.max(0,Math.min(charge,isSafeInteger(item.creditPaidCents)?item.creditPaidCents:0));}
export function cardBalances(cards:CreditCard[],items:CreditCharge[]):CardBalance[]{
 const totals=new Map<string,number>();for(const item of items){if(!item.creditCardId||item.p!=='Cartão de crédito')continue;const cents=chargeCents(item)-paidCents(item);if(cents>0&&isSafeInteger(cents))totals.set(item.creditCardId,(totals.get(item.creditCardId)||0)+cents);}
 return cards.map(card=>{const linkedCents=totals.get(card.id)||0,usedCents=Math.max(0,card.openingUsedCents-(card.openingPaidCents||0))+linkedCents;return {...card,linkedCents,usedCents,availableCents:Math.max(0,card.limitCents-usedCents),excessCents:Math.max(0,usedCents-card.limitCents)};});
}
function validMonth(value:unknown):value is string{return typeof value==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(value);}
function isoDate(value:unknown):value is string{return typeof value==='string'&&/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
function dateAt(month:string,day:number){if(!validMonth(month))throw Error('Mês inválido.');const [y,m]=month.split('-').map(Number);return `${month}-${String(Math.min(day,new Date(Date.UTC(y,m,0)).getUTCDate())).padStart(2,'0')}`;}
function moveMonth(month:string,offset:number){const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-1+offset,1)).toISOString().slice(0,7);}
export function cardDates(card:CreditCard,month:string){
 if(!validMonth(month))throw Error('Mês inválido.');const closing=card.closingDay?dateAt(month,card.closingDay):null,due=card.dueDay?dateAt(month,card.dueDay):null;
 let best:string|null=null;if(closing){const date=new Date(closing+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+1);best=date.toISOString().slice(0,10);}return {closing,due,best};
}
export function expenseInvoiceMonth(card:CreditCard,item:Pick<StoredExpense,'date'>){if(!isoDate(item.date)||!card.closingDay||!card.dueDay)return null;let month=item.date.slice(0,7);if(item.date>dateAt(month,card.closingDay))month=moveMonth(month,1);const closing=dateAt(month,card.closingDay);return dateAt(month,card.dueDay)<=closing?moveMonth(month,1):month;}
export function defaultInvoiceMonth(card:CreditCard,today:string){if(!isoDate(today))throw Error('Data inválida.');const month=today.slice(0,7);return card.dueDay&&dateAt(month,card.dueDay)<today?moveMonth(month,1):month;}
export function cardInvoice(card:CreditCard,items:StoredExpense[],month:string){
 if(!validMonth(month))throw Error('Mês inválido.');if(!card.closingDay||!card.dueDay)return {ready:false as const,month,totalCents:0,remainingCents:0,entries:[]};
 const entries=items.filter(x=>x.creditCardId===card.id&&x.p==='Cartão de crédito').map(item=>({item,month:expenseInvoiceMonth(card,item),remainingCents:chargeCents(item)-paidCents(item)})).filter(x=>x.month===month||x.remainingCents>0&&(!x.month||x.month<month)).sort((a,b)=>(a.month||'').localeCompare(b.month||'')||(a.item.date||'').localeCompare(b.item.date||'')||String(a.item.id).localeCompare(String(b.item.id)));
 const opening=Math.max(0,card.openingUsedCents-(card.openingPaidCents||0));return {ready:true as const,month,totalCents:opening+entries.reduce((n,x)=>n+(x.month===month?chargeCents(x.item):x.remainingCents),0),remainingCents:opening+entries.reduce((n,x)=>n+x.remainingCents,0),entries,openingCents:opening};
}
// Manual confirmation only: original expenses remain intact; no second cash expense.
export function allocateInvoicePayment(card:CreditCard,items:StoredExpense[],month:string,amountCents:number,{id,date,today=date}:{id?:string;date?:string;today?:string}={}){
 const invoice=cardInvoice(card,items,month);if(!invoice.ready)throw Error('Informe fechamento e vencimento do cartão.');if(!isoDate(date)||date>today!)throw Error('Informe uma data de pagamento válida, até hoje.');if(!isSafeInteger(amountCents)||amountCents<1||amountCents>invoice.remainingCents||amountCents>CARD_MAX)throw Error('O pagamento deve ser maior que zero e não ultrapassar o saldo da fatura.');
 let left=amountCents;const openingPayment=Math.min(left,invoice.openingCents);left-=openingPayment;const changes=new Map();for(const row of invoice.entries){if(!left)break;const pay=Math.min(left,row.remainingCents);if(!pay)continue;left-=pay;const paid=paidCents(row.item)+pay;changes.set(row.item.id,{...row.item,creditPaidCents:paid,creditPaid:paid===chargeCents(row.item)});}
 const next=normalizeCreditCard({...card,openingPaidCents:(card.openingPaidCents||0)+openingPayment,payments:[...(card.payments||[]),{id:id!,date,invoiceMonth:month,amountCents}]});return {card:next,items:items.map(x=>changes.get(x.id)||x)};
}
export function cardCalendarEvents(cards:CreditCard[],items:StoredExpense[],month:string):CardCalendarEvent[]{
 if(!validMonth(month))throw Error('Mês inválido.');const events:CardCalendarEvent[]=[];for(const card of cards){if(!card.active)continue;const dates=cardDates(card,month),previous=cardDates(card,moveMonth(month,-1));if(dates.closing)events.push({id:card.id+'-close-'+month,cardId:card.id,date:dates.closing,kind:'closing',label:'Fechamento · '+card.name});if(dates.due){const invoice=cardInvoice(card,items,month);events.push({id:card.id+'-due-'+month,cardId:card.id,date:dates.due,kind:'due',label:'Vencimento · '+card.name,amountCents:invoice.ready?invoice.remainingCents:null});}for(const candidate of [previous.best,dates.best])if(candidate?.startsWith(month))events.push({id:card.id+'-best-'+candidate,cardId:card.id,date:candidate,kind:'best',label:'Melhor dia estimado · '+card.name});for(const payment of card.payments||[])if(payment.date.startsWith(month))events.push({id:payment.id,cardId:card.id,date:payment.date,kind:'payment',label:'Pagamento de fatura · '+card.name,amountCents:payment.amountCents});}return events.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
