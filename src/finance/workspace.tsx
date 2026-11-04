import React from 'react';
import {viewGroup,viewList} from '../services/presentation.ts';
import {arrangeSummary} from '../components/summary-layout.tsx';
import type {CsvPreview,CsvRecord} from '../types/workspace';
import type {PurchasePlan} from '../types/calculations';
import type {WorkspaceViewContext} from '../types/views';
import type {FinancialCalculationContext} from '../types/calculations';
import {isObject,includesValue} from '../services/type-guards';
import {isSafeInteger,isInteger} from '../services/type-guards.ts';
import type {WorkspaceElement} from '../types/workspace-dom';
import type {WorkspaceSnapshot,RecoveryRow,LedgerRecord,Expense,Debt,Split,ShoppingPlan,ShoppingOffer,ClosedReport,Friend,SharedExpense,SheetState,ActionRow,ProductPreview,OfferResult} from '../types/workspace';
import type {FinancialGoal,ProductGoal,CreditCard,FinanceServices} from '../types/finance-runtime';
import type {OcrWorker} from '../types/browser';
import {errorDetails} from '../services/errors.ts';
import {readDismissedNotifications,clearNotificationRows,DISMISSED_NOTIFICATIONS_KEY} from '../services/notification-dismissals.ts';
import {core_toCents,core_expenseBudgetCents,core_monthProjectionCents,core_goalInvestedCents,core_goalProjection,core_planSchedule,core_planProjection,core_debtInstallments,core_debtPaidCount,core_debtRemainingCents,core_splitShares} from './calculations.ts';
import {vR as rendervR,vI as rendervI,summaryView as rendersummaryView} from './views/summary.tsx';
import {vD as rendervD,vCards as rendervCards,vSplit as rendervSplit,commitmentsView as rendercommitmentsView} from './views/commitments.tsx';
import {vCart as rendervCart,vOffers as rendervOffers,planningView as renderplanningView} from './views/planning.tsx';
import {vCarbon as rendervCarbon,analysisView as renderanalysisView} from './views/analysis.tsx';
import {vCredit as rendervCredit} from './views/investments.tsx';
import {vSettings as rendervSettings,vYou as rendervYou} from './views/account.tsx';
import {installLegacyFinanceAdapter} from '../services/legacy-finance-adapter.ts';
import {finance,assertFinanceReady,subscribeFinance} from '../services/finance-runtime.ts';
import {notificationStore} from '../services/notification-store.ts';
import {subscriptionSummary} from '../services/subscriptions.ts';
import {MAIN_AREAS,availableViews,resolveAreaView} from '../services/navigation.ts';
import {exportTaxData} from '../services/taxes/client.ts';
import {animate} from 'motion';
import {APP_SPRING,FADE,PROFILE_EXIT} from '../services/motion-presets.ts';
import {bottomNavigationViewport} from '../services/mobile-layout.ts';
import {normalizeCreditCard,cardBalances,allocateInvoicePayment,cardInvoice,cardCalendarEvents} from '../services/credit.ts';
import {getLayout} from '../services/layout-preferences.ts';
import {responsibleProgress} from '../services/responsible-progress.ts';
import {readNotificationPreferences} from '../services/notification-preferences.ts';
import {decodeSharedDebt} from '../services/shared-debt.ts';
import {searchFinance} from '../services/search.ts';

export async function startWorkspace({renderView}:{renderView:typeof import('../components/FinanceView').renderView}){
try{if(location.hash?.startsWith('#debt=')&&location.hash.length<4000)sessionStorage.setItem('plan12-pending-debt',location.hash);}catch{}
try{await window.planAuth.ready;}catch{location.replace('./login.html');return;}
if(!window.planAuth.hasAccess()){location.replace('./login.html');return;}
await window.planCloud?.prepare();
document.documentElement.classList.remove('auth-pending');
const localStorage=window.planAuth.storage;
document.addEventListener('error',e=>{if((e.target as HTMLElement).matches?.('.profile-photo img,.rail-avatar img,.nav-avatar img'))(e.target as HTMLElement).remove();},true);
document.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLButtonElement>('[data-a="profile-settings"]')){S.tab='x';draw();}if((e.target as HTMLElement).closest<HTMLButtonElement>('#legacyBackup')){const raw=window.localStorage.getItem('plan12workspace_v3');if(raw){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='dados-locais-anteriores.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}});
document.addEventListener('click',async e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('#accountSignOut');if(!button||button.disabled)return;button.disabled=true;try{await window.planCloud?.flush();await window.planAuth.signOut();}catch(err){button.disabled=false;showError(err);}});
document.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLElement>('#exportTaxes'))exportTaxData().catch(showError);});
installLegacyFinanceAdapter(window);
const viewContext:WorkspaceViewContext={get CART(){return CART},get CLOSED_REPORTS(){return CLOSED_REPORTS},get DEBTS(){return DEBTS},get GOAL(){return GOAL},get ICON(){return ICON},get M(){return M},get MAX_MONTHS(){return MAX_MONTHS},get S(){return S},get accountSettingsTab(){return accountSettingsTab},get accountSettingsView(){return accountSettingsView},get areaNavigation(){return areaNavigation},get areaViews(){return areaViews},get behaviorView(){return behaviorView},get brl(){return brl},get carbonRecords(){return carbonRecords},get chartMetric(){return chartMetric},get dailyBars(){return dailyBars},get dateLabel(){return dateLabel},get dateLong(){return dateLong},get debt(){return debt},get debtChart(){return debtChart},get debtInstallments(){return debtInstallments},get debtPaidCount(){return debtPaidCount},get debtRemainingCents(){return debtRemainingCents},get debtSchedule(){return debtSchedule},get dm(){return dm},get donut(){return donut},get entryFilter(){return entryFilter},get esc(){return esc},get goalChart(){return goalChart},get goalProjection(){return goalProjection},get inc(){return inc},get integrationsView(){return integrationsView},get investmentCategoryTile(){return investmentCategoryTile},get isBetaTester(){return isBetaTester},get isMonthClosed(){return isMonthClosed},get itemsInMonth(){return itemsInMonth},get lim(){return lim},get mbtn(){return mbtn},get monthComparison(){return monthComparison},get monthKeyForIndex(){return monthKeyForIndex},get monthLabelFromKey(){return monthLabelFromKey},get monthlyRatings(){return monthlyRatings},get offerSearchResult(){return offerSearchResult},get offersSearchView(){return offersSearchView},get periodChart(){return periodChart},get planCard(){return planCard},get profileIdentity(){return profileIdentity},get profileStars(){return profileStars},get purchaseReviewView(){return purchaseReviewView},get receiptsInMonth(){return receiptsInMonth},get renderOfferResult(){return renderOfferResult},get reportsView(){return reportsView},get shoppingPlanForm(){return shoppingPlanForm},get socialView(){return socialView},get spent(){return spent},get streamingPill(){return streamingPill},get sum(){return sum},get summaryMode(){return summaryMode},get supportProjectCard(){return supportProjectCard},get tiles(){return tiles},get topList(){return topList},get vCarbon(){return vCarbon},get vCards(){return vCards},get vCart(){return vCart},get vD(){return vD},get vDivision(){return vDivision},get vI(){return vI},get vOffers(){return vOffers},get vR(){return vR},get vSplit(){return vSplit}};
const engineContext:FinancialCalculationContext={get CATS(){return CATS},get CLOSED_REPORTS(){return CLOSED_REPORTS},get DEBTS(){return DEBTS},get GOAL(){return GOAL},get MAX_CENTS(){return MAX_CENTS},get MAX_MONTHS(){return MAX_MONTHS},get canonicalCategory(){return canonicalCategory},get debt(){return debt},get debtInstallments(){return debtInstallments},get debtPaidCount(){return debtPaidCount},get expenseBudgetCents(){return expenseBudgetCents},get goalMonthProjectionCents(){return goalMonthProjectionCents},get inc(){return inc},get isMonthClosed(){return isMonthClosed},get itemsInMonth(){return itemsInMonth},get lim(){return lim},get monthIndexFromDate(){return monthIndexFromDate},get monthKeyForIndex(){return monthKeyForIndex},get monthProjectionCents(){return monthProjectionCents},get monthlyExpenseDate(){return monthlyExpenseDate},get planSchedule(){return planSchedule},get receiptsInMonth(){return receiptsInMonth},get splitShares(){return splitShares},get toCents(){return toCents},get todayISO(){return todayISO}};
// FINANCE_CORE

