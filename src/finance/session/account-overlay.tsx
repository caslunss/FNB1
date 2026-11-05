import { animate } from 'motion';
import { FADE, PROFILE_EXIT } from '../../services/motion-presets.ts';
import type { WorkspaceRuntime } from './contracts';

type AccountOverlayContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'P'
  | 'S'
  | 'accountOverlay'
  | 'accountPanel'
  | 'accountSettingsTab'
  | 'closeAccountPanel'
  | 'draw'
  | 'notificationsOpen'
  | 'overlayOpener'
  | 'renderAccountPanel'
  | 'renderNotifications'
  | 'renderView'
  | 'selectAreaView'
  | 'vC'
  | 'vSettings'
  | 'vYou'
>;

export function createAccountOverlay(workspace: AccountOverlayContext) {
  function renderAccountPanel() {
    if (!workspace.accountPanel) return;
    const title = {
        profile: 'Perfil',
        settings: 'Configurações',
        calendar: 'Calendário',
      }[workspace.accountPanel],
      content =
        workspace.accountPanel === 'profile'
          ? workspace.vYou()
          : workspace.accountPanel === 'calendar'
            ? workspace.vC()
            : workspace.vSettings();
    workspace.renderView(
      workspace.$('#accountOverlayContent'),
      <>
        {workspace.accountPanel!=='settings'&&<button
          type="button"
          className="mobile-sheet-grabber"
          data-mobile-expand=""
          aria-label="Expandir ou recolher folha"
          aria-expanded="false"
        >
          <span></span>
        </button>}
        {workspace.accountPanel!=='settings'&&<header className="account-overlay-header">
          <h2 id="accountOverlayTitle">{title}</h2>
          <button
            className="btn g account-overlay-close"
            type="button"
            data-close-account=""
            aria-label={'Fechar ' + String(title)}
          >
            {workspace.P(<path d="m6 6 12 12M18 6 6 18"></path>)}
          </button>
        </header>}
        <div
          className={
            'account-panel-body ' + String(workspace.accountPanel) + '-panel'
          }
        >
          {content}
        </div>
        <p
          id="accountPanelStatus"
          className="foot"
          role="alert"
          hidden={true}
        ></p>
      </>,
    );
  }

  function openAccountPanel(panel: string, opener: Element | null = null) {
    const destination = {
      shopping: 'commitments:cards',
      friends: 'commitments:friends',
      offers: 'planning:purchases',
      reports: 'analysis:reports',
    }[panel];
    if (destination) {
      workspace.closeAccountPanel();
      workspace.accountPanel = null;
      workspace.notificationsOpen = false;
      workspace.renderNotifications();
      if (workspace.selectAreaView(destination)) {
        scrollTo(0, 0);
        workspace.draw();
      }
      return;
    }
    if (panel === 'integrations') {
      workspace.accountSettingsTab = 'connections';
      panel = 'settings';
    }
    if (!['profile', 'settings', 'calendar'].includes(panel)) return;
    const dialog = workspace.$('#accountOverlay');
    if (!dialog) return;
    workspace.overlayOpener =
      opener ||
      (panel === 'calendar'
        ? workspace.$('#calendarButton')
        : document.querySelector<HTMLElement>('.app-symbol'));
    workspace.notificationsOpen = false;
    workspace.renderNotifications();
    workspace.accountPanel = panel;
    dialog.classList.remove('mobile-expanded');
    workspace.$('#accountOverlay').dataset.panel = panel;
    workspace.renderAccountPanel();
    if (!dialog.open) {
      dialog.showModal();
      document.body.classList.add('account-overlay-open');
    }
    document
      .querySelector<HTMLElement>('.app-symbol')
      ?.setAttribute('aria-expanded', String(panel === 'profile'));
    workspace
      .$('#calendarButton')
      ?.setAttribute('aria-expanded', String(panel === 'calendar'));
    dialog.querySelector<HTMLButtonElement>('[data-close-account],.settings-back')?.focus();
  }

  function closeAccountPanel({ immediate = false } = {}) {
    const dialog = workspace.$('#accountOverlay');
    if (!dialog?.open || dialog.dataset.closing) return;
    if (
      immediate ||
      dialog.dataset.panel !== 'profile' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      dialog.close();
      return;
    }
    dialog.dataset.closing = 'true';
    dialog.inert = true;
    const done = () => {
      dialog.close();
      dialog.inert = false;
      delete dialog.dataset.closing;
      dialog.style.removeProperty('opacity');
      dialog.style.removeProperty('transform');
    };
    const animation = animate(dialog, PROFILE_EXIT, {
      ...FADE,
      onComplete: () => {
        if (!workspace.scope.disposed) done();
      },
    });
    workspace.scope.own(() => animation.stop());
  }
  return {
    renderAccountPanel,
    openAccountPanel,
    closeAccountPanel,
  } satisfies Pick<
    WorkspaceRuntime,
    'renderAccountPanel' | 'openAccountPanel' | 'closeAccountPanel'
  >;
}

