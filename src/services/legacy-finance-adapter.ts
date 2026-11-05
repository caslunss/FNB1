import {finance,publishFinance} from './finance-runtime.ts';
/** Compatibility for existing integrations/debugging. React never imports this adapter. */
export function installLegacyFinanceAdapter(target:Window){
 const previous=Object.getOwnPropertyDescriptors(target);
 let active=true,pending=false;target.planFinanceChanged=()=>{if(pending||!active)return;pending=true;queueMicrotask(()=>{pending=false;if(active)publishFinance()})};
 const aliases={planTaxes:'taxes',planCredit:'credit',planProductGoals:'productGoals',planGoal:'goal',planMobile:'mobile',planNotifications:'notifications',planIsMonthClosed:'isMonthClosed',planResetFinancialData:'resetFinancialData',planSearchRecords:'searchRecords',planOpenSearchResult:'openSearchResult',planDebtSources:'debtSources',planActionItems:'actionItems'} as const;
 for(const [name,key] of Object.entries(aliases))Object.defineProperty(target,name,{configurable:true,get:()=>finance[key]});
 return()=>{
  active=false;
  for(const name of ['planFinanceChanged',...Object.keys(aliases)]){
   if(previous[name])Object.defineProperty(target,name,previous[name]);
   else Reflect.deleteProperty(target,name);
  }
 };
}