const START_YEAR=2026,START_MONTH=9,MIN_DATE='2026-10-01';
const MONTH_ABBR=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CATS=['Gastos Essenciais','Gastos Variáveis','Gastos Fixos','Gastos Supérfluos','Investimentos'];
const PAY=['Pix','Débito','Cartão de crédito'];
const TITLES:Record<string,string>={f:'Análises',c:'Calendário',v:'Investimentos',r:'Resumo',i:'Entradas',d:'Compromissos',s:'Dividir conta',k:'Cartões',o:'Planejamento',e:'Carbono',x:'Configurações',u:'Você'};
const P=(d: React.ReactNode)=>((
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
    {d}
  </svg>
));
const ICON:Record<string,React.ReactNode>={
 v:P((<path d="M4 20h16M7 16v-4m5 4V9m5 7V5M5 8l5-3 4 1 5-4"></path>)),
 share:P(((
  <path d="M8 8H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-3M12 15V2m0 0L8 6m4-4 4 4"></path>
))),
 e:P((<path d="M20 3C9 3 3 8 5 15s14 7 15-12ZM5 20 16 9"></path>)),
 x:P(((
  <g transform="translate(1.5 1)">
    <path d="m9 3-.6 2.3-2 .9-2.2-.7-1.5 2.6L4.3 10v2l-1.6 1.9 1.5 2.6 2.2-.7 2 .9L9 19h3l.6-2.3 2-.9 2.2.7 1.5-2.6-1.6-1.9v-2l1.6-1.9-1.5-2.6-2.2.7-2-.9L12 3Z"></path>
    <circle cx="10.5" cy="11" r="3"></circle>
  </g>
))),
 r:P(((
  <>
    <path d="M12 3a9 9 0 1 0 9 9h-9V3z"></path>
    <path d="M15 3.6A9 9 0 0 1 20.4 9H15V3.6z"></path>
  </>
))),
 g:P(((
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="3"></rect>
    <path d="M3 10h18M6.5 15h4"></path>
  </>
))),
 i:P((<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19.5h14"></path>)),
 d:P(((
  <>
    <rect x="5" y="3" width="14" height="18" rx="3"></rect>
    <path d="M9 8h6M9 12h6M9 16h3"></path>
  </>
))),
 b:P((<path d="M3 9l9-5 9 5M5.5 9v8.5M10 9v8.5M14 9v8.5M18.5 9v8.5M3 20h18"></path>)),
 c:P(((
  <>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5"></rect>
    <path d="M7.5 3v4M16.5 3v4M4 9.5h16M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"></path>
  </>
))),
 u:P(((
  <>
    <circle cx="12" cy="8" r="4"></circle>
    <path d="M4 21a8 8 0 0 1 16 0"></path>
  </>
))),
 o:P(((
  <>
    <path d="M3 4h8l10 10-7 7L3 10z"></path>
    <circle cx="7" cy="8" r="1"></circle>
  </>
))),
 k:P((<path d="M3 4h3l2 12h11l2-9H7M9 20h.01M18 20h.01"></path>)),
 s:P(((
  <>
    <circle cx="7" cy="7" r="3"></circle>
    <circle cx="17" cy="7" r="3"></circle>
    <path d="M2 19v-2a5 5 0 0 1 10 0v2M12 19v-2a5 5 0 0 1 10 0v2"></path>
  </>
))),
 plus:P((<path d="M12 5v14M5 12h14"></path>)),
 chev:((
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M6 3l5 5-5 5"></path>
  </svg>
)),
 more:P(((
  <>
    <circle cx="5.5" cy="12" r="1.2"></circle>
    <circle cx="12" cy="12" r="1.2"></circle>
    <circle cx="18.5" cy="12" r="1.2"></circle>
  </>
))),
 left:P((<path d="M15 18l-6-6 6-6"></path>)),right:P((<path d="M9 18l6-6-6-6"></path>))
};
const brl=(n:unknown)=>(Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=(value:unknown)=>String(value??'');
const $=<S extends string>(s:S)=>document.querySelector(s) as WorkspaceElement<S>;
// Regras compartilhadas: todos os cálculos monetários usam centavos inteiros.
const MAX_MONTHS=240,MAX_CENTS=100000000000,MAX_RECORDS=10000,WORKSPACE_KEY='plan12workspace_v3',BACKUP_KEY='plan12backup_before_v3';
const LEGACY_KEYS=['plan12','plan12receipts','plan12lim','plan12goal','plan12debts','plan12monthCount','plan12profile','plan12splits','plan12closedReports','plan12inc','plan12offers','plan12cart','plan12schema'];
const pad=(n:unknown)=>String(n).padStart(2,'0');
function toCents(value:unknown){return core_toCents(engineContext,value);}
function parseMoney(value:unknown){
 let text=String(value??'').trim().replace(/^R\$\s*/,'');if(!text)return NaN;
 if(text.includes(',')){if(!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(text))return NaN;text=text.replace(/\./g,'').replace(',','.');}
 else if(!/^-?\d+(?:\.\d{1,2})?$/.test(text))return NaN;
 const [whole,frac='']=text.replace('-','').split('.');const cents=Number(whole)*100+Number(frac.padEnd(2,'0'));return isSafeInteger(cents)&&cents<=MAX_CENTS?(text[0]==='-'?-cents:cents):NaN;
}
function moneyInput(input:HTMLInputElement|null,{zero=false}={}){const cents=parseMoney(input?.value);if(!isSafeInteger(cents)||cents<(zero?0:1)){input?.focus();throw Error('Informe um valor válido, com no máximo duas casas decimais.');}return cents/100;}
const sum=(a:readonly {v:number}[])=>a.reduce((total,x)=>total+toCents(x.v),0)/100;
const monthKeyForIndex=(i:number)=>{const d=new Date(START_YEAR,START_MONTH+i,1);return`${d.getFullYear()}-${pad(d.getMonth()+1)}`;};
const monthDate=(i:number)=>`${monthKeyForIndex(i)}-01`;
function validDate(value:unknown):value is string{if(typeof value!=='string'||!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value))return false;const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d,12);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;}
const indexFromKey=(k:string)=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(k||'')))return-1;const [y,m]=k.split('-').map(Number);return(y-START_YEAR)*12+(m-1-START_MONTH);};
const monthIndexFromDate=(d:string)=>validDate(d)?indexFromKey(d.slice(0,7)):-1;
const supportedDate=(d:unknown):d is string=>validDate(d)&&monthIndexFromDate(d)>=0&&monthIndexFromDate(d)<MAX_MONTHS;
const monthLabelFromKey=(k:string)=>{const[y,m]=k.split('-').map(Number);return`${MONTH_ABBR[m-1]}/${String(y).slice(-2)}`;};
const dateLabel=(d:string)=>validDate(d)?`${Number(d.slice(8))} ${MONTH_ABBR[Number(d.slice(5,7))-1].toLowerCase()}`:'Data não informada';
const dateLong=(d:string)=>validDate(d)?new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}):'Data não informada';
const todayISO=()=>{const d=new Date();return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const defaultDateForMonth=(m:number)=>todayISO().slice(0,7)===monthKeyForIndex(m)&&supportedDate(todayISO())?todayISO():monthDate(m);
const issuedIds=new Set();
function newId(){let id;do{if((globalThis.crypto as Partial<Crypto>)?.randomUUID)id=crypto.randomUUID();else if((globalThis.crypto as Partial<Crypto>)?.getRandomValues){const bytes=crypto.getRandomValues(new Uint8Array(16));id='id-'+Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');}else id='id-'+Date.now().toString(36)+'-'+(++newId.counter)+'-'+Math.random().toString(36).slice(2);}while(issuedIds.has(id));issuedIds.add(id);return id;}newId.counter=0;
const MIG:Record<string,string>={'Fixos':'Gastos Fixos','Gastos fixos':'Gastos Fixos','Assinaturas':'Gastos Fixos','Alimentação':'Gastos Essenciais','Transporte':'Gastos Essenciais','Necessidades':'Gastos Essenciais','Essenciais':'Gastos Essenciais','Ajuda à mãe':'Gastos Essenciais','Compras do mês':'Gastos Essenciais','Aleatórios':'Gastos Variáveis','Outros':'Gastos Variáveis','Gastos aleatórios':'Gastos Variáveis','Imprevistos':'Gastos Variáveis','Lazer':'Gastos Supérfluos','Entretenimento':'Gastos Supérfluos'};
const canonicalCategory=(c:string|undefined)=>CATS.includes(c!)?c!:Object.hasOwn(MIG,c!)?MIG[c!]:'Gastos Variáveis';
const migrateExpenseCategory=(x:Expense)=>({...x,c:canonicalCategory(x.c),...(x.subscription===true||x.c==='Assinaturas'?{subscription:true}:{})});
function migrateReportCategories(report:ClosedReport){
 const expenses=report.expenses.map(migrateExpenseCategory),categories=CATS.map(name=>{const cents=report.categories.filter(x=>canonicalCategory(x.name)===name).reduce((n,x)=>n+x.cents,0);if(!isSafeInteger(cents)||cents<0)throw Error('Total de categoria inválido.');return {name,cents};});
 return {...report,expenses,categories};
}

const recovery:RecoveryRow[]=[],rawSource:Record<string,string>={};let readBlocked=false,storageBase:string|null=null,backupReady=false,noticeMessage='',noticeError=false;
function readRaw(key:string){try{const raw=localStorage.getItem(key);if(raw!==null)rawSource[key]=raw;return raw;}catch{readBlocked=true;noticeMessage='Não foi possível acessar os dados deste navegador. Recarregue antes de salvar.';noticeError=true;return null;}}
function parseRaw(key:string,fallback:unknown){const raw=rawSource[key];if(raw===undefined)return fallback;try{return JSON.parse(raw);}catch{recovery.push({key,reason:'JSON inválido',raw});return fallback;}}
const load=<T,>(key:string,fallback:T,ok:(value:T)=>unknown):T=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return ok(value)?value:fallback;}catch{return fallback;}};
function rejected(key:string,value:unknown,reason:string){recovery.push({key,reason,value});}
function oldAmount(value:unknown,max=MAX_CENTS){const n=Number(value);if(!Number.isFinite(n)||n<0)throw Error('Valor inválido');const cents=toCents(n);if(cents>max)throw Error('Valor fora do limite permitido.');if(Math.abs(n*100-cents)>0.00001)rejected('valor',value,'Valor antigo arredondado para centavos; original preservado no backup');return cents/100;}
function cleanWorkspace(raw:Partial<WorkspaceSnapshot>){
 const object=isObject,list=<T,>(x:T[]|undefined,key:string):T[]=>{if(!Array.isArray(x)){if(x!==undefined)rejected(key,x,'Lista inválida');return [];}if(x.length>MAX_RECORDS)rejected(key,x.slice(MAX_RECORDS),'Registros excedentes preservados para recuperação');return x.slice(0,MAX_RECORDS);};
 const state:WorkspaceSnapshot={items:[],receipts:[],debts:[],limits:[],goal:{v:0,e:0},profile:{name:''},splits:[],reports:{},monthCount:1,offers:[],cart:[],creditCards:[]},idCounts=new Map(),itemMap=new Map();
 const cleanRecords=(records:LedgerRecord[]|undefined,key:string):LedgerRecord[]=>list(records,key).flatMap(x=>{try{if(!object(x)||typeof x.d!=='string'||!x.d.trim())throw Error('Lançamento incompleto');const v=oldAmount(x.v);if(v<=0)throw Error('Valor deve ser positivo');const oldId=String(x.id??''),id=/^[\w-]{1,100}$/.test(oldId)&&!issuedIds.has(oldId)?oldId:newId();issuedIds.add(id);if(key==='items')idCounts.set(oldId,(idCounts.get(oldId)||0)+1);const date=supportedDate(x.date)?x.date:'';if(x.date&&!date)rejected(key,x,'Data inválida preservada como lançamento sem data');const legacyMonth=isInteger(x.legacyMonth!)?x.legacyMonth:isInteger(x.m)?x.m!:0;if(!date&&(legacyMonth<0||legacyMonth>=MAX_MONTHS))throw Error('Mês fora do intervalo');const record:LedgerRecord={id,d:x.d.trim().slice(0,240),v,date,...(!date?{legacyMonth}:{}),...(key==='items'?{c:canonicalCategory(x.c),...(x.subscription===true||x.c==='Assinaturas'?{subscription:true}:{}),p:includesValue(PAY,x.p)?x.p:x.p==='Cartão'?'Cartão de crédito':'Pix'}:{})};if(key==='items'&&record.p==='Cartão de crédito'&&/^[\w-]{1,100}$/.test(x.creditCardId||'')){record.creditCardId=x.creditCardId;record.creditPaid=x.creditPaid===true;if(isSafeInteger(x.creditPaidCents)&&x.creditPaidCents>=0&&x.creditPaidCents<=(isSafeInteger(x.creditChargeCents)&&x.creditChargeCents>0?x.creditChargeCents:Math.round(v*100)))record.creditPaidCents=x.creditPaidCents;if(isSafeInteger(x.creditChargeCents)&&x.creditChargeCents>0&&x.creditChargeCents<=MAX_CENTS)record.creditChargeCents=x.creditChargeCents;}if(x.recurrenceId){if(/^[\w-]{1,100}$/.test(String(x.recurrenceId))&&isInteger(x.recurrenceCount)&&x.recurrenceCount>1&&x.recurrenceCount<=MAX_MONTHS&&isInteger(x.recurrenceIndex)&&x.recurrenceIndex>=0&&x.recurrenceIndex<x.recurrenceCount&&supportedDate(x.recurrenceOrigin)&&monthIndexFromDate(x.recurrenceOrigin)+x.recurrenceIndex<MAX_MONTHS&&record.date===monthlyExpenseDate(x.recurrenceOrigin,x.recurrenceIndex))Object.assign(record,{recurrenceId:x.recurrenceId,recurrenceIndex:x.recurrenceIndex,recurrenceCount:x.recurrenceCount,recurrenceOrigin:x.recurrenceOrigin,...(x.recurrenceStopped?{recurrenceStopped:true}:{})});else rejected(key,x,'Metadados de repetição inválidos; gasto preservado sem repetição');} if(key==='receipts'&&includesValue(['salary','monthly','once'],x.incomeKind))record.incomeKind=x.incomeKind;if(key==='items'&&!itemMap.has(oldId))itemMap.set(oldId,record);return [record];}catch(e){rejected(key,x,errorDetails(e).message);return [];}});
 const cardIds=new Set();state.creditCards=list(raw.creditCards,'creditCards').slice(0,100).flatMap(x=>{try{const card=normalizeCreditCard(x);if(cardIds.has(card.id))throw Error('Cartão duplicado.');cardIds.add(card.id);return [card];}catch(e){rejected('creditCards',x,errorDetails(e).message);return [];}});
 state.items=cleanRecords(raw.items,'items') as Expense[];state.receipts=cleanRecords(raw.receipts,'receipts');
 state.debts=list(raw.debts,'debts').flatMap(x=>{try{if(!object(x)||typeof x.n!=='string'||!x.n.trim())throw Error('Dívida incompleta');const v=oldAmount(x.v);if(v<=0||!isInteger(x.p)||x.p<1||x.p>MAX_MONTHS||!isInteger(x.s)||x.s<0||x.s+x.p>MAX_MONTHS)throw Error('Parcelamento fora do intervalo');const paid=x.paid??0;if(!isInteger(paid)||paid<0||paid>x.p)throw Error('Parcelas pagas inválidas');return [{n:x.n.trim().slice(0,240),v,p:x.p,s:x.s,paid,...(/^sd-[a-f0-9-]{36}$/.test(x.sharedRef||'')?{sharedRef:x.sharedRef}:{})}];}catch(e){rejected('debts',x,errorDetails(e).message);return [];}});
 list(raw.limits,'limits').slice(0,MAX_MONTHS).forEach((record,i)=>{state.limits[i]={};if(!object(record))return;for(const [key,value]of Object.entries(record)){try{const category=canonicalCategory(key),v=oldAmount(value,MAX_CENTS*20);if(v>0)state.limits[i][category]=((toCents(state.limits[i][category]||0)+toCents(v))/100);}catch(e){rejected('limits',{i,key,value},errorDetails(e).message);}}});
 try{if(object(raw.goal)){const v=oldAmount(raw.goal.v);if(!isInteger(raw.goal.e)||raw.goal.e<0||raw.goal.e>=MAX_MONTHS)throw Error('Prazo inválido');state.goal={v,e:raw.goal.e};if(includesValue(['months','date'],raw.goal.mode)&&supportedDate(raw.goal.date)){Object.assign(state.goal,{e:monthIndexFromDate(raw.goal.date),mode:raw.goal.mode,date:raw.goal.date,months:isInteger(raw.goal.months)&&raw.goal.months>0&&raw.goal.months<=MAX_MONTHS?raw.goal.months:1});}}}catch(e){rejected('goal',raw.goal,errorDetails(e).message);}
 if(object(raw.profile)&&typeof raw.profile.name==='string')state.profile.name=raw.profile.name.slice(0,60);
 state.splits=list(raw.splits,'splits').flatMap(x=>{try{if(!object(x)||typeof x.name!=='string'||!x.name.trim()||!isSafeInteger(x.cents)||x.cents<1||x.cents>MAX_CENTS||!Array.isArray(x.people)||x.people.length<2||x.people.length>100||x.people.some(p=>typeof p!=='string'||!p.trim()||p.length>100))throw Error('Divisão inválida');const oldId=String(x.id??''),id=/^[\w-]{1,100}$/.test(oldId)&&!issuedIds.has(oldId)?oldId:newId();issuedIds.add(id);const ownIndex=x.ownIndex??0;if(!isInteger(ownIndex)||ownIndex<0||ownIndex>=x.people.length)throw Error('Participante inválido');const oldExpense=String(x.expenseId??''),expense=idCounts.get(oldExpense)===1?itemMap.get(oldExpense):null,expected=splitShares(x.cents,x.people.length,x.shareOffset??0)[ownIndex];let expenseId=expense?.id||null,status=x.status||'';if(expense&&(toCents(expense.v)!==expected||expense.splitId)){expenseId=null;status='Vínculo antigo inconsistente. A despesa foi preservada; refaça a divisão se necessário.';rejected('splits',x,status);}if(expenseId)expense.splitId=id;return [{id,name:x.name.trim().slice(0,240),cents:x.cents,shareOffset:x.shareOffset??0,people:x.people.map(p=>p.trim()),ownIndex,date:supportedDate(x.date)?x.date:'',expenseId,status,paid:x.people.map((_,i)=>x.paid?.[i]===true)}];}catch(e){rejected('splits',x,errorDetails(e).message);return [];}});
 if(object(raw.reports))for(const [key,r]of Object.entries(raw.reports)){try{if(indexFromKey(key)<0||indexFromKey(key)>=MAX_MONTHS||!object(r)||r.key!==key||![r.incomeCents,r.expenseCents,r.debtCents,r.balanceCents].every(Number.isSafeInteger)||!Array.isArray(r.categories)||!Array.isArray(r.expenses)||!Array.isArray(r.receipts)||!r.categories.every(c=>object(c)&&typeof c.name==='string'&&isSafeInteger(c.cents))||![...r.expenses,...r.receipts].every(t=>object(t)&&typeof t.d==='string'&&Number.isFinite(t.v)&&(!t.date||validDate(t.date))))throw Error('Relatório inválido');state.reports[key]=migrateReportCategories(r);}catch(e){rejected('reports',r,errorDetails(e).message);}}
 // Compras planejadas e ofertas usam centavos explícitos, inclusive nos backups.
 for(const key of ['cart','offers'] as const){const cleaned=list<Partial<ShoppingPlan&ShoppingOffer>>(raw[key],key).flatMap(x=>{try{return [validateShopping({...x,category:canonicalCategory(x.category||'')},key,true)];}catch(e){rejected(key,x,errorDetails(e).message);return [];}});if(key==='cart')state.cart=cleaned as ShoppingPlan[];else state.offers=cleaned as ShoppingOffer[];}
 const indices=[0,...state.items.map(x=>x.date?monthIndexFromDate(x.date):x.legacyMonth!),...state.receipts.map(x=>x.date?monthIndexFromDate(x.date):x.legacyMonth!),...state.debts.map(d=>d.s+d.p-1),...state.limits.map((l,i)=>Object.keys(l).length?i:0),state.goal.e];
 const stored=isInteger(raw.monthCount)&&raw.monthCount>0&&raw.monthCount<=MAX_MONTHS?raw.monthCount:1;state.monthCount=Math.max(stored,...indices.map(i=>i+1));return state;
}
function convertMoney(state:WorkspaceSnapshot,direction:'encode'|'decode'){const next=JSON.parse(JSON.stringify(state)),convert=direction==='encode'?toCents:(v: unknown)=>{return isSafeInteger(v)&&Math.abs(v)<=MAX_CENTS?v/100:NaN;};for(const key of ['items','receipts','debts'])for(const x of Array.isArray(next[key])?next[key]:[])if(x&&typeof x==='object')x.v=convert(x.v);for(const row of Array.isArray(next.limits)?next.limits:[])if(row&&typeof row==='object')for(const key of Object.keys(row))row[key]=direction==='encode'?toCents(row[key]):isSafeInteger(row[key])&&row[key]>=0&&row[key]<=MAX_CENTS*20?row[key]/100:NaN;if(next.goal)next.goal.v=convert(next.goal.v);return next;}
LEGACY_KEYS.forEach(readRaw);storageBase=readRaw(WORKSPACE_KEY);backupReady=readRaw(BACKUP_KEY)!==null;readRaw('plan12categories_before_v2');
let boot;
if(storageBase!==null){try{const record=JSON.parse(storageBase);if(record.schemaVersion!==3||record.moneyUnit!=='centavos'||!record.data)throw Error('Formato desconhecido');boot=cleanWorkspace(convertMoney(record.data,'decode'));}catch(e){readBlocked=true;noticeMessage='O arquivo de dados deste navegador precisa de recuperação. Exporte o backup antes de continuar.';noticeError=true;rejected(WORKSPACE_KEY,storageBase,errorDetails(e).message);boot=cleanWorkspace({});}}
else{boot=cleanWorkspace({items:parseRaw('plan12',[]),receipts:parseRaw('plan12receipts',[]),debts:parseRaw('plan12debts',[]),limits:parseRaw('plan12lim',[]),goal:parseRaw('plan12goal',{v:0,e:0}),profile:parseRaw('plan12profile',{name:''}),splits:parseRaw('plan12splits',[]),reports:parseRaw('plan12closedReports',{}),monthCount:parseRaw('plan12monthCount',1)});}
let LIM=boot.limits,GOAL=boot.goal,DEBTS=boot.debts,PROFILE=boot.profile,SPLITS=boot.splits,CLOSED_REPORTS=boot.reports,monthCount=Math.max(boot.monthCount,Math.min(MAX_MONTHS,monthIndexFromDate(todayISO())+1)),CART=boot.cart,OFFERS=boot.offers,CARDS=boot.creditCards;
let M:string[]=[],chartMetric='i',entryFilter='all';
function refreshMonths(){if(!isInteger(monthCount)||monthCount<1||monthCount>MAX_MONTHS)throw Error('Limite de '+MAX_MONTHS+' meses atingido.');M=Array.from({length:monthCount},(_,i)=>monthLabelFromKey(monthKeyForIndex(i)));while(LIM.length<monthCount)LIM.push({});}
refreshMonths();
const S={m:Math.min(Math.max(0,monthIndexFromDate(todayISO())),monthCount-1),tab:'r',goal:false,q:'',items:boot.items,receipts:boot.receipts,calDate:defaultDateForMonth(0),bank:false};
let transactionDepth=0,pendingSave=false,drawPending=false,saveNumber=0,allowClosedReset=false;let savedMonthBaseline=JSON.parse(JSON.stringify(snapshot()));
function snapshot(){return {items:S.items,receipts:S.receipts,debts:DEBTS,limits:LIM,goal:GOAL,profile:PROFILE,splits:SPLITS,reports:CLOSED_REPORTS,monthCount,cart:CART,offers:OFFERS,creditCards:CARDS};}
function restore(state:WorkspaceSnapshot){S.items=state.items;S.receipts=state.receipts;DEBTS=state.debts;LIM=state.limits;GOAL=state.goal;PROFILE=state.profile;SPLITS=state.splits;CLOSED_REPORTS=state.reports;monthCount=state.monthCount;CART=state.cart;OFFERS=state.offers;CARDS=state.creditCards||[];refreshMonths();S.m=Math.min(S.m,M.length-1);}
function isMonthClosed(m:number,reports=CLOSED_REPORTS,date=todayISO()){return m>=0&&(m<monthIndexFromDate(date)||!!reports?.[monthKeyForIndex(m)]);}
function requireOpenDate(date:string){if(!supportedDate(date)||isMonthClosed(monthIndexFromDate(date)))throw Error('Mês encerrado: disponível somente para visualização. Escolha um mês aberto.');}
function assertClosedUnchanged(before:WorkspaceSnapshot,after:WorkspaceSnapshot){
 if(allowClosedReset)return;
 const closed=(x:{date:string;legacyMonth?:number})=>isMonthClosed(itemMonthIndex(x),before.reports),canonical=(x:object)=>JSON.stringify(Object.fromEntries(Object.entries(x).filter(([k])=>!['creditPaid','creditPaidCents','recurrenceStopped','paid','status'].includes(k)).sort(([a],[b])=>a.localeCompare(b))));
 for(const key of ['items','receipts','splits'] as const){const fingerprint=(list:{date:string;legacyMonth?:number}[])=>(list||[]).filter(closed).map(canonical).sort();if(JSON.stringify(fingerprint(before[key]))!==JSON.stringify(fingerprint(after[key])))throw Error('Mês encerrado: os lançamentos estão disponíveis somente para visualização.');}
 for(let m=0;m<Math.max(before.limits?.length||0,after.limits?.length||0);m++)if(isMonthClosed(m,before.reports)&&canonical(before.limits?.[m]||{})!==canonical(after.limits?.[m]||{}))throw Error('Não é possível alterar limites de um mês encerrado.');
 for(const [key,report] of Object.entries(before.reports||{}))if(JSON.stringify(report)!==JSON.stringify(after.reports?.[key]))throw Error('O relatório de um mês encerrado não pode ser alterado.');
}
function writeStorage(key:string,text:string){try{localStorage.setItem(key,text);}catch{throw Error('Não foi possível salvar neste navegador. Libere espaço ou exporte um backup; a alteração não foi aplicada.');}}
function persist(){assertClosedUnchanged(savedMonthBaseline,snapshot());if(readBlocked)throw Error('Os dados precisam ser recuperados antes de salvar. Exporte o backup e recarregue.');const current=localStorage.getItem(WORKSPACE_KEY);if(current!==storageBase)throw Error('Os dados foram alterados em outra aba. Recarregue antes de salvar novamente.');if(!backupReady&&Object.keys(rawSource).some(k=>LEGACY_KEYS.includes(k))){writeStorage(BACKUP_KEY,JSON.stringify({createdAt:new Date().toISOString(),raw:rawSource}));backupReady=true;}if(storageBase&&JSON.parse(storageBase).categoryVersion!==2&&!localStorage.getItem('plan12categories_before_v2'))writeStorage('plan12categories_before_v2',storageBase);const record={schemaVersion:3,categoryVersion:2,moneyUnit:'centavos',data:convertMoney(snapshot(),'encode'),recovery:[...bootRecovery,...recovery]};const text=JSON.stringify(record);try{localStorage.setItem(WORKSPACE_KEY,text);}catch{throw Error('Não foi possível salvar neste navegador. Libere espaço ou exporte um backup; a alteração não foi aplicada.');}storageBase=text;savedMonthBaseline=JSON.parse(JSON.stringify(snapshot()));saveNumber++;globalThis.planCloud?.capture(text);globalThis.planFinanceChanged?.();}
const bootRecovery=storageBase!==null?(()=>{try{const data=JSON.parse(storageBase).recovery;return Array.isArray(data)?data:[];}catch{return [];}})():[];
function atomic<T>(action:()=>T):T{if(transactionDepth)return action();const before=JSON.parse(JSON.stringify(snapshot())),ui={m:S.m,calDate:S.calDate,tab:S.tab,goal:S.goal};transactionDepth=1;pendingSave=false;drawPending=false;let value;try{value=action();if(pendingSave){assertClosedUnchanged(before,snapshot());persist();}}catch(e){transactionDepth=0;pendingSave=false;drawPending=false;restore(before);Object.assign(S,ui);throw e;}transactionDepth=0;const render=drawPending;drawPending=false;if(render)draw();return value;}
function saveWorkspace(){if(transactionDepth){pendingSave=true;return;}atomic(()=>{pendingSave=true;});}
function emptyFinancialSnapshot(state:WorkspaceSnapshot){return {...state,items:[],receipts:[],debts:[],limits:Array.from({length:state.monthCount},()=>({})),goal:{v:0,e:Math.max(0,state.monthCount-1)},splits:[],reports:{},cart:[],offers:[],creditCards:[]};}
async function resetFinancialData(){
 if(window.planAuth.user&&['conflict','updates','loading','error'].includes(window.planCloud?.state.mode))throw Error('Resolva a sincronização antes de zerar os dados.');
 const previousRecovery=[...recovery],previousBoot=[...bootRecovery];
 try{allowClosedReset=true;atomic(()=>{recovery.length=0;bootRecovery.length=0;restore(emptyFinancialSnapshot(snapshot()));saveWorkspace();});}catch(error){recovery.push(...previousRecovery);bootRecovery.push(...previousBoot);throw error;}finally{allowClosedReset=false;}
 for(const key of [...LEGACY_KEYS,BACKUP_KEY,'plan12categories_before_v2','plan12carbon_v1','plan12notifications',DISMISSED_NOTIFICATIONS_KEY,'plan12cloudcopies_v1']){try{localStorage.removeItem?.(key);}catch{}}
 Object.keys(rawSource).forEach(key=>delete rawSource[key]);editPlanId='';purchaseReview=null;csvPreview=null;behaviorAdvice=null;behaviorError=null;renderNotifications();
 const result=await window.planCloud?.flush();
 try{await window.planClearTaxData?.()}catch{return 'Dados financeiros zerados. Não foi possível apagar as análises tributárias; tente novamente conectado.';}
 // Keep the confirmation component mounted until it can report completion.
 return window.planAuth.user&&result?.mode!=='synced'?'Dados zerados neste aparelho. A sincronização está pendente; confira a conexão e as configurações.':'Dados financeiros zerados.';
};
function put(key:string,value:unknown){if(['plan12appearance','plan12notifications'].includes(key)){try{localStorage.setItem(key,JSON.stringify(value));}catch{throw Error('Não foi possível salvar a aparência.');}return;}saveWorkspace();}
const saveI=saveWorkspace,saveReceipts=saveWorkspace,saveL=saveWorkspace,saveG=saveWorkspace,saveD=saveWorkspace,saveMonthCount=saveWorkspace;
function showNotice(message:string,error=false){noticeMessage=message;noticeError=error;const box=$('#appNotice');if(!box)return;box.hidden=!message;box.setAttribute('role',error?'alert':'status');renderView(box,message?((
  <>
    <span>{esc(message)}</span>
    {error || recovery.length || bootRecovery.length ? (
      <button className="btn g" data-a="backup">
        {'Backup'}
      </button>
    ) : (
      ''
    )}
    {error ? (
      <button className="btn g" data-a="reload">
        {'Recarregar'}
      </button>
    ) : (
      ''
    )}
  </>
)):'');}
function showError(error:unknown){showNotice(errorDetails(error).message||String(error),true);const panelStatus=$('#accountPanelStatus');if(panelStatus){panelStatus.hidden=false;panelStatus.textContent=errorDetails(error).message||String(error);}const sheet=$('#scrim .sheet');if(sheet){sheet.querySelectorAll<HTMLElement>('.progressive-fields').forEach(node=>node.dispatchEvent(new Event('plan-expand-details')));let box=$('#sheetError');if(!box){box=document.createElement('p');box.id='sheetError';box.className='bad';box.setAttribute('role','alert');sheet.append(box);}box.textContent=errorDetails(error).message||String(error);}}
function clearTransientError(){if(!readBlocked)showNotice(recovery.length||bootRecovery.length?'Alguns dados antigos precisaram de validação. Os originais foram preservados; exporte o backup para conferir a recuperação.':'',false);}
function safely(action: { (): void; (): void; (): void; (): void; (): void; (): void; (): void; (): void; (): void; }){try{const before=saveNumber,value=atomic(action);if(saveNumber>before)clearTransientError();return value;}catch(error){showError(error);draw();return false;}}
function exportBackup(){const bundle={kind:'financas-backup',schemaVersion:3,createdAt:new Date().toISOString(),workspace:{schemaVersion:3,categoryVersion:2,moneyUnit:'centavos',data:convertMoney(snapshot(),'encode')},raw:rawSource,recovery:[...bootRecovery,...recovery]};const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='financas-backup-'+todayISO()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function ensureIndex(idx:number){if(!isInteger(idx)||idx<0||idx>=MAX_MONTHS)throw Error('Use um período entre '+monthLabelFromKey(monthKeyForIndex(0))+' e '+monthLabelFromKey(monthKeyForIndex(MAX_MONTHS-1))+'.');if(idx+1>monthCount){monthCount=idx+1;refreshMonths();saveMonthCount();}}
function ensureDate(date:string){if(!supportedDate(date))throw Error('Data inválida ou fora dos períodos disponíveis.');ensureIndex(monthIndexFromDate(date));return true;}
function addNextMonth(){ensureIndex(monthCount);S.m=M.length-1;S.calDate=monthDate(S.m);draw();}
const itemMonthIndex=(i:{date?:string;legacyMonth?:number})=>i.date?monthIndexFromDate(i.date):i.legacyMonth??0;
const itemsInMonth=(m: number)=>isMonthClosed(m)&&CLOSED_REPORTS[monthKeyForIndex(m)]?CLOSED_REPORTS[monthKeyForIndex(m)].expenses:S.items.filter(i=>itemMonthIndex(i)===m);
const receiptsInMonth=(m: number)=>isMonthClosed(m)&&CLOSED_REPORTS[monthKeyForIndex(m)]?CLOSED_REPORTS[monthKeyForIndex(m)].receipts:S.receipts.filter(i=>itemMonthIndex(i)===m);
const inc=(m: number)=>sum(receiptsInMonth(m)),spent=(m: number)=>sum(itemsInMonth(m));
const lim=(m: number,c: string)=>(LIM[m]&&LIM[m][canonicalCategory(c)])||0;
const dm=(d: Debt,m: number)=>{if(d.p<=0||m<d.s+debtPaidCount(d)||m>=d.s+d.p)return 0;const cents=toCents(d.v);return (Math.floor(cents/d.p)+(m-d.s<cents%d.p?1:0))/100;};
const debt=(m: number)=>isMonthClosed(m)&&CLOSED_REPORTS[monthKeyForIndex(m)]?CLOSED_REPORTS[monthKeyForIndex(m)].debtCents/100:DEBTS.reduce((total,d)=>total+toCents(dm(d,m)),0)/100;
function expenseBudgetCents(m:number,extraCategory='',extraCents=0){return core_expenseBudgetCents(engineContext,m,extraCategory,extraCents);}
function monthProjectionCents(m:number,extraCategory='',extraCents=0,cutoff=''){return core_monthProjectionCents(engineContext,m,extraCategory,extraCents,cutoff);}
function goalMonthProjectionCents(m:number,extraCategory='',extraCents=0,cutoff=''){
 const invested=itemsInMonth(m).filter(x=>x.c==='Investimentos'&&(!cutoff||!x.date||x.date<=cutoff)).reduce((n,x)=>n+toCents(x.v),0);
 return monthProjectionCents(m,extraCategory,extraCents,cutoff)+invested+(extraCategory==='Investimentos'&&!(isMonthClosed(m)&&CLOSED_REPORTS[monthKeyForIndex(m)])?extraCents:0);
}
function goalInvestedCents(m:number){return core_goalInvestedCents(engineContext,m);}
function goalProjection(m:number){return core_goalProjection(engineContext,m);}
function saveGoal(input:Parameters<FinanceServices['goal']['save']>[0]){return atomic(()=>{if(isMonthClosed(S.m))throw Error('Mês encerrado: a meta pode ser ajustada em um mês aberto.');const amount=Number(input.amountCents);if(!isSafeInteger(amount)||amount<0||amount>MAX_CENTS)throw Error('Informe um valor válido para a meta.');const mode=input.mode==='date'?'date':'months',months=Number(input.months);let date=input.date;if(mode==='months'){if(!isInteger(months)||months<1||months>MAX_MONTHS)throw Error('Escolha um prazo de 1 a '+MAX_MONTHS+' meses.');date=monthlyExpenseDate(todayISO(),months);}if(!supportedDate(date)||date<todayISO())throw Error('Escolha uma data a partir de hoje, dentro do período disponível.');const e=monthIndexFromDate(date);ensureIndex(e);GOAL={v:amount/100,e,mode,date,months:mode==='months'?months:Math.max(1,e-monthIndexFromDate(todayISO())+(Number(date.slice(8))>Number(todayISO().slice(8))?1:0))};saveWorkspace();return GOAL;});}
function saveIncome(record:Omit<LedgerRecord,'id'>,id?:string|null,count=1){return atomic(()=>{const existing=id?S.receipts.find(x=>x.id===id):null;if(id&&!existing)throw Error('Entrada não encontrada.');requireOpenDate(record.date);if(existing)requireOpenDate(existing.date||monthDate(existing.legacyMonth||0));if(typeof record.d!=='string'||!record.d.trim()||record.d.length>240||!isSafeInteger(toCents(record.v))||toCents(record.v)<1||toCents(record.v)>MAX_CENTS||!isInteger(count)||count<1||count>MAX_MONTHS-monthIndexFromDate(record.date))throw Error('Revise o ganho, valor e quantidade de meses.');if(existing?.recurrenceId&&count!==1)throw Error('Edite apenas este recebimento ou cancele as próximas repetições.');if(S.receipts.length+count-(existing?1:0)>MAX_RECORDS)throw Error('Limite de entradas atingido.');const group=count>1?newId():null,created=[];for(let i=0;i<count;i++){const date=monthlyExpenseDate(record.date,i),metadata=group?{recurrenceId:group,recurrenceIndex:i,recurrenceCount:count,recurrenceOrigin:record.date}:{};ensureDate(date);const next={...record,d:record.d.trim(),date,incomeKind:includesValue(['salary','monthly','once'],record.incomeKind)?record.incomeKind:'once',...metadata};if(i===0&&existing){Object.assign(existing,next);delete existing.legacyMonth;created.push(existing);}else{const item={id:newId(),...next};S.receipts.push(item);created.push(item);}}saveWorkspace();return created;});}
function cancelFutureIncome(id:string){return atomic(()=>{const source=S.receipts.find(x=>x.id===id);if(!source?.recurrenceId)return 0;const cutoff=source.date>todayISO()?source.date:todayISO(),before=S.receipts.length;S.receipts=S.receipts.filter(x=>x.recurrenceId!==source.recurrenceId||x.date<=cutoff||isMonthClosed(itemMonthIndex(x)));const removed=before-S.receipts.length;if(removed){S.receipts.filter(x=>x.recurrenceId===source.recurrenceId).forEach(x=>x.recurrenceStopped=true);saveWorkspace();}return removed;});}

const mbtn=(k:string,id:string|number,label:string)=>((
  <button
    className="ib"
    data-a="menu"
    data-k={k}
    data-id={esc(id)}
    aria-haspopup="menu"
    aria-expanded="false"
    aria-label={label}
  >
    {ICON.more}
  </button>
));

function monthlyExpenseDate(anchor:string,offset:number){if(!supportedDate(anchor)||!isInteger(offset)||offset<0)throw Error('Data de repetição inválida.');const index=monthIndexFromDate(anchor)+offset;if(index>=MAX_MONTHS)throw Error('A repetição ultrapassa o período disponível.');const first=monthKeyForIndex(index),[year,month]=first.split('-').map(Number),day=Math.min(Number(anchor.slice(8)),new Date(year,month,0).getDate());return `${first}-${pad(day)}`;}
function saveExpense(record:Omit<Expense,'id'>,id?:string|null,count=1){return atomic(()=>{const existing=id?S.items.find(x=>x.id===id):null;if(id&&!existing)throw Error('Gasto não encontrado. Recarregue os dados.');if(existing?.splitId)throw Error('Altere a divisão para editar este gasto.');requireOpenDate(record.date);if(existing)requireOpenDate(existing.date||monthDate(existing.legacyMonth||0));record={...record,c:MIG[record.c]||record.c,...(record.c==='Assinaturas'?{subscription:true}:{})};if((existing?.creditPaidCents||0)>0&&(record.creditCardId!==existing!.creditCardId||record.p!==existing!.p||Math.round((record.creditChargeCents??record.v*100))<existing!.creditPaidCents!))throw Error('Este gasto tem pagamento registrado. Mantenha o cartão e um valor igual ou maior ao já pago.');if((existing?.creditPaidCents||0)>0&&record.creditCardId===existing!.creditCardId&&record.creditPaidCents===undefined)record.creditPaidCents=existing!.creditPaidCents!;if(record.p==='Cartão de crédito'&&!record.creditCardId)throw Error('Selecione um cartão cadastrado. Cadastre banco e limite em Crédito e investimentos.');if(!record.creditCardId){delete record.creditCardId;delete record.creditPaid;delete record.creditChargeCents;delete record.creditPaidCents;}if(record.creditCardId&&(!CARDS.some(c=>c.id===record.creditCardId&&(c.active||existing?.creditCardId===record.creditCardId&&count===1))||record.p!=='Cartão de crédito'))throw Error('Escolha um cartão ativo para este gasto.');if(!supportedDate(record.date)||typeof record.d!=='string'||!record.d.trim()||!CATS.includes(record.c)||!PAY.includes(record.p)||!isSafeInteger(toCents(record.v))||toCents(record.v)<1||toCents(record.v)>MAX_CENTS||record.d.trim().length>240)throw Error('Revise os dados do gasto.');if(!isInteger(count)||count<1||count>MAX_MONTHS-monthIndexFromDate(record.date))throw Error('Informe uma quantidade válida de meses, incluindo o mês inicial.');if(existing?.recurrenceId&&count!==1)throw Error('Este lançamento já faz parte de uma repetição mensal.');if(S.items.length+count-(existing?1:0)>MAX_RECORDS)throw Error('A repetição ultrapassa o limite de lançamentos.');const dates=Array.from({length:count},(_,i)=>monthlyExpenseDate(record.date,i)),group=count>1?newId():null,created: Expense[]=[];dates.forEach((date,i)=>{ensureDate(date);const metadata=group?{recurrenceId:group,recurrenceIndex:i,recurrenceCount:count,recurrenceOrigin:record.date}:{};if(i===0&&existing){Object.assign(existing,record,{date},metadata);if(!record.creditCardId){delete existing!.creditCardId;delete existing.creditPaid;delete existing.creditChargeCents;delete existing!.creditPaidCents;}delete existing.legacyMonth;created.push(existing);}else{const item={id:newId(),...record,date,...metadata,...(record.creditCardId?{creditPaid:i===0?!!record.creditPaid:false,creditPaidCents:i===0?(record.creditPaidCents||0):0}:{})};S.items.push(item);created.push(item);}});saveWorkspace();return created;});}
function cancelFutureExpenses(id:string){return atomic(()=>{const item=S.items.find(x=>x.id===id);if(!item?.recurrenceId)return 0;const cutoff=item.date>todayISO()?item.date:todayISO(),before=S.items.length;S.items=S.items.filter(x=>x.recurrenceId!==item.recurrenceId||x.date<=cutoff);const removed=before-S.items.length;if(removed){S.items.filter(x=>x.recurrenceId===item.recurrenceId).forEach(x=>x.recurrenceStopped=true);saveWorkspace();}return removed;});}
function creditCardOptions(selected=''){return ((
  <>
    <option value="">{'Selecione um cartão'}</option>
    {viewList(
      CARDS.filter((c) => c.active || c.id === selected).map((c) => (
        <option value={esc(c.id)} selected={c.id === selected}>
          {esc(c.name)}
          {' · Limite '}
          {brl(c.limitCents / 100)}
          {c.active ? '' : ' · Arquivado'}
        </option>
      )),
    )}
  </>
));}
function creditPlanGuide(plan:Pick<ShoppingPlan,'priceCents'|'shippingCents'>){if(!CARDS.some(c=>c.active))return '';const total=plan.priceCents+plan.shippingCents;return ((
  <div className="credit-plan-guide">
    <h3>{'Limite para esta compra'}</h3>
    {viewList(
      cardBalances(CARDS, S.items)
        .filter((c) => c.active)
        .map((c: { name: unknown; availableCents: number; excessCents: number }) => (
          <div className="report-line">
            <span>
              {esc(c.name)}
              <small>
                {'Disponível: '}
                {brl(c.availableCents / 100)}
              </small>
            </span>
            <b className={c.availableCents >= total ? 'ok' : 'bad'}>
              {c.availableCents >= total
                ? 'Cabe no limite'
                : 'Faltam ' + brl((total - c.availableCents + c.excessCents) / 100)}
            </b>
          </div>
        )),
    )}
    <p className="foot">
      {
        'Produto e frete comprometem o limite total, mesmo com parcelas ou divisão. O limite só é reservado após confirmar.'
      }
    </p>
  </div>
));}
function recurrenceFields(item:Partial<LedgerRecord>,date:string,repeatDefault=false){if(item.recurrenceId)return ((
  <p className="foot full">
    {item.recurrenceStopped
      ? 'Repetição mensal com próximas cobranças canceladas.'
      : `Repetição mensal · ${item.recurrenceIndex! + 1} de ${item.recurrenceCount} meses.`}
    {' Alterações aqui afetam somente este lançamento.'}
  </p>
));const max=MAX_MONTHS-monthIndexFromDate(date);if(max<2)return (<p className="foot full">{'Este é o último mês disponível para lançamentos.'}</p>);return ((
  <>
    <label className="chk full">
      <input id="sr" type="checkbox" aria-controls="repeatMonths" checked={repeatDefault} />
      {'Repetir mensalmente'}
    </label>
    <div id="repeatMonths" className="full" hidden={!repeatDefault}>
      <label htmlFor="sn">{'Meses (inclui este)'}</label>
      <input id="sn" type="number" min="2" max={max} step="1" value={Math.min(12, max)} />
      <p className="foot">
        {'O valor será registrado uma vez por mês. Em meses mais curtos, usamos o último dia disponível.'}
      </p>
    </div>
  </>
));}


function safeProductUrl(value:unknown){if(!value)return '';try{const u=new URL(String(value));if(u.protocol!=='https:'||u.username||u.password)throw 0;return u.href;}catch{throw Error('Use um link HTTPS válido.');}}
function validateShopping(x:Partial<ShoppingPlan&ShoppingOffer>,kind:'cart',loading?:boolean):ShoppingPlan;
function validateShopping(x:Partial<ShoppingPlan&ShoppingOffer>,kind:string,loading?:boolean):ShoppingPlan|ShoppingOffer;
function validateShopping(x:Partial<ShoppingPlan&ShoppingOffer>,kind:string,loading=false):ShoppingPlan|ShoppingOffer{
 if(x&&typeof x==='object')x={...x,category:MIG[x.category||'']||x.category};
 if(!x||typeof x!=='object'||typeof x.name!=='string'||!x.name.trim()||x.name.length>120)throw Error('Informe um nome de até 120 caracteres.');
 const money=(n:unknown,positive=false)=>{if(!isSafeInteger(n)||n<(positive?1:0)||n>MAX_CENTS)throw Error('Revise os valores, com até duas casas decimais.');return n;};
 const hasId=typeof x.id==='string'&&/^[\w-]{1,100}$/.test(x.id),id=hasId?x.id:newId();
 if(x.creditCardId&&!/^[\w-]{1,100}$/.test(x.creditCardId))throw Error('Cartão inválido.');if(x.creditCardId&&!loading&&!CARDS.some(c=>c.id===x.creditCardId&&c.active))throw Error('Escolha um cartão ativo para a compra.');const base={id,name:x.name.trim(),url:safeProductUrl(x.url),...(x.creditCardId?{creditCardId:x.creditCardId}:{})};if(!isSafeInteger(x.priceCents!+x.shippingCents!)||x.priceCents!+x.shippingCents!>MAX_CENTS)throw Error('O total ultrapassa o limite permitido.');
 if(loading){if(hasId&&issuedIds.has(id))throw Error('Identificador duplicado.');issuedIds.add(id);}
 if(kind==='cart'){
  if(!supportedDate(x.date)||!isInteger(x.installments)||x.installments<1||x.installments>24||monthIndexFromDate(x.date)+x.installments>MAX_MONTHS)throw Error('Revise a data e as parcelas (até 24).');
  if(!includesValue(['alta','normal','baixa'],x.priority)||!includesValue(CATS,x.category))throw Error('Revise a prioridade e a categoria.');
  if(x.people!==undefined&&(!Array.isArray(x.people)||x.people.length>99||x.people.some((n: string)=>typeof n!=='string'||!n.trim()||n.length>100)))throw Error('Informe até 99 outras pessoas.');
  if(x.status==='purchased'&&(!x.purchase||!supportedDate(x.purchase.date)||![x.purchase.totalCents,x.purchase.ownCents,x.purchase.targetCents].every(n=>isSafeInteger(n)&&n>=0&&n<=MAX_CENTS)))throw Error('Histórico de compra inválido');
  if(x.productGoal===true){if(!includesValue(['save','cash','credit'],x.goalMode))throw Error('Escolha como pretende comprar.');money(x.monthlyReserveCents);if(x.goalMode==='save'&&x.reservedCents!<x.priceCents!+x.shippingCents!&&x.monthlyReserveCents!<1)throw Error('Informe a reserva mensal.');if(x.goalMode==='credit'&&!x.creditCardId&&!loading)throw Error('Selecione um cartão para simular o crédito.');if(x.goalMode!=='credit'&&x.installments!==1)throw Error('Parcelas somente no crédito.');}
  return {...base,...(x.productGoal===true?{productGoal:true,goalMode:x.goalMode,monthlyReserveCents:x.monthlyReserveCents}:{}),image:safeProductUrl(x.image||''),specs:Array.isArray(x.specs)?x.specs.filter(v=>typeof v==='string').slice(0,8).map(v=>v.slice(0,180)):[],targetCents:money(x.targetCents,true),priceCents:money(x.priceCents,true),shippingCents:money(x.shippingCents),reservedCents:money(x.reservedCents),date:x.date,installments:x.installments,priority:x.priority,category:x.category,goal:!!x.goal,affiliate:!!x.affiliate,people:(x.people||[]).map((n: string)=>n.trim()),status:x.status==='purchased'?'purchased':'planned',purchase:x.status==='purchased'?x.purchase||null:null} as ShoppingPlan;
 }
 if(typeof x.planId!=='string'||typeof x.store!=='string'||!['Amazon','Mercado Livre','TikTok Shop','Outra loja'].includes(x.store)||typeof x.condition!=='string'||x.condition.length>240||!supportedDate(x.checkedOn))throw Error('Revise a loja, a compra vinculada e a data da consulta.');
 return {...base,planId:x.planId,store:x.store,priceCents:money(x.priceCents,true),shippingCents:money(x.shippingCents),condition:x.condition.trim(),checkedOn:x.checkedOn,affiliate:!!x.affiliate} as ShoppingOffer;
}
function saveShopping(record:Partial<ShoppingPlan>,kind:string){if(kind!=='cart')throw Error('Ofertas estará disponível após a integração.');return atomic(()=>{const list=CART,old=record.id?list.find(x=>x.id===record.id):null;if(record.id&&!old)throw Error('Registro não encontrado.');if(old?.status==='purchased')throw Error('Uma compra confirmada não pode ser alterada aqui.');if(!old&&list.length>=MAX_RECORDS)throw Error('Limite de registros atingido.');const next=validateShopping({...record,id:old?.id||newId()},'cart');planSchedule(next);if(old){Object.assign(old,next);if(!next.creditCardId)delete old.creditCardId;}else list.push(next);saveWorkspace();return next;});}
function planSchedule(plan:PurchasePlan){return core_planSchedule(engineContext,plan);}
function planProjection(plan:PurchasePlan){return core_planProjection(engineContext,plan);}
function confirmPlannedPurchase(id:string|undefined,confirmed:boolean,expected:string|undefined,selectedCard?:string){return atomic(()=>{
 if(confirmed!==true)throw Error('Confirme a compra antes de registrar os gastos.');const plan=CART.find(x=>x.id===id);if(!plan||plan.status!=='planned')throw Error('Esta compra já foi confirmada ou removida.');if(expected!==JSON.stringify(plan))throw Error('O planejamento mudou. Revise a compra novamente.');
 if(selectedCard!==undefined){if(selectedCard&&!CARDS.some(c=>c.id===selectedCard&&c.active))throw Error('Escolha um cartão ativo para a compra.');plan.creditCardId=selectedCard;}if(plan.installments>1&&!plan.creditCardId)throw Error('Selecione um cartão cadastrado para a compra parcelada.');
 const schedule=planSchedule(plan);if(S.items.length+schedule.length>MAX_RECORDS||plan.people.length&&SPLITS.length+schedule.length>MAX_RECORDS)throw Error('Limite de registros atingido.');
 const cardExpenses: { expense: Expense|{ id: string; d: string; v: number; c: string; p: string; date: string; }; totalCents: number; }[]=[];schedule.forEach((x,i)=>{ensureDate(x.date);const d=plan.name+(schedule.length>1?' · '+(i+1)+'/'+schedule.length:'');if(plan.people.length){const split=registerSplit(d,x.totalCents,plan.people,x.date,x.shareOffset),expense=S.items.find(e=>e.id===split.expenseId);if(expense){expense.c=plan.category;expense.p=plan.installments>1?'Cartão de crédito':'Pix';cardExpenses.push({expense,totalCents:x.totalCents});}}else{const expense={id:newId(),d,v:x.cents/100,c:plan.category,p:plan.installments>1?'Cartão de crédito':'Pix',date:x.date};S.items.push(expense);cardExpenses.push({expense,totalCents:x.totalCents});}});
 if(plan.creditCardId){if(!CARDS.some(c=>c.id===plan.creditCardId&&c.active))throw Error('O cartão foi arquivado. Edite a compra antes de confirmar.');const unrepresented=schedule.reduce((n,x)=>n+x.totalCents,0)-cardExpenses.reduce((n,x)=>n+x.totalCents,0);for(const [index,{expense,totalCents}] of cardExpenses.entries())Object.assign(expense,{p:'Cartão de crédito',creditCardId:plan.creditCardId,creditPaid:false,creditChargeCents:totalCents+(index===0?unrepresented:0)});}plan.status='purchased';plan.purchase={date:todayISO(),totalCents:plan.priceCents+plan.shippingCents,ownCents:schedule.reduce((n,x)=>n+x.cents,0),targetCents:plan.targetCents};saveWorkspace();return plan;
 });}

function tiles(m:number,it:Expense[]){
 return viewList(CATS.map(c=>{const records=it.filter(i=>i.c===c),value=sum(records),limit=lim(m,c),valueCents=Math.round(value*100),limitCents=Math.round(limit*100),pct=limitCents?valueCents*100/limitCents:0,reached=limitCents>0&&valueCents>=limitCents,percent=(Math.floor(pct*10+1e-9)/10).toLocaleString('pt-BR',{maximumFractionDigits:1}),status=limit?(reached?(value>limit?'Acima':'No limite'):percent+'% usado'):'Sem limite';if(c==='Investimentos')return '';return ((
  <div className="category-gauge-card">
    <div className="category-line" aria-label={String(esc(c)) + ': ' + String(brl(value))}>
      <span className="category-name">{categoryLabel(c)}</span>
      <span className="category-value">
        {brl(value)}
        {limit ? (
          <small>
            {' / '}
            {brl(limit)}
          </small>
        ) : (
          ''
        )}
      </span>
    </div>
    <div
      data-progress-gauge=""
      data-value={pct}
      data-label={esc(c)}
      data-status={limit ? (reached ? status : 'Usado') : 'Sem limite'}
      data-indicator-key={'category:' + String(esc(c))}
      data-known={!!limit}
      data-attention={reached}
      data-limit={reached}
    >
      <span className={'category-track' + String(reached ? ' is-limit' : '')} aria-hidden="true">
        <i style={{ width: String(Math.max(0, Math.min(100, pct))) + '%' }}></i>
        <span className="category-status">{status}</span>
      </span>
    </div>
    {categoryExpenseDetails(records)}
  </div>
));}));
}

function investmentCategoryTile(m:number,records:Expense[],value:number,limit:number){return ((
  <section className="card category-gauge-card investment-goal-card" aria-label="Investimentos e metas">
    <div className="category-line" aria-label={'Investimentos no mês: ' + String(brl(value))}>
      <span className="category-name">{'Investimentos'}</span>
      <span className={'category-value' + String(limit && value >= limit ? ' bad' : '')}>
        {'No mês · '}
        {brl(value)}
        {limit ? (
          <small>
            {' / limite '}
            {brl(limit)}
          </small>
        ) : (
          ''
        )}
      </span>
    </div>
    {investmentGoalView(m)}
    {categoryExpenseDetails(records)}
  </section>
));}
function investmentGoalView(m:number){const invested=goalInvestedCents(m),target=toCents(GOAL.v),pct=target?invested/target*100:0;return ((
  <>
    <div
      data-progress-gauge=""
      data-value={pct}
      data-label="Meta de investimentos"
      data-status={!target ? 'Sem meta' : pct >= 100 ? 'Meta atingida' : 'Da meta'}
      data-known={!!target}
    >
      <span className="habit-track">
        <i style={{ width: String(Math.min(100, pct)) + '%' }}></i>
      </span>
    </div>
    <div className="investment-goal-summary">
      <div>
        <span>{'Investido até o mês'}</span>
        <strong>{brl(invested / 100)}</strong>
      </div>
      {target ? (
        <p className="foot">
          {'Meta '}
          {brl(GOAL.v)}
          {' · '}
          {GOAL.date ? dateLabel(GOAL.date) : M[GOAL.e]}
        </p>
      ) : (
        <p className="foot">{'Defina uma meta para acompanhar os aportes.'}</p>
      )}
      <button type="button" className="btn g" data-a="goal" data-show-goal="true">
        {isMonthClosed(m) ? 'Ver meta' : S.goal ? 'Ver meta' : GOAL.v > 0 ? 'Editar meta' : 'Definir meta'}
      </button>
    </div>
  </>
));}
function categoryExpenseDetails(records:Expense[]){
 if(!records.length)return '';
 const row=(x: { d: unknown; v: unknown; })=>((
  <li>
    <span className="category-expense-name" title={esc(x.d)}>
      {esc(
        String(x.d || 'Gasto')
          .trim()
          .replace(/\s+/g, ' '),
      )}
    </span>
    <b>{brl(x.v)}</b>
  </li>
));
 return ((
  <>
    <ul className="category-expenses" aria-label="Gastos da categoria">
      {viewList(records.slice(0, 2).map(row))}
    </ul>
    {records.length > 2 ? (
      <details className="category-expenses-more">
        <summary>
          {'Mais '}
          {records.length - 2}
        </summary>
        <ul className="category-expenses">{viewList(records.slice(2).map(row))}</ul>
      </details>
    ) : (
      ''
    )}
  </>
));
}

const categoryLabel=(c:string)=>c;
const categoryPercent=(value:number,total:number)=>value>0&&value/total*100<1?'Menos de 1%':value<total&&value/total*100>99?'Mais de 99%':Math.round(value/total*100)+'%';
const mf=(v:number)=>v.toLocaleString('pt-BR',{notation:Math.abs(v)>=1000?'compact':'standard',maximumFractionDigits:1});

function donut(it:Expense[]){
 const T=sum(it);if(!T)return((
  <p className="mut" style={{ margin: '0' }}>
    {'Sem gastos neste mês.'}
  </p>
));
 const rows=CATS.map((c,i)=>({c,i,g:sum(it.filter(x=>x.c===c))})).filter(r=>r.g>0),R=52,C=2*Math.PI*R;let off=0;
 const seg=viewList(rows.map(r=>{const len=r.g/T*C,e=((
  <circle
    cx="70"
    cy="70"
    r={R}
    fill="none"
    strokeWidth="22"
    strokeDasharray={String(Math.max(0, len - 2).toFixed(2)) + ' ' + String(C.toFixed(2))}
    strokeDashoffset={(-off).toFixed(2)}
    transform="rotate(-90 70 70)"
    style={{ stroke: 'var(--c' + String(r.i) + ')' }}
  ></circle>
));off+=len;return e}));
 return((
  <div className="dn">
    <svg
      viewBox="0 0 140 140"
      role="img"
      aria-label={'Distribuição dos gastos de ' + String(M[S.m]) + ' por categoria'}
    >
      {seg}
      <text x="70" y="66" textAnchor="middle" fontSize="11" style={{ fill: 'var(--lb2)' }}>
        {'Total'}
      </text>
      <text x="70" y="86" textAnchor="middle" fontSize="14" fontWeight="700" style={{ fill: 'var(--lb)' }}>
        {Math.abs(T) >= 10000 ? mf(T) : brl(T)}
      </text>
    </svg>
    <div className="dl">
      {viewList(
        rows.map((r) => (
          <div className="item">
            <span className="dot" style={{ background: 'var(--c' + String(r.i) + ')' }}></span>
            <span>{r.c}</span>
            <b>{categoryPercent(r.g, T)}</b>
          </div>
        )),
      )}
    </div>
  </div>
));
}
function topList(it:Expense[]){const r=[...it].sort((a,b)=>b.v-a.v).slice(0,5);if(!r.length)return((
  <p className="mut" style={{ margin: '0' }}>
    {'Sem gastos neste mês.'}
  </p>
));return viewList(r.map((x,i)=>((
  <div className="tp">
    <div className="row">
      <span className="rk">{i + 1}</span>
      <span style={{ flex: '1', minWidth: '0' }}>
        {esc(x.d)}
        <span className="foot" style={{ display: 'block' }}>
          {esc(x.c)}
          {x.date ? ' · ' + dateLabel(x.date) : ''}
        </span>
      </span>
      <b>{brl(x.v)}</b>
    </div>
    <div className="hb">
      <i style={{ width: String((x.v / r[0].v) * 100) + '%', opacity: 1 - i * 0.14 }}></i>
    </div>
  </div>
))));}
function vR(){return rendervR(viewContext);}

function vI(){return rendervI(viewContext);}
function debtInstallments(d:Debt){return core_debtInstallments(engineContext,d);}
function debtPaidCount(d:Debt){return core_debtPaidCount(engineContext,d);}
function debtRemainingCents(d:Debt){return core_debtRemainingCents(engineContext,d);}
function debtSchedule(start:number){
 const open=DEBTS.filter(d=>debtRemainingCents(d)>0),payments=new Map();let last=start;
 open.forEach(d=>debtInstallments(d).forEach((value,j)=>{if(j<debtPaidCount(d))return;const month=Math.max(start,d.s+j);payments.set(month,(payments.get(month)||0)+value);last=Math.max(last,month);}));
 let balance=open.reduce((total,d)=>total+debtRemainingCents(d),0);const rows=[{m:start,v:balance}];
 if(!open.length)return rows;
 for(let month=start;month<=last;month++){balance=Math.max(0,balance-(payments.get(month)||0));rows.push({m:month+1,v:balance});}
 return rows;
}
function debtChart(){
 const rows=debtSchedule(S.m),max=Math.max(1,...rows.map(x=>x.v)),W=640,H=214,L=46,R=20,T=20,B=32,X=(i: number)=>L+(W-L-R)*(rows.length===1?.5:i/(rows.length-1)),Y=(v: number)=>T+(H-T-B)*(1-v/max),path=rows.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x.v).toFixed(1)).join(' ');
 return ((
  <svg
    className="debt-chart"
    viewBox={'0 0 ' + String(W) + ' ' + String(H)}
    role="img"
    aria-label={
      'Projeção das dívidas em aberto: de ' +
      String(brl(rows[0].v / 100)) +
      ' até ' +
      String(brl(rows.at(-1)!.v / 100)) +
      '.'
    }
  >
    {viewList(
      [0, 0.5, 1].map((f) => (
        <>
          <line x1={L} x2={W - R} y1={Y(max * f)} y2={Y(max * f)} stroke="var(--sep)" strokeWidth=".5"></line>
          <text x={L - 6} y={Y(max * f) + 3} textAnchor="end" fontSize="10" fill="var(--lb2)">
            {mf((max * f) / 100)}
          </text>
        </>
      )),
    )}
    <path d={path} fill="none" stroke="var(--tintT)" strokeWidth="2.5" strokeLinejoin="round"></path>
    {viewList(
      rows.map((x, i) => (
        <>
          <circle
            cx={X(i)}
            cy={Y(x.v)}
            r={i === 0 || i === rows.length - 1 ? 4 : 2}
            fill="var(--tintT)"
          ></circle>
          {i % Math.max(1, Math.ceil(rows.length / 7)) === 0 || i === rows.length - 1 ? (
            <text x={X(i)} y={H - 7} textAnchor="middle" fontSize="10" fill="var(--lb2)">
              {i === 0 ? 'Atual' : monthLabelFromKey(monthKeyForIndex(x.m - 1))}
            </text>
          ) : (
            ''
          )}
        </>
      )),
    )}
  </svg>
));
}
function vD(){return rendervD(viewContext);}
function financeToolsView(){return ((
  <section className="card">
    <h2>{'Importar CSV'}</h2>
    <p className="mut">{'Colunas: data, descrição, valor e tipo (opcional). Revise antes de importar.'}</p>
    <label htmlFor="csvConvention">{'Como interpretar os valores, se não houver coluna tipo?'}</label>
    <select id="csvConvention">
      {viewList(
        [
          ['', 'Escolha uma opção'],
          ['signed', 'Positivos são entradas; negativos são gastos'],
          ['expense', 'Todos os valores são gastos'],
          ['income', 'Todos os valores são entradas'],
        ].map(([v, l]) => (
          <option value={v} selected={csvConvention === v}>
            {l}
          </option>
        )),
      )}
    </select>
    <label htmlFor="csv">{'Arquivo CSV (até 500 KB)'}</label>
    <input type="file" id="csv" accept=".csv,text/csv" data-file-name={esc(csvPreview?.sourceName || '')} />
    <p className="foot" id="csvm" role="status"></p>
    {csvPreviewView()}
  </section>
));}
function totalsByDate(){const map:Record<string,{date:string;spent:number;income:number;count:number;expenseCount?:number}>={};for(const [list,type]of [[itemsInMonth(S.m),'spent'],[receiptsInMonth(S.m),'income']] as const)for(const x of list){if(!x.date||monthIndexFromDate(x.date)!==S.m)continue;map[x.date]??={date:x.date,spent:0,income:0,count:0};map[x.date][type]+=toCents(x.v);map[x.date].count++;if(type==='spent')map[x.date].expenseCount=(map[x.date].expenseCount||0)+1;}for(const x of Object.values(map)){x.spent/=100;x.income/=100;}return map;}
function calendarDayLabel(iso:string,expense:number,income:number){return`${dateLong(iso)}. Gastos: ${brl(expense)}. Entradas: ${brl(income)}.`;}
function vC(){
 const key=monthKeyForIndex(S.m),[year,month]=key.split('-').map(Number),first=new Date(year,month-1,1),offset=(first.getDay()+6)%7,days=new Date(year,month,0).getDate(),details=totalsByDate();
 if(!S.calDate||S.calDate.slice(0,7)!==key)S.calDate=monthDate(S.m);
 const cardEvents=cardCalendarEvents(CARDS,S.items,key),selected=S.calDate,dayNums=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
 let cells=viewList(dayNums.map(d=>(<div className="cal-weekday">{d}</div>)));
 for(let i=0;i<offset;i++)cells=viewGroup(cells,(<div className="cal-empty" aria-hidden="true"></div>));
 for(let day=1;day<=days;day++){
  const iso=`${key}-${pad(day)}`,d=details[iso]||{spent:0,income:0,count:0},isSel=iso===selected,hasExpense=d.spent>0,hasIncome=d.income>0;
  cells=viewGroup(cells,((
  <button
    className={
      'cal-day' +
      String(isSel ? ' selected' : '') +
      String(hasExpense ? ' has-exp' : '') +
      String(hasIncome ? ' has-inc' : '')
    }
    data-a="calday"
    data-date={iso}
    aria-pressed={isSel}
    aria-label={esc(
      calendarDayLabel(iso, d.spent, d.income) +
        (cardEvents
          .filter((x) => x.date === iso)
          .map((x) => x.label)
          .join('. ')
          ? ' ' +
            cardEvents
              .filter((x) => x.date === iso)
              .map((x) => x.label)
              .join('. ')
          : ''),
    )}
  >
    <span className="cal-number">{day}</span>
    <span className="cal-dots">
      {hasExpense ? <i className="expense-dot" aria-hidden="true"></i> : ''}
      {hasIncome ? <i className="income-dot" aria-hidden="true"></i> : ''}
      {cardEvents.some((x) => x.date === iso) ? <i className="card-date-dot" aria-hidden="true"></i> : ''}
    </span>
  </button>
)));
 }
 const dayExpenses=itemsInMonth(S.m).filter(x=>x.date===selected),dayReceipts=receiptsInMonth(S.m).filter(x=>x.date===selected),spentDay=sum(dayExpenses),incomeDay=sum(dayReceipts);
 const selectedCardEvents=cardEvents.filter(x=>x.date===selected),eventRows=viewList(selectedCardEvents.map(x=>((
  <div className="calendar-event-row">
    <span>
      <strong>{esc(x.label)}</strong>
      <small>
        {x.kind === 'best'
          ? 'Estimativa pelo fechamento informado'
          : x.kind === 'payment'
            ? 'Pagamento confirmado manualmente'
            : x.kind === 'due'
              ? 'Saldo registrado, sem duplicar gastos'
              : 'Data informada no cartão'}
      </small>
    </span>
    {x.amountCents != null ? <b>{brl(x.amountCents / 100)}</b> : ''}
  </div>
))));
 const activities:{type:string;label:string;v:number;c?:string;p?:string}[]=[...dayExpenses.map(x=>({type:'Gasto',label:x.d,v:x.v,c:x.c,p:x.p})),...dayReceipts.map(x=>({type:'Entrada',label:x.d,v:x.v}))];
 const activityRows=viewList(activities.map(x=>((
  <div className="item">
    <span style={{ minWidth: '0' }}>
      <span style={{ display: 'block' }}>{esc(x.label)}</span>
      <span className="foot">
        {x.type}
        {x.c ? ' · ' + esc(x.c) : ''}
        {x.p ? ' · ' + esc(x.p) : ''}
      </span>
    </span>
    <b className={x.type === 'Entrada' ? 'ok' : 'bad'}>
      {x.type === 'Entrada' ? '+' : '−'} {brl(x.v)}
    </b>
  </div>
))))||((
  <p className="mut" style={{ margin: '0' }}>
    {'Nenhum lançamento nesta data.'}
  </p>
));
 const ranking=Object.values(details).filter(x=>x.spent>0).sort((a,b)=>b.spent-a.spent).slice(0,5);
 const rankRows=viewList(ranking.map((x,i)=>((
  <button className="lrow" data-a="calday" data-date={x.date}>
    <span>
      <span style={{ display: 'block' }}>
        {i + 1}
        {'. '}
        {dateLong(x.date)}
      </span>
      <span className="foot">
        {x.expenseCount || 0}
        {' gasto(s) registrado(s)'}
      </span>
    </span>
    <b className="bad">{brl(x.spent)}</b>
    {ICON.chev}
  </button>
))))||((
  <p className="mut" style={{ margin: '0' }}>
    {'Sem registros.'}
  </p>
));
 return((
  <>
    <section className="card calendar-card">
      <div className="row" style={{ marginBottom: '16px' }}>
        <div>
          <div className="mut">{'Calendário de movimentações'}</div>
          <h2 style={{ margin: '4px 0 0' }}>
            {dateLong(monthDate(S.m)).replace('1 de ', '').replace(' de ', ' de ')}
          </h2>
        </div>
        <div className="cal-nav">
          <button className="ib" data-a="prevmonth" aria-label="Mês anterior" disabled={S.m === 0}>
            {ICON.left}
          </button>
          <button
            className="ib"
            data-a="nextmonth"
            aria-label="Próximo mês"
            disabled={S.m === MAX_MONTHS - 1}
          >
            {ICON.right}
          </button>
        </div>
      </div>
      <div className="cal-grid">{cells}</div>
      <div className="cal-legend">
        <span>
          <i className="expense-dot"></i>
          {' Dia com gasto'}
        </span>
        <span>
          <i className="income-dot"></i>
          {' Dia com entrada'}
        </span>
        <span>
          <i className="card-date-dot"></i>
          {' Cartão'}
        </span>
      </div>
      <p className="foot" style={{ margin: '12px 0 0' }}></p>
    </section>
    <section className="card">
      <div className="mut">{'Dia selecionado'}</div>
      <h2 style={{ marginTop: '4px' }}>{dateLong(selected)}</h2>
      <div className="kpis cal-kpis">
        <div className="kpi">
          <div className="foot">{'Total gasto'}</div>
          <div className="kv bad">{brl(spentDay)}</div>
        </div>
        <div className="kpi">
          <div className="foot">{'Total de entradas'}</div>
          <div className="kv ok">{brl(incomeDay)}</div>
        </div>
      </div>
      <div className="row" style={{ marginBottom: '8px' }}>
        <h2>{'Lançamentos do dia'}</h2>
        <div className="row" style={{ gap: '4px' }}>
          <button
            type="button"
            className="ib"
            data-a="sheet"
            data-k="launch"
            data-date={selected}
            aria-label="Adicionar lançamento nesta data"
          >
            {ICON.plus}
          </button>
        </div>
      </div>
      {eventRows}
      {activities.length || !selectedCardEvents.length ? activityRows : ''}
    </section>
    {ranking.length ? (
      <section className="card">
        <h2>{'Dias de maior gasto'}</h2>
        {rankRows}
      </section>
    ) : (
      ''
    )}
  </>
));
}
var suspendedAccountPanel:string|null=null;var accountPanel:string|null=null,accountSettingsTab='account',overlayOpener:Element|null=null;
var renderedRoute:string|null=null,committingRoute=false;
var areaViews:Record<string,string>={commitments:'debts',planning:'purchases',analysis:'taxes'};
function selectAreaView(value:string){const next=resolveAreaView(value,getLayout().sections);if(!next)return false;areaViews[next.area]=next.view;S.tab=next.tab;return true;}
function areaNavigation(area:string,label:string){return ((
  <div className="area-toolbar">
    <div className="segments area-switch" aria-label={label}>
      {viewList(
        availableViews(area, getLayout().sections).map(([key, name]) => (
          <button
            type="button"
            data-area-view={String(area) + ':' + String(key)}
            aria-pressed={areaViews[area] === key}
          >
            {name}
          </button>
        )),
      )}
    </div>
  </div>
));}
function commitmentsView(){return rendercommitmentsView(viewContext);}
function planningView(){return renderplanningView(viewContext);}
function analysisView(){return renderanalysisView(viewContext);}
function draw(){
 globalThis.planFinanceChanged?.();
 if(S.tab==='k'){areaViews.commitments='cards';S.tab='d';}
 if(S.tab==='s'){areaViews.commitments='friends';S.tab='d';}
 if(S.tab==='e'){areaViews.analysis='carbon';S.tab='f';}
 for(const area of Object.keys(areaViews)){const views=availableViews(area,getLayout().sections);if(!views.some(([key])=>key===areaViews[area]))areaViews[area]=views[0][0];}
 const requestedPanel=S.tab==='u'?'profile':S.tab==='x'?'settings':S.tab==='c'&&getLayout().sections.calendar?'calendar':null;if(['u','x','c'].includes(S.tab))S.tab='r';
 if(transactionDepth){drawPending=true;return;}
 const nextRoute=S.tab+':'+(S.tab==='i'?'entries':S.tab==='d'?areaViews.commitments:S.tab==='o'?areaViews.planning:S.tab==='f'?areaViews.analysis:summaryMode);
 if(!requestedPanel&&renderedRoute!==null&&nextRoute!==renderedRoute&&!committingRoute&&window.planRouteMotion){window.planRouteMotion.run(()=>{committingRoute=true;try{draw()}finally{committingRoute=false}});return;}
 renderedRoute=nextRoute;
 $('#summaryOptions')?.remove();
 closeCompletedMonths();
 showNotice(noticeMessage,noticeError);
 $('#currentMonth').textContent=M[S.m];$('#currentMonth').hidden=true;const monthSelect=$('#mes');if(monthSelect?.closest('header'))monthSelect.closest('header')!.hidden=!['r','i'].includes(S.tab);if(monthSelect?.parentElement){monthSelect.parentElement.hidden=!['r','i'].includes(S.tab);}const monthStatus=$('#monthStatus');if(monthStatus){monthStatus.hidden=!['r','i','d','o'].includes(S.tab);monthStatus.textContent=isMonthClosed(S.m)?'Encerrado · somente leitura':'Mês aberto';}const closedNotice=$('#closedMonthNotice');if(closedNotice)closedNotice.hidden=!isMonthClosed(S.m)||!['r','i','d','c'].includes(S.tab);
 monthSelect.min=monthKeyForIndex(0);monthSelect.max=monthKeyForIndex(MAX_MONTHS-1);monthSelect.value=monthKeyForIndex(S.m);monthSelect.parentElement!.title='Selecionar mês · '+monthLabelFromKey(monthKeyForIndex(S.m));
 $('#summaryToolbar').hidden=!['r','i'].includes(S.tab);renderView($('#summaryModes'),['r','i'].includes(S.tab)?summarySwitch():'');
 $('#app').className='layout-'+S.tab;$('#app').dataset.summaryView=S.tab==='i'?'entries':S.tab==='d'?areaViews.commitments:S.tab==='o'?areaViews.planning:S.tab==='f'?areaViews.analysis:summaryMode;
 renderView($('#app'),prepareSummary(({r:summaryView,i:summaryView,d:commitmentsView,v:vCredit,o:planningView,f:analysisView} as Record<string,()=>React.ReactNode>)[S.tab]()));
 if(isMonthClosed(S.m)&&['r','i','d','c'].includes(S.tab)){for(const node of document.querySelectorAll<HTMLButtonElement>('#app [data-a=sheet],#app [data-a=menu],#app [data-a=srem],#app [data-read-receipt],#app [data-a=cplim],#app [data-a=goal],#app [data-glass-actions=categories],#app [data-glass-actions=ledger] button,#app [data-goal-editor] button,#app [data-goal-editor] input,#app [data-goal-editor] select')){node.disabled=true;node.setAttribute('aria-disabled','true');} }
 $('#lt').textContent=$('#it').textContent=TITLES[S.tab==='i'?'r':S.tab];$('#pg').classList.toggle('nr',S.tab!=='r');

 $('#pageDescription').textContent='';$('#pageDescription').hidden=true;
 $('#newEntry').hidden=true;
 const context=$('#contextContent');if(context)renderView(context,contextActivity());
 document.body.dataset.page=S.tab;$('#settingsTop').hidden=!['u','r'].includes(S.tab)||(S.tab==='r'&&summaryMode==='behavior');$('#settingsTop').setAttribute('aria-label',S.tab==='r'?'Reorganizar cards':'Configurações');$('#settingsTop').title=S.tab==='r'?'Reorganizar cards':'Configurações';renderView($('#settingsTop'),S.tab==='u'?((
  <button className="ib" type="button" aria-label="Configurações">
    {ICON.x}
  </button>
)):((
  <span data-glass-actions="summary" aria-label="Reorganizar cards">
    {ICON.more}
  </span>
)));
 const identity=profileIdentity();const symbol=document.querySelector<HTMLElement>('.app-symbol')!;renderView(symbol,avatarMarkup(identity,'rail-avatar'));symbol.setAttribute('aria-label','Abrir perfil de '+identity.name);symbol.removeAttribute('aria-pressed');symbol.setAttribute('aria-expanded',String(accountPanel==='profile'&&$('#accountOverlay')?.open));

 applyAppearance(document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));


 const calendarButton=$('#calendarButton');if(calendarButton){calendarButton.hidden=!getLayout().sections.calendar;calendarButton.setAttribute('aria-expanded',String(accountPanel==='calendar'&&$('#accountOverlay')?.open));}
 syncNavigation();
 dispatchEvent(new Event('plan-navigation-change'));
 if(requestedPanel)openAccountPanel(requestedPanel);else if(accountPanel&&$('#accountOverlay')?.open)renderAccountPanel();
}

