import type { WorkspaceRuntime } from './contracts';

type AppearanceContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'P'
  | 'S'
  | 'appearance'
  | 'appearanceMedia'
  | 'applyAppearance'
  | 'arrangeCards'
  | 'chartMetric'
  | 'draw'
  | 'entryFilter'
  | 'load'
  | 'renderView'
  | 'selectAreaView'
  | 'summaryMode'
  | 'toggleTheme'
>;

export function createAppearance(workspace: AppearanceContext) {
  function appearance() {
    const saved = workspace.load<string | null>(
      'plan12appearance',
      null,
      (v: string | null) => v === 'dark' || v === 'light',
    );
    return saved || (workspace.appearanceMedia.matches ? 'dark' : 'light');
  }

  function applyAppearance(mode: string) {
    document.documentElement.dataset.theme = mode;
    document
      .querySelectorAll<HTMLElement>('[data-theme-toggle]')
      .forEach((b) => {
        b.setAttribute('aria-pressed', String(mode === 'dark'));
        b.setAttribute(
          'aria-label',
          mode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro OLED',
        );
        b.title =
          mode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro OLED';
        workspace.renderView(
          b,
          <>
            {mode === 'dark'
              ? workspace.P(
                  <>
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"></path>
                  </>,
                )
              : workspace.P(
                  <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"></path>,
                )}
            <span className="theme-label">
              {mode === 'dark' ? 'Modo claro' : 'Modo escuro'}
            </span>
          </>,
        );
      });
  }
  return { appearance, applyAppearance } satisfies Pick<
    WorkspaceRuntime,
    'appearance' | 'applyAppearance'
  >;
}

export function initializeAppearance(workspace: AppearanceContext) {
  // @workspace-step 187 FirstStatement
  workspace.appearanceMedia = matchMedia('(prefers-color-scheme: dark)');
  // @workspace-end 187

  // @workspace-step 190 ExpressionStatement
  workspace.applyAppearance(workspace.appearance());
  // @workspace-end 190
  // @workspace-step 191 ExpressionStatement
  workspace.scope.listen(workspace.appearanceMedia, 'change', () => {
    if (
      !workspace.load<string | null>(
        'plan12appearance',
        null,
        (v: string | null) => v === 'dark' || v === 'light',
      )
    )
      workspace.applyAppearance(workspace.appearance());
  });
  // @workspace-end 191
  // @workspace-step 192 ExpressionStatement
  workspace.scope.listen(window, 'plan-theme-request', (e) => {
    if (
      ['light', 'dark'].includes(e.detail) &&
      e.detail !== document.documentElement.dataset.theme
    )
      workspace.toggleTheme();
  });
  // @workspace-end 192
  // @workspace-step 193 ExpressionStatement
  workspace.scope.listen(window, 'plan-segment-request', (e) => {
    const { kind, value } = e.detail || {};
    if (kind === 'data-area-view') {
      if (workspace.selectAreaView(value)) workspace.draw();
      return;
    }
    if (kind === 'data-entry-filter' && ['all', 'i', 'g'].includes(value))
      workspace.entryFilter = value;
    else if (
      kind === 'data-summary-mode' &&
      ['overview', 'behavior', 'entries'].includes(value)
    ) {
      workspace.summaryMode = value;
      workspace.S.tab = value === 'entries' ? 'i' : 'r';
      workspace.arrangeCards = false;
    } else if (kind === 'data-chart' && ['i', 'g', 'meta'].includes(value))
      workspace.chartMetric = value;
    else return;
    workspace.draw();
  });
  // @workspace-end 193
  // @workspace-step 194 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if ((e.target as HTMLElement).closest<HTMLElement>('[data-theme-toggle]'))
      workspace.toggleTheme();
    const chart = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-chart]',
    );
    if (chart) {
      workspace.chartMetric = chart.dataset.chart!;
      workspace.draw();
    }
  });
  // @workspace-end 194
}
