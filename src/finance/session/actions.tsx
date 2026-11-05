import { finance } from '../../services/finance-runtime.ts';
import type { WorkspaceRuntime } from './contracts';

type ActionsContext = Pick<
  WorkspaceRuntime,
  | 'MENU'
  | 'S'
  | 'arrangeCards'
  | 'defaultDateForMonth'
  | 'dispatchWorkspaceAction'
  | 'draw'
  | 'openReceipt'
  | 'openSheet'
>;

export function initializeActions(workspace: ActionsContext) {
  // @workspace-step 159 ExpressionStatement
  finance.actionItems = (descriptor) => {
    const d = descriptor || {};
    if (d.kind === 'ledger')
      return [
        ...['i', 'g'].map((k) => ({
          label: k === 'i' ? 'Entrada' : 'Gasto',
          onSelect: () => workspace.openSheet({ dataset: { k } }),
        })),
        { label: 'Ler nota', onSelect: () => workspace.openReceipt() },
        {
          label: 'Salário mensal',
          onSelect: () =>
            workspace.openSheet({ dataset: { k: 'i', incomeKind: 'salary' } }),
        },
      ];
    if (d.kind === 'summary')
      return [
        {
          label: workspace.arrangeCards
            ? 'Concluir organização'
            : 'Reorganizar cards',
          onSelect: () => {
            workspace.arrangeCards = !workspace.arrangeCards;
            workspace.draw();
          },
        },
      ];
    let rows =
      d.kind === 'context'
        ? workspace.MENU[d.k!]?.(d.k === 'd' ? Number(d.id) : d.id) || []
        : d.k === 'launch'
          ? [
              {
                l: 'Entrada',
                a: 'sheet',
                k: 'i',
                date: d.date || workspace.defaultDateForMonth(workspace.S.m),
              },
              {
                l: 'Gasto',
                a: 'sheet',
                k: 'g',
                date: d.date || workspace.defaultDateForMonth(workspace.S.m),
              },
            ]
          : [
              {
                l:
                  d.a === 'addmonth'
                    ? 'Adicionar mês'
                    : d.k === 'd'
                      ? 'Adicionar dívida'
                      : d.k === 'l'
                        ? 'Adicionar limite'
                        : d.k === 'i'
                          ? 'Entrada'
                          : 'Gasto',
                a: d.a === 'addmonth' ? 'addmonth' : 'sheet',
                k: d.k,
                date: d.date || workspace.defaultDateForMonth(workspace.S.m),
              },
            ];
    return rows.map((row) => ({
      label: row.l,
      destructive: !!row.d,
      onSelect: () => {
        const dataset: DOMStringMap = {};
        for (const field of ['a', 'k', 'id', 'c', 'date'] as const)
          if (row[field] !== undefined) dataset[field] = String(row[field]);
        workspace.dispatchWorkspaceAction({ dataset });
      },
    }));
  };
  // @workspace-end 159
}
