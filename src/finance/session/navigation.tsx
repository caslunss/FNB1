import { requestFinancePublish } from '../../services/finance-runtime';
import React from 'react';
import { viewList } from '../../services/presentation.ts';
import { commitmentsView as rendercommitmentsView } from '../views/commitments.tsx';
import { planningView as renderplanningView } from '../views/planning.tsx';
import { analysisView as renderanalysisView } from '../views/analysis.tsx';
import { availableViews, resolveAreaView } from '../../services/navigation.ts';
import { getLayout } from '../../services/layout-preferences.ts';
import type { WorkspaceRuntime } from './contracts';

type NavigationContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'CATS'
  | 'ICON'
  | 'M'
  | 'MAX_MONTHS'
  | 'MENU'
  | 'S'
  | 'TITLES'
  | 'accountPanel'
  | 'accountSettingsTab'
  | 'analysisView'
  | 'applyAppearance'
  | 'areaViews'
  | 'avatarMarkup'
  | 'categoryLabel'
  | 'closeCompletedMonths'
  | 'commitmentsView'
  | 'committingRoute'
  | 'contextActivity'
  | 'draw'
  | 'drawPending'
  | 'isMonthClosed'
  | 'lim'
  | 'monthKeyForIndex'
  | 'monthLabelFromKey'
  | 'noticeError'
  | 'noticeMessage'
  | 'openAccountPanel'
  | 'overlayOpener'
  | 'planningView'
  | 'prepareSummary'
  | 'profileIdentity'
  | 'renderAccountPanel'
  | 'renderView'
  | 'renderedRoute'
  | 'showNotice'
  | 'summaryMode'
  | 'summarySwitch'
  | 'summaryView'
  | 'suspendedAccountPanel'
  | 'syncNavigation'
  | 'transactionDepth'
  | 'vCredit'
  | 'viewContext'
>;

