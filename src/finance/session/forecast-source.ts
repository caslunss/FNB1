import type {WorkspaceRuntime} from './contracts';
import type {ForecastSource} from '../../services/forecast-settings';
import {decimalCents} from '../../services/money.ts';
export function readForecastSource(workspace:Pick<WorkspaceRuntime,'S'|'CARDS'|'DEBTS'|'todayISO'>):ForecastSource{
 return {today:workspace.todayISO(),cards:workspace.CARDS.map(card=>({id:card.id,name:card.name,closingDay:card.closingDay,dueDay:card.dueDay,openingUsedCents:card.openingUsedCents,openingPaidCents:card.openingPaidCents})),pending:workspace.DEBTS.some(debt=>debt.v>0&&debt.p>(debt.paid||0))?['Há parcelas de dívidas sem dia de vencimento. Revise suas datas; elas não foram debitadas automaticamente.']:[],transactions:[
  ...workspace.S.receipts.map(row=>({id:String(row.id),description:row.d,cents:decimalCents(row.v),date:row.date,kind:'income' as const,recurrenceId:row.recurrenceId,recurrenceCount:row.recurrenceCount,recurrenceStopped:row.recurrenceStopped})),
  ...workspace.S.items.map(row=>({id:String(row.id),description:row.d,cents:decimalCents(row.v),date:row.date,kind:'expense' as const,payment:row.p==='Cartão de crédito'?'credit' as const:'cash' as const,cardId:row.creditCardId,chargeCents:row.creditChargeCents,paidCents:row.creditPaid?(row.creditChargeCents??decimalCents(row.v)):row.creditPaidCents,subscription:row.subscription,recurrenceId:row.recurrenceId,recurrenceCount:row.recurrenceCount,recurrenceStopped:row.recurrenceStopped}))]};
}
