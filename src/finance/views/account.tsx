import type { WorkspaceViewContext } from '../../types/views';
// Presentation only: controller dependencies are injected at each render.
export function vSettings(context: WorkspaceViewContext) {
  const { accountSettingsTab, accountSettingsView, integrationsView } = context;
  return (
    <div data-settings-navigation="" data-settings-initial={accountSettingsTab} data-settings-visitor={!window.planAuth.user||window.planAuth.user.is_anonymous===true?'true':'false'}>
      {accountSettingsView()}
      {integrationsView()}
    </div>
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
        data-email={esc(user?.email || '')}
        data-verified={!!user?.email_confirmed_at}
        data-tester={isBetaTester(user)}
        data-supporter={user?.app_metadata?.supporter === true}
      >
        <details className="profile-notes-section"><summary><svg className="profile-row-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg><span>Gastos e economias</span><svg className="profile-extras-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></summary>
        <h3 className="profile-notes-title">{'Gastos e economias'}</h3>
        {profileStars()}
        <div className="profile-card-months">
          {monthlyRatings() || (
            <p className="profile-no-ratings">
              {'As notas mensais aparecem após o fechamento de um mês com entradas e gastos.'}
            </p>
          )}
        </div>
        </details>
      <details className="profile-extras">
        <summary aria-label="Assinaturas e apoio">
          <svg className="profile-row-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h3"/></svg><span>{'Assinaturas'}</span>
          <svg className="profile-extras-chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 10 5 5 5-5"></path>
          </svg>
        </summary>
        {streamingPill()}
        {supportProjectCard()}
      </details>
      </div>
    </div>
  );
}
// end-view:vYou