export function createNavigation(workspace: NavigationContext) {
  function selectAreaView(value: string) {
    const next = resolveAreaView(value, getLayout().sections);
    if (!next) return false;
    workspace.areaViews[next.area] = next.view;
    workspace.S.tab = next.tab;
    return true;
  }

  function areaNavigation(area: string, label: string) {
    return (
      <div className="area-toolbar">
        <div className="segments area-switch" aria-label={label}>
          {viewList(
            availableViews(area, getLayout().sections).map(([key, name]) => (
              <button
                type="button"
                data-area-view={String(area) + ':' + String(key)}
                aria-pressed={workspace.areaViews[area] === key}
              >
                {name}
              </button>
            )),
          )}
        </div>
      </div>
    );
  }

  function commitmentsView() {
    return rendercommitmentsView(workspace.viewContext);
  }

  function planningView() {
    return renderplanningView(workspace.viewContext);
  }

  function analysisView() {
    return renderanalysisView(workspace.viewContext);
  }

  function draw() {
    if (workspace.scope.disposed) return;
    requestFinancePublish();
    if (workspace.S.tab === 'k') {
      workspace.areaViews.commitments = 'cards';
      workspace.S.tab = 'd';
    }
    if (workspace.S.tab === 's') {
      workspace.areaViews.commitments = 'friends';
      workspace.S.tab = 'd';
    }
    if (workspace.S.tab === 'e') {
      workspace.areaViews.analysis = 'carbon';
      workspace.S.tab = 'f';
    }
    for (const area of Object.keys(workspace.areaViews)) {
      const views = availableViews(area, getLayout().sections);
      if (!views.some(([key]) => key === workspace.areaViews[area]))
        workspace.areaViews[area] = views[0][0];
    }
    const requestedPanel =
      workspace.S.tab === 'u'
        ? 'profile'
        : workspace.S.tab === 'x'
          ? 'settings'
          : workspace.S.tab === 'c' && getLayout().sections.calendar
            ? 'calendar'
            : null;
    if (['u', 'x', 'c'].includes(workspace.S.tab)) workspace.S.tab = 'r';
    if (workspace.transactionDepth) {
      workspace.drawPending = true;
      return;
    }
    const nextRoute =
      workspace.S.tab +
      ':' +
      (workspace.S.tab === 'i'
        ? 'entries'
        : workspace.S.tab === 'd'
          ? workspace.areaViews.commitments
          : workspace.S.tab === 'o'
            ? workspace.areaViews.planning
            : workspace.S.tab === 'f'
              ? workspace.areaViews.analysis
              : workspace.summaryMode);
    if (
      !requestedPanel &&
      workspace.renderedRoute !== null &&
      nextRoute !== workspace.renderedRoute &&
      !workspace.committingRoute &&
      window.planRouteMotion
    ) {
      window.planRouteMotion.run(() => {
        if (workspace.scope.disposed) return;
        workspace.committingRoute = true;
        try {
          workspace.draw();
        } finally {
          workspace.committingRoute = false;
        }
      });
      return;
    }
    workspace.renderedRoute = nextRoute;
    workspace.$('#summaryOptions')?.remove();
    workspace.closeCompletedMonths();
    workspace.showNotice(workspace.noticeMessage, workspace.noticeError);
    workspace.$('#currentMonth').textContent = workspace.M[workspace.S.m];
    workspace.$('#currentMonth').hidden = true;
    const monthSelect = workspace.$('#mes');
    if (monthSelect?.closest('header'))
      monthSelect.closest('header')!.hidden = !['r', 'i'].includes(
        workspace.S.tab,
      );
    if (monthSelect?.parentElement) {
      monthSelect.parentElement.hidden = !['r', 'i'].includes(workspace.S.tab);
    }
    const monthStatus = workspace.$('#monthStatus');
    if (monthStatus) {
      monthStatus.hidden = !['r', 'i', 'd', 'o'].includes(workspace.S.tab);
      monthStatus.textContent = workspace.isMonthClosed(workspace.S.m)
        ? 'Encerrado · somente leitura'
        : 'Mês aberto';
    }
    const closedNotice = workspace.$('#closedMonthNotice');
    if (closedNotice)
      closedNotice.hidden =
        !workspace.isMonthClosed(workspace.S.m) ||
        !['r', 'i', 'd', 'c'].includes(workspace.S.tab);
    monthSelect.min = workspace.monthKeyForIndex(0);
    monthSelect.max = workspace.monthKeyForIndex(workspace.MAX_MONTHS - 1);
    monthSelect.value = workspace.monthKeyForIndex(workspace.S.m);
    monthSelect.parentElement!.title =
      'Selecionar mês · ' +
      workspace.monthLabelFromKey(workspace.monthKeyForIndex(workspace.S.m));
    workspace.$('#summaryToolbar').hidden = !['r', 'i'].includes(
      workspace.S.tab,
    );
    workspace.renderView(
      workspace.$('#summaryModes'),
      ['r', 'i'].includes(workspace.S.tab) ? workspace.summarySwitch() : '',
    );
    workspace.$('#app').className = 'layout-' + workspace.S.tab;
    workspace.$('#app').dataset.summaryView =
      workspace.S.tab === 'i'
        ? 'entries'
        : workspace.S.tab === 'd'
          ? workspace.areaViews.commitments
          : workspace.S.tab === 'o'
            ? workspace.areaViews.planning
            : workspace.S.tab === 'f'
              ? workspace.areaViews.analysis
              : workspace.summaryMode;
    workspace.renderView(
      workspace.$('#app'),
      workspace.prepareSummary(
        (
          {
            r: workspace.summaryView,
            i: workspace.summaryView,
            d: workspace.commitmentsView,
            v: workspace.vCredit,
            o: workspace.planningView,
            f: workspace.analysisView,
          } as Record<string, () => React.ReactNode>
        )[workspace.S.tab](),
      ),
    );
    if (
      workspace.isMonthClosed(workspace.S.m) &&
      ['r', 'i', 'd', 'c'].includes(workspace.S.tab)
    ) {
      for (const node of document.querySelectorAll<HTMLButtonElement>(
        '#app [data-a=sheet],#app [data-a=menu],#app [data-a=srem],#app [data-read-receipt],#app [data-a=cplim],#app [data-a=goal],#app [data-glass-actions=categories],#app [data-glass-actions=ledger] button,#app [data-goal-editor] button,#app [data-goal-editor] input,#app [data-goal-editor] select',
      )) {
        node.disabled = true;
        node.setAttribute('aria-disabled', 'true');
      }
    }
    workspace.$('#lt').textContent = workspace.$('#it').textContent =
      workspace.TITLES[workspace.S.tab === 'i' ? 'r' : workspace.S.tab];
    workspace.$('#pg').classList.toggle('nr', workspace.S.tab !== 'r');

    workspace.$('#pageDescription').textContent = '';
    workspace.$('#pageDescription').hidden = true;
    workspace.$('#newEntry').hidden = true;
    const context = workspace.$('#contextContent');
    if (context) workspace.renderView(context, workspace.contextActivity());
    document.body.dataset.page = workspace.S.tab;
    workspace.$('#settingsTop').hidden =
      !['u', 'r'].includes(workspace.S.tab) ||
      (workspace.S.tab === 'r' && workspace.summaryMode === 'behavior');
    workspace
      .$('#settingsTop')
      .setAttribute(
        'aria-label',
        workspace.S.tab === 'r' ? 'Reorganizar cards' : 'Configurações',
      );
    workspace.$('#settingsTop').title =
      workspace.S.tab === 'r' ? 'Reorganizar cards' : 'Configurações';
    workspace.renderView(
      workspace.$('#settingsTop'),
      workspace.S.tab === 'u' ? (
        <button className="ib" type="button" aria-label="Configurações">
          {workspace.ICON.x}
        </button>
      ) : (
        <span data-glass-actions="summary" aria-label="Reorganizar cards">
          {workspace.ICON.more}
        </span>
      ),
    );
    const identity = workspace.profileIdentity();
    const symbol = document.querySelector<HTMLElement>('.app-symbol')!;
    workspace.renderView(
      symbol,
      workspace.avatarMarkup(identity, 'rail-avatar'),
    );
    symbol.setAttribute('aria-label', 'Abrir perfil de ' + identity.name);
    symbol.removeAttribute('aria-pressed');
    symbol.setAttribute(
      'aria-expanded',
      String(
        workspace.accountPanel === 'profile' &&
          workspace.$('#accountOverlay')?.open,
      ),
    );

    workspace.applyAppearance(
      document.documentElement.dataset.theme ||
        (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'),
    );

    const calendarButton = workspace.$('#calendarButton');
    if (calendarButton) {
      calendarButton.hidden = !getLayout().sections.calendar;
      calendarButton.setAttribute(
        'aria-expanded',
        String(
          workspace.accountPanel === 'calendar' &&
            workspace.$('#accountOverlay')?.open,
        ),
      );
    }
    workspace.syncNavigation();
    dispatchEvent(new Event('plan-navigation-change'));
    if (requestedPanel) workspace.openAccountPanel(requestedPanel);
    else if (workspace.accountPanel && workspace.$('#accountOverlay')?.open)
      workspace.renderAccountPanel();
  }
  return {
    selectAreaView,
    areaNavigation,
    commitmentsView,
    planningView,
    analysisView,
    draw,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'selectAreaView'
    | 'areaNavigation'
    | 'commitmentsView'
    | 'planningView'
    | 'analysisView'
    | 'draw'
  >;
}

export function initializeNavigation(workspace: NavigationContext) {
  // @workspace-step 148 FirstStatement
  workspace.suspendedAccountPanel = null;
  // @workspace-end 148
  // @workspace-step 149 FirstStatement
  workspace.accountPanel = null;
  workspace.accountSettingsTab = 'account';
  workspace.overlayOpener = null;
  // @workspace-end 149
  // @workspace-step 150 FirstStatement
  workspace.renderedRoute = null;
  workspace.committingRoute = false;
  // @workspace-end 150
  // @workspace-step 151 FirstStatement
  workspace.areaViews = {
    commitments: 'debts',
    planning: 'purchases',
    analysis: 'taxes',
  };
  // @workspace-end 151

  // @workspace-step 158 FirstStatement
  workspace.MENU = {
    g: (id?: string | number) => [
      { l: 'Editar', a: 'sheet', k: 'g', id },
      { l: 'Duplicar', a: 'dup', id },
      ...(workspace.S.items.find((x) => x.id === id)?.recurrenceId
        ? [{ l: 'Cancelar próximas repetições', a: 'stoprepeat', id, d: 1 }]
        : []),
      { l: 'Apagar este gasto', a: 'del', id, d: 1 },
    ],
    i: (id) => [
      { l: 'Editar', a: 'sheet', k: 'i', id },
      { l: 'Apagar', a: 'idel', id, d: 1 },
    ],
    d: (id) => [{ l: 'Apagar', a: 'ddel', id, d: 1 }],
    l: () => [
      { l: 'Adicionar limite', a: 'sheet', k: 'l' },
      ...workspace.CATS.filter((c) => workspace.lim(workspace.S.m, c) > 0).map(
        (c) => ({ l: workspace.categoryLabel(c), a: 'sheet', k: 'l', c }),
      ),
      { l: 'Aplicar a todos os meses', a: 'cplim' },
    ],
  };
  // @workspace-end 158
}
