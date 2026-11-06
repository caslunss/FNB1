import { isSafeInteger } from '../../services/type-guards.ts';
import { errorDetails } from '../../services/errors.ts';
import type { WorkspaceRuntime } from './contracts';

type ProfileEventsContext = Pick<
  WorkspaceRuntime,
  'scope' | '$' | 'S' | 'carbonRecords' | 'draw' | 'localStorage'
>;

export function initializeProfileEvents(workspace: ProfileEventsContext) {
  workspace.scope.listen(window,'plan-profile-appearance-change',()=>workspace.draw());
  // @workspace-step 212 ExpressionStatement
  workspace.scope.listen(document, 'submit', (e) => {
    if ((e.target as HTMLFormElement).id !== 'carbonForm') return;
    e.preventDefault();
    try {
      const data = new FormData(e.target as HTMLFormElement),
        id = String(data.get('purchase')),
        raw = String(data.get('kg')).trim().replace(',', '.');
      if (!/^\d+(\.\d{1,3})?$/.test(raw))
        throw Error('Informe até três casas decimais.');
      const grams = Math.round(Number(raw) * 1000);
      if (
        !isSafeInteger(grams) ||
        grams < 0 ||
        grams > 1e12 ||
        !workspace.S.items.some((x) => x.id === id)
      )
        throw Error('Revise a compra e a emissão.');
      const records = workspace.carbonRecords();
      records[id] = {
        grams,
        source: String(data.get('source') || '')
          .trim()
          .slice(0, 240),
      };
      workspace.localStorage.setItem(
        'plan12carbon_v1',
        JSON.stringify(records),
      );
      workspace.draw();
    } catch (error) {
      workspace.$('#carbonStatus').textContent = errorDetails(error).message;
    }
  });
  // @workspace-end 212
}
