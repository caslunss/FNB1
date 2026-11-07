import type { FinancialExpense, NotificationSnapshot } from './finance';
export interface StoredExpense {
  id: string;
  d: string;
  v: number;
  c: string;
  p: string;
  date: string;
  creditCardId?: string;
  creditPaid?: boolean;
  creditPaidCents?: number;
  creditChargeCents?: number;
  subscription?: boolean;
}
export interface CardPayment {
  id: string;
  date: string;
  invoiceMonth: string;
  amountCents: number;
}
export interface BankImportRow {
  id: string;
  date: string;
  description: string;
  cents: number;
  type: string;
  category: string;
  credit?: boolean;
  cardId?: string;
  uf?: string;
  merchantCnpj?: string;
  cnae?: string;
}
export interface CreditCard {
  id: string;
  name: string;
  active: boolean;
  limitCents: number;
  openingUsedCents: number;
  closingDay: number | null;
  dueDay: number | null;
  openingPaidCents?: number;
  payments?: CardPayment[];
  usedCents?: number;
  availableCents?: number;
  excessCents?: number;
}
export interface ProductGoal {
  people: string[];
  goal: boolean;
  id: string;
  name: string;
  productGoal: boolean;
  goalMode: 'save' | 'cash' | 'credit';
  monthlyReserveCents: number;
  priceCents: number;
  shippingCents: number;
  reservedCents: number;
  date: string;
  installments: number;
  creditCardId?: string;
  category: string;
  status: 'planned' | 'purchased';
}
export interface FinancialGoal {
  v: number;
  e: number;
  mode?: 'months' | 'date';
  date?: string;
  months?: number;
}
export interface GoalState extends FinancialGoal {
  today: string;
  readonly: boolean;
}
export interface TaxState {
  month: string;
  today: string;
  closedMonths: string[];
  expenses: FinancialExpense[];
}
export interface CreditState {
  cards: import('../services/credit').CardBalance[];
  items: StoredExpense[];
}
export interface ProductGoalsState {
  goals: ProductGoal[];
  cards: CreditCard[];
  categories: string[];
  today: string;
}
export interface MobileState {
  tab: string;
  composeDebt: boolean;
  closed: boolean;
  sections: Record<string, boolean>;
}
export interface FinanceServices {
 friends:{getState():{people:{id:string;name:string;local:boolean}[];ledger:import('../services/friends-ledger').FriendsLedger;debts:{id:string;name:string;cents:number}[]};saveLedger(ledger:import('../services/friends-ledger').FriendsLedger):void};
 setup:{getState():{complete:boolean;name:string;username:string;hasSalary:boolean;hasCards:boolean;today:string};saveUsername(username:string):Promise<void>;finish(input:{name:string;salaryCents?:number;salaryDate?:string;card?:Partial<CreditCard>}):void};
  forecast:{getState():import('../services/forecast-settings').ForecastSource};
  taxes: {
    getState(): TaxState;
    addExpense(input: {
      description: string;
      value: string;
      date: string;
      category: string;
    }): FinancialExpense;
    importBank(rows: BankImportRow[]): number;
  };
  credit: {
    getState(): CreditState;
    saveCard(input: Partial<CreditCard>): CreditCard;
    payInvoice(id: string, month: string, amount: number, date: string, expected: number): void;
    setPaid(id: string, paid: boolean): void;
  };
  productGoals: {
    getState(): ProductGoalsState;
    save(input: Partial<ProductGoal>): ProductGoal;
    remove(id: string): void;
    context(goal: ProductGoal): import('../services/product-goals').GoalReportContext;
    prepare(id: string): void;
  };
  goal: {
    getState(): GoalState;
    save(
      input: { amountCents: number; mode: 'months' | 'date'; months: number; date: string },
      options?: { redraw?: boolean },
    ): FinancialGoal;
  };
  mobile: {
    getState(): MobileState;
    navigate(key: string): void;
    open(panel: string, opener?: Element): void;
    compose(): void;
    rowAction(action: string, kind: string, id: string): void;
  };
  notifications: { getState(): NotificationSnapshot; close(): void; clear(): void; settings(): void };
  isMonthClosed(): boolean;
  resetFinancialData(): Promise<string>;
  searchRecords(filters: import('../services/search').SearchFilters): {
    rows: import('../services/search').SearchRecord[];
    total: number;
  };
  openSearchResult(row: import('../services/search').SearchRecord): void;
  debtSources(): { id: string; name: string; cents: number }[];
  actionItems(descriptor: {
    kind?: string;
    k?: string;
    id?: string;
    a?: string;
    date?: string;
  }): { label: string; destructive?: boolean; onSelect(): void }[];
}
