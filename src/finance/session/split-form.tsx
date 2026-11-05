import { registerSplit as migrated_registerSplit } from '../controllers/planning';
import { isSafeInteger } from '../../services/type-guards.ts';
import { core_splitShares } from '../calculations.ts';
import type { WorkspaceRuntime } from './contracts';

type SplitFormContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'PROFILE'
  | 'S'
  | 'SPLITS'
  | 'applyAppearance'
  | 'atomic'
  | 'brl'
  | 'clearTransientError'
  | 'dateLong'
  | 'draw'
  | 'engineContext'
  | 'entryFilter'
  | 'moneyInput'
  | 'parseMoney'
  | 'planningContext'
  | 'put'
  | 'registerSplit'
  | 'safely'
  | 'saveWorkspace'
  | 'showError'
  | 'splitShares'
  | 'toCents'
  | 'todayISO'
  | 'toggleTheme'
>;

export function createSplitForm(workspace: SplitFormContext) {
  function splitShares(cents: number, n: number, offset = 0) {
    return core_splitShares(workspace.engineContext, cents, n, offset);
  }

  function registerSplit(
    name: string,
    cents: number,
    others: string[],
    date = workspace.todayISO(),
    shareOffset = 0,
  ) {
    return migrated_registerSplit(
      workspace.planningContext,
      name,
      cents,
      others,
      date,
      shareOffset,
    );
  }

  function toggleTheme() {
    try {
      const mode =
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      workspace.put('plan12appearance', mode);
      workspace.applyAppearance(mode);
    } catch (e) {
      workspace.showError(e);
    }
  }
  return { splitShares, registerSplit, toggleTheme } satisfies Pick<
    WorkspaceRuntime,
    'splitShares' | 'registerSplit' | 'toggleTheme'
  >;
}

export function initializeSplitForm(workspace: SplitFormContext) {
  // @workspace-step 257 ExpressionStatement
  workspace.scope.listen(document, 'input', (e) => {
    const form = (e.target as HTMLInputElement).closest<HTMLFormElement>(
      '[data-form="split"]',
    );
    if (!form) return;
    const data = new FormData(form),
      cents = workspace.parseMoney(data.get('price')),
      others = String(data.get('people') || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      count = others.length + 1,
      box = workspace.$('#splitEstimate');
    if (box)
      box.textContent =
        isSafeInteger(cents) && cents > 0 && count <= 100
          ? 'Sua parte: ' +
            workspace.brl(workspace.splitShares(cents, count)[0] / 100) +
            ' · ' +
            count +
            ' pessoa(s) · registro em ' +
            workspace.dateLong(workspace.todayISO())
          : 'Informe um valor com até duas casas decimais e até 99 outras pessoas.';
  });
  // @workspace-end 257
  // @workspace-step 258 ExpressionStatement
  workspace.scope.listen(document, 'submit', (e) => {
    const form = (e.target as HTMLFormElement).closest<HTMLFormElement>(
      '[data-form]',
    );
    if (!form) return;
    e.preventDefault();
    const data = new FormData(form),
      kind = form.dataset.form,
      name = String(data.get('name') || '').trim();
    try {
      workspace.atomic(() => {
        if (!name) throw Error('Informe uma descrição ou nome.');
        if (kind === 'profile') {
          if (name.length > 60)
            throw Error('Use um nome de até 60 caracteres.');
          workspace.PROFILE.name = name;
          workspace.saveWorkspace();
          return;
        }
        if (kind === 'split') {
          const price = workspace.moneyInput(
              form.querySelector<HTMLInputElement>('[name="price"]'),
            ),
            others = String(data.get('people') || '')
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean);
          workspace.registerSplit(name, workspace.toCents(price), others);
        }
      });
      workspace.clearTransientError();
      workspace.draw();
      if (kind === 'profile')
        workspace.$('#profileStatus').textContent = 'Nome salvo.';
    } catch (error) {
      workspace.showError(error);
    }
  });
  // @workspace-end 258
  // @workspace-step 259 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    const filter = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-entry-filter]',
    );
    if (filter) {
      workspace.entryFilter = filter.dataset.entryFilter!;
      workspace.draw();
      return;
    }
    const ui = (e.target as HTMLElement).closest<HTMLElement>('[data-ui]');
    if (ui) {
      if (ui.dataset.ui === 'calendar') {
        workspace.S.tab = 'c';
        workspace.draw();
      } else if (ui.dataset.ui === 'theme') workspace.toggleTheme();
      return;
    }
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-feature="split-delete"]',
    );
    if (!button) return;
    const id = button.dataset.id!;
    workspace.safely(() => {
      const split = workspace.SPLITS.find((x) => x.id === id);
      if (!split) return;
      if (split.expenseId)
        workspace.S.items = workspace.S.items.filter(
          (x) => !(x.id === split.expenseId && x.splitId === split.id),
        );
      workspace.SPLITS = workspace.SPLITS.filter((x) => x.id !== id);
      workspace.saveWorkspace();
      workspace.draw();
    });
  });
  // @workspace-end 259
}
