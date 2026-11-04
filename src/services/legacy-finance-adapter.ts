import {finance,publishFinance} from './finance-runtime.ts';
/** Compatibility for existing integrations/debugging. React never imports this adapter. */
export function installLegacyFinanceAdapter(target:Window){
 let pending=false;target.planFinanceChanged=()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;publishFinance()})};
 const aliases={planTaxes:'taxes',planCredit:'credit',planProductGoals:'productGoals',planGoal:'goal',planMobile:'mobile',planNotifications:'notifications',planIsMonthClosed:'isMonthClosed',planResetFinancialData:'resetFinancialData',planSearchRecords:'searchRecords',planOpenSearchResult:'openSearchResult',planDebtSources:'debtSources',planActionItems:'actionItems'} as const;
 for(const [name,key] of Object.entries(aliases))Object.defineProperty(target,name,{configurable:true,get:()=>finance[key]});
}
