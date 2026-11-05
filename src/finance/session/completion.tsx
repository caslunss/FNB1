import {
  assertFinanceReady,
  subscribeFinance,
} from '../../services/finance-runtime.ts';
import type { WorkspaceRuntime } from './contracts';

type CompletionContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'S'
  | 'atomic'
  | 'bootRecovery'
  | 'draw'
  | 'ensureDate'
  | 'incomingDebt'
  | 'monthIndexFromDate'
  | 'observedDay'
  | 'readBlocked'
  | 'recovery'
  | 'renderNotifications'
  | 'saveWorkspace'
  | 'showError'
  | 'showNotice'
  | 'supportedDate'
>;

export function initializeCompletion(workspace: CompletionContext) {
  // @workspace-step 336 ExpressionStatement
  assertFinanceReady();
  // @workspace-end 336
  // @workspace-step 337 ExpressionStatement
  workspace.scope.own(subscribeFinance(workspace.renderNotifications));
  // @workspace-end 337
  // @workspace-step 338 ExpressionStatement
  workspace.scope.timeout(workspace.incomingDebt, 0);
  // @workspace-end 338
  // @workspace-step 339 TryStatement
  try {
    workspace.atomic(() => {
      if (workspace.supportedDate(workspace.observedDay)) {
        workspace.ensureDate(workspace.observedDay);
        workspace.S.m = workspace.monthIndexFromDate(workspace.observedDay);
        workspace.S.calDate = workspace.observedDay;
      }
      workspace.saveWorkspace();
    });
  } catch (e) {
    workspace.showError(e);
  }
  // @workspace-end 339
  // @workspace-step 340 IfStatement
  if (
    !workspace.readBlocked &&
    (workspace.recovery.length || workspace.bootRecovery.length)
  )
    workspace.showNotice(
      'Alguns dados antigos precisaram de validação. Os originais foram preservados; exporte o backup para conferir a recuperação.',
      false,
    );
  // @workspace-end 340
  // @workspace-step 341 ExpressionStatement
  workspace.draw();
  // @workspace-end 341
}
