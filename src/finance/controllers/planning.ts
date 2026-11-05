import type { Expense, Split } from '../../types/workspace';
import type {
  FinancialGoal,
  FinanceServices,
} from '../../types/finance-runtime';
import { isSafeInteger, isInteger } from '../../services/type-guards.ts';
export interface PlanningContext {
  MAX_CENTS: number;
  MAX_MONTHS: number;
  MAX_RECORDS: number;
  S: { m: number; calDate: string; items: Expense[] };
  PROFILE: { name: string };
  SPLITS: Split[];
  GOAL: FinancialGoal;
  atomic: <T>(operation: () => T) => T;
  isMonthClosed: (index: number) => boolean;
  monthlyExpenseDate: (day: string, offset: number) => string;
  todayISO: () => string;
  supportedDate: (date: unknown) => date is string;
  monthIndexFromDate: (day: string) => number;
  ensureIndex: (index: number) => unknown;
  saveWorkspace: () => void;
  newId: () => string;
  splitShares: (cents: number, n: number, offset?: number) => number[];
  requireOpenDate: (day: string) => void;
  ensureDate: (day: string) => unknown;
}
export function saveGoal(
  context: PlanningContext,
  input: Parameters<FinanceServices['goal']['save']>[0],
) {
  const {
    MAX_CENTS,
    MAX_MONTHS,
    S,
    atomic,
    isMonthClosed,
    monthlyExpenseDate,
    todayISO,
    supportedDate,
    monthIndexFromDate,
    ensureIndex,
    saveWorkspace,
  } = context;
  return atomic(() => {
    if (isMonthClosed(S.m))
      throw Error('Mês encerrado: a meta pode ser ajustada em um mês aberto.');
    const amount = Number(input.amountCents);
    if (!isSafeInteger(amount) || amount < 0 || amount > MAX_CENTS)
      throw Error('Informe um valor válido para a meta.');
    const mode = input.mode === 'date' ? 'date' : 'months',
      months = Number(input.months);
    let date = input.date;
    if (mode === 'months') {
      if (!isInteger(months) || months < 1 || months > MAX_MONTHS)
        throw Error('Escolha um prazo de 1 a ' + MAX_MONTHS + ' meses.');
      date = monthlyExpenseDate(todayISO(), months);
    }
    if (!supportedDate(date) || date < todayISO())
      throw Error(
        'Escolha uma data a partir de hoje, dentro do período disponível.',
      );
    const e = monthIndexFromDate(date);
    ensureIndex(e);
    context.GOAL = {
      v: amount / 100,
      e,
      mode,
      date,
      months:
        mode === 'months'
          ? months
          : Math.max(
              1,
              e -
                monthIndexFromDate(todayISO()) +
                (Number(date.slice(8)) > Number(todayISO().slice(8)) ? 1 : 0),
            ),
    };
    saveWorkspace();
    return context.GOAL;
  });
}
export function registerSplit(
  context: PlanningContext,
  name: string,
  cents: number,
  others: string[],
  date = context.todayISO(),
  shareOffset = 0,
) {
  const {
    MAX_CENTS,
    MAX_RECORDS,
    S,
    PROFILE,
    SPLITS,
    monthIndexFromDate,
    saveWorkspace,
    newId,
    splitShares,
    requireOpenDate,
    ensureDate,
  } = context;

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.length > 240 ||
    !Array.isArray(others) ||
    !others.length ||
    others.length > 99 ||
    others.some((p) => typeof p !== 'string' || !p.trim() || p.length > 100) ||
    !isSafeInteger(cents) ||
    cents < 1 ||
    cents > MAX_CENTS
  )
    throw Error(
      'Informe a descrição, um valor válido e de 1 a 99 outras pessoas.',
    );
  if (S.items.length >= MAX_RECORDS || SPLITS.length >= MAX_RECORDS)
    throw Error('Limite de registros atingido.');
  const people = [PROFILE.name || 'Você', ...others],
    shares = splitShares(cents, people.length, shareOffset),
    id = newId(),
    expenseId = shares[0] > 0 ? newId() : null;
  requireOpenDate(date);
  ensureDate(date);
  const split = {
    id,
    name: name.trim(),
    cents,
    people,
    ownIndex: 0,
    date,
    expenseId,
    shareOffset,
    status:
      shares[0] === 0
        ? 'Sua parte é R$ 0,00 nesta parcela; nenhum gasto foi criado.'
        : '',
  };
  if (expenseId)
    S.items.push({
      id: expenseId,
      d: name + ' · sua parte',
      v: shares[0] / 100,
      c: 'Gastos Variáveis',
      p: 'Pix',
      date,
      splitId: id,
    });
  SPLITS.push(split);
  saveWorkspace();
  S.m = monthIndexFromDate(date);
  S.calDate = date;
  return split;
}