/* Menus de contexto: edição primeiro e ação destrutiva por último. */
const MENU:Record<string,(id?:string|number)=>ActionRow[]>={
 g:(id?: string|number)=>[{l:'Editar',a:'sheet',k:'g',id},{l:'Duplicar',a:'dup',id},...(S.items.find(x=>x.id===id)?.recurrenceId?[{l:'Cancelar próximas repetições',a:'stoprepeat',id,d:1}]:[]),{l:'Apagar este gasto',a:'del',id,d:1}],
 i:id=>[{l:'Editar',a:'sheet',k:'i',id},{l:'Apagar',a:'idel',id,d:1}],
 d:id=>[{l:'Apagar',a:'ddel',id,d:1}],
 l:()=>[{l:'Adicionar limite',a:'sheet',k:'l'},...CATS.filter(c=>lim(S.m,c)>0).map(c=>({l:categoryLabel(c),a:'sheet',k:'l',c})),{l:'Aplicar a todos os meses',a:'cplim'}]
};
// Glass actions delegate to the validated financial controllers.
finance.actionItems=descriptor=>{
 const d=descriptor||{};
 if(d.kind==='ledger')return [...['i','g'].map(k=>({label:k==='i'?'Entrada':'Gasto',onSelect:()=>openSheet({dataset:{k}})})),{label:'Ler nota',onSelect:()=>openReceipt()},{label:'Salário mensal',onSelect:()=>openSheet({dataset:{k:'i',incomeKind:'salary'}})}];
 if(d.kind==='summary')return [{label:arrangeCards?'Concluir organização':'Reorganizar cards',onSelect:()=>{arrangeCards=!arrangeCards;draw();}}];
 let rows=d.kind==='context'?(MENU[d.k!]?.(d.k==='d'?Number(d.id):d.id)||[]):d.k==='launch'?[{l:'Entrada',a:'sheet',k:'i',date:d.date||defaultDateForMonth(S.m)},{l:'Gasto',a:'sheet',k:'g',date:d.date||defaultDateForMonth(S.m)}]:[{l:d.a==='addmonth'?'Adicionar mês':d.k==='d'?'Adicionar dívida':d.k==='l'?'Adicionar limite':d.k==='i'?'Entrada':'Gasto',a:d.a==='addmonth'?'addmonth':'sheet',k:d.k,date:d.date||defaultDateForMonth(S.m)}];
 return rows.map(row=>({label:row.l,destructive:!!row.d,onSelect:()=>{const button=document.createElement('button');button.type='button';for(const field of ['a','k','id','c','date'] as const)if(row[field]!==undefined)button.dataset[field]=String(row[field]);document.body.append(button);try{button.click();}finally{button.remove();}}}));
};
let menuOpener:HTMLButtonElement|null=null;
function closeMenu(restoreFocus=false){const m=$('#menu');m.hidden=true;document.querySelectorAll<HTMLElement>('[aria-expanded][data-a="menu"]').forEach(b=>b.setAttribute('aria-expanded','false'));if(restoreFocus&&menuOpener?.isConnected)menuOpener.focus();}
function openMenu(b:HTMLButtonElement){closeMenu();menuOpener=b;const m=$('#menu'),fn=MENU[b.dataset.k!];if(!fn)return;renderView(m,viewList(fn(b.dataset.k! ==='d'?Number(b.dataset.id!):b.dataset.id!).map(x=>((
  <button
    role="menuitem"
    className={x.d ? 'r' : ''}
    data-a={x.a}
    data-id={x.id ?? ''}
    data-k={x.k ?? ''}
    data-c={esc(x.c || '')}
  >
    {esc(x.l)}
  </button>
)))));m.hidden=false;const r=b.getBoundingClientRect(),w=m.offsetWidth,h=m.offsetHeight;m.style.left=Math.max(8,Math.min(innerWidth-w-8,r.right-w))+'px';m.style.top=Math.max(8,Math.min(innerHeight-h-8,r.bottom+4))+'px';b.setAttribute('aria-expanded','true');m.querySelector('button')?.focus();}

