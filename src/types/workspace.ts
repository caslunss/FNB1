import type { CreditCard, FinancialGoal, ProductGoal, StoredExpense } from './finance-runtime';
export interface LedgerRecord {
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
}
export interface Expense extends LedgerRecord, StoredExpense {
  c: string;
  p: string;
}
export interface Debt {
  n: string;
  v: number;
  p: number;
  s: number;
  paid?: number;
  sharedRef?: string;
}
export interface Split {
  id: string;
  name: string;
  cents: number;
  people: string[];
  ownIndex: number;
  date: string;
  expenseId: string | null;
  status: string;
  shareOffset: number;
  paid?: boolean[];
}
export interface PurchaseReceipt {
  date: string;
  totalCents: number;
  ownCents: number;
  targetCents: number;
  expenseIds?: string[];
  splitIds?: string[];
}
export interface ShoppingPlan extends Omit<ProductGoal, 'productGoal' | 'goalMode' | 'monthlyReserveCents'> {
  productGoal?: boolean;
  goalMode?: ProductGoal['goalMode'];
  monthlyReserveCents?: number;
  targetCents: number;
  url: string;
  image?: string;
  specs?: string[];
  people: string[];
  priority: string;
  goal: boolean;
  affiliate?: boolean;
  purchase?: PurchaseReceipt | null;
}
export interface ShoppingOffer {
  id: string;
  name: string;
  url: string;
  planId: string;
  store: string;
  priceCents: number;
  shippingCents: number;
  condition: string;
  checkedOn: string;
  affiliate: boolean;
}
export interface ClosedReport {
  key: string;
  label: string;
  closedOn: string;
  incomeCents: number;
  expenseCents: number;
  debtCents: number;
  balanceCents: number;
  categories: { name: string; cents: number }[];
  expenses: Expense[];
  receipts: LedgerRecord[];
  debts?: { name: string; cents: number }[];
}
export interface WorkspaceSnapshot {
  items: Expense[];
  receipts: LedgerRecord[];
  debts: Debt[];
  limits: Record<string, number>[];
  goal: FinancialGoal;
  profile: { name: string; onboardingComplete?:boolean; friendLedger?:import('../services/friends-ledger').FriendsLedger };
  splits: Split[];
  reports: Record<string, ClosedReport>;
  monthCount: number;
  cart: ShoppingPlan[];
  offers: ShoppingOffer[];
  creditCards: CreditCard[];
}
export interface RecoveryRow {
  key: string;
  reason: string;
  raw?: string;
  value?: unknown;
}
export interface Friend {
  id: string;
  sender: string;
  recipient: string;
  status: string;
  created_at: string;
}
export interface SharedExpense extends Friend {
  cents: number;
  description: string;
  expense_date: string;
  updated_at?: string;
}
export interface SheetState {
  k: string;
  id?: string | null;
  i?: number;
  c?: string;
  date?: string;
  incomeKind?: string;
  sharedRef?: string;
  opener?: Element | null;
}
export interface ActionRow {
  l: string;
  a: string;
  k?: string;
  id?: string | number;
  c?: string;
  date?: string;
  d?: number;
}
export interface ProductPreview {
  name: string;
  priceCents: number;
  image?: string;
  url?: string;
  specs: string[];
  source?: string;
  promotion?: string;
  store?: string;
}
export interface OfferResult {
  products: ProductPreview[];
  query?: string;
  checkedAt: string;
  source?: string;
  message?: string;
  sources: { url: string; title: string }[];
  suggestions?: string;
}

export interface CsvRecord {
  type: string;
  date: string;
  d: string;
  v: number;
}
export interface CsvPreview {
  records: CsvRecord[];
  errors: { line: number; message: string }[];
  incomeCents: number;
  expenseCents: number;
  matches?: number;
  sourceName?: string;
}
