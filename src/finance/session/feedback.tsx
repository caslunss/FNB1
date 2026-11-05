import { isInteger } from '../../services/type-guards.ts';
import { errorDetails } from '../../services/errors.ts';
import type { WorkspaceRuntime } from './contracts';

type FeedbackContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'M'
  | 'MAX_MONTHS'
  | 'S'
  | 'atomic'
  | 'bootRecovery'
  | 'clearTransientError'
  | 'convertMoney'
  | 'draw'
  | 'ensureIndex'
  | 'esc'
  | 'monthCount'
  | 'monthDate'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'monthLabelFromKey'
  | 'noticeError'
  | 'noticeMessage'
  | 'rawSource'
  | 'readBlocked'
  | 'recovery'
  | 'refreshMonths'
  | 'renderView'
  | 'saveMonthCount'
  | 'saveNumber'
  | 'showError'
  | 'showNotice'
  | 'snapshot'
  | 'supportedDate'
  | 'todayISO'
>;

export function createFeedback(workspace: FeedbackContext) {
  function showNotice(message: string, error = false) {
    workspace.noticeMessage = message;
    workspace.noticeError = error;
    const box = workspace.$('#appNotice');
    if (!box) return;
    box.hidden = !message;
    box.setAttribute('role', error ? 'alert' : 'status');
    workspace.renderView(
      box,
      message ? (
        <>
          <span>{workspace.esc(message)}</span>
          {error ||
          workspace.recovery.length ||
          workspace.bootRecovery.length ? (
            <button className="btn g" data-a="backup">
              {'Backup'}
            </button>
          ) : (
            ''
          )}
          {error ? (
            <button className="btn g" data-a="reload">
              {'Recarregar'}
            </button>
          ) : (
            ''
          )}
        </>
      ) : (
        ''
      ),
    );
  }

  function showError(error: unknown) {
    if (workspace.scope.disposed) return;
    workspace.showNotice(errorDetails(error).message || String(error), true);
    const panelStatus = workspace.$('#accountPanelStatus');
    if (panelStatus) {
      panelStatus.hidden = false;
      panelStatus.textContent = errorDetails(error).message || String(error);
    }
    const sheet = workspace.$('#scrim .sheet');
    if (sheet) {
      sheet
        .querySelectorAll<HTMLElement>('.progressive-fields')
        .forEach((node) =>
          node.dispatchEvent(new Event('plan-expand-details')),
        );
      let box = workspace.$('#sheetError');
      if (!box) {
        box = document.createElement('p');
        box.id = 'sheetError';
        box.className = 'bad';
        box.setAttribute('role', 'alert');
        sheet.append(box);
      }
      box.textContent = errorDetails(error).message || String(error);
    }
  }

  function clearTransientError() {
    if (!workspace.readBlocked)
      workspace.showNotice(
        workspace.recovery.length || workspace.bootRecovery.length
          ? 'Alguns dados antigos precisaram de validação. Os originais foram preservados; exporte o backup para conferir a recuperação.'
          : '',
        false,
      );
  }

  function safely(action: {
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
    (): void;
  }) {
    try {
      const before = workspace.saveNumber,
        value = workspace.atomic(action);
      if (workspace.saveNumber > before) workspace.clearTransientError();
      return value;
    } catch (error) {
      workspace.showError(error);
      workspace.draw();
      return false;
    }
  }

  function exportBackup() {
    const bundle = {
      kind: 'financas-backup',
      schemaVersion: 3,
      createdAt: new Date().toISOString(),
      workspace: {
        schemaVersion: 3,
        categoryVersion: 2,
        moneyUnit: 'centavos',
        data: workspace.convertMoney(workspace.snapshot(), 'encode'),
      },
      raw: workspace.rawSource,
      recovery: [...workspace.bootRecovery, ...workspace.recovery],
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: 'application/json',
      }),
      url = workspace.scope.objectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'financas-backup-' + workspace.todayISO() + '.json';
    a.click();
    workspace.scope.timeout(() => workspace.scope.revokeURL(url), 1000);
  }

  function ensureIndex(idx: number) {
    if (!isInteger(idx) || idx < 0 || idx >= workspace.MAX_MONTHS)
      throw Error(
        'Use um período entre ' +
          workspace.monthLabelFromKey(workspace.monthKeyForIndex(0)) +
          ' e ' +
          workspace.monthLabelFromKey(
            workspace.monthKeyForIndex(workspace.MAX_MONTHS - 1),
          ) +
          '.',
      );
    if (idx + 1 > workspace.monthCount) {
      workspace.monthCount = idx + 1;
      workspace.refreshMonths();
      workspace.saveMonthCount();
    }
  }

  function ensureDate(date: string) {
    if (!workspace.supportedDate(date))
      throw Error('Data inválida ou fora dos períodos disponíveis.');
    workspace.ensureIndex(workspace.monthIndexFromDate(date));
    return true;
  }

  function addNextMonth() {
    workspace.ensureIndex(workspace.monthCount);
    workspace.S.m = workspace.M.length - 1;
    workspace.S.calDate = workspace.monthDate(workspace.S.m);
    workspace.draw();
  }
  return {
    showNotice,
    showError,
    clearTransientError,
    safely,
    exportBackup,
    ensureIndex,
    ensureDate,
    addNextMonth,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'showNotice'
    | 'showError'
    | 'clearTransientError'
    | 'safely'
    | 'exportBackup'
    | 'ensureIndex'
    | 'ensureDate'
    | 'addNextMonth'
  >;
}
