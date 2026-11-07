import type { ReactNode } from 'react';
import type { FinancialCalculationContext } from './calculations';
import type { Expense, LedgerRecord, ShoppingPlan, ClosedReport, OfferResult, Debt } from './workspace';
import type { User } from '@supabase/supabase-js';
export interface WorkspaceViewContext
  extends Pick<
    FinancialCalculationContext,
    | 'GOAL'
    | 'MAX_MONTHS'
    | 'debt'
    | 'debtInstallments'
    | 'debtPaidCount'
    | 'inc'
    | 'lim'
    | 'monthKeyForIndex'
    | 'isMonthClosed'
  > {
  CART: ShoppingPlan[];
  CLOSED_REPORTS: Record<string, ClosedReport>;
  DEBTS: Debt[];
  S: { m: number; tab: string; goal: boolean; q: string };
  M: string[];
  ICON: Record<string, ReactNode>;
  accountSettingsTab: string;
  areaViews: Record<string, string>;
  chartMetric: string;
  entryFilter: string;
  summaryMode: string;
  offerSearchResult: OfferResult | null;
  brl(value: unknown): string;
  esc(value: unknown): string;
  dateLong(value: string): string;
  dateLabel(value: string): string;
  itemsInMonth(month: number): Expense[];
  receiptsInMonth(month: number): LedgerRecord[];
  goalProjection(month: number): number;
  dm(debt: Debt, month: number): number;
  sum(items: readonly { v: number }[]): number;
  isBetaTester(user: User | null): boolean;
  profileIdentity(): { name: string; photo: string };
  mbtn(kind: string, id: string | number, label: string): ReactNode;
  monthLabelFromKey(key: string): string;
  monthComparison(metric: string, month: number): ReactNode;
  areaNavigation(area: string, label: string): ReactNode;
  tiles(month: number, items: Expense[]): ReactNode;
  investmentCategoryTile(month: number, records: Expense[], value: number, limit: number): ReactNode;
  donut(items: Expense[]): ReactNode;
  topList(items: Expense[]): ReactNode;
  debtSchedule(month: number): { m: number; v: number }[];
  debtRemainingCents(debt: Debt): number;
  planCard(plan: ShoppingPlan): ReactNode;
  renderOfferResult(result: OfferResult): ReactNode;
  accountSettingsView(): ReactNode;
  integrationsView(): ReactNode;
  behaviorView(): ReactNode;
  dailyBars(): ReactNode;
  goalChart(): ReactNode;
  debtChart(): ReactNode;
  monthlyRatings(): ReactNode;
  offersSearchView(): ReactNode;
  periodChart(): ReactNode;
  profileStars(): ReactNode;
  purchaseReviewView(): ReactNode;
  reportsView(): ReactNode;
  shoppingPlanForm(): ReactNode;
  socialView(): ReactNode;
  streamingPill(): ReactNode;
  supportProjectCard(): ReactNode;
  spent(month: number): number;
  vCards(): ReactNode;
  vCart(): ReactNode;
  vD(): ReactNode;
  vDivision(): ReactNode;
  vI(): ReactNode;
  vOffers(): ReactNode;
  vR(): ReactNode;
  vSplit(): ReactNode;
}