/* Folhas de edição. Cada entrada financeira contém uma data real. */
let SH:SheetState|null=null;
function openSheet(a:{dataset:DOMStringMap}){
 const opener=SH?.opener||document.activeElement;
 const k=a.dataset.k!,id=a.dataset.id!==undefined&&a.dataset.id!==''?(a.dataset.k! ==='d'?Number(a.dataset.id!):a.dataset.id!):null,m=S.m;let t,b;if(isMonthClosed(m)&&['launch','g','i','l','d'].includes(k)){showNotice('Mês encerrado: disponível somente para visualização.',false);return;}
 if(k==='launch'){
 SH={k,date:a.dataset.date!||defaultDateForMonth(m)};t='Novo lançamento';b=((
  <>
    <p className="mut">{'O que você quer registrar?'}</p>
    <div className="launch-options">
      <button className="launch-option" data-a="sheet" data-k="i" data-date={SH!.date}>
        {ICON.i}
        <strong>{'Entrada'}</strong>
        <span>{'Dinheiro que entrou'}</span>
      </button>
      <button className="launch-option" data-a="sheet" data-k="g" data-date={SH!.date}>
        {ICON.g}
        <strong>{'Gasto'}</strong>
        <span>{'Dinheiro que saiu'}</span>
      </button>
    </div>
  </>
));
 }else if(k==='g'){
  const it:Partial<Expense>=id!==null?S.items.find(i=>i.id===id)||{}:{};if(it.splitId){showNotice('Este gasto pertence a uma divisão. Para alterar o valor, exclua e refaça a divisão na aba Amigos.',false);return;}SH={k,id:it.id};t=it.id?'Editar gasto':'Novo gasto';
  const selectedDate=a.dataset.date!||it.date||defaultDateForMonth(it.legacyMonth??m);SH!.date=selectedDate;
  b=((
  <div className="grid">
    <div className="full">
      <label htmlFor="sd">{'Descrição'}</label>
      <input id="sd" autoComplete="off" required={true} value={esc(it.d || '')} placeholder="Descrição" />
    </div>
    <div>
      <label htmlFor="sv">{'Valor (R$)'}</label>
      <input
        id="sv"
        inputMode="decimal"
        required={true}
        placeholder="0,00"
        value={it.v ? String(it.v).replace('.', ',') : ''}
      />
    </div>
    <div>
      <label htmlFor="sp">{'Pagamento'}</label>
      <select id="sp">
        {viewList(PAY.map((p) => <option selected={p === (it.p || PAY[0])}>{p}</option>))}
      </select>
    </div>
    <p className="entry-date full">
      {'Registro em '}
      {dateLong(selectedDate)}
    </p>
    <div className="full">
      <label htmlFor="sc">{'Categoria'}</label>
      <select id="sc">
        {viewList(CATS.map((c) => <option selected={c === (it.c || CATS[0])}>{c}</option>))}
      </select>
    </div>
    {
      <>
        <div className="full">
          <label htmlFor="expenseCard">{'Cartão'}</label>
          <select id="expenseCard">{creditCardOptions(it.creditCardId || '')}</select>
        </div>
        <label className="chk full">
          <input id="expenseSubscription" type="checkbox" checked={it.subscription} />
          {'Assinatura'}
        </label>
        <label className="chk full">
          <input
            id="expenseCardPaid"
            type="checkbox"
            disabled={(it.creditPaidCents || 0) > 0}
            checked={it.creditPaid}
          />
          {'Já pago'}
        </label>
      </>
    }
    {recurrenceFields(it, selectedDate)}
  </div>
));
 }else if(k==='i'){
  const it:Partial<LedgerRecord>=id!==null?S.receipts.find(i=>i.id===id)||{}:{};SH={k,id:it.id};t=it.id?'Editar entrada':'Nova entrada';SH!.incomeKind=a.dataset.incomeKind||it.incomeKind||'once';
  const selectedDate=a.dataset.date!||it.date||defaultDateForMonth(it.legacyMonth??m);SH!.date=selectedDate;
  b=((
  <div className="grid">
    <div className="full">
      <label htmlFor="incomeKind">{'Tipo de ganho'}</label>
      <select id="incomeKind">
        {viewList(
          [
            ['salary', 'Salário mensal'],
            ['monthly', 'Outro ganho mensal'],
            ['once', 'Ganho pontual'],
          ].map(([key, label]) => (
            <option value={key} selected={key === SH!.incomeKind}>
              {label}
            </option>
          )),
        )}
      </select>
    </div>
    <div className="full">
      <label htmlFor="sd">{'Descrição'}</label>
      <input
        id="sd"
        autoComplete="off"
        required={true}
        placeholder="Descrição"
        value={esc(it.d || (SH!.incomeKind === 'salary' ? 'Salário' : ''))}
      />
    </div>
    <div className="full">
      <label htmlFor="sv">{'Valor da entrada (R$)'}</label>
      <input
        id="sv"
        inputMode="decimal"
        required={true}
        placeholder="0,00"
        value={it.v ? String(it.v).replace('.', ',') : ''}
      />
    </div>
    <div className="full">
      <label htmlFor="incomeDate">{'Recebimento'}</label>
      <input
        id="incomeDate"
        type="date"
        min={monthDate(Math.max(0, monthIndexFromDate(todayISO())))}
        max={String(monthKeyForIndex(MAX_MONTHS - 1)) + '-30'}
        value={selectedDate}
        required={true}
      />
    </div>
    {recurrenceFields(it, selectedDate, !it.id && SH!.incomeKind !== 'once')}
  </div>
));
 }else if(k==='l'){
  const c=a.dataset.c||CATS.find(x=>!lim(m,x))||CATS[0],has=lim(m,c)>0;SH={k,c};t=has?'Limite de '+c:'Novo limite';
  b=((
  <div className="grid">
    <div className="full">
      <label htmlFor="sc">{'Categoria'}</label>
      <select id="sc" disabled={has}>
        {viewList(CATS.map((x) => <option selected={x === c}>{x}</option>))}
      </select>
    </div>
    <div className="full">
      <label htmlFor="sv">
        {'Limite em '}
        {M[m]}
        {' (R$)'}
      </label>
      <input
        id="sv"
        inputMode="decimal"
        required={true}
        placeholder="0,00"
        value={has ? String(lim(m, c)).replace('.', ',') : ''}
      />
    </div>
    <label className="chk full">
      <input type="checkbox" id="sa" />
      {'Todos os meses'}
    </label>
    {has ? (
      <button className="btn d full" data-a="srem">
        {'Remover limite'}
      </button>
    ) : (
      ''
    )}
  </div>
));
 }else if(k==='d'){
  const hi=id!==null,d=hi?DEBTS[Number(id)]:{n:'',v:0,s:m,p:1};SH={k,i:hi?Number(id):undefined};t=hi?'Editar dívida':'Nova dívida';
  b=((
  <div className="grid">
    <div className="full">
      <label htmlFor="sd">{'Credor'}</label>
      <input id="sd" autoComplete="off" required={true} value={esc(d.n || '')} />
    </div>
    <div>
      <label htmlFor="sv">{'Valor total (R$)'}</label>
      <input
        id="sv"
        inputMode="decimal"
        required={true}
        placeholder="0,00"
        value={d.v ? String(d.v).replace('.', ',') : ''}
      />
    </div>
    <div>
      <label htmlFor="sp">{'Parcelas'}</label>
      <input id="sp" inputMode="numeric" type="number" min="1" max="240" step="1" value={d.p || 1} />
    </div>
    <div>
      <label htmlFor="sdpaid">{'Parcelas já pagas'}</label>
      <input id="sdpaid" type="number" min="0" step="1" max="240" value={d.paid || 0} />
    </div>
    <div className="full">
      <label htmlFor="sm">{'Mês de início'}</label>
      <select id="sm">
        {viewList(
          M.map((x, j) => (
            <option value={j} selected={j === d.s}>
              {x}
            </option>
          )),
        )}
      </select>
    </div>
    {hi ? (
      <button className="btn d full" data-a="srem">
        {'Apagar dívida'}
      </button>
    ) : (
      ''
    )}
  </div>
));
 }else{return;}
 SH!.opener=opener;if($('#accountOverlay')?.open){suspendedAccountPanel=accountPanel;closeAccountPanel({immediate:true});accountPanel=null;}const s=$('#scrim');renderView(s,((
  <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="st">
    <div className="grab" aria-hidden="true"></div>
    <div className="sh">
      <button className="btn p" data-a="sclose">
        {'Cancelar'}
      </button>
      <h2 id="st">{esc(t)}</h2>
      {k === 'launch' ? (
        ''
      ) : (
        <button className="btn save" data-a="ssave">
          {'Salvar'}
        </button>
      )}
    </div>
    {b}
  </div>
)));s.hidden=false;document.body.style.overflow='hidden';document.querySelector<HTMLElement>('.workspace-frame')!.inert=true;document.querySelector<HTMLElement>('.account-toolbar')?.setAttribute('inert','');document.querySelector<HTMLElement>('.theme-mobile')?.setAttribute('inert','');const f=s.querySelector<HTMLInputElement>('input:not([type=checkbox]),select:not([disabled])')||s.querySelector('button');f?.focus();
}
function closeSheet(){document.querySelector<HTMLElement>('.workspace-frame')!.inert=false;document.querySelector<HTMLElement>('.account-toolbar')?.removeAttribute('inert');document.querySelector<HTMLElement>('.theme-mobile')?.removeAttribute('inert');const s=$('#scrim');s.hidden=true;renderView(s,'');document.body.style.overflow='';if(SH&&SH!.opener&&SH!.opener.isConnected)(SH!.opener as HTMLElement).focus();SH=null;if(suspendedAccountPanel){const panel=suspendedAccountPanel;suspendedAccountPanel=null;openAccountPanel(panel);}}
function saveSheet(){
 if(!SH||SH!.k==='launch')return;try{
  atomic(()=>{const v=moneyInput($('#sv')),all=!!$('#sa')?.checked;
   if(SH!.k==='g'||SH!.k==='i'){const label=$('#sd').value.trim(),date=SH!.k==='i'?$('#incomeDate').value:SH!.date||todayISO();if(!label||label.length>240){$('#sd').focus();throw Error('Informe uma descrição de até 240 caracteres.');}ensureDate(date);const list=SH!.k==='g'?S.items:S.receipts,existing=SH!.id?list.find(x=>x.id===SH!.id):null;if(existing?.splitId)throw Error('Este valor pertence a uma divisão. Altere a divisão para manter os valores consistentes.');if(!existing&&list.length>=MAX_RECORDS)throw Error('Limite de lançamentos atingido.');const record:Omit<LedgerRecord,'id'>={d:label,v,date,...(SH!.k==='g'?{c:$('#sc').value,p:$('#sp').value}:{})};if(SH!.k==='g'){const cardId=$('#expenseCard')?.value||'';record.subscription=!!$('#expenseSubscription')?.checked;record.creditCardId=cardId;record.creditPaid=!!$('#expenseCardPaid')?.checked;if(cardId){record.p='Cartão de crédito';record.creditChargeCents=toCents(v);}const count=$('#sr')?.checked?Number($('#sn').value):1;if($('#sr')?.checked&&count<2)throw Error('Para repetir, informe pelo menos 2 meses, incluindo este mês.');saveExpense(record as Omit<Expense,'id'>,SH!.id,count);}else{record.incomeKind=$('#incomeKind').value;const count=$('#sr')?.checked?Number($('#sn')?.value):1;if($('#sr')?.checked&&count<2)throw Error('Informe pelo menos 2 meses para repetir.');saveIncome(record,SH!.id,count);}S.m=monthIndexFromDate(date);S.calDate=date;
   }else if(SH!.k==='d'){const n=$('#sd').value.trim(),p=Number($('#sp').value),s=Number($('#sm').value),paid=Number($('#sdpaid').value);if(!n||n.length>240)throw Error('Informe um credor de até 240 caracteres.');if(!isInteger(p)||p<1||p>MAX_MONTHS||!isInteger(s)||s<0||s+p>MAX_MONTHS||!isInteger(paid)||paid<0||paid>p)throw Error('Revise as parcelas: use de 1 a '+MAX_MONTHS+', dentro do período disponível, e uma quantidade válida de parcelas pagas.');if(SH!.sharedRef&&DEBTS.some(x=>x.sharedRef===SH!.sharedRef))throw Error('Esta dívida já foi adicionada.');const record={n,v,p,s,paid,...(SH!.sharedRef?{sharedRef:SH!.sharedRef}:{})};if(SH!.i!==undefined)Object.assign(DEBTS[SH!.i!],record);else{if(DEBTS.length>=MAX_RECORDS)throw Error('Limite de dívidas atingido.');DEBTS.push(record);}ensureIndex(s+p-1);saveWorkspace();
   }else if(SH!.k==='l'){const category=$('#sc').value;if(!CATS.includes(category))throw Error('Categoria inválida.');const targets=all?Array.from({length:M.length},(_,i)=>i).filter(i=>!isMonthClosed(i)):[S.m];targets.forEach(i=>{LIM[i]??={};LIM[i][category]=v;});saveWorkspace();}
  });if(SH?.sharedRef){sessionStorage.removeItem('plan12-pending-debt');history.replaceState(null,'',location.pathname+location.search);}clearTransientError();closeSheet();draw();
 }catch(e){showError(e);}
}
function removeLim(){if(!SH)return;try{atomic(()=>{if(SH!.k==='d'){DEBTS.splice(SH!.i!,1);saveD();return;}const all=!!$('#sa')?.checked,targets=all?Array.from({length:M.length},(_,i)=>i).filter(i=>!isMonthClosed(i)):[S.m];targets.forEach(i=>{if(LIM[i])delete LIM[i][SH!.c!];});saveL();});if(SH?.sharedRef){sessionStorage.removeItem('plan12-pending-debt');history.replaceState(null,'',location.pathname+location.search);}clearTransientError();closeSheet();draw();}catch(e){showError(e);}}

function switchMonth(m:string|number){const idx=Number(m);if(!isInteger(idx)||idx<0)return;ensureIndex(idx);S.m=Math.min(idx,M.length-1);S.calDate=monthDate(S.m);draw();}

/* Controladores: toda alteração financeira é validada e gravada como uma unidade. */
function syncNavigation(){document.querySelectorAll<HTMLElement>('#tabs button').forEach(button=>{if(button.dataset.t! ===(S.tab==='i'?'r':S.tab))button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});}
function renderNavigation(){renderView($('#tabs'),viewList(MAIN_AREAS.map(({key:k,label})=>((
  <button
    type="button"
    data-t={k}
    aria-label={label}
    title={label}
    aria-current={k === (S.tab === 'i' ? 'r' : S.tab) ? 'page' : undefined}
  >
    {k === 'f' ? P(<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"></path>) : ICON[k]}
  </button>
)))));}
if(typeof bottomNavigationViewport!=='undefined')bottomNavigationViewport?.addEventListener('change',()=>{renderNavigation();syncNavigation();dispatchEvent(new Event('plan-navigation-change'));});
renderNavigation();addEventListener('plan-sections-change',()=>{const label=document.activeElement?.getAttribute('aria-label');renderNavigation();draw();if(label)[...document.querySelectorAll<HTMLElement>('#accountOverlay [role=switch]')].find(x=>x.getAttribute('aria-label')===label)?.focus({preventScroll:true});});
if($('#calendarButton')){renderView($('#calendarButton'),ICON.c);$('#calendarButton').onclick=()=>{closeMenu();openAccountPanel('calendar');};}
if($('#friendsButton')){renderView($('#friendsButton'),ICON.s);$('#friendsButton').onclick=()=>{closeMenu();openAccountPanel('friends');};}
document.querySelector<HTMLElement>('.app-symbol')!.onclick=()=>{notificationsOpen=false;renderNotifications();closeMenu();openAccountPanel('profile');};
$('#tabs').onclick=e=>{const b=(e.target as HTMLInputElement).closest('button');if(b?.dataset.t!){S.tab=b.dataset.t!;syncNavigation();closeMenu();scrollTo(0,0);draw();}};
$('#mes').onchange=e=>safely(()=>switchMonth(/^\d{4}-\d{2}$/.test((e.target as HTMLInputElement).value)?monthIndexFromDate((e.target as HTMLInputElement).value+'-01'):Number((e.target as HTMLInputElement).value)));
addEventListener('scroll',()=>{document.body.classList.toggle('scrolled',scrollY>24);closeMenu();},{passive:true});
addEventListener('keydown',e=>{if(SH){if(e.key==='Escape'){closeSheet();return;}if(e.key==='Tab'){const controls=[...$('#scrim').querySelectorAll<HTMLButtonElement>('button,input,select')].filter(x=>!x.disabled&&x.getClientRects().length>0),i=controls.indexOf(document.activeElement as HTMLButtonElement);if(i<0||e.shiftKey&&i===0){e.preventDefault();(e.shiftKey?controls.at(-1):controls[0])?.focus();}else if(!e.shiftKey&&i===controls.length-1){e.preventDefault();controls[0]?.focus();}}if(e.key==='Enter'&&(e.target as HTMLInputElement).tagName==='INPUT'&&(e.target as HTMLInputElement).type!=='checkbox'){e.preventDefault();saveSheet();}return;}const menu=$('#menu');if(e.key==='Escape')closeMenu(true);if(!menu.hidden&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){const buttons=[...menu.querySelectorAll('button')],index=buttons.indexOf(document.activeElement as HTMLButtonElement);e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus();}});
document.addEventListener('click',e=>{const a=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-a]');if(!a){if((e.target as HTMLElement).id==='scrim')closeSheet();else if(!(e.target as HTMLElement).closest<HTMLElement>('#menu'))closeMenu();return;}const action=a.dataset.a!,id=a.dataset.id!;try{
 if(action==='menu'){a.getAttribute('aria-expanded')==='true'?closeMenu(true):openMenu(a);return;}closeMenu();
 if(action==='sheet'){openSheet(a);return;}if(action==='sclose'){closeSheet();return;}if(action==='ssave'){saveSheet();return;}if(action==='srem'){removeLim();return;}
 if(action==='backup'){exportBackup();return;}if(action==='reload'){location.reload();return;}
 if(action==='csvcancel'){csvPreview=null;csvGeneration++;draw();return;}
 if(action==='csvapply'){const count=atomic(applyCsv);csvPreview=null;showNotice(count+' lançamento(s) importado(s).');draw();const status=$('#accountPanelStatus');if(status){status.hidden=false;status.setAttribute('role','status');status.textContent=count+' lançamento(s) importado(s).';}return;}
 safely(()=>{if(action==='del'){S.items=S.items.filter(x=>x.id!==id);saveI();}else if(action==='stoprepeat'){cancelFutureExpenses(id);}else if(action==='istoprepeat'){cancelFutureIncome(id);}else if(action==='idel'){S.receipts=S.receipts.filter(x=>x.id!==id);saveReceipts();}else if(action==='dup'){const source=S.items.find(x=>x.id===id);if(source){if(source.p==='Cartão de crédito'&&!source.creditCardId)throw Error('Edite este gasto e selecione um cartão antes de duplicar.');if(source.creditCardId&&!CARDS.some(c=>c.id===source.creditCardId&&c.active))throw Error('Ative o cartão antes de duplicar este gasto.');if(S.items.length>=MAX_RECORDS)throw Error('Limite de lançamentos atingido.');const copy={...source,id:newId(),...(source.creditCardId?{creditPaid:false}:{})};delete copy.splitId;if(copy.creditCardId){copy.creditChargeCents=toCents(copy.v);copy.creditPaidCents=0;}for(const key of ['recurrenceId','recurrenceIndex','recurrenceCount','recurrenceOrigin','recurrenceStopped'] as const)delete copy[key];S.items.push(copy);saveI();}}else if(action==='ddel'){DEBTS.splice(Number(id),1);saveD();}else if(action==='bank')S.bank=!S.bank;else if(action==='goal'){S.goal=a.dataset.showGoal==='true'||!S.goal;S.tab='r';summaryMode='overview';chartMetric='meta';scrollTo(0,0);}else if(action==='cplim'){LIM=Array.from({length:M.length},(_,i)=>isMonthClosed(i)?{...LIM[i]}:{...LIM[S.m]});saveL();}else if(action==='addmonth')addNextMonth();else if(action==='setmonth'){switchMonth(Number(a.dataset.m));S.tab='i';}else if(action==='calday'){ensureDate(a.dataset.date!);S.m=monthIndexFromDate(a.dataset.date!);S.calDate=a.dataset.date!;}else if(action==='prevmonth'){if(S.m>0)switchMonth(S.m-1);}else if(action==='nextmonth')switchMonth(S.m+1);draw();});
 }catch(error){showError(error);}});
