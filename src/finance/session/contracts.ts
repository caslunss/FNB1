import { type PlanningContext } from '../controllers/planning';
import { type DebtContext } from '../controllers/debts';
import { type LedgerContext } from '../controllers/ledger';
import { type CsvContext } from '../controllers/csv';
import React from 'react';
import type { CsvPreview } from '../../types/workspace';
import type { PurchasePlan } from '../../types/calculations';
import type { WorkspaceViewContext } from '../../types/views';
import type { FinancialCalculationContext } from '../../types/calculations';
import type { WorkspaceElement } from '../../types/workspace-dom';
import type {
  WorkspaceSnapshot,
  RecoveryRow,
  LedgerRecord,
  Expense,
  Debt,
  Split,
  ShoppingPlan,
  ShoppingOffer,
  ClosedReport,
  Friend,
  SharedExpense,
  SheetState,
  ActionRow,
  ProductPreview,
  OfferResult,
} from '../../types/workspace';
import type {
  FinancialGoal,
  CreditCard,
  FinanceServices,
} from '../../types/finance-runtime';
import type { OcrWorker } from '../../types/browser';

import type { SessionScope } from './scope';
export interface WorkspaceRuntime {
  readonly scope: SessionScope;
  renderView: (
    target: HTMLElement | null | undefined,
    content: React.ReactNode,
  ) => void;
  localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  viewContext: WorkspaceViewContext;
  engineContext: FinancialCalculationContext;
  planningContext: PlanningContext;
  debtContext: DebtContext;
  ledgerContext: LedgerContext;
  START_YEAR: 2026;
  START_MONTH: 9;
  MIN_DATE: '2026-10-01';
  MONTH_ABBR: string[];
  CATS: string[];
  PAY: string[];
  TITLES: Record<string, string>;
  P: (d: React.ReactNode) => React.JSX.Element;
  ICON: Record<string, React.ReactNode>;
  brl: (n: unknown) => string;
  esc: (value: unknown) => string;
  $: <S extends string>(s: S) => WorkspaceElement<S>;
  MAX_MONTHS: 240;
  MAX_CENTS: 100000000000;
  MAX_RECORDS: 10000;
  WORKSPACE_KEY: 'plan12workspace_v3';
  BACKUP_KEY: 'plan12backup_before_v3';
  LEGACY_KEYS: string[];
  pad: (n: unknown) => string;
  toCents: (value: unknown) => number;
  parseMoney: (value: unknown) => number;
  moneyInput: (
    input: HTMLInputElement | null,
    { zero }?: { zero?: boolean | undefined },
  ) => number;
  sum: (a: readonly { v: number }[]) => number;
  monthKeyForIndex: (i: number) => string;
  monthDate: (i: number) => string;
  validDate: (value: unknown) => value is string;
  indexFromKey: (k: string) => number;
  monthIndexFromDate: (d: string) => number;
  supportedDate: (d: unknown) => d is string;
  monthLabelFromKey: (k: string) => string;
  dateLabel: (d: string) => string;
  dateLong: (d: string) => string;
  todayISO: () => string;
  defaultDateForMonth: (m: number) => string;
  issuedIds: Set<unknown>;
  newId: { (): string; counter: number };
  MIG: Record<string, string>;
  canonicalCategory: (c: string | undefined) => string;
  migrateExpenseCategory: (x: Expense) => {
    subscription?: boolean;
    c: string;
    p: string;
    id: string;
    d: string;
    v: number;
    date: string;
    m?: number;
    legacyMonth?: number;
    splitId?: string;
    recurrenceId?: string;
    recurrenceIndex?: number;
    recurrenceCount?: number;
    recurrenceOrigin?: string;
    recurrenceStopped?: boolean;
    incomeKind?: string;
    creditCardId?: string;
    creditPaid?: boolean;
    creditPaidCents?: number;
    creditChargeCents?: number;
  };
  migrateReportCategories: (report: ClosedReport) => {
    expenses: {
      subscription?: boolean;
      c: string;
      p: string;
      id: string;
      d: string;
      v: number;
      date: string;
      m?: number;
      legacyMonth?: number;
      splitId?: string;
      recurrenceId?: string;
      recurrenceIndex?: number;
      recurrenceCount?: number;
      recurrenceOrigin?: string;
      recurrenceStopped?: boolean;
      incomeKind?: string;
      creditCardId?: string;
      creditPaid?: boolean;
      creditPaidCents?: number;
      creditChargeCents?: number;
    }[];
    categories: { name: string; cents: number }[];
    key: string;
    label: string;
    closedOn: string;
    incomeCents: number;
    expenseCents: number;
    debtCents: number;
    balanceCents: number;
    receipts: LedgerRecord[];
    debts?: { name: string; cents: number }[];
  };
  recovery: RecoveryRow[];
  rawSource: Record<string, string>;
  readBlocked: boolean;
  storageBase: string | null;
  backupReady: boolean;
  noticeMessage: string;
  noticeError: boolean;
  readRaw: (key: string) => string | null;
  parseRaw: <T>(key: string, fallback: T) => T;
  load: <T>(key: string, fallback: T, ok: (value: T) => unknown) => T;
  rejected: (key: string, value: unknown, reason: string) => void;
  oldAmount: (value: unknown, max?: number) => number;
  cleanWorkspace: (raw: Partial<WorkspaceSnapshot>) => WorkspaceSnapshot;
  convertMoney: (
    state: WorkspaceSnapshot,
    direction: 'encode' | 'decode',
  ) => WorkspaceSnapshot;
  boot: WorkspaceSnapshot;
  LIM: Record<string, number>[];
  GOAL: FinancialGoal;
  DEBTS: Debt[];
  PROFILE: { name: string };
  SPLITS: Split[];
  CLOSED_REPORTS: Record<string, ClosedReport>;
  monthCount: number;
  CART: ShoppingPlan[];
  OFFERS: ShoppingOffer[];
  CARDS: CreditCard[];
  M: string[];
  chartMetric: string;
  entryFilter: string;
  refreshMonths: () => void;
  S: {
    m: number;
    tab: string;
    goal: boolean;
    q: string;
    items: Expense[];
    receipts: LedgerRecord[];
    calDate: string;
    bank: boolean;
  };
  transactionDepth: number;
  pendingSave: boolean;
  drawPending: boolean;
  saveNumber: number;
  allowClosedReset: boolean;
  savedMonthBaseline: WorkspaceSnapshot;
  snapshot: () => {
    items: Expense[];
    receipts: LedgerRecord[];
    debts: Debt[];
    limits: Record<string, number>[];
    goal: FinancialGoal;
    profile: { name: string };
    splits: Split[];
    reports: Record<string, ClosedReport>;
    monthCount: number;
    cart: ShoppingPlan[];
    offers: ShoppingOffer[];
    creditCards: CreditCard[];
  };
  restore: (state: WorkspaceSnapshot) => void;
  isMonthClosed: (
    m: number,
    reports?: Record<string, ClosedReport>,
    date?: string,
  ) => boolean;
  requireOpenDate: (date: string) => void;
  assertClosedUnchanged: (
    before: WorkspaceSnapshot,
    after: WorkspaceSnapshot,
  ) => void;
  writeStorage: (key: string, text: string) => void;
  persist: () => void;
  bootRecovery: RecoveryRow[];
  atomic: <T>(action: () => T) => T;
  saveWorkspace: () => void;
  emptyFinancialSnapshot: (state: WorkspaceSnapshot) => {
    items: never[];
    receipts: never[];
    debts: never[];
    limits: {}[];
    goal: { v: number; e: number };
    splits: never[];
    reports: {};
    cart: never[];
    offers: never[];
    creditCards: never[];
    profile: { name: string };
    monthCount: number;
  };
  resetFinancialData: () => Promise<
    | 'Dados financeiros zerados. Não foi possível apagar as análises tributárias; tente novamente conectado.'
    | 'Dados zerados neste aparelho. A sincronização está pendente; confira a conexão e as configurações.'
    | 'Dados financeiros zerados.'
  >;
  put: (key: string, value: unknown) => void;
  saveI: () => void;
  saveReceipts: () => void;
  saveL: () => void;
  saveG: () => void;
  saveD: () => void;
  saveMonthCount: () => void;
  showNotice: (message: string, error?: boolean) => void;
  showError: (error: unknown) => void;
  clearTransientError: () => void;
  safely: (action: {
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
  }) => false | void;
  exportBackup: () => void;
  ensureIndex: (idx: number) => void;
  ensureDate: (date: string) => boolean;
  addNextMonth: () => void;
  itemMonthIndex: (i: { date?: string; legacyMonth?: number }) => number;
  itemsInMonth: (m: number) => Expense[];
  receiptsInMonth: (m: number) => LedgerRecord[];
  inc: (m: number) => number;
  spent: (m: number) => number;
  lim: (m: number, c: string) => number;
  dm: (d: Debt, m: number) => number;
  debt: (m: number) => number;
  expenseBudgetCents: (
    m: number,
    extraCategory?: string,
    extraCents?: number,
  ) => number;
  monthProjectionCents: (
    m: number,
    extraCategory?: string,
    extraCents?: number,
    cutoff?: string,
  ) => number;
  goalMonthProjectionCents: (
    m: number,
    extraCategory?: string,
    extraCents?: number,
    cutoff?: string,
  ) => number;
  goalInvestedCents: (m: number) => number;
  goalProjection: (m: number) => number;
  saveGoal: (
    input: Parameters<FinanceServices['goal']['save']>[0],
  ) => FinancialGoal;
  saveDebt: (
    input: Debt,
    index?: number,
  ) => {
    n: string;
    v: number;
    p: number;
    s: number;
    paid?: number;
    sharedRef?: string;
  };
  saveIncome: (
    record: Omit<LedgerRecord, 'id'>,
    id?: string | null,
    count?: number,
  ) => LedgerRecord[];
  cancelFutureIncome: (id: string) => number;
  mbtn: (k: string, id: string | number, label: string) => React.JSX.Element;
  monthlyExpenseDate: (anchor: string, offset: number) => string;
  saveExpense: (
    record: Omit<Expense, 'id'>,
    id?: string | null,
    count?: number,
  ) => Expense[];
  cancelFutureExpenses: (id: string) => number;
  creditCardOptions: (selected?: string) => React.JSX.Element;
  creditPlanGuide: (
    plan: Pick<ShoppingPlan, 'priceCents' | 'shippingCents'>,
  ) => React.JSX.Element | '';
  recurrenceFields: (
    item: Partial<LedgerRecord>,
    date: string,
    repeatDefault?: boolean,
  ) => React.JSX.Element;
  safeProductUrl: (value: unknown) => string;
  validateShopping: {
    (
      x: Partial<ShoppingPlan & ShoppingOffer>,
      kind: 'cart',
      loading?: boolean,
    ): ShoppingPlan;
    (
      x: Partial<ShoppingPlan & ShoppingOffer>,
      kind: string,
      loading?: boolean,
    ): ShoppingPlan | ShoppingOffer;
  };
  saveShopping: (record: Partial<ShoppingPlan>, kind: string) => ShoppingPlan;
  planSchedule: (plan: PurchasePlan) => {
    date: string;
    cents: number;
    totalCents: number;
    shareOffset: number;
  }[];
  planProjection: (plan: PurchasePlan) => {
    rows: {
      m: number;
      income: number;
      commitments: number;
      after: number;
      overdueCents: number;
      complete: boolean;
      date: string;
      cents: number;
      totalCents: number;
      shareOffset: number;
    }[];
    totalCents: number;
    goalAfter: number | null;
  };
  confirmPlannedPurchase: (
    id: string | undefined,
    confirmed: boolean,
    expected: string | undefined,
    selectedCard?: string,
  ) => ShoppingPlan;
  tiles: (m: number, it: Expense[]) => React.ReactNode;
  investmentCategoryTile: (
    m: number,
    records: Expense[],
    value: number,
    limit: number,
  ) => React.JSX.Element;
  investmentGoalView: (m: number) => React.JSX.Element;
  categoryExpenseDetails: (records: Expense[]) => React.JSX.Element | '';
  categoryLabel: (c: string) => string;
  categoryPercent: (value: number, total: number) => string;
  mf: (v: number) => string;
  donut: (it: Expense[]) => React.JSX.Element;
  topList: (
    it: Expense[],
  ) =>
    | string
    | number
    | bigint
    | boolean
    | Iterable<React.ReactNode>
    | Promise<Awaited<React.ReactNode>>
    | React.JSX.Element
    | null
    | undefined;
  vR: () => React.JSX.Element;
  vI: () => React.JSX.Element;
  debtInstallments: (d: Debt) => number[];
  debtPaidCount: (d: Debt) => number;
  debtRemainingCents: (d: Debt) => number;
  debtSchedule: (start: number) => { m: number; v: number }[];
  debtChart: () => React.JSX.Element;
  vD: () => React.JSX.Element;
  financeToolsView: () => React.JSX.Element;
  totalsByDate: () => Record<
    string,
    {
      date: string;
      spent: number;
      income: number;
      count: number;
      expenseCount?: number;
    }
  >;
  calendarDayLabel: (iso: string, expense: number, income: number) => string;
  vC: () => React.JSX.Element;
  suspendedAccountPanel: string | null;
  accountPanel: string | null;
  accountSettingsTab: string;
  overlayOpener: Element | null;
  renderedRoute: string | null;
  committingRoute: boolean;
  areaViews: Record<string, string>;
  selectAreaView: (value: string) => boolean;
  areaNavigation: (area: string, label: string) => React.JSX.Element;
  commitmentsView: () => React.JSX.Element;
  planningView: () => React.JSX.Element;
  analysisView: () => React.JSX.Element;
  draw: () => void;
  MENU: Record<string, (id?: string | number) => ActionRow[]>;
  SH: SheetState | null;
  openSheet: (a: { dataset: DOMStringMap }) => void;
  closeSheet: () => void;
  saveSheet: () => void;
  removeLim: () => void;
  switchMonth: (m: string | number) => void;
  syncNavigation: () => void;
  renderNavigation: () => void;
  dispatchWorkspaceAction: (a: { dataset: DOMStringMap }) => void;
  monthComparison: (metric: string, m: number) => React.JSX.Element;
  goalChart: () => React.JSX.Element;
  periodChart: () => React.JSX.Element;
  dailyBars: () => React.JSX.Element;
  contextActivity: () => React.JSX.Element;
  appearanceMedia: MediaQueryList;
  appearance: () => string;
  applyAppearance: (mode: string) => void;
  makeClosedReport: (
    m: number,
    closedOn: string,
  ) => {
    key: string;
    label: string;
    closedOn: string;
    incomeCents: number;
    expenseCents: number;
    debtCents: number;
    balanceCents: number;
    expenses: {
      c: string;
      p: string;
      id: string;
      d: string;
      v: number;
      date: string;
      m?: number;
      legacyMonth?: number;
      subscription?: boolean;
      splitId?: string;
      recurrenceId?: string;
      recurrenceIndex?: number;
      recurrenceCount?: number;
      recurrenceOrigin?: string;
      recurrenceStopped?: boolean;
      incomeKind?: string;
      creditCardId?: string;
      creditPaid?: boolean;
      creditPaidCents?: number;
      creditChargeCents?: number;
    }[];
    receipts: {
      id: string;
      d: string;
      v: number;
      date: string;
      c?: string;
      p?: string;
      m?: number;
      legacyMonth?: number;
      subscription?: boolean;
      splitId?: string;
      recurrenceId?: string;
      recurrenceIndex?: number;
      recurrenceCount?: number;
      recurrenceOrigin?: string;
      recurrenceStopped?: boolean;
      incomeKind?: string;
      creditCardId?: string;
      creditPaid?: boolean;
      creditPaidCents?: number;
      creditChargeCents?: number;
    }[];
    categories: { name: string; cents: number }[];
    debts: { name: string; cents: number }[];
  };
  closeCompletedMonths: (date?: string) => boolean;
  closedReportsView: () => React.JSX.Element;
  COMMUNITY_PROGRAM: Readonly<{
    betaStartsAt: null;
    betaEndsAt: null;
    supportUrl: '';
  }>;
  isBetaTester: (
    user: import('@supabase/supabase-js').User | null,
    program?: Readonly<{
      betaStartsAt: null;
      betaEndsAt: null;
      supportUrl: '';
    }>,
    now?: number,
  ) => boolean;
  supportProjectCard: () => React.JSX.Element;
  profileIdentity: () => {
    name: string;
    email: string;
    photo: string;
    google: boolean;
  };
  avatarMarkup: (
    person: { name: string; photo?: string },
    cls?: string,
  ) => React.JSX.Element;
  identitySettingsView: () => React.JSX.Element;
  profileStars: () => React.JSX.Element;
  ratingStars: (n: number) => React.JSX.Element;
  monthlyRatings: () => React.ReactNode;
  streamingPill: () => React.JSX.Element;
  vYou: () => React.JSX.Element;
  cloudSettingsView: () => React.JSX.Element | '';
  accountSettingsView: () => React.JSX.Element;
  reportsView: () => React.JSX.Element;
  vSettings: () => React.JSX.Element;
  integrationsView: () => React.JSX.Element;
  renderAccountPanel: () => void;
  openAccountPanel: (panel: string, opener?: Element | null) => void;
  closeAccountPanel: ({
    immediate,
  }?: {
    immediate?: boolean | undefined;
  }) => void;
  accountOverlay: HTMLDialogElement;
  editPlanId: string;
  purchaseReview: { id: string; expected: string } | null;
  shoppingMoney: (n: number) => string;
  projectionView: (
    plan: PurchasePlan & { reservedCents: number },
  ) => React.JSX.Element;
  shoppingPlanForm: () => React.JSX.Element;
  readPlanForm: (form: HTMLFormElement) => ShoppingPlan;
  planCard: (x: ShoppingPlan) => React.JSX.Element;
  purchaseReviewView: () => React.JSX.Element | '';
  vCart: () => React.JSX.Element;
  vCards: () => React.JSX.Element;
  vOffers: () => React.JSX.Element;
  updatePlanProjection: (form: HTMLFormElement) => void;
  planProjectionTimer: number | undefined;
  splitMonth: string | null;
  splitMonthKey: (split: Split) => string;
  splitMonthlyTotals: (splits: Split[]) => { month: string; cents: number }[];
  splitMonthLabel: (key: string | null) => string;
  vSplit: () => React.JSX.Element;
  vDivision: () => React.JSX.Element;
  csvContext: CsvContext;
  csvPreview: CsvPreview | null;
  csvGeneration: number;
  csvConvention: string;
  prepareCsv: (text: string, convention: string) => CsvPreview;
  csvPreviewView: () => React.JSX.Element | '';
  applyCsv: () => number | undefined;
  splitShares: (cents: number, n: number, offset?: number) => number[];
  registerSplit: (
    name: string,
    cents: number,
    others: string[],
    date?: string,
    shareOffset?: number,
  ) => {
    id: string;
    name: string;
    cents: number;
    people: string[];
    ownIndex: number;
    date: string;
    expenseId: string | null;
    shareOffset: number;
    status: string;
  };
  toggleTheme: () => void;
  social: {
    friends: Friend[];
    shares: SharedExpense[];
    error: string;
    busy: boolean;
  };
  notificationsOpen: boolean;
  socialUser: () => string | undefined;
  friendCode: (f: Friend) => string;
  acceptedFriends: () => Friend[];
  friendOptions: () => React.ReactNode;
  friendDivisionForm: (plan?: ShoppingPlan) => React.JSX.Element;
  socialView: () => React.JSX.Element;
  shareMarkup: (x: SharedExpense) => React.JSX.Element;
  refreshSocial: (redraw?: boolean) => Promise<void>;
  notificationRows: () => (
    | import('../../services/balance-alert').BalanceAlertRow
    | {
        id: string;
        date: string;
        title: string;
        subtitle: string;
        text: string;
        tab: string;
        kind: 'friends';
      }
    | {
        id: string;
        date: string;
        title: string;
        subtitle: string;
        recipient: string;
        amount: string;
        status: string;
        error: boolean;
        text: string;
        tab: string;
        kind: 'shares';
      }
    | {
        id: string;
        date: string;
        title: string;
        subtitle: string;
        text: string;
        tab: string;
        kind: 'reports';
      }
    | {
        id: string;
        date: string;
        title: string;
        subtitle: string;
        amount: string;
        text: string;
        tab: string;
        kind: 'expenses';
      }
  )[];
  notificationUnread: string[];
  renderNotifications: () => void;
  spreadsheetCSV: () => string;
  arrangeCards: boolean;
  prepareSummary: (markup: import('react').ReactNode) => React.ReactNode;
  receiptWorker: OcrWorker | null;
  receiptGeneration: number;
  openReceipt: () => void;
  parseReceiptText: (text: string) => {
    items: string;
    total: string;
    name: string;
    date: string;
  };
  readReceipt: () => Promise<void>;
  usernames: Record<string, string>;
  normalizeUsername: (value: unknown) => string;
  validUsername: (value: string) => boolean;
  refreshUsernames: () => Promise<void>;
  usernameProfile: () => React.JSX.Element | '';
  offerSearchResult: OfferResult | null;
  offerSearchGeneration: number;
  offersSearchView: () => React.JSX.Element;
  productPreview: (p: ProductPreview) => React.JSX.Element;
  renderOfferResult: (r: OfferResult) => React.JSX.Element;
  shoppingRequest: {
    (payload: {
      action: 'behavior';
      summary: unknown;
    }): Promise<{ advice: string; checkedAt: string }>;
    (payload: Record<string, unknown>): Promise<OfferResult>;
  };
  summaryMode: string;
  behaviorAdvice: { key: string; text: string; at: string } | null;
  behaviorLoading: boolean;
  behaviorError: { key: string; message: string } | null;
  behaviorAggregate: () => {
    month: string;
    asOf: string;
    count: number;
    totalCents: number;
    previousTotalCents: number;
    partial: boolean;
    categories: { name: string; cents: number; count: number }[];
    weekdays: { day: number; cents: number }[];
    months: { month: string; cents: number }[];
  };
  habitBars: (
    rows: { label: string; cents: number; attention?: boolean }[],
  ) => React.JSX.Element;
  behaviorView: () => React.JSX.Element;
  summarySwitch: () => React.JSX.Element;
  summaryView: () =>
    | string
    | number
    | bigint
    | boolean
    | Iterable<React.ReactNode>
    | Promise<Awaited<React.ReactNode>>
    | React.JSX.Element
    | null
    | undefined;
  splitPaymentTotals: (
    splits: Split[],
  ) => { name: string; paid: number; pending: number }[];
  splitPaymentsChart: (splits?: Split[]) => React.JSX.Element | '';
  hasPendingInteraction: () => boolean;
  storageDescription: HTMLElement | null;
  observedDay: string;
  searchSourceRecords: () => {
    id: string;
    type: string;
    name: string;
    category: string;
    date: string;
    cents: number;
  }[];
  incomingDebt: () => void;
}
