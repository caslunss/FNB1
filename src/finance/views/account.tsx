import { viewList } from '../../services/presentation.ts';
import type { WorkspaceViewContext } from '../../types/views';
// Presentation only: controller dependencies are injected at each render.
export function vSettings(context: WorkspaceViewContext) {
  const { accountSettingsTab, accountSettingsView, integrationsView } = context;
  return (
    <>
      <div className="account-settings-tabs" role="tablist" aria-label="Configurações">
        {viewList(
          [
            ['account', 'Conta'],
            ['notifications', 'Notificações'],
            ['layout', 'Layout'],
            ['connections', 'Conexões'],
          ].map(([key, label]) => (
            <button
              type="button"
              role="tab"
              id={'settingsTab-' + String(key)}
              data-account-settings-tab={key}
              aria-selected={accountSettingsTab === key}
              aria-controls="settingsPanel"
              tabIndex={Number(accountSettingsTab === key ? 0 : -1)}
            >
              {label}
            </button>
          )),
        )}
      </div>
      <section
        id="settingsPanel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={'settingsTab-' + String(accountSettingsTab)}
      >
        {accountSettingsTab === 'account' ? (
          accountSettingsView()
        ) : accountSettingsTab === 'layout' ? (
          <div data-layout-settings=""></div>
        ) : accountSettingsTab === 'connections' ? (
          integrationsView()
        ) : (
          <div data-notification-preferences=""></div>
        )}
      </section>
    </>
  );
}
// end-view:vSettings
export function vYou(context: WorkspaceViewContext) {
  const {
    esc,
    isBetaTester,
    monthlyRatings,
    profileIdentity,
    profileStars,
    streamingPill,
    supportProjectCard,
  } = context;
  const p = profileIdentity(),
    user = window.planAuth.user;
  return (
    <div className="profile-redesign profile-card-layout">
      <div
        data-profile-card=""
        data-name={esc(p.name)}
        data-photo={esc(p.photo || '')}
        data-verified={!!user?.email_confirmed_at}
        data-tester={isBetaTester(user)}
        data-supporter={user?.app_metadata?.supporter === true}
      >
        <h3 className="profile-notes-title">{'Gastos e economias'}</h3>
        {profileStars()}
        <div className="profile-card-months">
          {monthlyRatings() || (
            <p className="profile-no-ratings">
              {'As notas mensais aparecem após o fechamento de um mês com entradas e gastos.'}
            </p>
          )}
        </div>
      </div>
      <details className="profile-extras">
        <summary aria-label="Assinaturas e apoio">
          {'Assinaturas'}
          <svg className="profile-extras-chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 10 5 5 5-5"></path>
          </svg>
        </summary>
        {streamingPill()}
        {supportProjectCard()}
      </details>
    </div>
  );
}
// end-view:vYou
