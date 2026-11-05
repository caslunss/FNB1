import { installLegacyFinanceAdapter } from '../../services/legacy-finance-adapter.ts';
import { exportTaxData } from '../../services/taxes/client.ts';
import type { WorkspaceRuntime } from './contracts';

type AccountEventsContext = Pick<
  WorkspaceRuntime,
  'scope' | 'S' | 'draw' | 'showError'
>;

export function initializeAccountEvents(workspace: AccountEventsContext) {
  // @workspace-step 6 ExpressionStatement
  workspace.scope.listen(
    document,
    'error',
    (e) => {
      if (
        (e.target as HTMLElement).matches?.(
          '.profile-photo img,.rail-avatar img,.nav-avatar img',
        )
      )
        (e.target as HTMLElement).remove();
    },
    true,
  );
  // @workspace-end 6
  // @workspace-step 7 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if (
      (e.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-a="profile-settings"]',
      )
    ) {
      workspace.S.tab = 'x';
      workspace.draw();
    }
    if ((e.target as HTMLElement).closest<HTMLButtonElement>('#legacyBackup')) {
      const raw = window.localStorage.getItem('plan12workspace_v3');
      if (raw) {
        const url = workspace.scope.objectURL(
          new Blob([raw], { type: 'application/json' }),
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dados-locais-anteriores.json';
        a.click();
        workspace.scope.timeout(() => workspace.scope.revokeURL(url), 1000);
      }
    }
  });
  // @workspace-end 7
  // @workspace-step 8 ExpressionStatement
  workspace.scope.listen(document, 'click', async (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '#accountSignOut',
    );
    if (!button || button.disabled) return;
    button.disabled = true;
    try {
      await window.planCloud?.flush();
      await window.planAuth.signOut();
    } catch (err) {
      button.disabled = false;
      workspace.showError(err);
    }
  });
  // @workspace-end 8
  // @workspace-step 9 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if ((e.target as HTMLElement).closest<HTMLElement>('#exportTaxes'))
      exportTaxData().catch(workspace.showError);
  });
  // @workspace-end 9
  // @workspace-step 10 ExpressionStatement
  workspace.scope.own(installLegacyFinanceAdapter(window));
  // @workspace-end 10
}
