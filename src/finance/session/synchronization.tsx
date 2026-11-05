import { includesValue } from '../../services/type-guards';
import { finance } from '../../services/finance-runtime.ts';
import { searchFinance } from '../../services/search.ts';
import type { WorkspaceRuntime } from './contracts';

type SynchronizationContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'CART'
  | 'DEBTS'
  | 'S'
  | 'SH'
  | 'WORKSPACE_KEY'
  | 'behaviorLoading'
  | 'csvPreview'
  | 'debtRemainingCents'
  | 'draw'
  | 'editPlanId'
  | 'ensureDate'
  | 'hasPendingInteraction'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'observedDay'
  | 'openSheet'
  | 'purchaseReview'
  | 'safely'
  | 'searchSourceRecords'
  | 'selectAreaView'
  | 'showError'
  | 'showNotice'
  | 'storageBase'
  | 'storageDescription'
  | 'toCents'
  | 'todayISO'
>;

export function createSynchronization(workspace: SynchronizationContext) {
  function hasPendingInteraction() {
    return !!(
      workspace.SH ||
      workspace.csvPreview ||
      workspace.purchaseReview ||
      workspace.behaviorLoading ||
      document.querySelector<HTMLDialogElement>(
        'dialog[open],details[open] form',
      ) ||
      document.activeElement?.matches(
        'input,select,textarea,[contenteditable="true"]',
      )
    );
  }

  function searchSourceRecords() {
    return [
      ...workspace.S.items.map((x) => ({
        id: x.id,
        type: 'g',
        name: x.d,
        category: x.c,
        date: x.date,
        cents: workspace.toCents(x.v),
      })),
      ...workspace.S.receipts.map((x) => ({
        id: x.id,
        type: 'i',
        name: x.d,
        category: 'Entradas',
        date: x.date,
        cents: workspace.toCents(x.v),
      })),
      ...workspace.DEBTS.map((x, id) => ({
        id: String(id),
        type: 'd',
        name: x.n,
        category: 'Dívidas',
        date: workspace.monthKeyForIndex(x.s) + '-01',
        cents: workspace.toCents(x.v),
      })),
      ...workspace.CART.map((x) => ({
        id: x.id,
        type: 'k',
        name: x.name,
        category: x.category,
        date: x.date,
        cents: x.priceCents! + x.shippingCents!,
      })),
    ];
  }
  return { hasPendingInteraction, searchSourceRecords } satisfies Pick<
    WorkspaceRuntime,
    'hasPendingInteraction' | 'searchSourceRecords'
  >;
}

export function initializeSynchronization(workspace: SynchronizationContext) {
  // @workspace-step 316 ExpressionStatement
  window.planCloud?.connect({
    canApply: () => !workspace.hasPendingInteraction(),
    onRemote: () => {
      try {
        sessionStorage.setItem('plan12-sync-tab', workspace.S.tab);
      } catch {}
      location.reload();
    },
  });
  workspace.scope.own(() =>
    window.planCloud?.connect({ canApply: () => false, onRemote: () => {} }),
  );
  // @workspace-end 316
  // @workspace-step 317 TryStatement
  try {
    const resume = sessionStorage.getItem('plan12-sync-tab');
    sessionStorage.removeItem('plan12-sync-tab');
    if (
      includesValue(
        ['r', 'i', 'd', 's', 'k', 'o', 'e', 'u', 'x', 'v', 'c', 'f'],
        resume,
      )
    )
      workspace.S.tab = resume;
  } catch {}
  // @workspace-end 317
  // @workspace-step 318 FirstStatement
  workspace.storageDescription = document.getElementById('storageDescription');
  // @workspace-end 318
  // @workspace-step 319 IfStatement
  if (workspace.storageDescription)
    workspace.storageDescription.textContent = window.planAuth.user
      ? 'Dados da conta · cópia local neste dispositivo.'
      : 'Dados temporários nesta aba do navegador.';
  // @workspace-end 319
  // @workspace-step 320 FirstStatement
  workspace.observedDay = workspace.todayISO();
  // @workspace-end 320
  // @workspace-step 321 ExpressionStatement
  workspace.scope.interval(() => {
    const day = workspace.todayISO();
    if (day !== workspace.observedDay && !workspace.hasPendingInteraction()) {
      workspace.observedDay = day;
      workspace.safely(() => {
        workspace.ensureDate(day);
        workspace.S.m = workspace.monthIndexFromDate(day);
        workspace.S.calDate = day;
        workspace.draw();
      });
    }
  }, 60000);
  // @workspace-end 321
  // @workspace-step 322 ExpressionStatement
  workspace.scope.listen(window, 'storage', (e) => {
    if (
      e.key === window.planAuth.key(workspace.WORKSPACE_KEY) &&
      e.newValue !== workspace.storageBase
    )
      workspace.showNotice(
        'Os dados foram atualizados em outra aba. Recarregue antes de salvar.',
        true,
      );
  });
  // @workspace-end 322

  // @workspace-step 324 ExpressionStatement
  finance.searchRecords = (filters) =>
    searchFinance(workspace.searchSourceRecords(), filters);
  // @workspace-end 324
  // @workspace-step 325 ExpressionStatement
  finance.openSearchResult = (row) => {
    const current = workspace
      .searchSourceRecords()
      .find((x) => x.type === row.type && x.id === row.id);
    if (
      !current ||
      current.name !== row.name ||
      current.cents !== row.cents ||
      current.date !== row.date
    ) {
      workspace.showError(Error('O registro mudou. Pesquise novamente.'));
      return;
    }
    if (row.type === 'k') {
      workspace.selectAreaView('planning:purchases');
      workspace.editPlanId =
        workspace.CART.find((x) => x.id === row.id)?.status === 'planned'
          ? row.id
          : '';
      workspace.draw();
    } else {
      if (row.type === 'd') workspace.selectAreaView('commitments:debts');
      else workspace.S.tab = 'i';
      workspace.draw();
      workspace.openSheet({ dataset: { k: row.type, id: row.id } });
    }
  };
  // @workspace-end 325
  // @workspace-step 326 ExpressionStatement
  finance.debtSources = () =>
    workspace.DEBTS.map((x, id) => ({
      id: String(id),
      name: x.n,
      cents: workspace.debtRemainingCents(x),
    }));
  // @workspace-end 326
}
