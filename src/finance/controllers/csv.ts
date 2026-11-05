import type { CsvPreview, LedgerRecord, Expense } from '../../types/workspace';
import { isSafeInteger } from '../../services/type-guards.ts';
import { errorDetails } from '../../services/errors.ts';
export interface CsvContext {
  MAX_RECORDS: number;
  S: { receipts: LedgerRecord[]; items: Expense[] };
  supportedDate: (value: string) => boolean;
  requireOpenDate: (value: string) => void;
  parseMoney: (value: unknown) => number;
  toCents: (value: unknown) => number;
}
export function csvRows(text: string) {
  text = String(text).replace(/^\uFEFF/, '');
  const scores: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  let quote = false;
  for (
    let i = 0;
    i < text.length && text[i] !== '\n' && text[i] !== '\r';
    i++
  ) {
    if (text[i] === '"') {
      if (quote && text[i + 1] === '"') {
        i++;
        continue;
      }
      quote = !quote;
    } else if (!quote && text[i] in scores) scores[text[i]]++;
  }
  const separator = Object.keys(scores).sort(
    (a, b) => scores[b] - scores[a],
  )[0];
  const rows = [];
  let row = [],
    value = '',
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (!quoted && value !== '')
        throw Error('Aspas em posição inválida no CSV.');
      else {
        quoted = !quoted;
        if (!quoted) closed = true;
      }
    } else if (!quoted && c === separator) {
      row.push(value);
      value = '';
      closed = false;
    } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(value);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      value = '';
      closed = false;
    } else {
      if (closed && !quoted && !/\s/.test(c))
        throw Error('Texto após fechamento de aspas no CSV.');
      value += c;
    }
  }
  if (quoted) throw Error('O CSV tem um campo com aspas não fechadas.');
  row.push(value);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
export function parseCsvDate(context: CsvContext, value: unknown) {
  const { supportedDate } = context;
  const text = String(value || '').trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/),
    date = match ? text : '';
  if (!date) {
    match = text.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
    if (match)
      date = `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2]}-${match[1]}`;
  }
  return supportedDate(date) ? date : '';
}
export function prepareCsv(
  context: CsvContext,
  text: string,
  convention: string,
) {
  const { MAX_RECORDS, S, requireOpenDate, parseMoney, toCents } = context;

  const rows = csvRows(text);
  if (!rows.length) throw Error('O arquivo está vazio.');
  if (rows.length > MAX_RECORDS + 1)
    throw Error('Importe até ' + MAX_RECORDS + ' linhas por arquivo.');
  const fold = (v: string) =>
    String(v)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const header = rows[0].map(fold),
    aliases = {
      date: ['data', 'date'],
      description: ['descricao', 'description', 'historico'],
      value: ['valor', 'value', 'amount'],
      type: ['tipo', 'type'],
    },
    columns: Record<string, number> = {};
  for (const [key, names] of Object.entries(aliases))
    columns[key] = header.findIndex((h) => names.includes(h));
  let first = 1;
  if (columns.date < 0 || columns.description < 0 || columns.value < 0) {
    if (parseCsvDate(context, rows[0][0]) && rows[0].length === 3) {
      Object.assign(columns, { date: 0, description: 1, value: 2, type: -1 });
      first = 0;
    } else
      throw Error(
        'Use as colunas data, descrição e valor. A coluna tipo é opcional.',
      );
  }
  if (columns.type < 0 && !['signed', 'expense', 'income'].includes(convention))
    throw Error(
      'Escolha como interpretar os valores do extrato antes de importar.',
    );
  const result: CsvPreview = {
    records: [],
    errors: [],
    incomeCents: 0,
    expenseCents: 0,
  };
  for (let i = first; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (row.length !== rows[0].length)
        throw Error('Quantidade de colunas diferente do cabeçalho');
      const date = parseCsvDate(context, row[columns.date]);
      if (!date) throw Error('Data inválida ou fora do intervalo');
      requireOpenDate(date);
      const label = row[columns.description].trim();
      if (!label || label.length > 240)
        throw Error('Descrição vazia ou muito longa');
      const cents = parseMoney(row[columns.value]);
      if (!isSafeInteger(cents) || cents === 0)
        throw Error('Valor inválido; use até duas casas decimais');
      let type;
      if (columns.type >= 0) {
        const raw = fold(row[columns.type]);
        if (
          ['entrada', 'recebimento', 'receita', 'credito', 'income'].includes(
            raw,
          )
        )
          type = 'i';
        else if (['gasto', 'despesa', 'debito', 'expense'].includes(raw))
          type = 'g';
        else throw Error('Tipo deve ser entrada ou gasto');
      } else
        type =
          convention === 'income'
            ? 'i'
            : convention === 'expense'
              ? 'g'
              : cents > 0
                ? 'i'
                : 'g';
      result.records.push({ type, date, d: label, v: Math.abs(cents) / 100 });
      result[type === 'i' ? 'incomeCents' : 'expenseCents'] += Math.abs(cents);
    } catch (e) {
      result.errors.push({ line: i + 1, message: errorDetails(e).message });
    }
  }
  const fingerprint = (x: Pick<LedgerRecord, 'date' | 'd' | 'v'>) =>
    [x.date, x.d, toCents(x.v)].join('|');
  result.matches = result.records.filter((r) =>
    (r.type === 'i' ? S.receipts : S.items).some(
      (x) => fingerprint(x) === fingerprint(r),
    ),
  ).length;
  return result;
}
