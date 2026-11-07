import { disposeViews } from '../components/FinanceView';
import { captureFinanceRegistration } from '../services/finance-runtime';
import { WorkspaceSession } from './session/state';
import { initializeWorkspace } from './session/assembly';

export async function startWorkspace({
  renderView,
}: {
  renderView: typeof import('../components/FinanceView').renderView;
}) {
  try {
    if (/^#(?:debt|d)=/.test(location.hash||'') && location.hash.length < 4000)
      sessionStorage.setItem('plan12-pending-debt', location.hash);
  } catch {}
  try {
    await window.planAuth.ready;
  } catch {
    location.replace('./login.html');
    return;
  }
  if (!window.planAuth.hasAccess()) {
    location.replace('./login.html');
    return;
  }
  await window.planCloud?.prepare();
  document.documentElement.classList.remove('auth-pending');
  const workspace = new WorkspaceSession(renderView, disposeViews);
  workspace.scope.own(captureFinanceRegistration());
  workspace.localStorage = window.planAuth.storage;
  try {
    initializeWorkspace(workspace);
    return workspace;
  } catch (error) {
    workspace.dispose();
    throw error;
  }
}
