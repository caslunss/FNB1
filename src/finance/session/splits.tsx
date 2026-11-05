import { viewList } from '../../services/presentation.ts';
import type { Split } from '../../types/workspace';
import { vSplit as rendervSplit } from '../views/commitments.tsx';
import type { WorkspaceRuntime } from './contracts';

type SplitsContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'ICON'
  | 'S'
  | 'SPLITS'
  | 'brl'
  | 'dateLong'
  | 'draw'
  | 'esc'
  | 'friendDivisionForm'
  | 'monthKeyForIndex'
  | 'shareMarkup'
  | 'social'
  | 'splitMonth'
  | 'splitMonthKey'
  | 'splitMonthLabel'
  | 'splitMonthlyTotals'
  | 'splitPaymentsChart'
  | 'splitShares'
  | 'viewContext'
>;

export function createSplits(workspace: SplitsContext) {
  function splitMonthKey(split: Split) {
    return /^\d{4}-\d{2}-\d{2}$/.test(split.date || '')
      ? split.date.slice(0, 7)
      : 'undated';
  }

  function splitMonthlyTotals(splits: Split[]) {
    const totals = new Map<string, number>();
    for (const x of splits) {
      const key = workspace.splitMonthKey(x);
      totals.set(key, (totals.get(key) || 0) + x.cents);
    }
    return [...totals]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cents]) => ({ month, cents }));
  }

  function splitMonthLabel(key: string | null) {
    if (key === 'undated') return 'Sem data';
    const [year, month] = key!.split('-');
    return (
      [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ][Number(month) - 1] +
      '/' +
      year.slice(-2)
    );
  }

  function vSplit() {
    return rendervSplit(workspace.viewContext);
  }

  function vDivision() {
    const months = workspace.splitMonthlyTotals(workspace.SPLITS),
      preferred = workspace.monthKeyForIndex(workspace.S.m);
    if (!months.some((x) => x.month === workspace.splitMonth))
      workspace.splitMonth = months.some((x) => x.month === preferred)
        ? preferred
        : months.at(-1)?.month || null;
    const selected = workspace.SPLITS.filter(
        (x) => workspace.splitMonthKey(x) === workspace.splitMonth,
      ),
      total = selected.reduce((n, x) => n + x.cents, 0),
      chartMonths = months.filter((x) => x.month !== 'undated').slice(-12),
      max = Math.max(1, ...chartMonths.map((x) => x.cents));
    return (
      <>
        <h2>{'Divisão de gastos'}</h2>
        <details className="floating-action-editor">
          <summary className="btn">
            {workspace.ICON.plus}
            <span>{'Dividir com amigo'}</span>
          </summary>
          <section className="card">{workspace.friendDivisionForm()}</section>
        </details>
        {workspace.social.shares.length ? (
          <section className="card">
            <h3>{'Divisões com amigos'}</h3>
            {viewList(workspace.social.shares.map(workspace.shareMarkup))}
          </section>
        ) : (
          ''
        )}
        {workspace.SPLITS.length ? (
          <section className="card split-monthly-card">
            <div className="split-monthly-header">
              <h2>{'Gastos divididos'}</h2>
              <label className="split-month-picker">
                {'Mês'}
                <select id="splitMonth">
                  {viewList(
                    months.map((x) => (
                      <option
                        value={x.month}
                        selected={x.month === workspace.splitMonth}
                      >
                        {workspace.splitMonthLabel(x.month)}
                      </option>
                    )),
                  )}
                </select>
              </label>
            </div>
            <strong className="split-month-total">
              {workspace.brl(total / 100)}
            </strong>
            <p className="foot">
              {'Valor total dividido · '}
              {selected.length} {selected.length === 1 ? 'gasto' : 'gastos'}
              {' em '}
              {workspace.splitMonthLabel(workspace.splitMonth)}
            </p>
            {chartMonths.length ? (
              <div
                className="split-month-chart"
                role="img"
                aria-label="Valores totais divididos por mês"
              >
                <div className="split-month-bars">
                  {viewList(
                    chartMonths.map((x) => (
                      <div
                        className={
                          'split-month-column ' +
                          String(
                            x.month === workspace.splitMonth ? 'selected' : '',
                          )
                        }
                      >
                        <span>{workspace.brl(x.cents / 100)}</span>
                        <div className="split-month-track">
                          <i
                            style={{
                              height: String((x.cents / max) * 100) + '%',
                            }}
                          ></i>
                        </div>
                        <small>{workspace.splitMonthLabel(x.month)}</small>
                      </div>
                    )),
                  )}
                </div>
              </div>
            ) : (
              ''
            )}
            {workspace.splitPaymentsChart(selected)}
            <div className="split-month-details">
              <h3>{'Detalhes do mês'}</h3>
              {viewList(
                selected.map((x) => {
                  const active = workspace.S.items.some(
                      (item) => item.id === x.expenseId,
                    ),
                    shares = workspace.splitShares(
                      x.cents,
                      x.people.length,
                      x.shareOffset ?? 0,
                    );
                  return (
                    <div className="split-block">
                      <div className="row">
                        <h3>{workspace.esc(x.name)}</h3>
                        <strong>{workspace.brl(x.cents / 100)}</strong>
                        <button
                          className="ib"
                          data-feature="split-delete"
                          data-id={x.id}
                          aria-label={
                            'Excluir divisão ' +
                            String(workspace.esc(x.name)) +
                            String(active ? ' e seu gasto' : '')
                          }
                        >
                          {'×'}
                        </button>
                      </div>
                      {viewList(
                        x.people.map((name, i) => (
                          <div className="split-person">
                            <span>
                              {workspace.esc(name)}
                              {i === x.ownIndex && name !== 'Você'
                                ? ' · Você'
                                : ''}
                            </span>
                            <b>{workspace.brl(shares[i] / 100)}</b>
                            <button
                              className="btn g"
                              type="button"
                              data-split-paid={i}
                              data-id={x.id}
                              aria-pressed={!!x.paid?.[i]}
                              aria-label={
                                String(
                                  x.paid?.[i]
                                    ? 'Desmarcar pagamento de'
                                    : 'Confirmar pagamento de',
                                ) +
                                ' ' +
                                String(workspace.esc(name))
                              }
                            >
                              {x.paid?.[i] ? 'Pago' : 'Confirmar'}
                            </button>
                          </div>
                        )),
                      )}
                      <p className="foot">
                        {x.people.length}
                        {' pessoas · '}
                        {x.status
                          ? workspace.esc(x.status)
                          : x.date
                            ? workspace.dateLong(x.date) +
                              ' · ' +
                              (active
                                ? 'Sua parte está em Entradas e no calendário'
                                : 'Gasto vinculado removido')
                            : 'Divisão anterior sem lançamento vinculado'}
                      </p>
                    </div>
                  );
                }),
              )}
            </div>
          </section>
        ) : (
          <p className="foot split-empty">{'Nenhum gasto dividido.'}</p>
        )}
      </>
    );
  }
  return {
    splitMonthKey,
    splitMonthlyTotals,
    splitMonthLabel,
    vSplit,
    vDivision,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'splitMonthKey'
    | 'splitMonthlyTotals'
    | 'splitMonthLabel'
    | 'vSplit'
    | 'vDivision'
  >;
}

export function initializeSplits(workspace: SplitsContext) {
  // @workspace-step 241 FirstStatement
  workspace.splitMonth = null;
  // @workspace-end 241

  // @workspace-step 247 ExpressionStatement
  workspace.scope.listen(document, 'change', (e) => {
    if ((e.target as HTMLInputElement).id === 'splitMonth') {
      workspace.splitMonth = (e.target as HTMLInputElement).value;
      workspace.draw();
    }
  });
  // @workspace-end 247
}