document.addEventListener('change',e=>{if((e.target as HTMLInputElement).id==='incomeKind'){const kind=(e.target as HTMLInputElement).value;SH!.incomeKind=kind;const repeat=$('#sr');if(repeat){repeat.checked=kind!=='once';$('#repeatMonths').hidden=!repeat.checked;}if(kind==='salary'&&!$('#sd').value)$('#sd').value='Salário';}if((e.target as HTMLInputElement).id==='sr')$('#repeatMonths').hidden=!(e.target as HTMLInputElement).checked;});
document.addEventListener('change',e=>{const input=(e.target as HTMLInputElement);
 if(input.id==='gv'){safely(()=>{GOAL.v=moneyInput(input,{zero:true});ensureIndex(GOAL.e);saveG();draw();});return;}
 if(input.id==='ge'){safely(()=>{const index=Number(input.value);ensureIndex(index);GOAL.e=index;saveG();draw();});return;}
 if(input.id==='csvConvention'){csvConvention=input.value;csvPreview=null;csvGeneration++;draw();const select=$('#csvConvention');if(select)select.value=input.value;return;}
 if(input.id!=='csv'||!input.files![0])return;const file=input.files![0],convention=$('#csvConvention').value,generation=++csvGeneration;input.value='';if(file.size>500000){showError(Error('Use um CSV de até 500 KB.'));return;}
 file.text().then(text=>{if(generation!==csvGeneration)return;csvPreview={...prepareCsv(text,convention),sourceName:file.name};draw();if($('#csvConvention'))$('#csvConvention').value=convention;}).catch(showError);
});







function monthComparison(metric:string,m:number){
 if(m===0)return (<p className="comparison neutral">{'Sem mês anterior.'}</p>);
 const value=(k: number)=>metric==='meta'?goalProjection(k):metric==='i'?inc(k):spent(k),now=toCents(value(m)),prev=toCents(value(m-1)),delta=now-prev;
 if(!delta)return (<p className="comparison neutral">{'Sem variação mensal.'}</p>);
 const positive=metric==='g'?delta<0:delta>0,sign=delta>0?'+':'−',pct=prev!==0?Math.abs(delta/prev*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':brl(Math.abs(delta)/100);
 return ((
  <p className={'comparison ' + String(positive ? 'ok' : 'bad')}>
    {delta > 0 ? '↑' : '↓'} {sign}
    {pct} <span>{'vs. mês anterior'}</span>
  </p>
));
}
function goalChart(){
 const count=Math.max(1,M.length,GOAL.v>0?GOAL.e+1:1),values=(()=>{let cents=0;return Array.from({length:count},(_,k)=>(cents+=(GOAL.date&&k>GOAL.e?0:goalMonthProjectionCents(k,'',0,GOAL.date&&k===GOAL.e?GOAL.date:'')))/100);})(),lo=Math.min(0,...values),hi=Math.max(1,GOAL.v,...values),W=640,H=212,L=48,R=20,T=25,B=30,X=(k: number)=>L+(W-L-R)*(count===1?.5:k/(count-1)),Y=(v: number)=>T+(H-T-B)*(hi-v)/(hi-lo),line=values.map((v,k)=>(k?'L':'M')+X(k).toFixed(1)+' '+Y(v).toFixed(1)).join(' '),labels=viewList(values.map((_,k)=>k%Math.max(1,Math.ceil(count/8))?'':((
  <text x={X(k)} y={H - 5} textAnchor="middle" fontSize="10" fill="var(--lb2)">
    {esc(M[k] || monthLabelFromKey(monthKeyForIndex(k)))}
  </text>
))));
 return ((
  <>
    <svg
      className="daily-chart goal-chart"
      viewBox={'0 0 ' + String(W) + ' ' + String(H)}
      role="img"
      aria-label={
        'Projeção acumulada de ' +
        String(brl(values[0])) +
        ' a ' +
        String(brl(values[count - 1])) +
        '. ' +
        String(GOAL.v > 0 ? 'Meta de ' + brl(GOAL.v) : 'Sem meta definida.')
      }
    >
      {viewList(
        [lo, (hi + lo) / 2, hi].map((v) => (
          <>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--sep)" strokeWidth=".5"></line>
            <text x={L - 6} y={Y(v) + 3} textAnchor="end" fontSize="10" fill="var(--lb2)">
              {mf(v)}
            </text>
          </>
        )),
      )}
      {GOAL.v > 0 ? (
        <>
          <line
            x1={L}
            x2={W - R}
            y1={Y(GOAL.v)}
            y2={Y(GOAL.v)}
            stroke="var(--greenT)"
            strokeDasharray="5 5"
          ></line>
          <text x={W - R} y={Y(GOAL.v) - 8} textAnchor="end" fontSize="10" fill="var(--greenT)">
            {'Meta · '}
            {brl(GOAL.v)}
          </text>
        </>
      ) : (
        ''
      )}
      <path d={line} fill="none" stroke="var(--tint)" strokeWidth="2.5" strokeLinejoin="round"></path>
      {viewList(
        values.map((v, k) => <circle cx={X(k)} cy={Y(v)} r={k === S.m ? 4 : 2} fill="var(--tint)"></circle>),
      )}
      {labels}
    </svg>
    <div className="chart-legend goal-legend">
      <span>{'Projeção acumulada'}</span>
      {GOAL.v > 0 ? <span>{'Meta definida'}</span> : ''}
    </div>
  </>
));
}
function periodChart(){
 const start=Math.max(0,Math.min(MAX_MONTHS-12,S.m-5)),totals=new Map();for(const record of S.receipts){const key=itemMonthIndex(record);totals.set(key,(totals.get(key)||0)+toCents(record.v));}
 const months=Array.from({length:12},(_,i)=>start+i),values=months.map(k=>isMonthClosed(k)&&CLOSED_REPORTS[monthKeyForIndex(k)]?sum(CLOSED_REPORTS[monthKeyForIndex(k)].receipts):(totals.get(k)||0)/100),max=Math.max(1,...values);
 return ((
  <div className="period-chart" role="group" aria-label="Entradas por período">
    {viewList(
      months.map((k, i) => (
        <div
          className={'period-column ' + String(k === S.m ? 'selected' : '')}
          aria-label={String(monthLabelFromKey(monthKeyForIndex(k))) + ': ' + String(brl(values[i]))}
        >
          <span className="period-value">{brl(values[i])}</span>
          <span className="period-track">
            <i style={{ height: String(Math.max(0, (values[i] / max) * 100)) + '%' }}></i>
          </span>
          <span className="period-label">{monthLabelFromKey(monthKeyForIndex(k))}</span>
        </div>
      )),
    )}
  </div>
));
}

function dailyBars(){
 const m=S.m,key=monthKeyForIndex(m),[year,month]=key.split('-').map(Number),days=Math.max(new Date(year,month,0).getDate(),new Date(year,month-1,0).getDate());
 const records=chartMetric==='i'?receiptsInMonth:itemsInMonth;
 const source=[...records(m),...(m>0?records(m-1):[])];
 const totals=new Map();for(const x of source){const date=x.date;if(date)totals.set(date,(totals.get(date)||0)+toCents(x.v));}
 const series=(idx: number)=>{const k=monthKeyForIndex(idx);return Array.from({length:days},(_,i)=>(totals.get(`${k}-${pad(i+1)}`)||0)/100);};
 const current=series(m),previous=m>0?series(m-1):Array(days).fill(0),max=Math.max(1,...current,...previous),w=640,h=212,baseline=182,step=620/days,bw=Math.min(6,step*.31);
 const bars=viewList(current.map((v,i)=>{const x=10+i*step,hh=v?Math.max(3,v/max*144):0,ph=previous[i]?Math.max(3,previous[i]/max*144):0;return ((
  <>
    <rect x={x} y={baseline - ph} width={bw} height={ph} rx="2" fill="var(--chart-previous)"></rect>
    <rect x={x + bw + 2} y={baseline - hh} width={bw} height={hh} rx="2" fill="var(--tint)"></rect>
    {i % Math.ceil(days / 12) === 0 ? (
      <text x={x + bw} y="204" textAnchor="middle" fontSize="10" fill="var(--lb2)">
        {i + 1}
      </text>
    ) : (
      ''
    )}
  </>
));}));
 return ((
  <svg
    className="daily-chart"
    viewBox={'0 0 ' + String(w) + ' ' + String(h)}
    role="img"
    aria-label={
      String(chartMetric === 'i' ? 'Entradas' : 'Gastos') +
      ' por dia de ' +
      String(M[m]) +
      ', em comparação com o mês anterior.'
    }
  >
    {viewList(
      [38, 86, 134, 182].map((y) => (
        <line x1="8" x2="632" y1={y} y2={y} stroke="var(--sep)" strokeWidth=".5"></line>
      )),
    )}
    {bars}
  </svg>
));
}
function contextActivity(){
 const rows=[...itemsInMonth(S.m).map(x=>({...x,k:'g'})),...receiptsInMonth(S.m).map(x=>({...x,k:'i'}))].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5);
 const balance=(toCents(inc(S.m))-toCents(spent(S.m))-toCents(debt(S.m)))/100;
 return ((
  <>
    <div className="context-heading">
      {'Atividade recente '}
      <span className="tag">{rows.length}</span>
    </div>
    {rows.length ? (
      viewList(
        rows.map((x) => (
          <button className="context-item" data-a="sheet" data-k={x.k} data-id={x.id}>
            <span className="context-icon">{ICON[x.k]}</span>
            <span>
              <span className="context-name">{esc(x.d)}</span>
              <small>{x.date ? dateLabel(x.date) : 'Sem data'}</small>
            </span>
            <b className={x.k === 'i' ? 'ok' : ''}>
              {x.k === 'i' ? '+' : '−'} {brl(x.v)}
            </b>
          </button>
        )),
      )
    ) : (
      <div className="context-empty">
        <span className="context-icon">{ICON.g}</span>
        <p>
          <strong>{'Tudo começa com um registro.'}</strong>
          <br />
          {'Seus gastos e entradas mais recentes aparecerão aqui.'}
        </p>
        <button className="context-add" data-a="sheet" data-k="g">
          {'Novo gasto'}
        </button>
      </div>
    )}
    <h2>{'Seu mês em foco'}</h2>
    <div className="timeline">
      <div className="timeline-item">
        <small>{'Saldo disponível'}</small>
        <p>
          <strong className={balance < 0 ? 'bad' : ''}>{brl(balance)}</strong>
          <br />
          {'Entradas menos gastos e dívidas.'}
        </p>
      </div>
      <div className="timeline-item">
        <small>{'Compromissos do mês'}</small>
        <p>
          {brl(debt(S.m))}
          {' em parcelas de dívidas.'}
        </p>
      </div>
      <div className="timeline-item">
        <small>{'Planejamento'}</small>
        <p>
          {GOAL.v > 0
            ? 'Meta de ' + brl(GOAL.v) + ' até ' + (GOAL.date ? dateLong(GOAL.date) : M[GOAL.e]) + '.'
            : 'Defina limites por categoria para acompanhar seu orçamento.'}
        </p>
      </div>
    </div>
  </>
));
}
const appearanceMedia=matchMedia('(prefers-color-scheme: dark)');
function appearance(){const saved=load<string|null>('plan12appearance',null,(v:string|null)=>v==='dark'||v==='light');return saved||(appearanceMedia.matches?'dark':'light');}
function applyAppearance(mode:string){document.documentElement.dataset.theme=mode;document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach(b=>{b.setAttribute('aria-pressed',String(mode==='dark'));b.setAttribute('aria-label',mode==='dark'?'Ativar modo claro':'Ativar modo escuro OLED');b.title=mode==='dark'?'Ativar modo claro':'Ativar modo escuro OLED';renderView(b,((
  <>
    {mode === 'dark'
      ? P(
          <>
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"></path>
          </>,
        )
      : P(<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"></path>)}
    <span className="theme-label">{mode === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
  </>
)));});}
applyAppearance(appearance());
appearanceMedia.addEventListener('change',()=>{if(!load<string|null>('plan12appearance',null,(v:string|null)=>v==='dark'||v==='light'))applyAppearance(appearance());});
addEventListener('plan-theme-request',e=>{if(['light','dark'].includes(e.detail)&&e.detail!==document.documentElement.dataset.theme)toggleTheme();});
addEventListener('plan-segment-request',e=>{const {kind,value}=e.detail||{};if(kind==='data-area-view'){if(selectAreaView(value))draw();return;}if(kind==='data-entry-filter'&&['all','i','g'].includes(value))entryFilter=value;else if(kind==='data-summary-mode'&&['overview','behavior','entries'].includes(value)){summaryMode=value;S.tab=value==='entries'?'i':'r';arrangeCards=false;}else if(kind==='data-chart'&&['i','g','meta'].includes(value))chartMetric=value;else return;draw();});
document.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLElement>('[data-theme-toggle]'))toggleTheme();const chart=(e.target as HTMLElement).closest<HTMLElement>('[data-chart]');if(chart){chartMetric=chart.dataset.chart!;draw();}});


function makeClosedReport(m:number,closedOn:string){
 const expenses=itemsInMonth(m).map(x=>({...x})),receipts=receiptsInMonth(m).map(x=>({...x})),incomeCents=receipts.reduce((t,x)=>t+Math.round(x.v*100),0),expenseCents=expenses.reduce((t,x)=>t+Math.round(x.v*100),0),debtCents=Math.round(debt(m)*100);
 return {key:monthKeyForIndex(m),label:M[m],closedOn,incomeCents,expenseCents,debtCents,balanceCents:incomeCents-expenseCents-debtCents,expenses,receipts,categories:CATS.map(name=>({name,cents:expenses.filter(x=>x.c===name).reduce((t,x)=>t+Math.round(x.v*100),0)})),debts:DEBTS.filter(d=>dm(d,m)>0).map(d=>({name:d.n,cents:Math.round(dm(d,m)*100)}))};
}
function closeCompletedMonths(date=todayISO()){
 const current=monthIndexFromDate(date);if(current<=0)return false;const missing: number[]=[];for(let m=0;m<Math.min(current,monthCount,MAX_MONTHS);m++)if(!CLOSED_REPORTS[monthKeyForIndex(m)])missing.push(m);if(!missing.length)return false;
 try{atomic(()=>{missing.forEach(m=>{CLOSED_REPORTS[monthKeyForIndex(m)]=makeClosedReport(m,date);});saveWorkspace();});return true;}catch(error){showNotice('Não foi possível salvar o fechamento mensal. '+errorDetails(error).message,true);return false;}
}
function closedReportsView(){
 const reports=Object.values(CLOSED_REPORTS).sort((a,b)=>b.key.localeCompare(a.key));
 return ((
  <section className="card closed-reports">
    <h2>{'Relatórios mensais fechados'}</h2>
    <p className="foot">
      {'Fechamento automático na virada do mês ou no próximo acesso. Os valores fechados ficam preservados.'}
    </p>
    {reports.length ? (
      viewList(
        reports.map((r) => (
          <details className="report-block">
            <summary>
              <span>
                {esc(r.label)}
                <small>
                  {'Fechado em '}
                  {dateLong(r.closedOn)}
                </small>
              </span>
              <span className="tag">{'Fechado'}</span>
              <b className={r.balanceCents < 0 ? 'bad' : 'ok'}>{brl(r.balanceCents / 100)}</b>
            </summary>
            <div className="report-stats">
              <div>
                <span>{'Entradas'}</span>
                <b>{brl(r.incomeCents / 100)}</b>
              </div>
              <div>
                <span>{'Gastos'}</span>
                <b>{brl(r.expenseCents / 100)}</b>
              </div>
              <div>
                <span>{'Parcelas previstas'}</span>
                <b>{brl(r.debtCents / 100)}</b>
              </div>
              <div>
                <span>{'Saldo após compromissos'}</span>
                <b>{brl(r.balanceCents / 100)}</b>
              </div>
            </div>
            <h3>{'Por categoria'}</h3>
            {viewList(
              r.categories
                .filter((x) => x.cents > 0)
                .map((x) => (
                  <div className="report-line">
                    <span>{esc(x.name)}</span>
                    <b>{brl(x.cents / 100)}</b>
                  </div>
                )),
            ) || <p className="foot">{'Sem gastos neste mês.'}</p>}
            <h3>{'Lançamentos do mês'}</h3>
            {viewList(
              [
                ...r.receipts.map((x) => ({ ...x, type: 'i' })),
                ...r.expenses.map((x) => ({ ...x, type: 'g' })),
              ]
                .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                .map((x) => (
                  <div className="report-line">
                    <span>
                      {esc(x.d)}
                      <small>
                        {x.date ? dateLong(x.date) : 'Sem data'}
                        {' · '}
                        {x.type === 'i' ? 'Entrada' : 'Gasto'}
                      </small>
                    </span>
                    <b>
                      {x.type === 'i' ? '+' : '−'} {brl(x.v)}
                    </b>
                  </div>
                )),
            ) || <p className="foot">{'Sem lançamentos.'}</p>}
            <p className="foot">{'Mês encerrado: lançamentos disponíveis somente para visualização.'}</p>
          </details>
        )),
      )
    ) : (
      <div className="quiet-empty">
        <h3>{'Seu primeiro relatório chega no próximo mês'}</h3>
        <p>{'Os registros deste mês serão reunidos aqui quando o mês terminar.'}</p>
      </div>
    )}
  </section>
));
}
// Close the beta by setting betaEndsAt; qualifying accounts keep their badge.
const COMMUNITY_PROGRAM=Object.freeze({betaStartsAt:null,betaEndsAt:null,supportUrl:''});
function isBetaTester(user:import('@supabase/supabase-js').User|null,program=COMMUNITY_PROGRAM,now=Date.now()){
 if(!user?.id||!user.created_at)return false;
 const created=Date.parse(user.created_at),start=program.betaStartsAt?Date.parse(program.betaStartsAt):0,end=program.betaEndsAt?Date.parse(program.betaEndsAt):Infinity;
 return Number.isFinite(created)&&created>0&&created<=now&&created>=start&&created<=end;
}
function supportProjectCard(){const url=COMMUNITY_PROGRAM.supportUrl;let valid=false;try{const u=new URL(url);valid=u.protocol==='https:'&&!u.username&&!u.password;}catch{}return ((
  <div className="profile-support-action">
    {valid ? (
      <a className="btn" href={esc(url)} target="_blank" rel="noopener noreferrer">
        {ICON.plus}
        {' Apoiar projeto'}
      </a>
    ) : (
      <button className="btn" type="button" disabled={true} aria-label="Apoiar projeto, em breve">
        {'♡ Apoiar projeto'}
      </button>
    )}
  </div>
));}

function profileIdentity(){
 const user=window.planAuth.user,meta=user?.user_metadata||{};let photo='';
 try{const url=new URL(meta.avatar_url||meta.picture||'');if(url.protocol==='https:'&&(url.hostname==='googleusercontent.com'||url.hostname.endsWith('.googleusercontent.com')))photo=url.href;}catch{}
 return {name:user?String(meta.full_name||meta.name||PROFILE.name||'Sua conta').slice(0,120):window.planAuth.guestName(),email:user?.email||'',photo,google:!!user};
}
function avatarMarkup(person:{name:string;photo?:string},cls='profile-photo'){return ((
  <span className={cls}>
    <span aria-hidden="true">{esc(person.name.trim().slice(0, 1).toUpperCase() || 'V')}</span>
    {person.photo ? (
      <img src={esc(person.photo)} alt={'Foto de ' + String(esc(person.name))} referrerPolicy="no-referrer" />
    ) : (
      ''
    )}
  </span>
));}
function identitySettingsView(){const p=profileIdentity();return ((
  <>
    <dl className="identity-fields">
      <div>
        <dt>{'Nome'}</dt>
        <dd>{esc(p.name)}</dd>
      </div>
      <div>
        <dt>{'E-mail'}</dt>
        <dd>{p.email ? esc(p.email) : 'Sem e-mail vinculado'}</dd>
      </div>
      <div>
        <dt>{'Acesso'}</dt>
        <dd>{p.google ? 'Google' : 'Visitante'}</dd>
      </div>
    </dl>
    {usernameProfile()}
  </>
));}
function profileStars(){
 const current=todayISO().slice(0,7),totals=new Map(),row=(key: string)=>{if(!totals.has(key))totals.set(key,{key,income:0,expenses:0,incomeCount:0,expenseCount:0,spent:new Map()});return totals.get(key);};
 for(const x of S.items){const m=row(x.date.slice(0,7)),cents=toCents(x.v);m.expenses+=cents;m.expenseCount++;m.spent.set(x.c,(m.spent.get(x.c)||0)+cents);}
 for(const x of S.receipts){const m=row(x.date.slice(0,7));m.income+=toCents(x.v);m.incomeCount++;}
 const months=[...totals.values()].map(m=>{const index=monthIndexFromDate(m.key+'-01');return {...m,debts:toCents(debt(index)),categories:CATS.map(c=>({limit:toCents(lim(index,c)),spent:m.spent.get(c)||0}))};});
 const progress=responsibleProgress(months,current);
 return ((
  <div className="profile-stars" role="img" aria-label={String(progress.stars) + ' de 5 estrelas'}>
    {viewList(
      Array.from({ length: 5 }, (_, i) => (
        <svg className={i < progress.stars ? 'earned' : ''} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9Z"></path>
        </svg>
      )),
    )}
    <span>
      {progress.stars}
      {'/5'}
    </span>
  </div>
));
}
function ratingStars(n:number){return ((
  <span className="rating-stars" role="img" aria-label={String(n) + ' de 5 estrelas'}>
    {viewList(
      Array.from({ length: 5 }, (_, i) => (
        <span className={i < n ? 'earned' : ''} aria-hidden="true">
          {'★'}
        </span>
      )),
    )}
  </span>
));}
function monthlyRatings(){const reports=Object.values(CLOSED_REPORTS).filter(r=>r.receipts?.length&&r.expenses?.length).sort((a,b)=>b.key.localeCompare(a.key));return viewList(reports.map(r=>{const total=r.expenseCents+r.debtCents,income=r.incomeCents;let stars=1;if(income>0){stars=2;if(total<=income)stars=3;if(total<=income*.9)stars=4;if(total<=income*.8)stars=5;}const index=monthIndexFromDate(r.key+'-01'),limits=CATS.filter(c=>lim(index,c)>0);if(!limits.length)stars=Math.min(stars,3);if(limits.some(c=>r.expenses.filter(x=>x.c===c).reduce((n,x)=>n+toCents(x.v),0)>toCents(lim(index,c))))stars=Math.min(stars,2);return ((
  <article className="monthly-rating-pill">
    <span className="rating-month-icon" aria-hidden="true">
      {ICON.c}
    </span>
    <div>
      <h3>{esc(monthLabelFromKey(r.key))}</h3>
      <span className="foot">
        {stars === 5 ? 'Em equilíbrio' : stars >= 3 ? 'Dentro da renda' : 'Em atenção'}
      </span>
    </div>
    {ratingStars(stars)}
  </article>
));}));}
function streamingPill(){return ((
  <div data-subscriptions={esc(JSON.stringify(subscriptionSummary(S.items, todayISO().slice(0, 7))))}></div>
));}
function vYou(){return rendervYou(viewContext);}



function cloudSettingsView(){return window.planAuth.user?((
  <section className="card cloud-settings" data-cloud-panel="">
    <h2>{'Sincronização'}</h2>
    <p data-cloud-message="" role="status"></p>
    <p className="foot" data-cloud-last=""></p>
    <div className="settings-actions">
      <button className="btn g" type="button" data-cloud-retry="">
        {'Sincronizar'}
      </button>
      <button className="btn g" type="button" data-cloud-copy-download="" hidden={true}>
        {'Baixar cópias'}
      </button>
    </div>
    <div className="cloud-conflict" data-cloud-conflict="" hidden={true}>
      <h3>{'Escolha qual versão usar'}</h3>
      <p className="foot">
        {
          'Há alterações diferentes neste dispositivo e na conta. Antes de trocar, o app guarda uma cópia das duas versões neste navegador. Baixe essas cópias para mantê-las fora do dispositivo.'
        }
      </p>
      <div className="settings-actions">
        <button className="btn" type="button" data-cloud-resolve="cloud">
          {'Usar dados da conta'}
        </button>
        <button className="btn g" type="button" data-cloud-resolve="local">
          {'Enviar dados deste dispositivo'}
        </button>
      </div>
      <p className="foot">
        {
          'A versão escolhida substituirá a outra. Se houver um formulário aberto, feche-o antes de continuar.'
        }
      </p>
    </div>
  </section>
)):'';}

function carbonRecords(){return load<Record<string,{grams:number;source:string}>>('plan12carbon_v1',{},x=>x&&typeof x==='object'&&!Array.isArray(x));}
function vCarbon(){return rendervCarbon(viewContext);}
document.addEventListener('submit',e=>{if((e.target as HTMLFormElement).id!=='carbonForm')return;e.preventDefault();try{const data=new FormData((e.target as HTMLFormElement)),id=String(data.get('purchase')),raw=String(data.get('kg')).trim().replace(',','.');if(!/^\d+(\.\d{1,3})?$/.test(raw))throw Error('Informe até três casas decimais.');const grams=Math.round(Number(raw)*1000);if(!isSafeInteger(grams)||grams<0||grams>1e12||!S.items.some(x=>x.id===id))throw Error('Revise a compra e a emissão.');const records=carbonRecords();records[id]={grams,source:String(data.get('source')||'').trim().slice(0,240)};localStorage.setItem('plan12carbon_v1',JSON.stringify(records));draw();}catch(error){$('#carbonStatus').textContent=errorDetails(error).message;}});
function accountSettingsView(){return ((
  <section className="account-details" id="identitySettings">
    {identitySettingsView()}
    {cloudSettingsView()}
    <section className="card">
      <h2>{'Seus dados'}</h2>
      <p className="mut">
        {window.planAuth.user
          ? 'Dados sincronizados por conta. Uma cópia neste dispositivo permite continuar sem conexão.'
          : 'Dados temporários desta visita.'}
      </p>
      <div data-account-data-controls=""></div>
    </section>
  </section>
));}
function reportsView(){return ((
  <>
    {closedReportsView()}
    {financeToolsView()}
    <section className="card export-reports">
      <h2>{'Exportar'}</h2>
      <div className="settings-actions">
        <button className="btn t" type="button" data-a="backup">
          {'Backup'}
        </button>
        <button className="btn g" type="button" id="exportSpreadsheet">
          {'CSV'}
        </button>
        <button className="btn g" type="button" id="exportTaxes">
          {'Impostos'}
        </button>
        {window.localStorage.getItem('plan12workspace_v3') ? (
          <button className="btn g" type="button" id="legacyBackup">
            {'Dados anteriores'}
          </button>
        ) : (
          ''
        )}
      </div>
      <p className="foot">{'Backup completo. CSV com entradas e gastos de todos os meses.'}</p>
    </section>
  </>
));}

function vSettings(){return rendervSettings(viewContext);}
function integrationsView(){return ((
  <div className="integration-list">
    <section className="card integration-tile">
      <span className="integration-icon">{ICON.b}</span>
      <div>
        <h2>{'Open Finance'}</h2>
      </div>
      <button type="button" className="btn" data-connect-pluggy="">
        {'Conectar banco'}
      </button>
      <p className="foot" data-pluggy-status="" role="status"></p>
    </section>
    {viewList(
      [
        ['d', 'Serasa'],
        ['i', 'Boletos emitidos'],
      ].map(([icon, name]) => (
        <section className="card integration-tile">
          <span className="integration-icon">{ICON[icon]}</span>
          <div>
            <h2>{name}</h2>
          </div>
          <span className="tag">{'Em breve'}</span>
        </section>
      )),
    )}
  </div>
));}
document.addEventListener('click',async event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-connect-pluggy]');if(!button||button.disabled)return;button.disabled=true;const status=document.querySelector<HTMLElement>('[data-pluggy-status]');try{const {connectBank}=await import('../services/pluggy-connect.ts');await connectBank((message: string|null)=>{const target=document.querySelector<HTMLElement>('[data-pluggy-status]');if(target)target.textContent=message;});}catch{if(status)status.textContent='Não foi possível abrir a conexão. Tente novamente.';}finally{button.disabled=false;}});


