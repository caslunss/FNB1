import { saveGoal as migrated_saveGoal } from '../controllers/planning';
import { saveDebt as migratedSaveDebt } from '../controllers/debts';
import {
  saveIncome as migrated_saveIncome,
  cancelFutureIncome as migrated_cancelFutureIncome,
  saveExpense as migrated_saveExpense,
  cancelFutureExpenses as migrated_cancelFutureExpenses,
} from '../controllers/ledger';
import { isInteger } from '../../services/type-guards.ts';
import type { LedgerRecord, Expense, Debt } from '../../types/workspace';
import type { FinanceServices } from '../../types/finance-runtime';
import {
  core_expenseBudgetCents,
  core_monthProjectionCents,
  core_goalInvestedCents,
  core_goalProjection,
} from '../calculations.ts';
import type { WorkspaceRuntime } from './contracts';

type SelectorsContext = Pick<
  WorkspaceRuntime,
  | 'CLOSED_REPORTS'
  | 'DEBTS'
  | 'ICON'
  | 'LIM'
  | 'MAX_MONTHS'
  | 'S'
  | 'canonicalCategory'
  | 'debt'
  | 'debtContext'
  | 'debtPaidCount'
  | 'dm'
  | 'engineContext'
  | 'esc'
  | 'inc'
  | 'isMonthClosed'
  | 'itemMonthIndex'
  | 'itemsInMonth'
  | 'ledgerContext'
  | 'lim'
  | 'mbtn'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'monthProjectionCents'
  | 'pad'
  | 'planningContext'
  | 'receiptsInMonth'
  | 'spent'
  | 'sum'
  | 'supportedDate'
  | 'toCents'
>;

export function createSelectors(workspace: SelectorsContext) {
  function expenseBudgetCents(m: number, extraCategory = '', extraCents = 0) {
    return core_expenseBudgetCents(
      workspace.engineContext,
      m,
      extraCategory,
      extraCents,
    );
  }

  function monthProjectionCents(
    m: number,
    extraCategory = '',
    extraCents = 0,
    cutoff = '',
  ) {
    return core_monthProjectionCents(
      workspace.engineContext,
      m,
      extraCategory,
      extraCents,
      cutoff,
    );
  }

  function goalMonthProjectionCents(
    m: number,
    extraCategory = '',
    extraCents = 0,
    cutoff = '',
  ) {
    const invested = workspace
      .itemsInMonth(m)
      .filter(
        (x) =>
          x.c === 'Investimentos' && (!cutoff || !x.date || x.date <= cutoff),
      )
      .reduce((n, x) => n + workspace.toCents(x.v), 0);
    return (
      workspace.monthProjectionCents(m, extraCategory, extraCents, cutoff) +
      invested +
      (extraCategory === 'Investimentos' &&
      !(
        workspace.isMonthClosed(m) &&
        workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)]
      )
        ? extraCents
        : 0)
    );
  }

  function goalInvestedCents(m: number) {
    return core_goalInvestedCents(workspace.engineContext, m);
  }

  function goalProjection(m: number) {
    return core_goalProjection(workspace.engineContext, m);
  }

  function saveGoal(input: Parameters<FinanceServices['goal']['save']>[0]) {
    return migrated_saveGoal(workspace.planningContext, input);
  }

  function saveDebt(input: Debt, index?: number) {
    return migratedSaveDebt(workspace.debtContext, input, index);
  }

  function saveIncome(
    record: Omit<LedgerRecord, 'id'>,
    id?: string | null,
    count = 1,
  ) {
    return migrated_saveIncome(workspace.ledgerContext, record, id, count);
  }

  function cancelFutureIncome(id: string) {
    return migrated_cancelFutureIncome(workspace.ledgerContext, id);
  }

  function monthlyExpenseDate(anchor: string, offset: number) {
    if (!workspace.supportedDate(anchor) || !isInteger(offset) || offset < 0)
      throw Error('Data de repetição inválida.');
    const index = workspace.monthIndexFromDate(anchor) + offset;
    if (index >= workspace.MAX_MONTHS)
      throw Error('A repetição ultrapassa o período disponível.');
    const first = workspace.monthKeyForIndex(index),
      [year, month] = first.split('-').map(Number),
      day = Math.min(
        Number(anchor.slice(8)),
        new Date(year, month, 0).getDate(),
      );
    return `${first}-${workspace.pad(day)}`;
  }

  function saveExpense(
    record: Omit<Expense, 'id'>,
    id?: string | null,
    count = 1,
  ) {
    return migrated_saveExpense(workspace.ledgerContext, record, id, count);
  }

  function cancelFutureExpenses(id: string) {
    return migrated_cancelFutureExpenses(workspace.ledgerContext, id);
  }
  return {
    expenseBudgetCents,
    monthProjectionCents,
    goalMonthProjectionCents,
    goalInvestedCents,
    goalProjection,
    saveGoal,
    saveDebt,
    saveIncome,
    cancelFutureIncome,
    monthlyExpenseDate,
    saveExpense,
    cancelFutureExpenses,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'expenseBudgetCents'
    | 'monthProjectionCents'
    | 'goalMonthProjectionCents'
    | 'goalInvestedCents'
    | 'goalProjection'
    | 'saveGoal'
    | 'saveDebt'
    | 'saveIncome'
    | 'cancelFutureIncome'
    | 'monthlyExpenseDate'
    | 'saveExpense'
    | 'cancelFutureExpenses'
  >;
}

