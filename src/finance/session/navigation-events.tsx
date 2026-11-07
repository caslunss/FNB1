import { viewList } from '../../services/presentation.ts';
import { MAIN_AREAS } from '../../services/navigation.ts';
import { bottomNavigationViewport } from '../../services/mobile-layout.ts';
import type { WorkspaceRuntime } from './contracts';

type NavigationEventsContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'CARDS'
  | 'DEBTS'
  | 'GOAL'
  | 'ICON'
  | 'LIM'
  | 'M'
  | 'MAX_RECORDS'
  | 'P'
  | 'S'
  | 'SH'
  | 'addNextMonth'
  | 'applyCsv'
  | 'atomic'
  | 'cancelFutureExpenses'
  | 'cancelFutureIncome'
  | 'chartMetric'
  | 'closeSheet'
  | 'csvConvention'
  | 'csvGeneration'
  | 'csvPreview'
  | 'dispatchWorkspaceAction'
  | 'draw'
  | 'ensureDate'
  | 'ensureIndex'
  | 'exportBackup'
  | 'isMonthClosed'
  | 'moneyInput'
  | 'monthIndexFromDate'
  | 'newId'
  | 'notificationsOpen'
  | 'openAccountPanel'
  | 'openSheet'
  | 'prepareCsv'
  | 'removeLim'
  | 'renderNavigation'
  | 'renderNotifications'
  | 'renderView'
  | 'safely'
  | 'saveD'
  | 'saveG'
  | 'saveI'
  | 'saveL'
  | 'saveReceipts'
  | 'saveSheet'
  | 'showError'
  | 'showNotice'
  | 'summaryMode'
  | 'switchMonth'
  | 'syncNavigation'
  | 'toCents'
>;

