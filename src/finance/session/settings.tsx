import { viewList } from '../../services/presentation.ts';
import { vSettings as rendervSettings } from '../views/account.tsx';
import type { WorkspaceRuntime } from './contracts';

type SettingsContext = Pick<
  WorkspaceRuntime,
  | 'ICON'
  | 'closedReportsView'
  | 'cloudSettingsView'
  | 'financeToolsView'
  | 'identitySettingsView'
  | 'viewContext'
>;

export function createSettings(workspace: SettingsContext) {
  function accountSettingsView() {
    return (
      <section className="account-details" id="identitySettings">
        {workspace.identitySettingsView()}
        {workspace.cloudSettingsView()}
        <section className="card">
          <h2>{'Seus dados'}</h2>
          <p className="mut">
            {window.planAuth.user
              ? 'Sincronizados por conta, com cópia local para uso offline.'
              : 'Dados temporários desta visita.'}
          </p>
          <div data-account-data-controls=""></div>
        </section>
      </section>
    );
  }

  function reportsView() {
    return (
      <>
        {workspace.closedReportsView()}
        {workspace.financeToolsView()}
        <section className="card export-reports">
          <h2>{'Exportar'}</h2>
          <div className="settings-actions">
            <button className="btn t" type="button" data-a="backup">
              {'Backup'}
            </button>
            <button className="btn g" type="button" id="exportSpreadsheet">
              {'CSV'}
            </button>
            <button className="btn g" type="button" id="exportTaxes">
              {'Impostos'}
            </button>
            {window.localStorage.getItem('plan12workspace_v3') ? (
              <button className="btn g" type="button" id="legacyBackup">
                {'Dados anteriores'}
              </button>
            ) : (
              ''
            )}
          </div>
          <p className="foot">
            {'Backup completo · CSV de todos os meses.'}
          </p>
        </section>
      </>
    );
  }

  function vSettings() {
    return rendervSettings(workspace.viewContext);
  }

  function integrationsView() {
    return (
      <div className="integration-list">
        <section className="card integration-tile">
          <span className="integration-icon">{workspace.ICON.b}</span>
          <div>
            <h2>{'Open Finance'}</h2>
          </div>
          <button type="button" className="btn" data-connect-pluggy="">
            {'Conectar banco'}
          </button>
          <p className="foot" data-pluggy-status="" role="status"></p>
        </section>
        {viewList(
          [
            ['d', 'Serasa'],
            ['i', 'Boletos emitidos'],
          ].map(([icon, name]) => (
            <section className="card integration-tile">
              <span className="integration-icon">{workspace.ICON[icon]}</span>
              <div>
                <h2>{name}</h2>
              </div>
              <span className="tag">{'Em breve'}</span>
            </section>
          )),
        )}
      </div>
    );
  }
  return {
    accountSettingsView,
    reportsView,
    vSettings,
    integrationsView,
  } satisfies Pick<
    WorkspaceRuntime,
    'accountSettingsView' | 'reportsView' | 'vSettings' | 'integrationsView'
  >;
}