export function initializeSelectors(workspace: SelectorsContext) {
  // @workspace-step 96 FirstStatement
  workspace.itemMonthIndex = (i: { date?: string; legacyMonth?: number }) =>
    i.date ? workspace.monthIndexFromDate(i.date) : (i.legacyMonth ?? 0);
  // @workspace-end 96
  // @workspace-step 97 FirstStatement
  workspace.itemsInMonth = (m: number) =>
    workspace.isMonthClosed(m) &&
    workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)]
      ? workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)].expenses
      : workspace.S.items.filter((i) => workspace.itemMonthIndex(i) === m);
  // @workspace-end 97
  // @workspace-step 98 FirstStatement
  workspace.receiptsInMonth = (m: number) =>
    workspace.isMonthClosed(m) &&
    workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)]
      ? workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)].receipts
      : workspace.S.receipts.filter((i) => workspace.itemMonthIndex(i) === m);
  // @workspace-end 98
  // @workspace-step 99 FirstStatement
  workspace.inc = (m: number) => workspace.sum(workspace.receiptsInMonth(m));
  workspace.spent = (m: number) => workspace.sum(workspace.itemsInMonth(m));
  // @workspace-end 99
  // @workspace-step 100 FirstStatement
  workspace.lim = (m: number, c: string) =>
    (workspace.LIM[m] && workspace.LIM[m][workspace.canonicalCategory(c)]) || 0;
  // @workspace-end 100
  // @workspace-step 101 FirstStatement
  workspace.dm = (d: Debt, m: number) => {
    if (d.p <= 0 || m < d.s + workspace.debtPaidCount(d) || m >= d.s + d.p)
      return 0;
    const cents = workspace.toCents(d.v);
    return (Math.floor(cents / d.p) + (m - d.s < cents % d.p ? 1 : 0)) / 100;
  };
  // @workspace-end 101
  // @workspace-step 102 FirstStatement
  workspace.debt = (m: number) =>
    workspace.isMonthClosed(m) &&
    workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)]
      ? workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)].debtCents / 100
      : workspace.DEBTS.reduce(
          (total, d) => total + workspace.toCents(workspace.dm(d, m)),
          0,
        ) / 100;
  // @workspace-end 102

  // @workspace-step 112 FirstStatement
  workspace.mbtn = (k: string, id: string | number, label: string) => (
    <button
      className="ib"
      data-a="menu"
      data-k={k}
      data-id={workspace.esc(id)}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-label={label}
    >
      {workspace.ICON.more}
    </button>
  );
  // @workspace-end 112
}
