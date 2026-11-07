import { decodeSharedDebt } from '../../services/shared-debt.ts';
import type { WorkspaceRuntime } from './contracts';

type IncomingDebtContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'DEBTS'
  | 'SH'
  | 'brl'
  | 'draw'
  | 'esc'
  | 'openSheet'
  | 'renderView'
  | 'selectAreaView'
  | 'shoppingMoney'
  | 'showError'
  | 'showNotice'
>;

export function createIncomingDebt(workspace: IncomingDebtContext) {
  function incomingDebt() {
    let raw;
    try {
      raw = sessionStorage.getItem('plan12-pending-debt');
    } catch {}
    if (!raw) return;
    try {
      const debt = decodeSharedDebt(raw);
      const dialog = document.createElement('dialog');
      dialog.className = 'account-confirm-dialog';
      dialog.id = 'incomingDebtDialog';
      dialog.setAttribute('aria-labelledby', 'incomingDebtTitle');
      document.body.append(dialog);
      workspace.renderView(
        dialog,
        <>
          <h2 id="incomingDebtTitle">{'Dívida compartilhada'}</h2>
          <p>{workspace.esc(debt.name)}</p>
          {debt.collector&&<p>Quem cobra: {workspace.esc(debt.collector)}</p>}
          <strong>{workspace.brl(debt.cents / 100)}</strong>
          <p className="foot">
            {
              'Confirme o valor com quem enviou. Escolha mês e parcelas a seguir.'
            }
          </p>
          {!window.planAuth.user ? (
            <p className="foot">
              {
                'Visitante: dados temporários. Entre com Google para salvar na conta.'
              }
            </p>
          ) : (
            ''
          )}
          <div className="settings-actions">
            <button className="btn g" type="button" data-incoming-debt="cancel">
              {'Cancelar'}
            </button>
            <button className="btn" type="button" data-incoming-debt="review">
              {'Revisar dívida'}
            </button>
          </div>
        </>,
      );
      dialog.showModal();
      workspace.scope.listen(dialog, 'cancel', () => {
        sessionStorage.removeItem('plan12-pending-debt');
      });
      workspace.scope.listen(dialog, 'click', (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>(
          '[data-incoming-debt]',
        );
        if (!b) return;
        if (b.dataset.incomingDebt === 'cancel') {
          sessionStorage.removeItem('plan12-pending-debt');
          dialog.close();
          return;
        }
        if (workspace.DEBTS.some((x) => x.sharedRef === debt.id)) {
          sessionStorage.removeItem('plan12-pending-debt');
          workspace.showError(Error('Esta dívida já foi adicionada.'));
          dialog.close();
          return;
        }
        dialog.close();
        workspace.selectAreaView('commitments:debts');
        workspace.draw();
        workspace.openSheet({ dataset: { k: 'd' } });
        workspace.$('#sd').value = debt.name;
        workspace.$('#sv').value = workspace.shoppingMoney(debt.cents);
        workspace.SH!.sharedRef = debt.id;
      });
    } catch {
      sessionStorage.removeItem('plan12-pending-debt');
      workspace.showNotice(
        'O link de dívida não é válido. Nenhum dado foi adicionado.',
        true,
      );
    }
  }
  return { incomingDebt } satisfies Pick<WorkspaceRuntime, 'incomingDebt'>;
}
