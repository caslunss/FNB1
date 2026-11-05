import { viewList } from '../../services/presentation.ts';
import { errorDetails } from '../../services/errors.ts';
import type { WorkspaceRuntime } from './contracts';

type ReportsContext = Pick<
  WorkspaceRuntime,
  | 'CATS'
  | 'CLOSED_REPORTS'
  | 'DEBTS'
  | 'M'
  | 'MAX_MONTHS'
  | 'atomic'
  | 'brl'
  | 'dateLong'
  | 'debt'
  | 'dm'
  | 'esc'
  | 'itemsInMonth'
  | 'makeClosedReport'
  | 'monthCount'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'receiptsInMonth'
  | 'saveWorkspace'
  | 'showNotice'
  | 'todayISO'
>;

export function createReports(workspace: ReportsContext) {
  function makeClosedReport(m: number, closedOn: string) {
    const expenses = workspace.itemsInMonth(m).map((x) => ({ ...x })),
      receipts = workspace.receiptsInMonth(m).map((x) => ({ ...x })),
      incomeCents = receipts.reduce((t, x) => t + Math.round(x.v * 100), 0),
      expenseCents = expenses.reduce((t, x) => t + Math.round(x.v * 100), 0),
      debtCents = Math.round(workspace.debt(m) * 100);
    return {
      key: workspace.monthKeyForIndex(m),
      label: workspace.M[m],
      closedOn,
      incomeCents,
      expenseCents,
      debtCents,
      balanceCents: incomeCents - expenseCents - debtCents,
      expenses,
      receipts,
      categories: workspace.CATS.map((name) => ({
        name,
        cents: expenses
          .filter((x) => x.c === name)
          .reduce((t, x) => t + Math.round(x.v * 100), 0),
      })),
      debts: workspace.DEBTS.filter((d) => workspace.dm(d, m) > 0).map((d) => ({
        name: d.n,
        cents: Math.round(workspace.dm(d, m) * 100),
      })),
    };
  }

  function closeCompletedMonths(date = workspace.todayISO()) {
    const current = workspace.monthIndexFromDate(date);
    if (current <= 0) return false;
    const missing: number[] = [];
    for (
      let m = 0;
      m < Math.min(current, workspace.monthCount, workspace.MAX_MONTHS);
      m++
    )
      if (!workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)])
        missing.push(m);
    if (!missing.length) return false;
    try {
      workspace.atomic(() => {
        missing.forEach((m) => {
          workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(m)] =
            workspace.makeClosedReport(m, date);
        });
        workspace.saveWorkspace();
      });
      return true;
    } catch (error) {
      workspace.showNotice(
        'Não foi possível salvar o fechamento mensal. ' +
          errorDetails(error).message,
        true,
      );
      return false;
    }
  }

  function closedReportsView() {
    const reports = Object.values(workspace.CLOSED_REPORTS).sort((a, b) =>
      b.key.localeCompare(a.key),
    );
    return (
      <section className="card closed-reports">
        <h2>{'Relatórios mensais fechados'}</h2>
        <p className="foot">
          {
            'Fechamento automático na virada do mês ou no próximo acesso. Os valores fechados ficam preservados.'
          }
        </p>
        {reports.length ? (
          viewList(
            reports.map((r) => (
              <details className="report-block">
                <summary>
                  <span>
                    {workspace.esc(r.label)}
                    <small>
                      {'Fechado em '}
                      {workspace.dateLong(r.closedOn)}
                    </small>
                  </span>
                  <span className="tag">{'Fechado'}</span>
                  <b className={r.balanceCents < 0 ? 'bad' : 'ok'}>
                    {workspace.brl(r.balanceCents / 100)}
                  </b>
                </summary>
                <div className="report-stats">
                  <div>
                    <span>{'Entradas'}</span>
                    <b>{workspace.brl(r.incomeCents / 100)}</b>
                  </div>
                  <div>
                    <span>{'Gastos'}</span>
                    <b>{workspace.brl(r.expenseCents / 100)}</b>
                  </div>
                  <div>
                    <span>{'Parcelas previstas'}</span>
                    <b>{workspace.brl(r.debtCents / 100)}</b>
                  </div>
                  <div>
                    <span>{'Saldo após compromissos'}</span>
                    <b>{workspace.brl(r.balanceCents / 100)}</b>
                  </div>
                </div>
                <h3>{'Por categoria'}</h3>
                {viewList(
                  r.categories
                    .filter((x) => x.cents > 0)
                    .map((x) => (
                      <div className="report-line">
                        <span>{workspace.esc(x.name)}</span>
                        <b>{workspace.brl(x.cents / 100)}</b>
                      </div>
                    )),
                ) || <p className="foot">{'Sem gastos neste mês.'}</p>}
                <h3>{'Lançamentos do mês'}</h3>
                {viewList(
                  [
                    ...r.receipts.map((x) => ({ ...x, type: 'i' })),
                    ...r.expenses.map((x) => ({ ...x, type: 'g' })),
                  ]
                    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                    .map((x) => (
                      <div className="report-line">
                        <span>
                          {workspace.esc(x.d)}
                          <small>
                            {x.date ? workspace.dateLong(x.date) : 'Sem data'}
                            {' · '}
                            {x.type === 'i' ? 'Entrada' : 'Gasto'}
                          </small>
                        </span>
                        <b>
                          {x.type === 'i' ? '+' : '−'} {workspace.brl(x.v)}
                        </b>
                      </div>
                    )),
                ) || <p className="foot">{'Sem lançamentos.'}</p>}
                <p className="foot">
                  {
                    'Mês encerrado: lançamentos disponíveis somente para visualização.'
                  }
                </p>
              </details>
            )),
          )
        ) : (
          <div className="quiet-empty">
            <h3>{'Seu primeiro relatório chega no próximo mês'}</h3>
            <p>
              {
                'Os registros deste mês serão reunidos aqui quando o mês terminar.'
              }
            </p>
          </div>
        )}
      </section>
    );
  }
  return {
    makeClosedReport,
    closeCompletedMonths,
    closedReportsView,
  } satisfies Pick<
    WorkspaceRuntime,
    'makeClosedReport' | 'closeCompletedMonths' | 'closedReportsView'
  >;
}