export function createNavigationEvents(workspace: NavigationEventsContext) {
  function syncNavigation() {
    document.querySelectorAll<HTMLElement>('#tabs button').forEach((button) => {
      if (
        button.dataset.t! === (workspace.S.tab === 'i' ? 'r' : workspace.S.tab)
      )
        button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function renderNavigation() {
    workspace.renderView(
      workspace.$('#tabs'),
      viewList(
        MAIN_AREAS.map(({ key: k, label }) => (
          <button
            type="button"
            data-t={k}
            aria-label={label}
            title={label}
            aria-current={
              k === (workspace.S.tab === 'i' ? 'r' : workspace.S.tab)
                ? 'page'
                : undefined
            }
          >
            {k === 'a' ? workspace.P(<><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/></>) : k === 'f'
              ? workspace.P(<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"></path>)
              : workspace.ICON[k]}
          </button>
        )),
      ),
    );
  }

  function dispatchWorkspaceAction(a: { dataset: DOMStringMap }) {
    const action = a.dataset.a!,
      id = a.dataset.id!;
    try {
      if (action === 'sheet') {
        workspace.openSheet(a);
        return;
      }
      if (action === 'sclose') {
        workspace.closeSheet();
        return;
      }
      if (action === 'ssave') {
        workspace.saveSheet();
        return;
      }
      if (action === 'srem') {
        workspace.removeLim();
        return;
      }
      if (action === 'backup') {
        workspace.exportBackup();
        return;
      }
      if (action === 'reload') {
        location.reload();
        return;
      }
      if (action === 'csvcancel') {
        workspace.csvPreview = null;
        workspace.csvGeneration++;
        workspace.draw();
        return;
      }
      if (action === 'csvapply') {
        const count = workspace.atomic(workspace.applyCsv);
        workspace.csvPreview = null;
        workspace.showNotice(count + ' lançamento(s) importado(s).');
        workspace.draw();
        const status = workspace.$('#accountPanelStatus');
        if (status) {
          status.hidden = false;
          status.setAttribute('role', 'status');
          status.textContent = count + ' lançamento(s) importado(s).';
        }
        return;
      }
      workspace.safely(() => {
        if (action === 'del') {
          workspace.S.items = workspace.S.items.filter((x) => x.id !== id);
          workspace.saveI();
        } else if (action === 'stoprepeat') {
          workspace.cancelFutureExpenses(id);
        } else if (action === 'istoprepeat') {
          workspace.cancelFutureIncome(id);
        } else if (action === 'idel') {
          workspace.S.receipts = workspace.S.receipts.filter(
            (x) => x.id !== id,
          );
          workspace.saveReceipts();
        } else if (action === 'dup') {
          const source = workspace.S.items.find((x) => x.id === id);
          if (source) {
            if (source.p === 'Cartão de crédito' && !source.creditCardId)
              throw Error(
                'Edite este gasto e selecione um cartão antes de duplicar.',
              );
            if (
              source.creditCardId &&
              !workspace.CARDS.some(
                (c) => c.id === source.creditCardId && c.active,
              )
            )
              throw Error('Ative o cartão antes de duplicar este gasto.');
            if (workspace.S.items.length >= workspace.MAX_RECORDS)
              throw Error('Limite de lançamentos atingido.');
            const copy = {
              ...source,
              id: workspace.newId(),
              ...(source.creditCardId ? { creditPaid: false } : {}),
            };
            delete copy.splitId;
            if (copy.creditCardId) {
              copy.creditChargeCents = workspace.toCents(copy.v);
              copy.creditPaidCents = 0;
            }
            for (const key of [
              'recurrenceId',
              'recurrenceIndex',
              'recurrenceCount',
              'recurrenceOrigin',
              'recurrenceStopped',
            ] as const)
              delete copy[key];
            workspace.S.items.push(copy);
            workspace.saveI();
          }
        } else if (action === 'ddel') {
          workspace.DEBTS.splice(Number(id), 1);
          workspace.saveD();
        } else if (action === 'bank') workspace.S.bank = !workspace.S.bank;
        else if (action === 'goal') {
          workspace.S.goal = a.dataset.showGoal === 'true' || !workspace.S.goal;
          workspace.S.tab = 'r';
          workspace.summaryMode = 'overview';
          workspace.chartMetric = 'meta';
          scrollTo(0, 0);
        } else if (action === 'cplim') {
          workspace.LIM = Array.from({ length: workspace.M.length }, (_, i) =>
            workspace.isMonthClosed(i)
              ? { ...workspace.LIM[i] }
              : { ...workspace.LIM[workspace.S.m] },
          );
          workspace.saveL();
        } else if (action === 'addmonth') workspace.addNextMonth();
        else if (action === 'setmonth') {
          workspace.switchMonth(Number(a.dataset.m));
          workspace.S.tab = 'i';
        } else if (action === 'calday') {
          workspace.ensureDate(a.dataset.date!);
          workspace.S.m = workspace.monthIndexFromDate(a.dataset.date!);
          workspace.S.calDate = a.dataset.date!;
        } else if (action === 'prevmonth') {
          if (workspace.S.m > 0) workspace.switchMonth(workspace.S.m - 1);
        } else if (action === 'nextmonth')
          workspace.switchMonth(workspace.S.m + 1);
        workspace.draw();
      });
    } catch (error) {
      workspace.showError(error);
    }
  }
  return {
    syncNavigation,
    renderNavigation,
    dispatchWorkspaceAction,
  } satisfies Pick<
    WorkspaceRuntime,
    'syncNavigation' | 'renderNavigation' | 'dispatchWorkspaceAction'
  >;
}

export function initializeNavigationEvents(workspace: NavigationEventsContext) {
  // @workspace-step 168 IfStatement
  if (typeof bottomNavigationViewport !== 'undefined')
    workspace.scope.listen(bottomNavigationViewport, 'change', () => {
      workspace.renderNavigation();
      workspace.syncNavigation();
      dispatchEvent(new Event('plan-navigation-change'));
    });
  // @workspace-end 168
  // @workspace-step 169 ExpressionStatement
  workspace.renderNavigation();
  // @workspace-end 169
  // @workspace-step 170 ExpressionStatement
  workspace.scope.listen(window, 'plan-sections-change', () => {
    const label = document.activeElement?.getAttribute('aria-label');
    workspace.renderNavigation();
    workspace.draw();
    if (label)
      [
        ...document.querySelectorAll<HTMLElement>(
          '#accountOverlay [role=switch]',
        ),
      ]
        .find((x) => x.getAttribute('aria-label') === label)
        ?.focus({ preventScroll: true });
  });
  // @workspace-end 170
  // @workspace-step 171 IfStatement
  if (workspace.$('#calendarButton')) {
    workspace.renderView(workspace.$('#calendarButton'), workspace.ICON.c);
    workspace.scope.listen(workspace.$('#calendarButton'), 'click', () => {
      workspace.openAccountPanel('calendar');
    });
  }
  // @workspace-end 171
  // @workspace-step 172 IfStatement
  if (workspace.$('#friendsButton')) {
    workspace.renderView(workspace.$('#friendsButton'), workspace.ICON.s);
    workspace.scope.listen(workspace.$('#friendsButton'), 'click', () => {
      workspace.openAccountPanel('friends');
    });
  }
  // @workspace-end 172
  // @workspace-step 173 ExpressionStatement
  workspace.scope.listen(
    document.querySelector<HTMLElement>('.app-symbol')!,
    'click',
    () => {
      workspace.notificationsOpen = false;
      workspace.renderNotifications();
      workspace.openAccountPanel('profile');
    },
  );
  // @workspace-end 173
  // @workspace-step 174 ExpressionStatement
  workspace.scope.listen(workspace.$('#tabs'), 'click', (e) => {
    const b = (e.target as HTMLInputElement).closest('button');
    if (b?.dataset.t!) {
      workspace.S.tab = b.dataset.t!;
      workspace.syncNavigation();
      scrollTo(0, 0);
      workspace.draw();
    }
  });
  // @workspace-end 174
  // @workspace-step 175 ExpressionStatement
  workspace.scope.listen(workspace.$('#mes'), 'change', (e) =>
    workspace.safely(() =>
      workspace.switchMonth(
        /^\d{4}-\d{2}$/.test((e.target as HTMLInputElement).value)
          ? workspace.monthIndexFromDate(
              (e.target as HTMLInputElement).value + '-01',
            )
          : Number((e.target as HTMLInputElement).value),
      ),
    ),
  );
  // @workspace-end 175
  // @workspace-step 176 ExpressionStatement
  workspace.scope.listen(
    window,
    'scroll',
    () => {
      document.body.classList.toggle('scrolled', scrollY > 24);
    },
    { passive: true },
  );
  // @workspace-end 176
  // @workspace-step 177 ExpressionStatement
  workspace.scope.listen(window, 'keydown', (e) => {
    if (workspace.SH) {
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'Escape') {
        workspace.closeSheet();
        return;
      }
      if (e.key === 'Tab') {
        const controls = [
            ...workspace
              .$('#scrim')
              .querySelectorAll<HTMLButtonElement>('button,input,select'),
          ].filter((x) => !x.disabled && x.getClientRects().length > 0),
          i = controls.indexOf(document.activeElement as HTMLButtonElement);
        if (i < 0 || (e.shiftKey && i === 0)) {
          e.preventDefault();
          (e.shiftKey ? controls.at(-1) : controls[0])?.focus();
        } else if (!e.shiftKey && i === controls.length - 1) {
          e.preventDefault();
          controls[0]?.focus();
        }
      }
      if (
        e.key === 'Enter' &&
        (e.target as HTMLInputElement).tagName === 'INPUT' &&
        (e.target as HTMLInputElement).type !== 'checkbox'
      ) {
        e.preventDefault();
        workspace.saveSheet();
      }
      return;
    }
  });
  // @workspace-end 177

  // @workspace-step 179 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    const target = e.target as HTMLElement,
      action = target.closest<HTMLButtonElement>('[data-a]');
    if (action) workspace.dispatchWorkspaceAction(action);
    else if (target.id === 'scrim') workspace.closeSheet();
  });
  // @workspace-end 179
  // @workspace-step 180 ExpressionStatement
  workspace.scope.listen(document, 'change', (e) => {
    if ((e.target as HTMLInputElement).id === 'incomeKind') {
      const kind = (e.target as HTMLInputElement).value;
      workspace.SH!.incomeKind = kind;
      const repeat = workspace.$('#sr');
      if (repeat) {
        repeat.checked = kind !== 'once';
        workspace.$('#repeatMonths').hidden = !repeat.checked;
      }
      if (kind === 'salary' && !workspace.$('#sd').value)
        workspace.$('#sd').value = 'Salário';
    }
    if ((e.target as HTMLInputElement).id === 'sr')
      workspace.$('#repeatMonths').hidden = !(e.target as HTMLInputElement)
        .checked;
  });
  // @workspace-end 180
  // @workspace-step 181 ExpressionStatement
  workspace.scope.listen(document, 'change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.id === 'gv') {
      workspace.safely(() => {
        workspace.GOAL.v = workspace.moneyInput(input, { zero: true });
        workspace.ensureIndex(workspace.GOAL.e);
        workspace.saveG();
        workspace.draw();
      });
      return;
    }
    if (input.id === 'ge') {
      workspace.safely(() => {
        const index = Number(input.value);
        workspace.ensureIndex(index);
        workspace.GOAL.e = index;
        workspace.saveG();
        workspace.draw();
      });
      return;
    }
    if (input.id === 'csvConvention') {
      workspace.csvConvention = input.value;
      workspace.csvPreview = null;
      workspace.csvGeneration++;
      workspace.draw();
      const select = workspace.$('#csvConvention');
      if (select) select.value = input.value;
      return;
    }
    if (input.id !== 'csv' || !input.files![0]) return;
    const file = input.files![0],
      convention = workspace.$('#csvConvention').value,
      generation = ++workspace.csvGeneration;
    input.value = '';
    if (file.size > 500000) {
      workspace.showError(Error('Use um CSV de até 500 KB.'));
      return;
    }
    file
      .text()
      .then((text) => {
        if (generation !== workspace.csvGeneration) return;
        workspace.csvPreview = {
          ...workspace.prepareCsv(text, convention),
          sourceName: file.name,
        };
        workspace.draw();
        if (workspace.$('#csvConvention'))
          workspace.$('#csvConvention').value = convention;
      })
      .catch(workspace.showError);
  });
  // @workspace-end 181
}
