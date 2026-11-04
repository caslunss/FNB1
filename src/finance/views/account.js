// Presentation only: controller dependencies are injected at each render.
export function vSettings(context){
 const {accountSettingsTab,accountSettingsView,integrationsView}=context;
return `<div class="account-settings-tabs" role="tablist" aria-label="Configurações">${[['account','Conta'],['notifications','Notificações'],['layout','Layout'],['connections','Conexões']].map(([key,label])=>`<button type="button" role="tab" id="settingsTab-${key}" data-account-settings-tab="${key}" aria-selected="${accountSettingsTab===key}" aria-controls="settingsPanel" tabindex="${accountSettingsTab===key?0:-1}">${label}</button>`).join('')}</div><section id="settingsPanel" role="tabpanel" tabindex="0" aria-labelledby="settingsTab-${accountSettingsTab}">${accountSettingsTab==='account'?accountSettingsView():accountSettingsTab==='layout'?'<div data-layout-settings></div>':accountSettingsTab==='connections'?integrationsView():'<div data-notification-preferences></div>'}</section>`;
}
// end-view:vSettings
export function vYou(context){
 const {esc,isBetaTester,monthlyRatings,profileIdentity,profileStars,streamingPill,supportProjectCard}=context;
const p=profileIdentity(),user=window.planAuth.user;return `<div class="profile-redesign profile-card-layout"><div data-profile-card data-name="${esc(p.name)}" data-photo="${esc(p.photo||'')}" data-verified="${!!user?.email_confirmed_at}" data-tester="${isBetaTester(user)}" data-supporter="${user?.app_metadata?.supporter===true}"><h3 class="profile-notes-title">Gastos e economias</h3>${profileStars()}<div class="profile-card-months">${monthlyRatings()||'<p class="profile-no-ratings">As notas mensais aparecem após o fechamento de um mês com entradas e gastos.</p>'}</div></div><details class="profile-extras"><summary aria-label="Assinaturas e apoio">Assinaturas<svg class="profile-extras-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></summary>${streamingPill()}${supportProjectCard()}</details></div>`;
}
// end-view:vYou
