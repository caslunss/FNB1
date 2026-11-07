import { arrangeSummary } from '../../components/summary-layout.tsx';
import type { WorkspaceRuntime } from './contracts';

type SummaryContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'S'
  | 'arrangeCards'
  | 'draw'
  | 'load'
  | 'localStorage'
  | 'showError'
  | 'summaryMode'
>;

export function createSummary(workspace: SummaryContext) {
  function prepareSummary(markup: import('react').ReactNode) {
    if (workspace.S.tab !== 'r' || ['behavior','forecast'].includes(workspace.summaryMode))
      return markup;
    return arrangeSummary(
      markup,
      workspace.load<string[]>('plan12cardOrder', [], Array.isArray),
      workspace.arrangeCards,
    );
  }
  return { prepareSummary } satisfies Pick<WorkspaceRuntime, 'prepareSummary'>;
}

export function initializeSummary(workspace: SummaryContext) {
  // @workspace-step 283 FirstStatement
  workspace.arrangeCards = false;
  // @workspace-end 283

  // @workspace-step 285 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if (
      (e.target as HTMLElement).closest<HTMLElement>('[data-finish-arrange]')
    ) {
      workspace.arrangeCards = false;
      workspace.draw();
      return;
    }
    const b = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-move-card]',
    );
    if (!b) return;
    const card = b.closest<HTMLElement>('[data-card-key]'),
      all = [
        ...workspace
          .$('#app')
          .querySelectorAll<HTMLElement>(':scope > [data-card-key]'),
      ],
      index = all.indexOf(card!),
      next = index + Number(b.dataset.moveCard);
    if (next < 0 || next >= all.length) return;
    [all[index], all[next]] = [all[next], all[index]];
    try {
      workspace.localStorage.setItem(
        'plan12cardOrder',
        JSON.stringify(all.map((c) => c.dataset.cardKey)),
      );
      workspace.draw();
    } catch (error) {
      workspace.showError(error);
    }
  });
  // @workspace-end 285
}
