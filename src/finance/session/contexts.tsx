import type { WorkspaceRuntime } from './contracts';

type ContextsContext = Pick<
  WorkspaceRuntime,
  | 'CARDS'
  | 'CART'
  | 'CATS'
  | 'CLOSED_REPORTS'
  | 'DEBTS'
  | 'GOAL'
  | 'ICON'
  | 'M'
  | 'MAX_CENTS'
  | 'MAX_MONTHS'
  | 'MAX_RECORDS'
  | 'MIG'
  | 'PAY'
  | 'PROFILE'
  | 'S'
  | 'SPLITS'
  | 'accountSettingsTab'
  | 'accountSettingsView'
  | 'areaNavigation'
  | 'areaViews'
  | 'atomic'
  | 'behaviorView'
  | 'brl'
  | 'canonicalCategory'
  | 'carbonRecords'
  | 'chartMetric'
  | 'dailyBars'
  | 'dateLabel'
  | 'dateLong'
  | 'debt'
  | 'debtChart'
  | 'debtContext'
  | 'debtInstallments'
  | 'debtPaidCount'
  | 'debtRemainingCents'
  | 'debtSchedule'
  | 'dm'
  | 'donut'
  | 'engineContext'
  | 'ensureDate'
  | 'ensureIndex'
  | 'entryFilter'
  | 'esc'
  | 'expenseBudgetCents'
  | 'goalChart'
  | 'goalMonthProjectionCents'
  | 'goalProjection'
  | 'inc'
  | 'integrationsView'
  | 'investmentCategoryTile'
  | 'isBetaTester'
  | 'isMonthClosed'
  | 'itemMonthIndex'
  | 'itemsInMonth'
  | 'ledgerContext'
  | 'lim'
  | 'mbtn'
  | 'monthComparison'
  | 'monthDate'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'monthLabelFromKey'
  | 'monthProjectionCents'
  | 'monthlyExpenseDate'
  | 'monthlyRatings'
  | 'newId'
  | 'offerSearchResult'
  | 'offersSearchView'
  | 'periodChart'
  | 'planCard'
  | 'planSchedule'
  | 'planningContext'
  | 'profileIdentity'
  | 'profileStars'
  | 'purchaseReviewView'
  | 'receiptsInMonth'
  | 'renderOfferResult'
  | 'reportsView'
  | 'requireOpenDate'
  | 'saveWorkspace'
  | 'shoppingPlanForm'
  | 'socialView'
  | 'spent'
  | 'splitShares'
  | 'streamingPill'
  | 'sum'
  | 'summaryMode'
  | 'supportProjectCard'
  | 'supportedDate'
  | 'tiles'
  | 'toCents'
  | 'todayISO'
  | 'topList'
  | 'vCarbon'
  | 'vCards'
  | 'vCart'
  | 'vD'
  | 'vDivision'
  | 'vI'
  | 'vOffers'
  | 'vR'
  | 'vSplit'
  | 'viewContext'
>;

