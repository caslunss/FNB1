import type {ForecastResult} from './balance-forecast';
export interface BalanceAlertRow{id:string;kind:'balance';tab:string;date:string;title:string;subtitle:string;text:string;error:boolean}
/** Stable identity deduplicates the same projected date within a local day. */
export function balanceAlert(result:ForecastResult,today:string):BalanceAlertRow[]{
 if(!result.ready||result.risk==='ok'||result.risk===null)return [];
 const date=result.firstNegativeDate||result.lowestDate||today;
 return [{id:`balance-${today}-${date}`,kind:'balance',tab:'forecast',date:today,title:result.risk==='risco'?'Risco de saldo negativo':'Atenção ao saldo estimado',subtitle:'Previsão de saldo · estimativa',text:`Estimativa: revise seus compromissos até ${date.split('-').reverse().join('/')}. O saldo pode mudar.`,error:result.risk==='risco'}];
}
