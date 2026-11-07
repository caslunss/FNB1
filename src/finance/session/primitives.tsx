import React from 'react';
import { isSafeInteger } from '../../services/type-guards.ts';
import type { WorkspaceElement } from '../../types/workspace-dom';
import type { Expense, ClosedReport } from '../../types/workspace';
import { core_toCents } from '../calculations.ts';
import type { WorkspaceRuntime } from './contracts';

type PrimitivesContext = Pick<
  WorkspaceRuntime,
  | '$'
  | 'BACKUP_KEY'
  | 'CATS'
  | 'ICON'
  | 'LEGACY_KEYS'
  | 'MAX_CENTS'
  | 'MAX_MONTHS'
  | 'MAX_RECORDS'
  | 'MIG'
  | 'MIN_DATE'
  | 'MONTH_ABBR'
  | 'P'
  | 'PAY'
  | 'START_MONTH'
  | 'START_YEAR'
  | 'TITLES'
  | 'WORKSPACE_KEY'
  | 'brl'
  | 'canonicalCategory'
  | 'dateLabel'
  | 'dateLong'
  | 'defaultDateForMonth'
  | 'engineContext'
  | 'esc'
  | 'indexFromKey'
  | 'issuedIds'
  | 'migrateExpenseCategory'
  | 'monthDate'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'monthLabelFromKey'
  | 'newId'
  | 'pad'
  | 'parseMoney'
  | 'sum'
  | 'supportedDate'
  | 'toCents'
  | 'todayISO'
  | 'validDate'
>;

export function createPrimitives(workspace: PrimitivesContext) {
  function toCents(value: unknown) {
    return core_toCents(workspace.engineContext, value);
  }

  function parseMoney(value: unknown) {
    let text = String(value ?? '')
      .trim()
      .replace(/^R\$\s*/, '');
    if (!text) return NaN;
    if (text.includes(',')) {
      if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(text)) return NaN;
      text = text.replace(/\./g, '').replace(',', '.');
    } else if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) return NaN;
    const [whole, frac = ''] = text.replace('-', '').split('.');
    const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
    return isSafeInteger(cents) && cents <= workspace.MAX_CENTS
      ? text[0] === '-'
        ? -cents
        : cents
      : NaN;
  }

  function moneyInput(input: HTMLInputElement | null, { zero = false } = {}) {
    const cents = workspace.parseMoney(input?.value);
    if (!isSafeInteger(cents) || cents < (zero ? 0 : 1)) {
      input?.focus();
      throw Error(
        'Informe um valor válido, com no máximo duas casas decimais.',
      );
    }
    return cents / 100;
  }

  function validDate(value: unknown): value is string {
    if (
      typeof value !== 'string' ||
      !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)
    )
      return false;
    const [y, m, d] = value.split('-').map(Number),
      date = new Date(y, m - 1, d, 12);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  }

  function newId() {
    let id;
    do {
      if ((globalThis.crypto as Partial<Crypto>)?.randomUUID)
        id = crypto.randomUUID();
      else if ((globalThis.crypto as Partial<Crypto>)?.getRandomValues) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        id =
          'id-' +
          Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join('');
      } else
        id =
          'id-' +
          Date.now().toString(36) +
          '-' +
          ++workspace.newId.counter +
          '-' +
          Math.random().toString(36).slice(2);
    } while (workspace.issuedIds.has(id));
    workspace.issuedIds.add(id);
    return id;
  }

  newId.counter = 0;

  function migrateReportCategories(report: ClosedReport) {
    const expenses = report.expenses.map(workspace.migrateExpenseCategory),
      categories = workspace.CATS.map((name) => {
        const cents = report.categories
          .filter((x) => workspace.canonicalCategory(x.name) === name)
          .reduce((n, x) => n + x.cents, 0);
        if (!isSafeInteger(cents) || cents < 0)
          throw Error('Total de categoria inválido.');
        return { name, cents };
      });
    return { ...report, expenses, categories };
  }
  return {
    toCents,
    parseMoney,
    moneyInput,
    validDate,
    newId,
    migrateReportCategories,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'toCents'
    | 'parseMoney'
    | 'moneyInput'
    | 'validDate'
    | 'newId'
    | 'migrateReportCategories'
  >;
}