export function initializeContexts(workspace: ContextsContext) {
  // @workspace-step 11 FirstStatement
  workspace.viewContext = {
    get CART() {
      return workspace.CART;
    },
    get CLOSED_REPORTS() {
      return workspace.CLOSED_REPORTS;
    },
    get DEBTS() {
      return workspace.DEBTS;
    },
    get GOAL() {
      return workspace.GOAL;
    },
    get ICON() {
      return workspace.ICON;
    },
    get M() {
      return workspace.M;
    },
    get MAX_MONTHS() {
      return workspace.MAX_MONTHS;
    },
    get S() {
      return workspace.S;
    },
    get accountSettingsTab() {
      return workspace.accountSettingsTab;
    },
    get accountSettingsView() {
      return workspace.accountSettingsView;
    },
    get areaNavigation() {
      return workspace.areaNavigation;
    },
    get areaViews() {
      return workspace.areaViews;
    },
    get behaviorView() {
      return workspace.behaviorView;
    },
    get brl() {
      return workspace.brl;
    },
    get carbonRecords() {
      return workspace.carbonRecords;
    },
    get chartMetric() {
      return workspace.chartMetric;
    },
    get dailyBars() {
      return workspace.dailyBars;
    },
    get dateLabel() {
      return workspace.dateLabel;
    },
    get dateLong() {
      return workspace.dateLong;
    },
    get debt() {
      return workspace.debt;
    },
    get debtChart() {
      return workspace.debtChart;
    },
    get debtInstallments() {
      return workspace.debtInstallments;
    },
    get debtPaidCount() {
      return workspace.debtPaidCount;
    },
    get debtRemainingCents() {
      return workspace.debtRemainingCents;
    },
    get debtSchedule() {
      return workspace.debtSchedule;
    },
    get dm() {
      return workspace.dm;
    },
    get donut() {
      return workspace.donut;
    },
    get entryFilter() {
      return workspace.entryFilter;
    },
    get esc() {
      return workspace.esc;
    },
    get goalChart() {
      return workspace.goalChart;
    },
    get goalProjection() {
      return workspace.goalProjection;
    },
    get inc() {
      return workspace.inc;
    },
    get integrationsView() {
      return workspace.integrationsView;
    },
    get investmentCategoryTile() {
      return workspace.investmentCategoryTile;
    },
    get isBetaTester() {
      return workspace.isBetaTester;
    },
    get isMonthClosed() {
      return workspace.isMonthClosed;
    },
    get itemsInMonth() {
      return workspace.itemsInMonth;
    },
    get lim() {
      return workspace.lim;
    },
    get mbtn() {
      return workspace.mbtn;
    },
    get monthComparison() {
      return workspace.monthComparison;
    },
    get monthKeyForIndex() {
      return workspace.monthKeyForIndex;
    },
    get monthLabelFromKey() {
      return workspace.monthLabelFromKey;
    },
    get monthlyRatings() {
      return workspace.monthlyRatings;
    },
    get offerSearchResult() {
      return workspace.offerSearchResult;
    },
    get offersSearchView() {
      return workspace.offersSearchView;
    },
    get periodChart() {
      return workspace.periodChart;
    },
    get planCard() {
      return workspace.planCard;
    },
    get profileIdentity() {
      return workspace.profileIdentity;
    },
    get profileStars() {
      return workspace.profileStars;
    },
    get purchaseReviewView() {
      return workspace.purchaseReviewView;
    },
    get receiptsInMonth() {
      return workspace.receiptsInMonth;
    },
    get renderOfferResult() {
      return workspace.renderOfferResult;
    },
    get reportsView() {
      return workspace.reportsView;
    },
    get shoppingPlanForm() {
      return workspace.shoppingPlanForm;
    },
    get socialView() {
      return workspace.socialView;
    },
    get spent() {
      return workspace.spent;
    },
    get streamingPill() {
      return workspace.streamingPill;
    },
    get sum() {
      return workspace.sum;
    },
    get summaryMode() {
      return workspace.summaryMode;
    },
    get supportProjectCard() {
      return workspace.supportProjectCard;
    },
    get tiles() {
      return workspace.tiles;
    },
    get topList() {
      return workspace.topList;
    },
    get vCarbon() {
      return workspace.vCarbon;
    },
    get vCards() {
      return workspace.vCards;
    },
    get vCart() {
      return workspace.vCart;
    },
    get vD() {
      return workspace.vD;
    },
    get vDivision() {
      return workspace.vDivision;
    },
    get vI() {
      return workspace.vI;
    },
    get vOffers() {
      return workspace.vOffers;
    },
    get vR() {
      return workspace.vR;
    },
    get vSplit() {
      return workspace.vSplit;
    },
  };
  // @workspace-end 11
  // @workspace-step 12 FirstStatement
  workspace.engineContext = {
    get CATS() {
      return workspace.CATS;
    },
    get CLOSED_REPORTS() {
      return workspace.CLOSED_REPORTS;
    },
    get DEBTS() {
      return workspace.DEBTS;
    },
    get GOAL() {
      return workspace.GOAL;
    },
    get MAX_CENTS() {
      return workspace.MAX_CENTS;
    },
    get MAX_MONTHS() {
      return workspace.MAX_MONTHS;
    },
    get canonicalCategory() {
      return workspace.canonicalCategory;
    },
    get debt() {
      return workspace.debt;
    },
    get debtInstallments() {
      return workspace.debtInstallments;
    },
    get debtPaidCount() {
      return workspace.debtPaidCount;
    },
    get expenseBudgetCents() {
      return workspace.expenseBudgetCents;
    },
    get goalMonthProjectionCents() {
      return workspace.goalMonthProjectionCents;
    },
    get inc() {
      return workspace.inc;
    },
    get isMonthClosed() {
      return workspace.isMonthClosed;
    },
    get itemsInMonth() {
      return workspace.itemsInMonth;
    },
    get lim() {
      return workspace.lim;
    },
    get monthIndexFromDate() {
      return workspace.monthIndexFromDate;
    },
    get monthKeyForIndex() {
      return workspace.monthKeyForIndex;
    },
    get monthProjectionCents() {
      return workspace.monthProjectionCents;
    },
    get monthlyExpenseDate() {
      return workspace.monthlyExpenseDate;
    },
    get planSchedule() {
      return workspace.planSchedule;
    },
    get receiptsInMonth() {
      return workspace.receiptsInMonth;
    },
    get splitShares() {
      return workspace.splitShares;
    },
    get toCents() {
      return workspace.toCents;
    },
    get todayISO() {
      return workspace.todayISO;
    },
  };
  // @workspace-end 12
  // @workspace-step 13 FirstStatement
  workspace.planningContext = {
    get MAX_CENTS() {
      return workspace.MAX_CENTS;
    },
    get MAX_MONTHS() {
      return workspace.MAX_MONTHS;
    },
    get MAX_RECORDS() {
      return workspace.MAX_RECORDS;
    },
    get S() {
      return workspace.S;
    },
    get PROFILE() {
      return workspace.PROFILE;
    },
    get SPLITS() {
      return workspace.SPLITS;
    },
    get atomic() {
      return workspace.atomic;
    },
    get isMonthClosed() {
      return workspace.isMonthClosed;
    },
    get monthlyExpenseDate() {
      return workspace.monthlyExpenseDate;
    },
    get todayISO() {
      return workspace.todayISO;
    },
    get supportedDate() {
      return workspace.supportedDate;
    },
    get monthIndexFromDate() {
      return workspace.monthIndexFromDate;
    },
    get ensureIndex() {
      return workspace.ensureIndex;
    },
    get saveWorkspace() {
      return workspace.saveWorkspace;
    },
    get newId() {
      return workspace.newId;
    },
    get splitShares() {
      return workspace.splitShares;
    },
    get requireOpenDate() {
      return workspace.requireOpenDate;
    },
    get ensureDate() {
      return workspace.ensureDate;
    },
    get GOAL() {
      return workspace.GOAL;
    },
    set GOAL(value) {
      workspace.GOAL = value;
    },
  };
  // @workspace-end 13
  // @workspace-step 14 FirstStatement
  workspace.debtContext = {
    get DEBTS() {
      return workspace.DEBTS;
    },
    get MAX_MONTHS() {
      return workspace.MAX_MONTHS;
    },
    get MAX_RECORDS() {
      return workspace.MAX_RECORDS;
    },
    get MAX_CENTS() {
      return workspace.MAX_CENTS;
    },
    atomic: workspace.atomic,
    ensureIndex: workspace.ensureIndex,
    saveWorkspace: workspace.saveWorkspace,
  };
  // @workspace-end 14
  // @workspace-step 15 FirstStatement
  workspace.ledgerContext = {
    get MAX_CENTS() {
      return workspace.MAX_CENTS;
    },
    get MAX_RECORDS() {
      return workspace.MAX_RECORDS;
    },
    get MAX_MONTHS() {
      return workspace.MAX_MONTHS;
    },
    get CATS() {
      return workspace.CATS;
    },
    get PAY() {
      return workspace.PAY;
    },
    get MIG() {
      return workspace.MIG;
    },
    get CARDS() {
      return workspace.CARDS;
    },
    get S() {
      return workspace.S;
    },
    get atomic() {
      return workspace.atomic;
    },
    get requireOpenDate() {
      return workspace.requireOpenDate;
    },
    get monthDate() {
      return workspace.monthDate;
    },
    get toCents() {
      return workspace.toCents;
    },
    get monthIndexFromDate() {
      return workspace.monthIndexFromDate;
    },
    get newId() {
      return workspace.newId;
    },
    get monthlyExpenseDate() {
      return workspace.monthlyExpenseDate;
    },
    get ensureDate() {
      return workspace.ensureDate;
    },
    get saveWorkspace() {
      return workspace.saveWorkspace;
    },
    get todayISO() {
      return workspace.todayISO;
    },
    get isMonthClosed() {
      return workspace.isMonthClosed;
    },
    get itemMonthIndex() {
      return workspace.itemMonthIndex;
    },
    get supportedDate() {
      return workspace.supportedDate;
    },
  };
  // @workspace-end 15
}