function renderAccountPanel(){if(!accountPanel)return;const title={profile:'Perfil',settings:'Configurações',calendar:'Calendário'}[accountPanel],content=accountPanel==='profile'?vYou():accountPanel==='calendar'?vC():vSettings();renderView($('#accountOverlayContent'),((
  <>
    <button
      type="button"
      className="mobile-sheet-grabber"
      data-mobile-expand=""
      aria-label="Expandir ou recolher folha"
      aria-expanded="false"
    >
      <span></span>
    </button>
    <header className="account-overlay-header">
      <h2 id="accountOverlayTitle">{title}</h2>
      <button
        className="btn g account-overlay-close"
        type="button"
        data-close-account=""
        aria-label={'Fechar ' + String(title)}
      >
        {P(<path d="m6 6 12 12M18 6 6 18"></path>)}
      </button>
    </header>
    <div className={'account-panel-body ' + String(accountPanel) + '-panel'}>{content}</div>
    <p id="accountPanelStatus" className="foot" role="alert" hidden={true}></p>
  </>
)));}
function openAccountPanel(panel:string,opener:Element|null=null){
 const destination={shopping:'commitments:cards',friends:'commitments:friends',offers:'planning:purchases',reports:'analysis:reports'}[panel];
 if(destination){closeAccountPanel();accountPanel=null;notificationsOpen=false;renderNotifications();if(selectAreaView(destination)){scrollTo(0,0);draw();}return;}
 if(panel==='integrations'){accountSettingsTab='connections';panel='settings';}
if(!['profile','settings','calendar'].includes(panel))return;const dialog=$('#accountOverlay');if(!dialog)return;overlayOpener=opener||(panel==='calendar'?$('#calendarButton'):document.querySelector<HTMLElement>('.app-symbol'));notificationsOpen=false;renderNotifications();accountPanel=panel;dialog.classList.remove('mobile-expanded');$('#accountOverlay').dataset.panel=panel;renderAccountPanel();if(!dialog.open){dialog.showModal();document.body.classList.add('account-overlay-open');}document.querySelector<HTMLElement>('.app-symbol')?.setAttribute('aria-expanded',String(panel==='profile'));$('#calendarButton')?.setAttribute('aria-expanded',String(panel==='calendar'));dialog.querySelector<HTMLButtonElement>('[data-close-account]')?.focus();}
function closeAccountPanel({immediate=false}={}){const dialog=$('#accountOverlay');if(!dialog?.open||dialog.dataset.closing)return;
 if(immediate||dialog.dataset.panel!=='profile'||matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.close();return;}
 dialog.dataset.closing='true';dialog.inert=true;
 const done=()=>{dialog.close();dialog.inert=false;delete dialog.dataset.closing;dialog.style.removeProperty('opacity');dialog.style.removeProperty('transform')};
 animate(dialog,PROFILE_EXIT,{...FADE,onComplete:done});
}
const accountOverlay=$('#accountOverlay');if(accountOverlay){accountOverlay.addEventListener('cancel',e=>{if(accountOverlay.dataset.panel==='profile'){e.preventDefault();closeAccountPanel();}});accountOverlay.addEventListener('click',e=>{if((e.target as HTMLElement)===accountOverlay)closeAccountPanel();});accountOverlay.addEventListener('close',()=>{if(accountOverlay.open)return;accountPanel=null;$('#calendarButton')?.setAttribute('aria-expanded','false');document.querySelector<HTMLElement>('.app-symbol')?.setAttribute('aria-expanded','false');renderView($('#accountOverlayContent'),'');document.body.classList.remove('account-overlay-open');(overlayOpener as HTMLElement|null)?.focus({preventScroll:true});});}
document.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLElement>('[data-mobile-expand]')){const expanded=$('#accountOverlay').classList.toggle('mobile-expanded');(e.target as HTMLElement).closest<HTMLElement>('[data-mobile-expand]')!.setAttribute('aria-expanded',String(expanded));return;}if((e.target as HTMLElement).closest<HTMLButtonElement>('[data-close-account]')){closeAccountPanel();return;}const tab=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-account-settings-tab]');if(tab){accountSettingsTab=tab.dataset.accountSettingsTab!;renderAccountPanel();$('#settingsTab-'+accountSettingsTab)?.focus();return;}});
document.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('[data-account-settings-tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=['account','notifications','layout','connections'];accountSettingsTab=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1)!:tabs[(tabs.indexOf(accountSettingsTab)+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];renderAccountPanel();$('#settingsTab-'+accountSettingsTab)?.focus();}});


document.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLElement>('[data-cloud-settings]')){S.tab='x';draw();document.querySelector<HTMLElement>('.cloud-settings')?.scrollIntoView({behavior:'smooth',block:'center'});}});
let editPlanId='',purchaseReview:{id:string;expected:string}|null=null;
const shoppingMoney=(n:number)=>String((n||0)/100).replace('.',',');
function projectionView(plan:PurchasePlan&{reservedCents:number}){try{const p=planProjection(plan);return ((
  <>
    {creditPlanGuide(plan)}
    <div className="plan-projection">
      <h3>{'Impacto no planejamento'}</h3>
      <p className="foot">
        {
          'Simulação sem alterar seus dados. Considera gastos, limites e dívidas; atrasos entram no primeiro mês. Gastos cobertos pelo limite não são descontados de novo. Não inclui saldo bancário, renda não cadastrada ou outras compras planejadas.'
        }
      </p>
      <div className="plan-table-wrap">
        <table className="plan-table">
          <thead>
            <tr>
              <th>{'Período'}</th>
              <th>{'Sua parcela'}</th>
              <th>{'Após compromissos'}</th>
            </tr>
          </thead>
          <tbody>
            {viewList(
              p.rows.map((x) => (
                <tr>
                  <td data-label="Período">
                    {monthLabelFromKey(monthKeyForIndex(x.m))}
                    {!x.complete ? <small>{'Sem entradas cadastradas'}</small> : ''}
                  </td>
                  <td data-label="Sua parcela">{brl(x.cents / 100)}</td>
                  <td data-label="Após compromissos" className={x.after < 0 ? 'bad' : ''}>
                    {brl(x.after / 100)}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className="foot">
        {p.rows.some((x) => !x.complete)
          ? 'Faltam entradas em alguns meses.'
          : p.rows.some((x) => x.after < 0)
            ? 'A compra ultrapassa o disponível em pelo menos um mês.'
            : 'A simulação mantém os meses acima de zero com os dados cadastrados.'}
      </p>
      {p.goalAfter !== null ? (
        <p className={'foot ' + String(p.goalAfter < 0 ? 'bad' : '')}>
          {'Meta geral até '}
          {monthLabelFromKey(monthKeyForIndex(GOAL.e))}
          {': '}
          {p.goalAfter < 0
            ? 'faltariam ' + brl(-p.goalAfter / 100)
            : 'restariam ' + brl(p.goalAfter / 100) + ' além da meta'}
          {' na projeção acumulada após esta compra. A reserva informada não é adicionada ao saldo.'}
        </p>
      ) : (
        ''
      )}
      <p className="foot">
        {'Sua parte: '}
        <b>{brl(p.totalCents / 100)}</b>
        {' · Reserva: '}
        {brl(plan.reservedCents / 100)}
        {' (apenas acompanhamento).'}
      </p>
    </div>
  </>
));}catch(e){return (<p className="foot bad">{esc(errorDetails(e).message)}</p>);}}
function shoppingPlanForm(){const x:Omit<ShoppingPlan,'id'|'status'>&{id?:string;status?:string}=CART.find(x=>x.id===editPlanId&&x.status==='planned')||{name:'',targetCents:0,priceCents:0,shippingCents:0,reservedCents:0,date:defaultDateForMonth(S.m),installments:1,priority:'normal',category:'Gastos Essenciais',goal:false,people:[],url:''};return ((
  <details className="plan-editor plan-editor-floating floating-action-editor" open={!!editPlanId}>
    <summary className="btn">
      {ICON.plus}
      <span>{editPlanId ? 'Editar compra' : 'Compra planejada'}</span>
    </summary>
    <form data-shopping-form="plan" data-id={esc(x.id || '')} className="compact-form product-form">
      <label className="full">
        {'Produto'}
        <input
          name="name"
          value={esc(x.name)}
          maxLength={120}
          placeholder="Nome do produto"
          required={true}
        />
      </label>
      <label>
        {'Preço alvo (R$)'}
        <input
          name="targetCents"
          inputMode="decimal"
          value={x.targetCents ? shoppingMoney(x.targetCents) : ''}
          required={true}
        />
      </label>
      <label>
        {'Preço atual (R$)'}
        <input
          name="priceCents"
          inputMode="decimal"
          value={x.priceCents ? shoppingMoney(x.priceCents) : ''}
          required={true}
        />
      </label>
      <label>
        {'Frete (R$)'}
        <input
          name="shippingCents"
          inputMode="decimal"
          value={shoppingMoney(x.shippingCents)}
          required={true}
        />
      </label>
      <label>
        {'Reserva (R$)'}
        <input
          name="reservedCents"
          inputMode="decimal"
          value={shoppingMoney(x.reservedCents)}
          required={true}
        />
      </label>
      <label>
        {'Compra / 1ª parcela'}
        <input
          name="date"
          type="date"
          min={MIN_DATE}
          max={String(monthKeyForIndex(MAX_MONTHS - 1)) + '-30'}
          value={x.date}
          required={true}
        />
      </label>
      <label>
        {'Parcelas'}
        <input name="installments" type="number" min="1" max="24" value={x.installments} required={true} />
      </label>
      <label>
        {'Prioridade'}
        <select name="priority">
          {viewList(
            ['alta', 'normal', 'baixa'].map((v) => (
              <option value={v} selected={v === x.priority}>
                {v === 'alta' ? 'Alta' : v === 'baixa' ? 'Baixa' : 'Normal'}
              </option>
            )),
          )}
        </select>
      </label>
      <label>
        {'Categoria'}
        <select name="category">
          {viewList(CATS.map((c) => <option selected={c === x.category}>{c}</option>))}
        </select>
      </label>
      <label className="full">
        {'Dividir com'}
        <input name="people" value={esc(x.people.join(', '))} placeholder="Nomes separados por vírgula" />
      </label>
      <label className="full">
        {'Link do produto'}
        <input name="url" type="url" value={esc(x.url)} placeholder="https://" />
      </label>
      <div className="full">
        <button type="button" className="btn g" data-import-product="">
          {'Buscar produto'}
        </button>
        <p role="status" data-product-status=""></p>
        <div data-product-preview="">
          {x.image || x.specs?.length ? productPreview({ ...x, specs: x.specs || [] }) : ''}
        </div>
        <input type="hidden" name="image" value={esc(x.image || '')} />
        <input type="hidden" name="specs" value={esc(JSON.stringify(x.specs || []))} />
      </div>
      {CARDS.length ? (
        <label>
          {'Cartão (opcional)'}
          <select name="creditCardId" aria-label="Cartão (opcional)">
            {creditCardOptions(x.creditCardId || '')}
          </select>
        </label>
      ) : (
        ''
      )}
      <label className="chk full">
        <input name="goal" type="checkbox" checked={x.goal} />
        {'Incluir na meta'}
      </label>
      <p className="foot full">
        {'Preço alvo inclui frete. Inclua juros no preço. Divisão igual, com ajuste de centavos.'}
      </p>
      <div id="shoppingLiveProjection" className="full">
        {x.priceCents ? projectionView(x) : ''}
      </div>
      <div className="plan-actions full">
        <button className="btn">{'Salvar'}</button>
        {editPlanId ? (
          <button type="button" className="btn g" data-shop-action="cancel-edit">
            {'Cancelar'}
          </button>
        ) : (
          ''
        )}
      </div>
      <p className="foot full" data-shopping-error="" role="alert"></p>
    </form>
  </details>
));}
function readPlanForm(form:HTMLFormElement){const d=new FormData(form),money=(key: string)=>{const n=parseMoney(d.get(key));if(!isSafeInteger(n))throw Error('Preencha os valores com até duas casas decimais.');return n;};return validateShopping({id:form.dataset.id!||'draft',name:String(d.get('name')||''),targetCents:money('targetCents'),priceCents:money('priceCents'),shippingCents:money('shippingCents'),reservedCents:money('reservedCents'),date:String(d.get('date')),installments:Number(d.get('installments')),priority:d.get('priority') as string,category:d.get('category') as string,goal:d.has('goal'),affiliate:!!CART.find(x=>x.id===form.dataset.id!)?.affiliate,creditCardId:String(d.get('creditCardId')||''),people:String(d.get('people')||'').split(',').map(n=>n.trim()).filter(Boolean),url:String(d.get('url')||''),image:String(d.get('image')||''),specs:JSON.parse(String(d.get('specs')||'[]'))},'cart');}
function planCard(x:ShoppingPlan){const total=x.priceCents!+x.shippingCents!;return ((
  <article className="card finance-layout-card plan-card">
    {x.image ? (
      <img
        className="product-photo"
        src={esc(x.image)}
        alt={esc(x.name)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    ) : (
      ''
    )}
    {x.specs?.length ? <ul>{viewList(x.specs.map((v) => <li>{esc(v)}</li>))}</ul> : ''}
    <div className="row">
      <div>
        <span className="tag">
          {x.priority === 'alta' ? 'Prioridade alta' : x.priority === 'baixa' ? 'Sem pressa' : 'Planejado'}
        </span>
        <h2>{esc(x.name)}</h2>
      </div>
      <strong>{brl(total / 100)}</strong>
    </div>
    <p className="foot">
      {'Alvo: '}
      {brl(x.targetCents / 100)}
      {' · '}
      {dateLong(x.date)}
      {' · '}
      {x.installments}
      {' parcela(s)'}
      {x.people.length ? ' · ' + (x.people.length + 1) + ' pessoas' : ''}
    </p>
    <span className="tag">{total <= x.targetCents ? 'Dentro do alvo' : 'Acima do alvo'}</span>
    {x.url ? (
      <>
        {' '}
        <a
          className="plan-link"
          href={esc(x.url)}
          target="_blank"
          rel={'noopener noreferrer' + String(x.affiliate ? ' sponsored' : '')}
        >
          {x.affiliate ? 'Ver produto · link de afiliado' : 'Ver produto'}
          {' ↗'}
        </a>
      </>
    ) : (
      ''
    )}
    <details className="plan-detail">
      <summary>{'Simulação mensal'}</summary>
      {projectionView(x)}
    </details>
    <div className="plan-actions">
      <button className="btn g" data-shop-action="edit-plan" data-id={x.id}>
        {'Editar'}
      </button>
      <button className="btn" data-shop-action="review-purchase" data-id={x.id}>
        {'Já comprei'}
      </button>
      <button className="btn g" data-shop-action="delete-plan" data-id={x.id}>
        {'Remover'}
      </button>
    </div>
    <details className="purchase-friend-share">
      <summary>{'Compartilhar'}</summary>
      {friendDivisionForm(x)}
    </details>
  </article>
));}
function purchaseReviewView(){const x=CART.find(x=>x.id===purchaseReview?.id&&x.status==='planned');if(!x)return '';return ((
  <section className="card finance-layout-card purchase-review" role="region" aria-label="Conferir compra">
    <h2>
      {'Conferir '}
      {esc(x.name)}
    </h2>
    <p className="foot">
      {'Total final: '}
      {brl((x.priceCents! + x.shippingCents!) / 100)}
      {'. '}
      {x.installments}
      {' parcela(s), a partir de '}
      {dateLong(x.date)}
      {'. '}
      {x.people.length
        ? 'Apenas sua parte será registrada; cada parcela terá uma divisão salva.'
        : 'Os gastos serão adicionados ao calendário nas datas das parcelas.'}
      {' Revise o planejamento se preço, frete ou data mudaram.'}
    </p>
    {projectionView(x)}
    <form data-shopping-form="confirm">
      <label>
        {'Cartão'}
        <select name="purchaseCard" aria-label="Cartão para compra">
          {creditCardOptions(x.creditCardId || '')}
        </select>
      </label>
      <p className="foot">
        {'Obrigatório para parcelamento. Sem cartão, a compra à vista será registrada como Pix.'}
      </p>
      <label className="chk">
        <input type="checkbox" name="confirmed" required={true} />
        {'Conferi os valores e já comprei'}
      </label>
      <div className="plan-actions">
        <button className="btn">{'Confirmar'}</button>
        <button type="button" className="btn g" data-shop-action="cancel-review">
          {'Voltar'}
        </button>
      </div>
      <p data-shopping-error="" role="alert" className="foot bad"></p>
    </form>
  </section>
));}
function vCart(){return rendervCart(viewContext);}
function vCards(){return rendervCards(viewContext);}
function vOffers(){return rendervOffers(viewContext);}
function updatePlanProjection(form:HTMLFormElement){if(!form.isConnected)return;const box=form.querySelector<HTMLElement>('#shoppingLiveProjection');try{renderView(box,projectionView(readPlanForm(form)));}catch{renderView(box,(<p className="foot">{'Preencha nome, valores, data e parcelas para visualizar a simulação.'}</p>));}}
let planProjectionTimer:ReturnType<typeof setTimeout>|undefined;
document.addEventListener('input',e=>{const form=(e.target as HTMLInputElement).closest<HTMLFormElement>('[data-shopping-form="plan"]');if(!form)return;clearTimeout(planProjectionTimer);planProjectionTimer=setTimeout(()=>updatePlanProjection(form),120);});
document.addEventListener('submit',e=>{const form=(e.target as HTMLFormElement).closest<HTMLFormElement>('[data-shopping-form]');if(!form)return;e.preventDefault();try{if(form.dataset.shoppingForm==='plan'){const record:Partial<ShoppingPlan>=readPlanForm(form);record.id=form.dataset.id!||undefined;saveShopping(record,'cart');editPlanId='';purchaseReview=null;}else{confirmPlannedPurchase(purchaseReview?.id,form.querySelector<HTMLInputElement>('[name="confirmed"]')!.checked,purchaseReview?.expected,form.querySelector<HTMLInputElement>('[name="purchaseCard"]')!.value);purchaseReview=null;}clearTransientError();draw();}catch(error){form.querySelectorAll<HTMLElement>('.progressive-fields').forEach(node=>node.dispatchEvent(new Event('plan-expand-details')));form.querySelector<HTMLElement>('[data-shopping-error]')!.textContent=errorDetails(error).message;}});
document.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-shop-action]');if(!b)return;const action=b.dataset.shopAction!,id=b.dataset.id!;safely(()=>{if(action==='edit-plan'){editPlanId=id;purchaseReview=null;}if(action==='cancel-edit')editPlanId='';if(action==='delete-plan'){CART=CART.filter(x=>x.id!==id||x.status==='purchased');if(editPlanId===id)editPlanId='';if(purchaseReview?.id===id)purchaseReview=null;saveWorkspace();}if(action==='review-purchase'){const p=CART.find(x=>x.id===id&&x.status==='planned');if(p)purchaseReview={id,expected:JSON.stringify(p)};}if(action==='cancel-review')purchaseReview=null;draw();});if(['edit-plan','review-purchase'].includes(action)){scrollTo(0,0);const target=action==='review-purchase'?$('.purchase-review h2'):$('.plan-editor input');target?.setAttribute('tabindex','-1');target?.focus();}});

let splitMonth:string|null=null;
function splitMonthKey(split:Split){return /^\d{4}-\d{2}-\d{2}$/.test(split.date||'')?split.date.slice(0,7):'undated';}
function splitMonthlyTotals(splits:Split[]){const totals=new Map();for(const x of splits){const key=splitMonthKey(x);totals.set(key,(totals.get(key)||0)+x.cents);}return [...totals].sort(([a],[b])=>a.localeCompare(b)).map(([month,cents])=>({month,cents}));}
function splitMonthLabel(key:string|null){if(key==='undated')return 'Sem data';const [year,month]=key!.split('-');return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][Number(month)-1]+'/'+year.slice(-2);}
function vSplit(){return rendervSplit(viewContext);}
function vDivision(){
 const months=splitMonthlyTotals(SPLITS),preferred=monthKeyForIndex(S.m);
 if(!months.some(x=>x.month===splitMonth))splitMonth=months.some(x=>x.month===preferred)?preferred:months.at(-1)?.month||null;
 const selected=SPLITS.filter(x=>splitMonthKey(x)===splitMonth),total=selected.reduce((n,x)=>n+x.cents,0),chartMonths=months.filter(x=>x.month!=='undated').slice(-12),max=Math.max(1,...chartMonths.map(x=>x.cents));
 return ((
  <>
    <h2>{'Divisão de gastos'}</h2>
    <details className="floating-action-editor">
      <summary className="btn">
        {ICON.plus}
        <span>{'Dividir com amigo'}</span>
      </summary>
      <section className="card">{friendDivisionForm()}</section>
    </details>
    {social.shares.length ? (
      <section className="card">
        <h3>{'Divisões com amigos'}</h3>
        {viewList(social.shares.map(shareMarkup))}
      </section>
    ) : (
      ''
    )}
    {SPLITS.length ? (
      <section className="card split-monthly-card">
        <div className="split-monthly-header">
          <h2>{'Gastos divididos'}</h2>
          <label className="split-month-picker">
            {'Mês'}
            <select id="splitMonth">
              {viewList(
                months.map((x) => (
                  <option value={x.month} selected={x.month === splitMonth}>
                    {splitMonthLabel(x.month)}
                  </option>
                )),
              )}
            </select>
          </label>
        </div>
        <strong className="split-month-total">{brl(total / 100)}</strong>
        <p className="foot">
          {'Valor total dividido · '}
          {selected.length} {selected.length === 1 ? 'gasto' : 'gastos'}
          {' em '}
          {splitMonthLabel(splitMonth)}
        </p>
        {chartMonths.length ? (
          <div className="split-month-chart" role="img" aria-label="Valores totais divididos por mês">
            <div className="split-month-bars">
              {viewList(
                chartMonths.map((x) => (
                  <div className={'split-month-column ' + String(x.month === splitMonth ? 'selected' : '')}>
                    <span>{brl(x.cents / 100)}</span>
                    <div className="split-month-track">
                      <i style={{ height: String((x.cents / max) * 100) + '%' }}></i>
                    </div>
                    <small>{splitMonthLabel(x.month)}</small>
                  </div>
                )),
              )}
            </div>
          </div>
        ) : (
          ''
        )}
        {splitPaymentsChart(selected)}
        <div className="split-month-details">
          <h3>{'Detalhes do mês'}</h3>
          {viewList(
            selected.map((x) => {
              const active = S.items.some((item) => item.id === x.expenseId),
                shares = splitShares(x.cents, x.people.length, x.shareOffset ?? 0);
              return (
                <div className="split-block">
                  <div className="row">
                    <h3>{esc(x.name)}</h3>
                    <strong>{brl(x.cents / 100)}</strong>
                    <button
                      className="ib"
                      data-feature="split-delete"
                      data-id={x.id}
                      aria-label={
                        'Excluir divisão ' + String(esc(x.name)) + String(active ? ' e seu gasto' : '')
                      }
                    >
                      {'×'}
                    </button>
                  </div>
                  {viewList(
                    x.people.map((name, i) => (
                      <div className="split-person">
                        <span>
                          {esc(name)}
                          {i === x.ownIndex && name !== 'Você' ? ' · Você' : ''}
                        </span>
                        <b>{brl(shares[i] / 100)}</b>
                        <button
                          className="btn g"
                          type="button"
                          data-split-paid={i}
                          data-id={x.id}
                          aria-pressed={!!x.paid?.[i]}
                          aria-label={
                            String(x.paid?.[i] ? 'Desmarcar pagamento de' : 'Confirmar pagamento de') +
                            ' ' +
                            String(esc(name))
                          }
                        >
                          {x.paid?.[i] ? 'Pago' : 'Confirmar'}
                        </button>
                      </div>
                    )),
                  )}
                  <p className="foot">
                    {x.people.length}
                    {' pessoas · '}
                    {x.status
                      ? esc(x.status)
                      : x.date
                        ? dateLong(x.date) +
                          ' · ' +
                          (active ? 'Sua parte está em Entradas e no calendário' : 'Gasto vinculado removido')
                        : 'Divisão anterior sem lançamento vinculado'}
                  </p>
                </div>
              );
            }),
          )}
        </div>
      </section>
    ) : (
      <p className="foot split-empty">{'Nenhum gasto dividido.'}</p>
    )}
  </>
));
}
document.addEventListener('change',e=>{if((e.target as HTMLInputElement).id==='splitMonth'){splitMonth=(e.target as HTMLInputElement).value;draw();}});

let csvPreview:CsvPreview|null=null,csvGeneration=0,csvConvention='';
function csvRows(text:string){
 text=String(text).replace(/^\uFEFF/,'');const scores:Record<string,number>={';':0,',':0,'\t':0};let quote=false;
 for(let i=0;i<text.length&&text[i]!=='\n'&&text[i]!=='\r';i++){if(text[i]==='"'){if(quote&&text[i+1]==='"'){i++;continue;}quote=!quote;}else if(!quote&&text[i]in scores)scores[text[i]]++;}
 const separator=Object.keys(scores).sort((a,b)=>scores[b]-scores[a])[0];const rows=[];let row=[],value='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else if(!quoted&&value!=='')throw Error('Aspas em posição inválida no CSV.');else{quoted=!quoted;if(!quoted)closed=true;}}else if(!quoted&&c===separator){row.push(value);value='';closed=false;}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value='';closed=false;}else{if(closed&&!quoted&&!/\s/.test(c))throw Error('Texto após fechamento de aspas no CSV.');value+=c;}}
 if(quoted)throw Error('O CSV tem um campo com aspas não fechadas.');row.push(value);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
function parseCsvDate(value:unknown){const text=String(value||'').trim();let match=text.match(/^(\d{4})-(\d{2})-(\d{2})$/),date=match?text:'';if(!date){match=text.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);if(match)date=`${match[3].length===2?'20'+match[3]:match[3]}-${match[2]}-${match[1]}`;}return supportedDate(date)?date:'';}
function prepareCsv(text:string,convention:string){
 const rows=csvRows(text);if(!rows.length)throw Error('O arquivo está vazio.');if(rows.length>MAX_RECORDS+1)throw Error('Importe até '+MAX_RECORDS+' linhas por arquivo.');const fold=(v: string)=>String(v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const header=rows[0].map(fold),aliases={date:['data','date'],description:['descricao','description','historico'],value:['valor','value','amount'],type:['tipo','type']},columns:Record<string,number>={};for(const [key,names]of Object.entries(aliases))columns[key]=header.findIndex(h=>names.includes(h));let first=1;
 if(columns.date<0||columns.description<0||columns.value<0){if(parseCsvDate(rows[0][0])&&rows[0].length===3){Object.assign(columns,{date:0,description:1,value:2,type:-1});first=0;}else throw Error('Use as colunas data, descrição e valor. A coluna tipo é opcional.');}
 if(columns.type<0&&!['signed','expense','income'].includes(convention))throw Error('Escolha como interpretar os valores do extrato antes de importar.');
 const result:CsvPreview={records:[],errors:[],incomeCents:0,expenseCents:0};for(let i=first;i<rows.length;i++){const row=rows[i];try{if(row.length!==rows[0].length)throw Error('Quantidade de colunas diferente do cabeçalho');const date=parseCsvDate(row[columns.date]);if(!date)throw Error('Data inválida ou fora do intervalo');requireOpenDate(date);const label=row[columns.description].trim();if(!label||label.length>240)throw Error('Descrição vazia ou muito longa');const cents=parseMoney(row[columns.value]);if(!isSafeInteger(cents)||cents===0)throw Error('Valor inválido; use até duas casas decimais');let type;if(columns.type>=0){const raw=fold(row[columns.type]);if(['entrada','recebimento','receita','credito','income'].includes(raw))type='i';else if(['gasto','despesa','debito','expense'].includes(raw))type='g';else throw Error('Tipo deve ser entrada ou gasto');}else type=convention==='income'?'i':convention==='expense'?'g':cents>0?'i':'g';result.records.push({type,date,d:label,v:Math.abs(cents)/100});result[type==='i'?'incomeCents':'expenseCents']+=Math.abs(cents);}catch(e){result.errors.push({line:i+1,message:errorDetails(e).message});}}
 const fingerprint=(x:Pick<LedgerRecord,'date'|'d'|'v'>)=>[x.date,x.d,toCents(x.v)].join('|');result.matches=result.records.filter(r=>(r.type==='i'?S.receipts:S.items).some(x=>fingerprint(x)===fingerprint(r))).length;return result;
}
function csvPreviewView(){if(!csvPreview)return '';const p=csvPreview;return ((
  <div className="csv-preview" role="status">
    <h3>{'Confira antes de importar'}</h3>
    <p className="foot">
      {p.records.length}
      {' lançamento(s) válido(s) · '}
      {p.errors.length}
      {' linha(s) inválida(s), que não serão importadas.'}
    </p>
    <p className="foot">
      {'Entradas: '}
      {brl(p.incomeCents / 100)}
      {' · Gastos: '}
      {brl(p.expenseCents / 100)}
    </p>
    {p.matches ? (
      <p className="bad foot">
        {p.matches}
        {' lançamento(s) coincidem com registros já salvos. Confira para evitar duplicação.'}
      </p>
    ) : (
      ''
    )}
    {viewList(
      p.records.slice(0, 8).map((r: { d: unknown; date: string; type: string; v: unknown }) => (
        <div className="report-line">
          <span>
            {esc(r.d)}
            <small>
              {dateLabel(r.date)}
              {' · '}
              {r.type === 'i' ? 'Entrada' : 'Gasto'}
            </small>
          </span>
          <b>{brl(r.v)}</b>
        </div>
      )),
    )}
    {viewList(
      p.errors.slice(0, 10).map((r) => (
        <p className="foot bad">
          {'Linha '}
          {r.line}
          {': '}
          {esc(r.message)}
        </p>
      )),
    )}
    <div className="row">
      <button className="btn" data-a="csvapply" disabled={!p.records.length}>
        {'Importar '}
        {p.records.length}
        {' lançamento(s)'}
      </button>
      <button className="btn g" data-a="csvcancel">
        {'Cancelar'}
      </button>
    </div>
  </div>
));}
function applyCsv(){if(!csvPreview?.records.length)return;const preview=csvPreview,addedItems=preview.records.filter((x: { type: string; })=>x.type==='g'),addedReceipts=preview.records.filter((x: { type: string; })=>x.type==='i');if(S.items.length+addedItems.length>MAX_RECORDS||S.receipts.length+addedReceipts.length>MAX_RECORDS)throw Error('Limite de '+MAX_RECORDS+' lançamentos por lista atingido.');preview.records.forEach(({type,...r})=>{requireOpenDate(r.date);ensureDate(r.date);(type==='i'?S.receipts:S.items).push({id:newId(),...r,...(type==='g'?{c:'Gastos Variáveis',p:'Pix'}:{})} as Expense);});saveWorkspace();draw();return preview.records.length;}

function splitShares(cents:number,n:number,offset=0){return core_splitShares(engineContext,cents,n,offset);}
function registerSplit(name:string,cents:number,others:string[],date=todayISO(),shareOffset=0){
 if(typeof name!=='string'||!name.trim()||name.length>240||!Array.isArray(others)||!others.length||others.length>99||others.some(p=>typeof p!=='string'||!p.trim()||p.length>100)||!isSafeInteger(cents)||cents<1||cents>MAX_CENTS)throw Error('Informe a descrição, um valor válido e de 1 a 99 outras pessoas.');if(S.items.length>=MAX_RECORDS||SPLITS.length>=MAX_RECORDS)throw Error('Limite de registros atingido.');
 const people=[PROFILE.name||'Você',...others],shares=splitShares(cents,people.length,shareOffset),id=newId(),expenseId=shares[0]>0?newId():null;requireOpenDate(date);ensureDate(date);const split={id,name:name.trim(),cents,people,ownIndex:0,date,expenseId,shareOffset,status:shares[0]===0?'Sua parte é R$ 0,00 nesta parcela; nenhum gasto foi criado.':''};if(expenseId)S.items.push({id:expenseId,d:name+' · sua parte',v:shares[0]/100,c:'Gastos Variáveis',p:'Pix',date,splitId:id});SPLITS.push(split);saveWorkspace();S.m=monthIndexFromDate(date);S.calDate=date;return split;
}
document.addEventListener('input',e=>{const form=(e.target as HTMLInputElement).closest<HTMLFormElement>('[data-form="split"]');if(!form)return;const data=new FormData(form),cents=parseMoney(data.get('price')),others=String(data.get('people')||'').split(',').map(x=>x.trim()).filter(Boolean),count=others.length+1,box=$('#splitEstimate');if(box)box.textContent=isSafeInteger(cents)&&cents>0&&count<=100?'Sua parte: '+brl(splitShares(cents,count)[0]/100)+' · '+count+' pessoa(s) · registro em '+dateLong(todayISO()):'Informe um valor com até duas casas decimais e até 99 outras pessoas.';});
document.addEventListener('submit',e=>{const form=(e.target as HTMLFormElement).closest<HTMLFormElement>('[data-form]');if(!form)return;e.preventDefault();const data=new FormData(form),kind=form.dataset.form,name=String(data.get('name')||'').trim();try{atomic(()=>{if(!name)throw Error('Informe uma descrição ou nome.');if(kind==='profile'){if(name.length>60)throw Error('Use um nome de até 60 caracteres.');PROFILE.name=name;saveWorkspace();return;}if(kind==='split'){const price=moneyInput(form.querySelector<HTMLInputElement>('[name="price"]')),others=String(data.get('people')||'').split(',').map(x=>x.trim()).filter(Boolean);registerSplit(name,toCents(price),others);}});clearTransientError();draw();if(kind==='profile')$('#profileStatus').textContent='Nome salvo.';}catch(error){showError(error);}});
document.addEventListener('click',e=>{const filter=(e.target as HTMLElement).closest<HTMLElement>('[data-entry-filter]');if(filter){entryFilter=filter.dataset.entryFilter!;draw();return;}const ui=(e.target as HTMLElement).closest<HTMLElement>('[data-ui]');if(ui){if(ui.dataset.ui==='calendar'){if(getLayout().sections.calendar){S.tab='c';draw();}}else if(ui.dataset.ui==='theme')toggleTheme();return;}const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-feature="split-delete"]');if(!button)return;const id=button.dataset.id!;safely(()=>{const split=SPLITS.find(x=>x.id===id);if(!split)return;if(split.expenseId)S.items=S.items.filter(x=>!(x.id===split.expenseId&&x.splitId===split.id));SPLITS=SPLITS.filter(x=>x.id!==id);saveWorkspace();draw();});});
function toggleTheme(){try{const mode=document.documentElement.dataset.theme==='dark'?'light':'dark';put('plan12appearance',mode);applyAppearance(mode);}catch(e){showError(e);}}
var social:{friends:Friend[];shares:SharedExpense[];error:string;busy:boolean}={friends:[],shares:[],error:'',busy:false},notificationsOpen=false;
const socialUser=()=>window.planAuth.user?.id;
function friendCode(f:Friend){return f.sender===socialUser()?f.recipient:f.sender;}
function acceptedFriends(){return social.friends.filter(f=>f.status==='accepted');}
function friendOptions(){return viewList(acceptedFriends().map(f=>((
  <option value={esc(friendCode(f))}>
    {esc(usernames[friendCode(f)] ? '@' + usernames[friendCode(f)] : 'Amigo')}
  </option>
))));}
function friendDivisionForm(plan?:ShoppingPlan){if(!socialUser())return (<p className="foot">{'Entre com Google para dividir com amigos.'}</p>);if(!acceptedFriends().length)return (<p className="foot">{'Adicione um amigo e aguarde o aceite para compartilhar.'}</p>);return ((
  <form data-social="share" className="compact-form product-form">
    <label>
      {'Amigo'}
      <select name="friend" required={true}>
        <option value="">{'Selecione'}</option>
        {friendOptions()}
      </select>
    </label>
    <label>
      {'Descrição'}
      <input
        name="description"
        maxLength={120}
        required={true}
        value={esc(plan ? ('Compra planejada: ' + plan.name).slice(0, 120) : '')}
      />
    </label>
    <label>
      {'Total (R$)'}
      <input
        name="amount"
        inputMode="decimal"
        required={true}
        value={plan ? shoppingMoney(plan.priceCents + plan.shippingCents) : ''}
      />
    </label>
    <button className="btn" type="submit">
      {plan ? 'Compartilhar compra' : 'Enviar divisão'}
    </button>
    <p className="foot full">{'Divisão igual. Cada pessoa confirma sua parte; enviar não cria gastos.'}</p>
  </form>
));}
function socialView(){if(!socialUser())return ((
  <section className="card">
    <h2>{'Amigos'}</h2>
    <button className="btn" type="button" disabled={true}>
      {'Adicionar amigo'}
    </button>
    <p className="foot">{'Entre com Google para adicionar amigos.'}</p>
    <h3>{'Seus amigos'}</h3>
    <p className="foot">{'Nenhum amigo adicionado.'}</p>
  </section>
));return ((
  <>
    <details className="floating-action-editor">
      <summary className="btn">
        {ICON.plus}
        <span>{'Adicionar amigo'}</span>
      </summary>
      <form data-social="friend" className="card compact-form">
        <label>
          {'Usuário do amigo'}
          <input name="code" required={true} maxLength={41} placeholder="@usuario" />
        </label>
        <button className="btn" type="submit">
          {'Enviar pedido'}
        </button>
      </form>
    </details>
    <section className="card">
      <h2>{'Seus amigos'}</h2>
      {social.error ? (
        <p role="alert" className="bad">
          {esc(social.error)}
        </p>
      ) : (
        ''
      )}
      {viewList(
        social.friends.map((f) => (
          <div className="social-row">
            <span>
              {esc(usernames[friendCode(f)] ? '@' + usernames[friendCode(f)] : 'Amigo')}
              <small>
                {f.status === 'accepted' ? 'Adicionado' : f.status === 'declined' ? 'Recusado' : 'Pendente'}
              </small>
            </span>
            {f.recipient === socialUser() && f.status === 'pending' ? (
              <>
                <button className="btn" data-social-action="friend-accept" data-id={f.id}>
                  {'Aceitar'}
                </button>
                <button className="btn g" data-social-action="friend-decline" data-id={f.id}>
                  {'Recusar'}
                </button>
              </>
            ) : (
              ''
            )}
          </div>
        )),
      ) || <p className="foot">{'Nenhum amigo adicionado.'}</p>}
      <button className="btn g" data-social-action="refresh">
        {'Atualizar'}
      </button>
    </section>
  </>
));}

function shareMarkup(x:SharedExpense){const mine=x.sender===socialUser(),c=mine?Math.ceil(x.cents/2):Math.floor(x.cents/2);return ((
  <div className="social-row">
    <span>
      {esc(x.description)}
      <small>
        {mine ? 'Enviada' : 'Recebida'}
        {' · '}
        {dateLong(x.expense_date)}
        {' · Sua parte '}
        {brl(c / 100)}
        {' · '}
        {x.status === 'accepted' ? 'Aceita' : x.status === 'declined' ? 'Recusada' : 'Pendente'}
      </small>
    </span>
    {!mine && x.status === 'pending' ? (
      <>
        <button className="btn" data-social-action="share-accept" data-id={x.id}>
          {'Aceitar'}
        </button>
        <button className="btn g" data-social-action="share-decline" data-id={x.id}>
          {'Recusar'}
        </button>
      </>
    ) : (
      ''
    )}
    {(mine || x.status === 'accepted') && !S.items.some((i) => i.id === 'shared-' + x.id) ? (
      <button className="btn g" data-social-action="record" data-id={x.id}>
        {'Registrar parte'}
      </button>
    ) : (
      ''
    )}
  </div>
));}
async function refreshSocial(redraw=true){if(!socialUser()||social.busy)return;social.busy=true;try{const results=await Promise.all([window.planAuth.client!.from('app_friends').select('*').order('created_at',{ascending:false}).limit(100),window.planAuth.client!.from('app_shared_expenses').select('*').order('created_at',{ascending:false}).limit(100)]);for(const r of results)if(r.error)throw r.error;social.friends=results[0].data!;social.shares=results[1].data!;await refreshUsernames();social.error='';}catch(e){social.error='Não foi possível atualizar amigos e divisões. Tente novamente.';}finally{social.busy=false;renderNotifications();if(redraw&&['friends','profile'].includes(accountPanel!)&&$('#accountOverlay')?.open){renderAccountPanel();$('#accountOverlay [data-close-account]')?.focus({preventScroll:true});}else if(redraw&&(['s','u','i','k'].includes(S.tab)||S.tab==='d'&&areaViews.commitments==='friends')&&!document.activeElement?.closest('form'))draw();}}
function notificationRows(){const prefs=readNotificationPreferences(localStorage),dismissed=readDismissedNotifications(localStorage);return [...social.friends.filter(f=>f.recipient===socialUser()&&f.status==='pending').map(f=>({id:'friend-'+f.id,date:f.created_at,title:'Pedido de amizade',subtitle:'Convite recebido',text:'Novo pedido de amizade',tab:'s',kind:'friends' as const})),...social.shares.map(x=>({id:'share-'+x.id+'-'+x.status,date:x.updated_at||x.created_at||x.expense_date,title:x.description,subtitle:x.sender===socialUser()?'Divisão enviada':'Divisão recebida',recipient:usernames[x.recipient]?'Para: @'+usernames[x.recipient]:'',amount:brl(x.cents/100),status:x.status==='declined'?'Recusada':x.status==='accepted'?'Aceita':'Pendente',error:x.status==='declined',text:(x.sender===socialUser()?'Divisão enviada: ':'Divisão recebida: ')+x.description+' · '+(x.status==='pending'?'Pendente':x.status==='accepted'?'Aceita':'Recusada'),tab:'s',kind:'shares' as const})),...Object.values(CLOSED_REPORTS).map(r=>({id:'report-'+r.key,date:r.closedOn,title:'Relatório mensal',subtitle:r.label,text:'Relatório mensal disponível: '+r.label,tab:'reports',kind:'reports' as const})),...S.items.slice(-30).reverse().map(i=>({id:'expense-'+i.id,date:i.date,title:i.d,subtitle:i.c,amount:brl(i.v),text:'Gasto registrado: '+i.d+' · '+brl(i.v),tab:'i',kind:'expenses' as const}))].filter(row=>prefs[row.kind]&&!dismissed.has(row.id));}
let notificationUnread:string[]=[];
finance.notifications={
 getState:()=>({isOpen:notificationsOpen,rows:notificationRows().map(r=>({...r,unread:notificationUnread.includes(r.id)}))}),
 close(){notificationsOpen=false;renderNotifications();},
 clear(){clearNotificationRows(localStorage,notificationRows());notificationUnread=[];renderNotifications();},
 settings(){accountSettingsTab='notifications';openAccountPanel('settings',$('#notificationButton'));}
};
function renderNotifications(){const button=$('#notificationButton');if(!button)return;const rows=notificationRows(),seen=load<string[]>('plan12notifications',[],Array.isArray);renderView(button,((
  <>
    <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4"></path>
    </svg>
    <span>{rows.filter((r) => !seen.includes(r.id)).length || ''}</span>
  </>
)));button.setAttribute('aria-expanded',String(notificationsOpen));button.setAttribute('aria-haspopup','dialog');notificationStore.publish(finance.notifications.getState());dispatchEvent(new Event('plan-notifications-change'));}
document.addEventListener('submit',async e=>{const f=(e.target as HTMLFormElement).closest<HTMLFormElement>('[data-social]');if(!f)return;e.preventDefault();if(social.busy)return;social.busy=true;const submit=f.querySelector('button');submit!.disabled=true;try{const data=new FormData(f),me=socialUser();if(!me)throw Error('Entre com Google.');let result;if(f.dataset.social==='friend'){const username=normalizeUsername(data.get('code'));if(!validUsername(username))throw Error('Informe um @usuário válido.');const lookup=await window.planAuth.client!.from('app_usernames').select('user_id').eq('username',username).maybeSingle();if(lookup.error)throw Error('Não foi possível buscar este usuário.');const code=lookup.data?.user_id;if(!code)throw Error('Usuário não encontrado.');if(code===me)throw Error('Escolha outra pessoa.');if(social.friends.some(x=>friendCode(x)===code&&x.status!=='declined'))throw Error('Já existe um pedido para essa pessoa.');result=await window.planAuth.client!.from('app_friends').insert({sender:me,recipient:code});}else{const cents=toCents(moneyInput(f.querySelector<HTMLInputElement>('[name=amount]'))),recipient=String(data.get('friend')),description=String(data.get('description')).trim();if(!description||description.length>120||cents<2||cents>100000000||!social.friends.some(x=>x.status==='accepted'&&friendCode(x)===recipient))throw Error('Confira o amigo, a descrição e o valor (mínimo R$ 0,02).');result=await window.planAuth.client!.from('app_shared_expenses').insert({sender:me,recipient,description,cents,expense_date:todayISO()});}if(result.error)throw Error('Não foi possível enviar. Confira o usuário, a conexão e se o pedido já existe.');f.reset();social.error='';}catch(e){social.error=errorDetails(e).message;}finally{social.busy=false;submit!.disabled=false;if(social.error){showError(Error(social.error));}else await refreshSocial();}});
document.addEventListener('click',async e=>{const toggle=(e.target as HTMLElement).closest<HTMLElement>('#notificationButton'),go=(e.target as HTMLElement).closest<HTMLElement>('[data-notification-tab]');if(toggle){notificationsOpen=!notificationsOpen;if(notificationsOpen){const seen=load<string[]>('plan12notifications',[],Array.isArray);notificationUnread=notificationRows().filter(x=>!seen.includes(x.id)).map(x=>x.id);put('plan12notifications',notificationRows().map(x=>x.id));}renderNotifications();return;}if(go){notificationsOpen=false;renderNotifications();if(go.dataset.notificationTab! ==='reports'){renderNotifications();openAccountPanel('reports');}else{S.tab=go.dataset.notificationTab!;draw();}return;}const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-social-action]');if(!b)return;const a=b.dataset.socialAction!,id=b.dataset.id!;if(a==='close-notifications'){notificationsOpen=false;renderNotifications();return;}if(a==='refresh'){await refreshSocial();return;}if(social.busy)return;b.disabled=true;try{if(a==='record'){const x=social.shares.find(x=>x.id===id);if(!x||(x.sender!==socialUser()&&x.status!=='accepted'))throw Error('Aceite a divisão primeiro.');atomic(()=>{const key='shared-'+x.id;if(S.items.some(i=>i.id===key))return;ensureDate(x.expense_date);if(S.items.length>=MAX_RECORDS)throw Error('Limite de registros atingido.');S.items.push({id:key,d:x.description,v:(x.sender===socialUser()?Math.ceil(x.cents/2):Math.floor(x.cents/2))/100,c:'Gastos Variáveis',p:PAY[0],date:x.expense_date});saveWorkspace();});draw();}else{const table=a.startsWith('friend-')?'app_friends':'app_shared_expenses',status=a.endsWith('accept')?'accepted':'declined';const r=await window.planAuth.client!.from(table).update({status}).eq('id',id).eq('recipient',socialUser()).eq('status','pending').select('id');if(r.error||!r.data?.length)throw Error('Não foi possível atualizar este convite.');await refreshSocial();}}catch(err){showError(err);}finally{b.disabled=false;}});
addEventListener('plan-navigation-change',()=>renderNotifications());
addEventListener('plan-notification-preferences-change',()=>renderNotifications());
addEventListener('storage',e=>{if(e.key===null||[window.planAuth.key('plan12notificationPreferences'),window.planAuth.key('plan12notifications'),window.planAuth.key(DISMISSED_NOTIFICATIONS_KEY)].includes(e.key))renderNotifications()});
setInterval(()=>{if(document.visibilityState==='visible')refreshSocial(false);},30000);
queueMicrotask(()=>refreshSocial());

function spreadsheetCSV(){
 const cell=(value:unknown)=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 const rows=[['Data','Tipo','Descrição','Categoria','Pagamento','Valor (R$)'],...[...S.items.map(x=>({...x,type:'Gasto'})),...S.receipts.map(x=>({...x,type:'Entrada'}))].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(x=>[x.date||'',x.type,x.d,x.c||'',x.p||'',Number(x.v).toFixed(2).replace('.',',')])];
 return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
document.addEventListener('click',e=>{if(!(e.target as HTMLElement).closest<HTMLElement>('#exportSpreadsheet'))return;try{const url=URL.createObjectURL(new Blob([spreadsheetCSV()],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='TEFinance-lancamentos-'+todayISO()+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){showError(error);}});
let arrangeCards=false;
function prepareSummary(markup:import('react').ReactNode){
 if(S.tab!=='r'||summaryMode==='behavior')return markup;
 return arrangeSummary(markup,load<string[]>('plan12cardOrder',[],Array.isArray),arrangeCards);
}
document.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLElement>('[data-finish-arrange]')){arrangeCards=false;draw();return;}const b=(e.target as HTMLElement).closest<HTMLElement>('[data-move-card]');if(!b)return;const card=b.closest<HTMLElement>('[data-card-key]'),all=[...$('#app').querySelectorAll<HTMLElement>(':scope > [data-card-key]')],index=all.indexOf(card!),next=index+Number(b.dataset.moveCard);if(next<0||next>=all.length)return;[all[index],all[next]]=[all[next],all[index]];try{localStorage.setItem('plan12cardOrder',JSON.stringify(all.map(c=>c.dataset.cardKey)));draw();}catch(error){showError(error);}});
let receiptWorker:OcrWorker|null=null,receiptGeneration=0;
function openReceipt(){let dialog=$('#receiptDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='receiptDialog';document.body.append(dialog);}renderView(dialog,((
  <>
    <div className="row">
      <h2>{'Ler nota'}</h2>
      <button className="btn g" id="receiptClose">
        {'Cancelar'}
      </button>
    </div>
    <p className="foot">
      {
        'Foto JPG/PNG, XML da NF-e ou texto (até 10 MB). A leitura ocorre neste navegador; imagens precisam de internet para carregar o leitor. PDF não é aceito.'
      }
    </p>
    <label>
      {'Arquivo'}
      <input id="receiptFile" type="file" accept="image/jpeg,image/png,.xml,.txt" />
    </label>
    <p id="receiptStatus" role="status"></p>
    <form id="receiptForm" hidden={true} className="compact-form">
      <label>
        {'Itens identificados'}
        <textarea id="receiptItems" rows={5}></textarea>
      </label>
      <p className="foot">{'Revise itens e total: a leitura pode errar. Será salvo um único gasto.'}</p>
      <label>
        {'Descrição resumida'}
        <input id="receiptName" maxLength={240} required={true} />
      </label>
      <label>
        {'Total (R$)'}
        <input id="receiptTotal" inputMode="decimal" required={true} />
      </label>
      <label>
        {'Data'}
        <input id="receiptDate" type="date" value={todayISO()} required={true} />
      </label>
      <label>
        {'Categoria'}
        <select id="receiptCategory">{viewList(CATS.map((c) => <option>{esc(c)}</option>))}</select>
      </label>
      <label>
        {'Pagamento'}
        <select id="receiptPayment">{viewList(PAY.map((p) => <option>{esc(p)}</option>))}</select>
      </label>
      <label>
        {'Cartão'}
        <select id="receiptCard">{creditCardOptions()}</select>
      </label>
      <label className="chk">
        <input type="checkbox" required={true} />
        {'Conferi o total e os dados'}
      </label>
      <button className="btn">{'Registrar gasto'}</button>
    </form>
  </>
)));dialog.showModal();$('#receiptClose').onclick=()=>dialog.close();dialog.onclose=()=>{receiptGeneration++;receiptWorker?.terminate();receiptWorker=null;};$('#receiptFile').onchange=readReceipt;$('#receiptForm').onsubmit=e=>{e.preventDefault();try{saveExpense({d:$('#receiptName').value.trim(),v:moneyInput($('#receiptTotal')),date:$('#receiptDate').value,c:$('#receiptCategory').value,p:$('#receiptPayment').value,...($('#receiptPayment').value==='Cartão de crédito'?{creditCardId:$('#receiptCard').value,creditPaid:false}:{})},null);dialog.close();draw();}catch(err){$('#receiptStatus').textContent=errorDetails(err).message;}};}
function parseReceiptText(text:string){const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);const candidates=lines.filter(l=>/(total|valor a pagar)/i.test(l)&&!/(subtotal|tribut|imposto|desconto|itens)/i.test(l));const match=candidates.at(-1)?.match(/\d[\d.]*,\d{2}/g);return {items:lines.filter(l=>/\d+,\d{2}/.test(l)&&!/(cnpj|cpf|tribut|total|troco|pagamento)/i.test(l)).slice(0,80).join('\n'),total:match?.at(-1)||'',name:lines.filter(l=>/\d+,\d{2}/.test(l)&&!/(total|cnpj|cpf|troco|tribut|pagamento)/i.test(l)).slice(0,3).map(l=>l.replace(/\d[\d.]*,\d{2}/g,'').trim()).join(', ').slice(0,230)||'Compra — nota fiscal',date:''};}
async function readReceipt(){const f=$('#receiptFile').files![0];if(!f)return;const generation=++receiptGeneration;$('#receiptForm').hidden=true;$('#receiptStatus').textContent='Lendo…';let worker;try{if(f.size>10*1024*1024)throw Error('Use um arquivo de até 10 MB.');let result;if(/\.xml$/i.test(f.name)){const text=await f.text();if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML não suportado.');const xml=new DOMParser().parseFromString(text,'application/xml');if(xml.querySelector('parsererror'))throw Error('XML inválido.');const tag=(root: Element|Document,n: string)=>root.getElementsByTagNameNS('*',n)[0]?.textContent||'';const products=[...xml.getElementsByTagNameNS('*','det')].map(d=>tag(d,'xProd'));const total=tag(xml,'vNF');if(!/^\d+(\.\d{1,2})?$/.test(total))throw Error('Total da NF-e não encontrado.');result={items:products.join('\n'),name:products.slice(0,3).join(', ').slice(0,230)||'Compra — nota fiscal',total:Number(total).toFixed(2).replace('.',','),date:(tag(xml,'dhEmi')||tag(xml,'dEmi')).slice(0,10)};}else if(/\.txt$/i.test(f.name)){result=parseReceiptText(await f.text());}else if(['image/jpeg','image/png'].includes(f.type)){if(!window.Tesseract)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Leitor indisponível. Tente novamente com internet ou use XML.'));};document.head.append(script);});if(generation!==receiptGeneration)return;worker=await Tesseract.createWorker('por');receiptWorker=worker;const response=await worker.recognize(f);result=parseReceiptText(response.data.text);}else throw Error('Envie JPG, PNG, XML ou TXT.');if(generation!==receiptGeneration)return;$('#receiptItems').value=result.items;$('#receiptName').value=result.name;$('#receiptTotal').value=result.total;if(result.date&&supportedDate(result.date))$('#receiptDate').value=result.date;$('#receiptForm').hidden=false;$('#receiptStatus').textContent=result.total?'Leitura concluída. Confira antes de registrar.':'Total não identificado. Preencha o valor da nota.';}catch(err){if(generation===receiptGeneration)$('#receiptStatus').textContent=errorDetails(err).message||'Não foi possível ler a nota.';}finally{if(worker)await worker.terminate().catch(()=>{});if(receiptWorker===worker)receiptWorker=null;}}
document.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLElement>('[data-read-receipt]'))openReceipt();});
document.addEventListener('change',e=>{if((e.target as HTMLInputElement).id==='receiptCard'&&(e.target as HTMLInputElement).value&&$('#receiptPayment'))$('#receiptPayment').value='Cartão de crédito';if((e.target as HTMLInputElement).id==='receiptPayment'&&(e.target as HTMLInputElement).value!=='Cartão de crédito'&&$('#receiptCard'))$('#receiptCard').value='';if((e.target as HTMLInputElement).id==='expenseCard'&&(e.target as HTMLInputElement).value&&$('#sp'))$('#sp').value='Cartão de crédito';if((e.target as HTMLInputElement).id==='sp'&&(e.target as HTMLInputElement).value!=='Cartão de crédito'){const card=$('#expenseCard'),paid=$('#expenseCardPaid');if(card)card.value='';if(paid)paid.checked=false;}});