export function initializePrimitives(workspace: PrimitivesContext) {
  // @workspace-step 16 FirstStatement
  workspace.START_YEAR = 2026;
  workspace.START_MONTH = 9;
  workspace.MIN_DATE = '2026-10-01';
  // @workspace-end 16
  // @workspace-step 17 FirstStatement
  workspace.MONTH_ABBR = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  // @workspace-end 17
  // @workspace-step 18 FirstStatement
  workspace.CATS = [
    'Gastos Essenciais',
    'Gastos Variáveis',
    'Gastos Fixos',
    'Gastos Supérfluos',
    'Investimentos',
  ];
  // @workspace-end 18
  // @workspace-step 19 FirstStatement
  workspace.PAY = ['Pix', 'Débito', 'Cartão de crédito'];
  // @workspace-end 19
  // @workspace-step 20 FirstStatement
  workspace.TITLES = {
    f: 'Análises',
    c: 'Calendário',
    r: 'Resumo',
    i: 'Entradas',
    d: 'Compromissos',
    s: 'Dividir conta',
    k: 'Cartões',
    o: 'Planejamento',
    x: 'Configurações',
    u: 'Você',
  };
  // @workspace-end 20
  // @workspace-step 21 FirstStatement
  workspace.P = (d: React.ReactNode) => (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      {d}
    </svg>
  );
  // @workspace-end 21
  // @workspace-step 22 FirstStatement
  workspace.ICON = {
    share: workspace.P(
      <path d="M8 8H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-3M12 15V2m0 0L8 6m4-4 4 4"></path>,
    ),
    x: workspace.P(
      <g transform="translate(1.5 1)">
        <path d="m9 3-.6 2.3-2 .9-2.2-.7-1.5 2.6L4.3 10v2l-1.6 1.9 1.5 2.6 2.2-.7 2 .9L9 19h3l.6-2.3 2-.9 2.2.7 1.5-2.6-1.6-1.9v-2l1.6-1.9-1.5-2.6-2.2.7-2-.9L12 3Z"></path>
        <circle cx="10.5" cy="11" r="3"></circle>
      </g>,
    ),
    r: workspace.P(
      <>
        <path d="M12 3a9 9 0 1 0 9 9h-9V3z"></path>
        <path d="M15 3.6A9 9 0 0 1 20.4 9H15V3.6z"></path>
      </>,
    ),
    g: workspace.P(
      <>
        <rect x="3" y="5.5" width="18" height="13" rx="3"></rect>
        <path d="M3 10h18M6.5 15h4"></path>
      </>,
    ),
    i: workspace.P(<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19.5h14"></path>),
    d: workspace.P(
      <>
        <rect x="5" y="3" width="14" height="18" rx="3"></rect>
        <path d="M9 8h6M9 12h6M9 16h3"></path>
      </>,
    ),
    b: workspace.P(
      <path d="M3 9l9-5 9 5M5.5 9v8.5M10 9v8.5M14 9v8.5M18.5 9v8.5M3 20h18"></path>,
    ),
    c: workspace.P(
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="2.5"></rect>
        <path d="M7.5 3v4M16.5 3v4M4 9.5h16M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"></path>
      </>,
    ),
    u: workspace.P(
      <>
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 21a8 8 0 0 1 16 0"></path>
      </>,
    ),
    o: workspace.P(
      <>
        <path d="M3 4h8l10 10-7 7L3 10z"></path>
        <circle cx="7" cy="8" r="1"></circle>
      </>,
    ),
    k: workspace.P(<path d="M3 4h3l2 12h11l2-9H7M9 20h.01M18 20h.01"></path>),
    s: workspace.P(
      <>
        <circle cx="7" cy="7" r="3"></circle>
        <circle cx="17" cy="7" r="3"></circle>
        <path d="M2 19v-2a5 5 0 0 1 10 0v2M12 19v-2a5 5 0 0 1 10 0v2"></path>
      </>,
    ),
    plus: workspace.P(<path d="M12 5v14M5 12h14"></path>),
    chev: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M6 3l5 5-5 5"></path>
      </svg>
    ),
    more: workspace.P(
      <>
        <circle cx="5.5" cy="12" r="1.2"></circle>
        <circle cx="12" cy="12" r="1.2"></circle>
        <circle cx="18.5" cy="12" r="1.2"></circle>
      </>,
    ),
    left: workspace.P(<path d="M15 18l-6-6 6-6"></path>),
    right: workspace.P(<path d="M9 18l6-6-6-6"></path>),
  };
  // @workspace-end 22
  // @workspace-step 23 FirstStatement
  workspace.brl = (n: unknown) =>
    (Number(n) || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  // @workspace-end 23
  // @workspace-step 24 FirstStatement
  workspace.esc = (value: unknown) => String(value ?? '');
  // @workspace-end 24
  // @workspace-step 25 FirstStatement
  workspace.$ = <S extends string>(s: S) =>
    document.querySelector(s) as WorkspaceElement<S>;
  // @workspace-end 25
  // @workspace-step 26 FirstStatement
  workspace.MAX_MONTHS = 240;
  workspace.MAX_CENTS = 100000000000;
  workspace.MAX_RECORDS = 10000;
  workspace.WORKSPACE_KEY = 'plan12workspace_v3';
  workspace.BACKUP_KEY = 'plan12backup_before_v3';
  // @workspace-end 26
  // @workspace-step 27 FirstStatement
  workspace.LEGACY_KEYS = [
    'plan12',
    'plan12receipts',
    'plan12lim',
    'plan12goal',
    'plan12debts',
    'plan12monthCount',
    'plan12profile',
    'plan12splits',
    'plan12closedReports',
    'plan12inc',
    'plan12offers',
    'plan12cart',
    'plan12schema',
  ];
  // @workspace-end 27
  // @workspace-step 28 FirstStatement
  workspace.pad = (n: unknown) => String(n).padStart(2, '0');
  // @workspace-end 28

  // @workspace-step 32 FirstStatement
  workspace.sum = (a: readonly { v: number }[]) =>
    a.reduce((total, x) => total + workspace.toCents(x.v), 0) / 100;
  // @workspace-end 32
  // @workspace-step 33 FirstStatement
  workspace.monthKeyForIndex = (i: number) => {
    const d = new Date(workspace.START_YEAR, workspace.START_MONTH + i, 1);
    return `${d.getFullYear()}-${workspace.pad(d.getMonth() + 1)}`;
  };
  // @workspace-end 33
  // @workspace-step 34 FirstStatement
  workspace.monthDate = (i: number) => `${workspace.monthKeyForIndex(i)}-01`;
  // @workspace-end 34

  // @workspace-step 36 FirstStatement
  workspace.indexFromKey = (k: string) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(k || ''))) return -1;
    const [y, m] = k.split('-').map(Number);
    return (y - workspace.START_YEAR) * 12 + (m - 1 - workspace.START_MONTH);
  };
  // @workspace-end 36
  // @workspace-step 37 FirstStatement
  workspace.monthIndexFromDate = (d: string) =>
    workspace.validDate(d) ? workspace.indexFromKey(d.slice(0, 7)) : -1;
  // @workspace-end 37
  // @workspace-step 38 FirstStatement
  workspace.supportedDate = (d: unknown): d is string =>
    workspace.validDate(d) &&
    workspace.monthIndexFromDate(d) >= 0 &&
    workspace.monthIndexFromDate(d) < workspace.MAX_MONTHS;
  // @workspace-end 38
  // @workspace-step 39 FirstStatement
  workspace.monthLabelFromKey = (k: string) => {
    const [y, m] = k.split('-').map(Number);
    return `${workspace.MONTH_ABBR[m - 1]}/${String(y).slice(-2)}`;
  };
  // @workspace-end 39
  // @workspace-step 40 FirstStatement
  workspace.dateLabel = (d: string) =>
    workspace.validDate(d)
      ? `${Number(d.slice(8))} ${workspace.MONTH_ABBR[Number(d.slice(5, 7)) - 1].toLowerCase()}`
      : 'Data não informada';
  // @workspace-end 40
  // @workspace-step 41 FirstStatement
  workspace.dateLong = (d: string) =>
    workspace.validDate(d)
      ? new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Data não informada';
  // @workspace-end 41
  // @workspace-step 42 FirstStatement
  workspace.todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${workspace.pad(d.getMonth() + 1)}-${workspace.pad(d.getDate())}`;
  };
  // @workspace-end 42
  // @workspace-step 43 FirstStatement
  workspace.defaultDateForMonth = (m: number) =>
    workspace.todayISO().slice(0, 7) === workspace.monthKeyForIndex(m) &&
    workspace.supportedDate(workspace.todayISO())
      ? workspace.todayISO()
      : workspace.monthDate(m);
  // @workspace-end 43
  // @workspace-step 44 FirstStatement
  workspace.issuedIds = new Set();
  // @workspace-end 44

  // @workspace-step 46 ExpressionStatement
  workspace.newId.counter = 0;
  // @workspace-end 46
  // @workspace-step 47 FirstStatement
  workspace.MIG = {
    Fixos: 'Gastos Fixos',
    'Gastos fixos': 'Gastos Fixos',
    Assinaturas: 'Gastos Fixos',
    Alimentação: 'Gastos Essenciais',
    Transporte: 'Gastos Essenciais',
    Necessidades: 'Gastos Essenciais',
    Essenciais: 'Gastos Essenciais',
    'Ajuda à mãe': 'Gastos Essenciais',
    'Compras do mês': 'Gastos Essenciais',
    Aleatórios: 'Gastos Variáveis',
    Outros: 'Gastos Variáveis',
    'Gastos aleatórios': 'Gastos Variáveis',
    Imprevistos: 'Gastos Variáveis',
    Lazer: 'Gastos Supérfluos',
    Entretenimento: 'Gastos Supérfluos',
  };
  // @workspace-end 47
  // @workspace-step 48 FirstStatement
  workspace.canonicalCategory = (c: string | undefined) =>
    workspace.CATS.includes(c!)
      ? c!
      : Object.hasOwn(workspace.MIG, c!)
        ? workspace.MIG[c!]
        : 'Gastos Variáveis';
  // @workspace-end 48
  // @workspace-step 49 FirstStatement
  workspace.migrateExpenseCategory = (x: Expense) => ({
    ...x,
    c: workspace.canonicalCategory(x.c),
    ...(x.subscription === true || x.c === 'Assinaturas'
      ? { subscription: true }
      : {}),
  });
  // @workspace-end 49
}
