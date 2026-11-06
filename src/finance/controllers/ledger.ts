import type { LedgerRecord, Expense } from '../../types/workspace';
import type { CreditCard } from '../../types/finance-runtime';
import {
  isSafeInteger,
  isInteger,
  includesValue,
} from '../../services/type-guards.ts';
export interface LedgerContext {
  MAX_CENTS: number;
  MAX_RECORDS: number;
  MAX_MONTHS: number;
  CATS: string[];
  PAY: string[];
  MIG: Record<string, string>;
  CARDS: CreditCard[];
  S: { items: Expense[]; receipts: LedgerRecord[] };
  atomic: <T>(operation: () => T) => T;
  requireOpenDate: (date: string) => void;
  monthDate: (index: number) => string;
  toCents: (value: unknown) => number;
  monthIndexFromDate: (date: string) => number;
  newId: () => string;
  monthlyExpenseDate: (date: string, offset: number) => string;
  ensureDate: (date: string) => unknown;
  saveWorkspace: () => void;
  todayISO: () => string;
  isMonthClosed: (month: number) => boolean;
  itemMonthIndex: (item: LedgerRecord) => number;
  supportedDate: (date: unknown) => boolean;
}
export function saveIncome(
  context: LedgerContext,
  record: Omit<LedgerRecord, 'id'>,
  id?: string | null,
  count = 1,
) {
  const {
    MAX_CENTS,
    MAX_RECORDS,
    MAX_MONTHS,
    S,
    atomic,
    requireOpenDate,
    monthDate,
    toCents,
    monthIndexFromDate,
    newId,
    monthlyExpenseDate,
    ensureDate,
    saveWorkspace,
  } = context;
  return atomic(() => {
    const existing = id ? S.receipts.find((x) => x.id === id) : null;
    if (id && !existing) throw Error('Entrada não encontrada.');
    requireOpenDate(record.date);
    if (existing)
      requireOpenDate(existing.date || monthDate(existing.legacyMonth || 0));
    if (
      typeof record.d !== 'string' ||
      !record.d.trim() ||
      record.d.length > 240 ||
      !isSafeInteger(toCents(record.v)) ||
      toCents(record.v) < 1 ||
      toCents(record.v) > MAX_CENTS ||
      !isInteger(count) ||
      count < 1 ||
      count > MAX_MONTHS - monthIndexFromDate(record.date)
    )
      throw Error('Revise o ganho, valor e quantidade de meses.');
    if (existing?.recurrenceId && count !== 1)
      throw Error(
        'Edite apenas este recebimento ou cancele as próximas repetições.',
      );
    if (S.receipts.length + count - (existing ? 1 : 0) > MAX_RECORDS)
      throw Error('Limite de entradas atingido.');
    const group = count > 1 ? newId() : null,
      created = [];
    for (let i = 0; i < count; i++) {
      const date = monthlyExpenseDate(record.date, i),
        metadata = group
          ? {
              recurrenceId: group,
              recurrenceIndex: i,
              recurrenceCount: count,
              recurrenceOrigin: record.date,
            }
          : {};
      ensureDate(date);
      const next = {
        ...record,
        d: record.d.trim(),
        date,
        incomeKind: includesValue(
          ['salary', 'monthly', 'once'],
          record.incomeKind,
        )
          ? record.incomeKind
          : 'once',
        ...metadata,
      };
      if (i === 0 && existing) {
        Object.assign(existing, next);
        delete existing.legacyMonth;
        created.push(existing);
      } else {
        const item = { id: newId(), ...next };
        S.receipts.push(item);
        created.push(item);
      }
    }
    saveWorkspace();
    return created;
  });
}
export function cancelFutureIncome(context: LedgerContext, id: string) {
  const { S, atomic, saveWorkspace, todayISO, isMonthClosed, itemMonthIndex } =
    context;
  return atomic(() => {
    const source = S.receipts.find((x) => x.id === id);
    if (!source?.recurrenceId) return 0;
    const cutoff = source.date > todayISO() ? source.date : todayISO(),
      before = S.receipts.length;
    S.receipts = S.receipts.filter(
      (x) =>
        x.recurrenceId !== source.recurrenceId ||
        x.date <= cutoff ||
        isMonthClosed(itemMonthIndex(x)),
    );
    const removed = before - S.receipts.length;
    if (removed) {
      S.receipts
        .filter((x) => x.recurrenceId === source.recurrenceId)
        .forEach((x) => (x.recurrenceStopped = true));
      saveWorkspace();
    }
    return removed;
  });
}
export function saveExpense(
  context: LedgerContext,
  record: Omit<Expense, 'id'>,
  id?: string | null,
  count = 1,
) {
  const {
    MAX_CENTS,
    MAX_RECORDS,
    MAX_MONTHS,
    CATS,
    PAY,
    MIG,
    CARDS,
    S,
    atomic,
    requireOpenDate,
    monthDate,
    toCents,
    monthIndexFromDate,
    newId,
    monthlyExpenseDate,
    ensureDate,
    saveWorkspace,
    supportedDate,
  } = context;
  return atomic(() => {
    const existing = id ? S.items.find((x) => x.id === id) : null;
    if (id && !existing)
      throw Error('Gasto não encontrado. Recarregue os dados.');
    if (existing?.splitId)
      throw Error('Altere a divisão para editar este gasto.');
    requireOpenDate(record.date);
    if (existing)
      requireOpenDate(existing.date || monthDate(existing.legacyMonth || 0));
    record = {
      ...record,
      c: MIG[record.c] || record.c,
      ...(record.c === 'Assinaturas' ? { subscription: true } : {}),
    };
    if (
      (existing?.creditPaidCents || 0) > 0 &&
      (record.creditCardId !== existing!.creditCardId ||
        record.p !== existing!.p ||
        Math.round(record.creditChargeCents ?? record.v * 100) <
          existing!.creditPaidCents!)
    )
      throw Error(
        'Este gasto tem pagamento registrado. Mantenha o cartão e um valor igual ou maior ao já pago.',
      );
    if (
      (existing?.creditPaidCents || 0) > 0 &&
      record.creditCardId === existing!.creditCardId &&
      record.creditPaidCents === undefined
    )
      record.creditPaidCents = existing!.creditPaidCents!;
    if (record.p === 'Cartão de crédito' && !record.creditCardId)
      throw Error(
        'Selecione um cartão cadastrado. Cadastre banco e limite em Compromissos → Cartões.',
      );
    if (!record.creditCardId) {
      delete record.creditCardId;
      delete record.creditPaid;
      delete record.creditChargeCents;
      delete record.creditPaidCents;
    }
    if (
      record.creditCardId &&
      (!CARDS.some(
        (c) =>
          c.id === record.creditCardId &&
          (c.active ||
            (existing?.creditCardId === record.creditCardId && count === 1)),
      ) ||
        record.p !== 'Cartão de crédito')
    )
      throw Error('Escolha um cartão ativo para este gasto.');
    if (
      !supportedDate(record.date) ||
      typeof record.d !== 'string' ||
      !record.d.trim() ||
      !CATS.includes(record.c) ||
      !PAY.includes(record.p) ||
      !isSafeInteger(toCents(record.v)) ||
      toCents(record.v) < 1 ||
      toCents(record.v) > MAX_CENTS ||
      record.d.trim().length > 240
    )
      throw Error('Revise os dados do gasto.');
    if (
      !isInteger(count) ||
      count < 1 ||
      count > MAX_MONTHS - monthIndexFromDate(record.date)
    )
      throw Error(
        'Informe uma quantidade válida de meses, incluindo o mês inicial.',
      );
    if (existing?.recurrenceId && count !== 1)
      throw Error('Este lançamento já faz parte de uma repetição mensal.');
    if (S.items.length + count - (existing ? 1 : 0) > MAX_RECORDS)
      throw Error('A repetição ultrapassa o limite de lançamentos.');
    const dates = Array.from({ length: count }, (_, i) =>
        monthlyExpenseDate(record.date, i),
      ),
      group = count > 1 ? newId() : null,
      created: Expense[] = [];
    dates.forEach((date, i) => {
      ensureDate(date);
      const metadata = group
        ? {
            recurrenceId: group,
            recurrenceIndex: i,
            recurrenceCount: count,
            recurrenceOrigin: record.date,
          }
        : {};
      if (i === 0 && existing) {
        Object.assign(existing, record, { date }, metadata);
        if (!record.creditCardId) {
          delete existing!.creditCardId;
          delete existing.creditPaid;
          delete existing.creditChargeCents;
          delete existing!.creditPaidCents;
        }
        delete existing.legacyMonth;
        created.push(existing);
      } else {
        const item = {
          id: newId(),
          ...record,
          date,
          ...metadata,
          ...(record.creditCardId
            ? {
                creditPaid: i === 0 ? !!record.creditPaid : false,
                creditPaidCents: i === 0 ? record.creditPaidCents || 0 : 0,
              }
            : {}),
        };
        S.items.push(item);
        created.push(item);
      }
    });
    saveWorkspace();
    return created;
  });
}
export function cancelFutureExpenses(context: LedgerContext, id: string) {
  const { S, atomic, saveWorkspace, todayISO } = context;
  return atomic(() => {
    const item = S.items.find((x) => x.id === id);
    if (!item?.recurrenceId) return 0;
    const cutoff = item.date > todayISO() ? item.date : todayISO(),
      before = S.items.length;
    S.items = S.items.filter(
      (x) => x.recurrenceId !== item.recurrenceId || x.date <= cutoff,
    );
    const removed = before - S.items.length;
    if (removed) {
      S.items
        .filter((x) => x.recurrenceId === item.recurrenceId)
        .forEach((x) => (x.recurrenceStopped = true));
      saveWorkspace();
    }
    return removed;
  });
}