var usernames:Record<string,string>={};
function normalizeUsername(value:unknown){return String(value||'').trim().replace(/^@/,'').toLowerCase();}
function validUsername(value:string){return /^[a-z0-9_]{3,40}$/.test(value);}
async function refreshUsernames(){const me=socialUser();if(!me)return;const client=window.planAuth.client;const created=await client!.from('app_usernames').upsert({user_id:me,username:'u_'+me.replaceAll('-','')},{onConflict:'user_id',ignoreDuplicates:true});if(created.error)throw created.error;const ids=[...new Set([me,...social.friends.map(friendCode)])];const result=await client!.from('app_usernames').select('user_id,username').in('user_id',ids);if(result.error)throw result.error;usernames=Object.fromEntries(result.data.map(x=>[x.user_id,x.username]));}
function usernameProfile(){return socialUser()?((
  <section className="card username-card">
    <h3>{'@usuário'}</h3>
    <form id="usernameForm">
      <label className="sr-only" htmlFor="profileUsername">
        {'Nome de usuário'}
      </label>
      <div className="username-fields">
        <input
          id="profileUsername"
          name="username"
          aria-describedby="usernameHint"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          minLength={3}
          maxLength={40}
          required={true}
          pattern="[a-zA-Z0-9_]{3,40}"
          value={esc(usernames[socialUser()!] || '')}
          placeholder="seu_usuario"
        />
        <button className="btn">{'Salvar'}</button>
      </div>
      <small id="usernameHint">{'3–40 letras, números ou _'}</small>
      <p role="status" id="usernameStatus"></p>
    </form>
  </section>
)):'';}
document.addEventListener('submit',async e=>{if((e.target as HTMLFormElement).id!=='usernameForm')return;e.preventDefault();const form=(e.target as HTMLFormElement),button=form.querySelector('button'),status=form.querySelector<HTMLElement>('#usernameStatus');if(button!.disabled)return;button!.disabled=true;try{const username=normalizeUsername(new FormData(form).get('username'));if(!validUsername(username))throw Error('Use de 3 a 40 letras, números ou sublinhado.');const result=await window.planAuth.client!.from('app_usernames').update({username}).eq('user_id',socialUser()).select('username').single();if(result.error)throw Error(result.error.code==='23505'?'Este usuário já está em uso. Escolha outro.':'Não foi possível salvar. Tente novamente.');usernames[socialUser()!]=result.data.username;status!.textContent='Usuário salvo: @'+result.data.username;}catch(error){if(form.isConnected)status!.textContent=errorDetails(error).message;}finally{button!.disabled=false;}});

