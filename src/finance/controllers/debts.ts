import type { Debt } from '../../types/workspace';
import { isInteger, isSafeInteger } from '../../services/type-guards.ts';
export interface DebtContext {
  DEBTS: Debt[];
  MAX_MONTHS: number;
  MAX_RECORDS: number;
  MAX_CENTS: number;
  atomic: <T>(operation: () => T) => T;
  ensureIndex: (index: number) => unknown;
  saveWorkspace: () => void;
}
export function saveDebt(context: DebtContext, input: Debt, index?: number) {
  const {
    DEBTS,
    MAX_MONTHS,
    MAX_RECORDS,
    MAX_CENTS,
    atomic,
    ensureIndex,
    saveWorkspace,
  } = context;
  return atomic(() => {
    const record = { ...input, n: input.n.trim() },
      paid = record.paid ?? 0;
    if (!record.n || record.n.length > 240)
      throw Error('Informe um credor de até 240 caracteres.');
    if (
      Math.abs(record.v * 100 - Math.round(record.v * 100)) > 0.000001 ||
      !isSafeInteger(Math.round(record.v * 100)) ||
      record.v <= 0 ||
      Math.round(record.v * 100) > MAX_CENTS
    )
      throw Error('Informe um valor válido para a dívida.');
    if (
      !isInteger(record.p) ||
      record.p < 1 ||
      record.p > MAX_MONTHS ||
      !isInteger(record.s) ||
      record.s < 0 ||
      record.s + record.p > MAX_MONTHS ||
      !isInteger(paid) ||
      paid < 0 ||
      paid > record.p
    )
      throw Error(
        'Revise as parcelas: use de 1 a ' +
          MAX_MONTHS +
          ', dentro do período disponível, e uma quantidade válida de parcelas pagas.',
      );
    if (
      record.sharedRef &&
      DEBTS.some((row, i) => i !== index && row.sharedRef === record.sharedRef)
    )
      throw Error('Esta dívida já foi adicionada.');
    if (index !== undefined) {
      if (!isInteger(index) || !DEBTS[index])
        throw Error('Dívida não encontrada.');
      Object.assign(DEBTS[index], record, { paid });
    } else {
      if (DEBTS.length >= MAX_RECORDS)
        throw Error('Limite de dívidas atingido.');
      DEBTS.push({ ...record, paid });
    }
    ensureIndex(record.s + record.p - 1);
    saveWorkspace();
    return record;
  });
}