export function initializeAccountOverlay(workspace: AccountOverlayContext) {
  // @workspace-step 217 ExpressionStatement
  workspace.scope.listen(document, 'click', async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-connect-pluggy]',
    );
    if (!button || button.disabled) return;
    button.disabled = true;
    const status = document.querySelector<HTMLElement>('[data-pluggy-status]');
    try {
      const { connectBank } = await import('../../services/pluggy-connect.ts');
      await connectBank((message: string | null) => {
        const target = document.querySelector<HTMLElement>(
          '[data-pluggy-status]',
        );
        if (target) target.textContent = message;
      });
    } catch {
      if (status)
        status.textContent =
          'Não foi possível abrir a conexão. Tente novamente.';
    } finally {
      button.disabled = false;
    }
  });
  // @workspace-end 217

  // @workspace-step 221 FirstStatement
  workspace.accountOverlay = workspace.$('#accountOverlay');
  // @workspace-end 221
  // @workspace-step 222 IfStatement
  if (workspace.accountOverlay) {
    workspace.scope.listen(workspace.accountOverlay, 'cancel', (e) => {
      if (workspace.accountOverlay.dataset.panel === 'profile') {
        e.preventDefault();
        workspace.closeAccountPanel();
      }
    });
    workspace.scope.listen(workspace.accountOverlay, 'click', (e) => {
      if ((e.target as HTMLElement) === workspace.accountOverlay)
        workspace.closeAccountPanel();
    });
    workspace.scope.listen(workspace.accountOverlay, 'close', () => {
      if (workspace.accountOverlay.open) return;
      workspace.accountPanel = null;
      workspace.accountSettingsTab = 'home';
      workspace.$('#calendarButton')?.setAttribute('aria-expanded', 'false');
      document
        .querySelector<HTMLElement>('.app-symbol')
        ?.setAttribute('aria-expanded', 'false');
      workspace.renderView(workspace.$('#accountOverlayContent'), '');
      document.body.classList.remove('account-overlay-open');
      (workspace.overlayOpener as HTMLElement | null)?.focus({
        preventScroll: true,
      });
    });
  }
  // @workspace-end 222
  // @workspace-step 223 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if (
      (e.target as HTMLElement).closest<HTMLElement>('[data-mobile-expand]')
    ) {
      const expanded = workspace
        .$('#accountOverlay')
        .classList.toggle('mobile-expanded');
      (e.target as HTMLElement)
        .closest<HTMLElement>('[data-mobile-expand]')!
        .setAttribute('aria-expanded', String(expanded));
      return;
    }
    if (
      (e.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-close-account]',
      )
    ) {
      workspace.closeAccountPanel();
      return;
    }
    const tab = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-account-settings-tab]',
    );
    if (tab) {
      workspace.accountSettingsTab = tab.dataset.accountSettingsTab||'home';
      return;
    }
  });
  // @workspace-end 223
  // @workspace-step 224 ExpressionStatement
  workspace.scope.listen(document, 'plan-settings-home', () => {workspace.accountSettingsTab='home';});
  // @workspace-end 224
  // @workspace-step 225 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if (
      (e.target as HTMLElement).closest<HTMLElement>('[data-cloud-settings]')
    ) {
      workspace.accountSettingsTab='connections';
      workspace.S.tab = 'x';
      workspace.draw();
      document
        .querySelector<HTMLElement>('.cloud-settings')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  // @workspace-end 225
}
