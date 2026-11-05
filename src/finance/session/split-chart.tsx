import { viewList } from '../../services/presentation.ts';
import { isInteger } from '../../services/type-guards.ts';
import type { Split } from '../../types/workspace';
import type { WorkspaceRuntime } from './contracts';

type SplitChartContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'SPLITS'
  | 'atomic'
  | 'brl'
  | 'draw'
  | 'esc'
  | 'safely'
  | 'saveWorkspace'
  | 'splitPaymentTotals'
  | 'splitShares'
>;

export function createSplitChart(workspace: SplitChartContext) {
  function splitPaymentTotals(splits: Split[]) {
    const totals = new Map<
      string,
      { name: string; paid: number; pending: number }
    >();
    for (const split of splits) {
      const shares = workspace.splitShares(
        split.cents,
        split.people.length,
        split.shareOffset ?? 0,
      );
      split.people.forEach((name, i) => {
        const label = i === split.ownIndex ? 'Você' : name.trim(),
          key =
            i === split.ownIndex
              ? 'self'
              : 'name:' + label.toLocaleLowerCase('pt-BR');
        const row = totals.get(key) || { name: label, paid: 0, pending: 0 };
        if (split.paid?.[i]) row.paid += shares[i];
        else row.pending += shares[i];
        totals.set(key, row);
      });
    }
    return [...totals.values()].sort(
      (a, b) => b.paid - a.paid || a.name.localeCompare(b.name),
    );
  }

  function splitPaymentsChart(splits = workspace.SPLITS) {
    if (!splits.length) return '';
    const rows = workspace.splitPaymentTotals(splits),
      highest = rows[0]?.paid || 0,
      lowest = rows.length ? Math.min(...rows.map((x) => x.paid)) : 0;
    return (
      <div className="split-month-payments">
        <h3>{'Pagamentos por pessoa'}</h3>
        <p className="foot">
          {'Pagamentos confirmados manualmente. Agrupados por nome.'}
        </p>
        {rows.length ? (
          viewList(
            rows.map((x) => (
              <div className="habit-line gauge-tile">
                <div className="row">
                  <span>{workspace.esc(x.name)}</span>
                  <strong>{workspace.brl(x.paid / 100)}</strong>
                  <small>
                    {highest > lowest
                      ? x.paid === highest
                        ? 'Pagou mais'
                        : x.paid === lowest
                          ? 'Pagou menos'
                          : ''
                      : ''}
                  </small>
                </div>
                <div
                  data-progress-gauge=""
                  data-value={
                    x.paid + x.pending
                      ? (x.paid / (x.paid + x.pending)) * 100
                      : 0
                  }
                  data-label={workspace.esc(x.name)}
                  data-status="Pago"
                  data-indicator-key={
                    'payments:' + String(workspace.esc(x.name))
                  }
                >
                  <div className="habit-track">
                    <i
                      style={{
                        width:
                          String(
                            x.paid + x.pending
                              ? (x.paid / (x.paid + x.pending)) * 100
                              : 0,
                          ) + '%',
                      }}
                    ></i>
                  </div>
                </div>
                <small className="foot">
                  {'Pendente: '}
                  {workspace.brl(x.pending / 100)}
                </small>
              </div>
            )),
          )
        ) : (
          <p className="mut">{'Nenhuma divisão.'}</p>
        )}
      </div>
    );
  }
  return { splitPaymentTotals, splitPaymentsChart } satisfies Pick<
    WorkspaceRuntime,
    'splitPaymentTotals' | 'splitPaymentsChart'
  >;
}

export function initializeSplitChart(workspace: SplitChartContext) {
  // @workspace-step 314 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-split-paid]',
    );
    if (!b) return;
    workspace.safely(() => {
      workspace.atomic(() => {
        const x = workspace.SPLITS.find((x) => x.id === b.dataset.id!),
          i = Number(b.dataset.splitPaid);
        if (!x || !isInteger(i) || i < 0 || i >= x.people.length)
          throw Error('Participante inválido.');
        x.paid = Array.from({ length: x.people.length }, (_, j) =>
          j === i ? !x.paid?.[j] : !!x.paid?.[j],
        );
        workspace.saveWorkspace();
      });
      workspace.draw();
    });
  });
  // @workspace-end 314
}