var offerSearchResult:OfferResult|null=null,offerSearchGeneration=0;
function offersSearchView(){return ((
  <form id="offerSearch" className="compact-form">
    <label>
      {'Produto'}
      <input name="query" required={true} maxLength={160} placeholder="Ex.: notebook 16 GB 512 GB" />
    </label>
    <button className="btn">{'Pesquisar'}</button>
    <p role="status" id="offerStatus"></p>
  </form>
));}
function productPreview(p:ProductPreview){return ((
  <>
    {p.image ? (
      <img
        className="product-photo"
        src={esc(p.image)}
        alt={esc(p.name)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    ) : (
      ''
    )}
    <h3>{esc(p.name)}</h3>
    {p.priceCents ? (
      <strong>{brl(p.priceCents / 100)}</strong>
    ) : (
      <p className="foot">{'Preço não identificado'}</p>
    )}
    <ul>{viewList(p.specs.map((x) => <li>{esc(x)}</li>))}</ul>
    {p.promotion ? <p className="foot">{esc(p.promotion)}</p> : ''}
  </>
));}
function renderOfferResult(r:OfferResult){return ((
  <>
    <p className="foot planning-query-status">
      {'Consulta em '}
      {esc(new Date(r.checkedAt).toLocaleString('pt-BR'))}
      {'. Confira variante, frete e preço na loja.'}
    </p>
    {r.products.length ? (
      ''
    ) : (
      <p className="foot planning-query-status" role="status">
        {'Nenhum produto encontrado. Tente outro nome ou modelo.'}
      </p>
    )}
    {viewList(
      r.products.map((p) => (
        <article className="card finance-layout-card">
          {p.store ? <p className="foot">{esc(p.store)}</p> : ''}
          {productPreview(p)}
          {p.url ? (
            <a className="btn g" href={esc(p.url)} target="_blank" rel="noopener noreferrer">
              {'Ver oferta'}
            </a>
          ) : (
            ''
          )}
        </article>
      )),
    )}
    {r.sources.length ? (
      <section className="card finance-layout-card">
        <h3>{'Fontes'}</h3>
        {viewList(
          r.sources.map((s: { url: unknown; title: unknown }) => (
            <p>
              <a href={esc(s.url)} target="_blank" rel="noopener noreferrer">
                {esc(s.title)}
              </a>
            </p>
          )),
        )}
        {r.suggestions ? (
          <iframe
            title="Sugestões de pesquisa Google"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            srcDoc={esc(r.suggestions)}
            className="search-suggestions"
          ></iframe>
        ) : (
          ''
        )}
      </section>
    ) : (
      ''
    )}
  </>
));}
async function shoppingRequest(payload:Record<string,unknown>){if(!window.planAuth.user)throw Error('Entre com Google para pesquisar.');const session=await window.planAuth.client!.auth.getSession();const token=session.data.session?.access_token;if(!token)throw Error('Entre novamente.');const response=await fetch('/api/shopping',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload),signal:AbortSignal.timeout(110000)});if(response.status===404)throw Error('Publique o projeto completo com as funções de servidor para ativar a pesquisa.');let data;try{data=await response.json();}catch{throw Error('Pesquisa não disponível neste ambiente.');}if(!response.ok)throw Error(data.error||'Falha na pesquisa.');return data;}
document.addEventListener('submit',async e=>{if((e.target as HTMLFormElement).id!=='offerSearch')return;e.preventDefault();const form=(e.target as HTMLFormElement),button=form.querySelector('button'),status=form.querySelector<HTMLElement>('[role=status]');if(button!.disabled)return;const generation=++offerSearchGeneration;button!.disabled=true;status!.textContent='Pesquisando…';try{const result=await shoppingRequest({action:'search',query:new FormData(form).get('query')});if(generation!==offerSearchGeneration)return;offerSearchResult=result;if(form.isConnected){renderView($('#offerResults'),renderOfferResult(result));status!.textContent='';}}catch(error){if(form.isConnected)status!.textContent=errorDetails(error).message;}finally{button!.disabled=false;}});
document.addEventListener('click',async e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-import-product]');if(!button||button.disabled)return;const form=button.closest('form'),status=form!.querySelector<HTMLElement>('[data-product-status]'),url=form!.querySelector<HTMLInputElement>('[name=url]')!.value;button.disabled=true;status!.textContent='Consultando produto…';try{const checked=safeProductUrl(url);if(!checked)throw Error('Informe o link do produto.');const result=await shoppingRequest({action:'product',url:checked});if(!form!.isConnected)return;if(form!.querySelector<HTMLInputElement>('[name=url]')!.value!==url)throw Error('O link mudou. Consulte novamente.');const p=result.products[0];form!.querySelector<HTMLInputElement>('[name=name]')!.value=p.name;form!.querySelector<HTMLInputElement>('[name=priceCents]')!.value=p.priceCents?shoppingMoney(p.priceCents):'';form!.querySelector<HTMLInputElement>('[name=image]')!.value=p.image;form!.querySelector<HTMLInputElement>('[name=specs]')!.value=JSON.stringify(p.specs);renderView(form!.querySelector<HTMLElement>('[data-product-preview]'),productPreview(p));updatePlanProjection(form!);status!.textContent=p.priceCents?'Confira o produto, a variante e o preço antes de salvar.':'Preço não confirmado. Informe o preço atual antes de salvar.';}catch(error){if(form!.isConnected)status!.textContent=errorDetails(error).message;}finally{button.disabled=false;}});

var summaryMode='overview',behaviorAdvice:{key:string;text:string;at:string}|null=null,behaviorLoading=false,behaviorError:{key:string;message:string}|null=null;
function behaviorAggregate(){const cutoff=todayISO(),prefix=monthKeyForIndex(S.m),now=itemsInMonth(S.m).filter(x=>x.date&&x.date<=cutoff&&x.date.startsWith(prefix)),prev=S.m>0?itemsInMonth(S.m-1).filter(x=>x.date&&x.date<=cutoff&&x.date.startsWith(monthKeyForIndex(S.m-1))):[];const cents=(rows:readonly {v:number}[])=>rows.reduce((n: number,x: { v: unknown; })=>n+toCents(x.v),0);const weekdays=Array(7).fill(0);for(const x of now)weekdays[new Date(x.date+'T12:00:00').getDay()]+=toCents(x.v);return {month:prefix,asOf:cutoff,count:now.length,totalCents:cents(now),previousTotalCents:cents(prev),partial:prefix===cutoff.slice(0,7),categories:CATS.map(name=>({name,cents:cents(now.filter(x=>x.c===name)),count:now.filter(x=>x.c===name).length})),weekdays:weekdays.map((value,day)=>({day,cents:value})),months:Array.from({length:Math.min(S.m+1,6)},(_,i)=>{const index=S.m-Math.min(S.m,5)+i;return {month:monthKeyForIndex(index),cents:cents(itemsInMonth(index).filter(x=>x.date&&x.date<=cutoff&&x.date.startsWith(monthKeyForIndex(index))))};})};}
function habitBars(rows:{label:string;cents:number;attention?:boolean}[]){const total=rows.reduce((n,x)=>n+x.cents,0);if(!total)return (<p className="foot">{'Sem gastos.'}</p>);return ((
  <div className="habit-bars gauge-grid">
    {viewList(
      rows
        .filter((x: { cents: number }) => x.cents > 0)
        .map((x) => {
          const pct = (x.cents / total) * 100;
          return (
            <div className="habit-line gauge-tile">
              <div className="row">
                <span>{esc(x.label)}</span>
                <strong>{brl(x.cents / 100)}</strong>
                {x.attention ? <small className="habit-attention">{'Concentração'}</small> : ''}
              </div>
              <div
                data-progress-gauge=""
                data-value={pct}
                data-label={esc(x.label)}
                data-status="Do total"
                data-indicator-key={'habit:' + String(esc(x.label))}
                data-attention={!!x.attention}
              >
                <div className="habit-track">
                  <i className={x.attention ? 'attention' : ''} style={{ width: String(pct) + '%' }}></i>
                </div>
              </div>
            </div>
          );
        }),
    )}
  </div>
));}

function behaviorView(){const a=behaviorAggregate(),key=JSON.stringify(a),advice=behaviorAdvice?.key===key?behaviorAdvice:null;return ((
  <>
    <section className="card finance-layout-card habits-summary-card">
      <h2>{'Hábitos de gastos'}</h2>
      <p className="foot">
        {esc(M[S.m])}
        {a.partial ? ' · Mês em andamento' : ''}
        {' · '}
        {a.count}
        {' gastos registrados'}
      </p>
      <strong className="overview-total">{brl(a.totalCents / 100)}</strong>
      {a.count ? (
        <p className="foot">
          {'Atenção indica concentração de gastos, não uma avaliação do seu comportamento.'}
        </p>
      ) : (
        <p className="mut">{'Sem gastos registrados.'}</p>
      )}
    </section>
    <section className="card finance-layout-card">
      <h2>{'Por categoria'}</h2>
      {habitBars(
        a.categories.map((x) => ({
          ...x,
          label: x.name,
          attention: a.totalCents > 0 && x.cents / a.totalCents >= 0.5,
        })),
      )}
    </section>
    <section className="card finance-layout-card">
      <h2>{'Dias da semana'}</h2>
      {habitBars(
        a.weekdays.map((x) => ({
          ...x,
          label: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][x.day],
          attention: a.totalCents > 0 && x.cents / a.totalCents >= 0.35,
        })),
      )}
    </section>
    <section className="card finance-layout-card">
      <h2>{'Últimos meses'}</h2>
      {habitBars(a.months.map((x) => ({ ...x, label: x.month })))}
    </section>
    <section className="card finance-layout-card">
      <h2>{'Dicas para você'}</h2>
      <p className="foot">
        {
          'A análise envia ao Gemini totais por categoria, dia e mês, sem descrições ou dados de perfil. Não inclui gastos futuros.'
        }
      </p>
      <button className="btn" data-behavior-analyze="" disabled={!a.count || behaviorLoading}>
        {behaviorLoading ? 'Analisando…' : 'Analisar'}
      </button>
      <p role="status" id="behaviorStatus">
        {behaviorError?.key === key ? esc(behaviorError.message) : ''}
      </p>
      {advice ? (
        <>
          <p className="foot">
            {'Análise de '}
            {esc(new Date(advice.at).toLocaleString('pt-BR'))}
          </p>
          <div className="behavior-advice">{esc(advice.text)}</div>
        </>
      ) : (
        ''
      )}
    </section>
  </>
));}
function summarySwitch(){const mode=S.tab==='i'?'entries':'overview';return ((
  <div className="segments summary-switch" aria-label="Visão do resumo">
    {viewList(
      [
        ['overview', 'Visão geral'],
        ['entries', 'Lançamentos'],
      ].map(([key, label]) => (
        <button data-summary-mode={key} aria-pressed={mode === key}>
          {label}
        </button>
      )),
    )}
  </div>
));}
function summaryView(){return rendersummaryView(viewContext);}

document.addEventListener('click',async e=>{const tab=(e.target as HTMLElement).closest<HTMLElement>('[data-summary-mode]');if(tab){summaryMode=tab.dataset.summaryMode!;S.tab=summaryMode==='entries'?'i':'r';arrangeCards=false;draw();return;}const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-behavior-analyze]');if(!button||behaviorLoading)return;behaviorLoading=true;behaviorError=null;button.disabled=true;const snapshot=behaviorAggregate(),key=JSON.stringify(snapshot);try{const data=await shoppingRequest({action:'behavior',summary:snapshot});behaviorAdvice={key,text:data.advice,at:data.checkedAt};}catch(err){behaviorError={key,message:errorDetails(err).message||'Não foi possível analisar. Tente novamente.'};}finally{behaviorLoading=false;if(button.isConnected)button.disabled=false;if(S.tab==='r'&&summaryMode!=='entries')draw();}});

function splitPaymentTotals(splits:Split[]){const totals=new Map();for(const split of splits){const shares=splitShares(split.cents,split.people.length,split.shareOffset??0);split.people.forEach((name,i)=>{const label=i===split.ownIndex?'Você':name.trim(),key=i===split.ownIndex?'self':'name:'+label.toLocaleLowerCase('pt-BR');const row=totals.get(key)||{name:label,paid:0,pending:0};if(split.paid?.[i])row.paid+=shares[i];else row.pending+=shares[i];totals.set(key,row);});}return [...totals.values()].sort((a,b)=>b.paid-a.paid||a.name.localeCompare(b.name));}
function splitPaymentsChart(splits=SPLITS){if(!splits.length)return '';const rows=splitPaymentTotals(splits),highest=rows[0]?.paid||0,lowest=rows.length?Math.min(...rows.map(x=>x.paid)):0;return ((
  <div className="split-month-payments">
    <h3>{'Pagamentos por pessoa'}</h3>
    <p className="foot">{'Pagamentos confirmados manualmente. Agrupados por nome.'}</p>
    {rows.length ? (
      viewList(
        rows.map((x) => (
          <div className="habit-line gauge-tile">
            <div className="row">
              <span>{esc(x.name)}</span>
              <strong>{brl(x.paid / 100)}</strong>
              <small>
                {highest > lowest
                  ? x.paid === highest
                    ? 'Pagou mais'
                    : x.paid === lowest
                      ? 'Pagou menos'
                      : ''
                  : ''}
              </small>
            </div>
            <div
              data-progress-gauge=""
              data-value={x.paid + x.pending ? (x.paid / (x.paid + x.pending)) * 100 : 0}
              data-label={esc(x.name)}
              data-status="Pago"
              data-indicator-key={'payments:' + String(esc(x.name))}
            >
              <div className="habit-track">
                <i
                  style={{
                    width: String(x.paid + x.pending ? (x.paid / (x.paid + x.pending)) * 100 : 0) + '%',
                  }}
                ></i>
              </div>
            </div>
            <small className="foot">
              {'Pendente: '}
              {brl(x.pending / 100)}
            </small>
          </div>
        )),
      )
    ) : (
      <p className="mut">{'Nenhuma divisão.'}</p>
    )}
  </div>
));}
document.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-split-paid]');if(!b)return;safely(()=>{atomic(()=>{const x=SPLITS.find(x=>x.id===b.dataset.id!),i=Number(b.dataset.splitPaid);if(!x||!isInteger(i)||i<0||i>=x.people.length)throw Error('Participante inválido.');x.paid=Array.from({length:x.people.length},(_,j)=>j===i?!x.paid?.[j]:!!x.paid?.[j]);saveWorkspace();});draw();});});

function hasPendingInteraction(){return !!(SH||csvPreview||purchaseReview||behaviorLoading||document.querySelector<HTMLDialogElement>('dialog[open],details[open] form')||document.activeElement?.matches('input,select,textarea,[contenteditable="true"]'));}
window.planCloud?.connect({
 canApply:()=>!hasPendingInteraction(),
 onRemote:()=>{try{sessionStorage.setItem('plan12-sync-tab',S.tab);}catch{}location.reload();}
});
try{const resume=sessionStorage.getItem('plan12-sync-tab');sessionStorage.removeItem('plan12-sync-tab');if(includesValue(['r','i','d','s','k','o','e','u','x','v','c','f'],resume))S.tab=resume;}catch{}
const storageDescription=document.getElementById('storageDescription');if(storageDescription)storageDescription.textContent=window.planAuth.user?'Dados da conta · cópia local neste dispositivo.':'Dados temporários nesta aba do navegador.';
let observedDay=todayISO();
setInterval(()=>{const day=todayISO();if(day!==observedDay&&!hasPendingInteraction()){observedDay=day;safely(()=>{ensureDate(day);S.m=monthIndexFromDate(day);S.calDate=day;draw();});}},60000);
addEventListener('storage',e=>{if(e.key===window.planAuth.key(WORKSPACE_KEY)&&e.newValue!==storageBase)showNotice('Os dados foram atualizados em outra aba. Recarregue antes de salvar.',true);});
function searchSourceRecords(){return [
 ...S.items.map(x=>({id:x.id,type:'g',name:x.d,category:x.c,date:x.date,cents:toCents(x.v)})),
 ...S.receipts.map(x=>({id:x.id,type:'i',name:x.d,category:'Entradas',date:x.date,cents:toCents(x.v)})),
 ...DEBTS.map((x,id)=>({id:String(id),type:'d',name:x.n,category:'Dívidas',date:monthKeyForIndex(x.s)+'-01',cents:toCents(x.v)})),
 ...CART.map(x=>({id:x.id,type:'k',name:x.name,category:x.category,date:x.date,cents:x.priceCents!+x.shippingCents!})),
];}
finance.searchRecords=filters=>searchFinance(searchSourceRecords(),filters);
finance.openSearchResult=row=>{const current=searchSourceRecords().find(x=>x.type===row.type&&x.id===row.id);if(!current||current.name!==row.name||current.cents!==row.cents||current.date!==row.date){showError(Error('O registro mudou. Pesquise novamente.'));return;}if(row.type==='k'){selectAreaView('planning:purchases');editPlanId=CART.find(x=>x.id===row.id)?.status==='planned'?row.id:'';draw();}else{if(row.type==='d')selectAreaView('commitments:debts');else S.tab='i';draw();openSheet({dataset:{k:row.type,id:row.id}});}};
finance.debtSources=()=>DEBTS.map((x,id)=>({id:String(id),name:x.n,cents:debtRemainingCents(x)}));
function incomingDebt(){
 let raw;try{raw=sessionStorage.getItem('plan12-pending-debt');}catch{}if(!raw)return;
 try{const debt=decodeSharedDebt(raw);const dialog=document.createElement('dialog');dialog.className='account-confirm-dialog';dialog.id='incomingDebtDialog';dialog.setAttribute('aria-labelledby','incomingDebtTitle');document.body.append(dialog);
 renderView(dialog,((
  <>
    <h2 id="incomingDebtTitle">{'Dívida compartilhada'}</h2>
    <p>{esc(debt.name)}</p>
    <strong>{brl(debt.cents / 100)}</strong>
    <p className="foot">{'Confirme o valor com quem enviou. Escolha mês e parcelas a seguir.'}</p>
    {!window.planAuth.user ? (
      <p className="foot">{'Visitante: dados temporários. Entre com Google para salvar na conta.'}</p>
    ) : (
      ''
    )}
    <div className="settings-actions">
      <button className="btn g" type="button" data-incoming-debt="cancel">
        {'Cancelar'}
      </button>
      <button className="btn" type="button" data-incoming-debt="review">
        {'Revisar dívida'}
      </button>
    </div>
  </>
)));
 dialog.showModal();dialog.addEventListener('cancel',()=>{sessionStorage.removeItem('plan12-pending-debt');});
 dialog.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-incoming-debt]');if(!b)return;if(b.dataset.incomingDebt==='cancel'){sessionStorage.removeItem('plan12-pending-debt');dialog.close();return;}if(DEBTS.some(x=>x.sharedRef===debt.id)){sessionStorage.removeItem('plan12-pending-debt');showError(Error('Esta dívida já foi adicionada.'));dialog.close();return;}dialog.close();selectAreaView('commitments:debts');draw();openSheet({dataset:{k:'d'}});$('#sd').value=debt.name;$('#sv').value=shoppingMoney(debt.cents);SH!.sharedRef=debt.id;});
 }catch{sessionStorage.removeItem('plan12-pending-debt');showNotice('O link de dívida não é válido. Nenhum dado foi adicionado.',true);}
}
function vCredit(){return rendervCredit(viewContext);}
finance.isMonthClosed=()=>isMonthClosed(S.m);
finance.mobile={
 getState:()=>({tab:S.tab,composeDebt:S.tab==='d'&&areaViews.commitments==='debts',closed:isMonthClosed(S.m),sections:getLayout().sections}),
 navigate(key){if(!['r','d','o','v','e','f'].includes(key)||key==='e'&&!getLayout().sections.carbon)return;closeMenu();S.tab=key;scrollTo(0,0);draw();},
 open:(panel,opener)=>openAccountPanel(panel,opener),
 compose(){if(isMonthClosed(S.m))return;openSheet({dataset:{k:S.tab==='d'&&areaViews.commitments==='debts'?'d':'launch',date:defaultDateForMonth(S.m)}});},
 rowAction(action,kind,id){safely(()=>{if(isMonthClosed(S.m)||!['g','i'].includes(kind))return;const item=(kind==='g'?S.items:S.receipts).find(x=>String(x.id)===String(id));if(!item)return;if(item.splitId)throw Error('Altere esta divisão em Amigos.');if(action==='edit'){openSheet({dataset:{k:kind,id:item.id}});return;}if(action==='delete'){atomic(()=>{if(kind==='g')S.items=S.items.filter(x=>x.id!==item.id);else S.receipts=S.receipts.filter(x=>x.id!==item.id);saveWorkspace();});draw();}});}
};
finance.productGoals={
 getState:()=>({goals:CART.filter((x):x is ShoppingPlan&ProductGoal=>x.productGoal===true).map(x=>({...x})),cards:cardBalances(CARDS,S.items),categories:CATS.filter(x=>x!=='Investimentos'),today:todayISO()}),
 save(input){const mode=input.goalMode;const next=saveShopping({...input,productGoal:true,monthlyReserveCents:input.monthlyReserveCents,targetCents:input.priceCents,shippingCents:0,installments:mode==='credit'?input.installments:1,creditCardId:mode==='credit'?input.creditCardId:'',priority:'normal',goal:false,people:[],url:'',status:'planned'},'cart');dispatchEvent(new Event('plan-product-goals-change'));return next as ShoppingPlan&ProductGoal;},
 remove(id){atomic(()=>{const goal=CART.find(x=>x.id===id&&x.productGoal);if(!goal||goal.status!=='planned')throw Error('A meta foi alterada. Atualize a página.');CART=CART.filter(x=>x.id!==id);saveWorkspace()});dispatchEvent(new Event('plan-product-goals-change'));},
 context(goal){const simulation={...goal,date:goal.date<todayISO()?todayISO():goal.date},projection=planProjection(simulation),first=monthIndexFromDate(simulation.date),count=goal.goalMode==='save'?Math.max(1,Math.min(12,goal.monthlyReserveCents?Math.ceil(Math.max(0,goal.priceCents+goal.shippingCents-goal.reservedCents)/goal.monthlyReserveCents):1)):goal.installments;
 return {asOf:todayISO(),goals:CART.filter((x):x is ShoppingPlan&ProductGoal=>x.productGoal===true&&x.status==='planned'),card:cardBalances(CARDS,S.items).find((x: { id: string|undefined; })=>x.id===goal.creditCardId),months:Array.from({length:Math.min(count,MAX_MONTHS-first)},(_,i)=>{const m=first+i,payment=projection.rows.find(x=>x.m===m),overdue=i===0?projection.rows[0]?.overdueCents||0:0,available=monthProjectionCents(m)-overdue;return {key:monthKeyForIndex(m),availableCents:available,purchaseAfterCents:payment?payment.after:available,paymentCents:payment?.cents||0,complete:receiptsInMonth(m).length>0}})};},
 prepare(id){let expected='';atomic(()=>{const goal=CART.find(x=>x.id===id&&x.productGoal&&x.status==='planned');if(!goal)throw Error('Meta não encontrada.');goal.date=todayISO();saveWorkspace();expected=JSON.stringify(goal)});purchaseReview={id,expected};selectAreaView('planning:purchases');draw();}
};
finance.taxes={getState:()=>({month:monthKeyForIndex(S.m),today:todayISO(),closedMonths:Object.keys(CLOSED_REPORTS),expenses:S.items.map(x=>({id:String(x.id),description:x.d,cents:toCents(x.v),date:x.date,category:x.c,payment:x.p,creditCardId:x.creditCardId||null}))}),
 addExpense(input){requireOpenDate(input.date);const cents=parseMoney(input.value);if(!isSafeInteger(cents)||cents<1||!input.description?.trim())throw Error('Informe descrição, data e valor válidos.');if(S.items.length>=MAX_RECORDS)throw Error('Limite de lançamentos atingido.');const item={id:newId(),d:input.description.trim().slice(0,240),v:cents/100,date:input.date,c:canonicalCategory(input.category),p:'Pix'};atomic(()=>{S.items.push(item);saveWorkspace()});return {id:String(item.id),description:item.d,cents,date:item.date,category:item.c};},
 importBank(rows){if(!Array.isArray(rows)||rows.length>100)throw Error('Importe até 100 movimentações por vez.');let added=0;atomic(()=>{for(const x of rows){if(!/^of-[a-f0-9]{32}$/.test(x.id)||!isSafeInteger(x.cents)||x.cents<1||x.cents>MAX_CENTS)throw Error('Movimentação inválida.');requireOpenDate(x.date);if(x.credit&&!CARDS.some(c=>c.id===x.cardId&&c.active))throw Error('Selecione um cartão cadastrado para importar a fatura.');const list=x.type==='i'?S.receipts:S.items;if(list.some(y=>String(y.id)===x.id))continue;if(list.length>=MAX_RECORDS)throw Error('Limite de lançamentos atingido.');list.push({id:x.id,d:String(x.description||'Movimentação').slice(0,240),v:x.cents/100,date:x.date,...(x.type==='i'?{incomeKind:'once'}:{c:canonicalCategory(x.category),p:x.credit?'Cartão de crédito':'Pix',...(x.credit?{creditCardId:x.cardId}:{})})});added++;}saveWorkspace()});return added;}
};
finance.goal={getState:()=>({...GOAL,today:todayISO(),readonly:isMonthClosed(S.m)}),save(input,{redraw=true}={}){const result=saveGoal(input);showNotice('Meta salva.');if(redraw)draw();return result;}};
finance.credit={getState:()=>({cards:cardBalances(CARDS,S.items),items:S.items.filter(x=>x.creditCardId).map(x=>({...x}))}),payInvoice(id,month,amount,date,expected){atomic(()=>{const index=CARDS.findIndex(c=>c.id===id);if(index<0)throw Error('Cartão não encontrado.');if(cardInvoice(CARDS[index],S.items,month).remainingCents!==expected)throw Error('A fatura mudou. Confira o saldo e confirme novamente.');const next=allocateInvoicePayment(CARDS[index],S.items,month,amount,{id:newId(),date,today:todayISO()});CARDS[index]=next.card;S.items=next.items;saveWorkspace();});dispatchEvent(new Event('plan-credit-change'));},saveCard(input){const card=normalizeCreditCard({...input,id:input.id||newId()});atomic(()=>{const index=CARDS.findIndex(c=>c.id===card.id);if(index<0){if(CARDS.length>=100)throw Error('Use até 100 cartões.');CARDS.push(card);}else CARDS[index]=card;saveWorkspace();});dispatchEvent(new Event('plan-credit-change'));return card;},setPaid(id,paid){if(typeof paid!=='boolean')throw Error('Status inválido.');atomic(()=>{const item=S.items.find(x=>x.id===id);if(!item?.creditCardId||item.p!=='Cartão de crédito')throw Error('Lançamento não encontrado.');item.creditPaid=paid;saveWorkspace();});dispatchEvent(new Event('plan-credit-change'));}};
finance.resetFinancialData=resetFinancialData;
assertFinanceReady();
subscribeFinance(renderNotifications);
setTimeout(incomingDebt,0);
try{atomic(()=>{if(supportedDate(observedDay)){ensureDate(observedDay);S.m=monthIndexFromDate(observedDay);S.calDate=observedDay;}saveWorkspace();});}catch(e){showError(e);}
if(!readBlocked&&(recovery.length||bootRecovery.length))showNotice('Alguns dados antigos precisaram de validação. Os originais foram preservados; exporte o backup para conferir a recuperação.',false);
draw();
}
