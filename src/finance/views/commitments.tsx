import { viewList } from '../../services/presentation.ts';
import type { WorkspaceViewContext } from '../../types/views';
// Presentation only: controller dependencies are injected at each render.
export function vD(context: WorkspaceViewContext) {
  const {
    CLOSED_REPORTS,
    DEBTS,
    ICON,
    M,
    S,
    brl,
    debtChart,
    debtInstallments,
    debtPaidCount,
    debtRemainingCents,
    debtSchedule,
    esc,
    isMonthClosed,
    monthKeyForIndex,
    monthLabelFromKey,
  } = context;
  if (isMonthClosed(S.m) && CLOSED_REPORTS[monthKeyForIndex(S.m)]) {
    const report = CLOSED_REPORTS[monthKeyForIndex(S.m)];
    return (
      <section className="card">
        <h2>{'Dívidas do mês'}</h2>
        <strong className="overview-total">{brl(report.debtCents / 100)}</strong>
        {viewList(
          (report.debts || []).map((d) => (
            <div className="report-line">
              <span>{esc(d.name)}</span>
              <b>{brl(d.cents / 100)}</b>
            </div>
          )),
        ) || <p className="foot">{'Sem parcelas neste fechamento.'}</p>}
      </section>
    );
  }
  const rows = debtSchedule(S.m),
    total = rows[0].v / 100,
    open = DEBTS.filter((d) => debtRemainingCents(d) > 0),
    end = open.length ? Math.max(...open.map((d) => Math.max(S.m, d.s + d.p - 1))) : null;
  return (
    <>
      <div className="debt-stats">
        <section className="info-block">
          <span>{'Saldo em aberto'}</span>
          <strong>{brl(total)}</strong>
          <small>
            {open.length}
            {' dívida(s) em andamento'}
          </small>
        </section>
        <section className="info-block">
          <span>{'Parcelas do mês'}</span>
          <strong>
            {brl(
              DEBTS.reduce(
                (t, d) =>
                  t +
                  debtInstallments(d).reduce(
                    (sum, v, j) => sum + (j >= debtPaidCount(d) && d.s + j === S.m ? v : 0),
                    0,
                  ),
                0,
              ) / 100,
            )}
          </strong>
          <small>{M[S.m]}</small>
        </section>
        <section className="info-block">
          <span>{'Quitação prevista'}</span>
          <strong className="debt-end">
            {end === null ? '—' : monthLabelFromKey(monthKeyForIndex(end))}
          </strong>
          <small>{end === null ? 'Nenhuma dívida em aberto' : 'Conforme o parcelamento informado'}</small>
        </section>
      </div>
      <section className="card debt-projection">
        <div className="row">
          <h2>{'Evolução das dívidas'}</h2>
          <span className="tag">{'Até a quitação'}</span>
        </div>
        <div
          className="chart-scroll"
          tabIndex={0}
          role="region"
          aria-label="Gráfico de dívidas, deslize para explorar"
        >
          {debtChart()}
        </div>
        <p className="foot">{'Projeção das parcelas restantes. Atrasos entram no mês selecionado.'}</p>
      </section>
      <div className="row section-heading">
        <h2>{'Suas dívidas'}</h2>
        <button className="btn t" type="button" aria-label="Adicionar dívida" data-direct-sheet="" data-a="sheet" data-k="d">
          {ICON.plus}
        </button>
      </div>
      <div className="debt-blocks">
        {DEBTS.length ? (
          viewList(
            DEBTS.map((d, i) => {
              const paid = debtPaidCount(d),
                left = debtRemainingCents(d) / 100,
                parts = debtInstallments(d);
              return (
                <button className="debt-block" data-a="sheet" data-k="d" data-id={i}>
                  <div className="row">
                    <h3>{esc(d.n)}</h3>
                    <span className="tag">{left > 0 ? 'Em aberto' : 'Quitada'}</span>
                  </div>
                  <span className="foot">{'Saldo restante'}</span>
                  <strong>{brl(left)}</strong>
                  <div className="debt-facts">
                    <span>
                      {'Parcela '}
                      <b>{brl((parts[paid] || 0) / 100)}</b>
                    </span>
                    <span>
                      {'Pagas '}
                      <b>
                        {paid}
                        {' de '}
                        {d.p}
                      </b>
                    </span>
                    <span>
                      {'Total '}
                      <b>{brl(d.v)}</b>
                    </span>
                    <span>
                      {'Última parcela '}
                      <b>{monthLabelFromKey(monthKeyForIndex(d.s + d.p - 1))}</b>
                    </span>
                  </div>
                </button>
              );
            }),
          )
        ) : (
          <div className="quiet-empty">
            <h3>{'Sem dívidas'}</h3>
            <p>{'Adicione uma dívida para acompanhar as parcelas.'}</p>
          </div>
        )}
      </div>
    </>
  );
}
// end-view:vD
export function vCards(context: WorkspaceViewContext) {
  const {} = context;
  return <div data-credit-investments=""></div>;
}
// end-view:vCards
export function vSplit(context: WorkspaceViewContext) {
  const { ICON, socialView, vDivision } = context;
  return (
    <>
      {socialView()}
      {vDivision()}
      <details className="floating-action-editor">
        <summary className="btn">
          {ICON.share}
          <span>{'Compartilhar'}</span>
        </summary>
        <section className="card">
          <div data-share-debt=""></div>
        </section>
      </details>
    </>
  );
}
// end-view:vSplit
export function commitmentsView(context: WorkspaceViewContext) {
  const { areaNavigation, areaViews, vCards, vD, vSplit } = context;
  return (
    <>
      {areaNavigation('commitments', 'Seções de compromissos')}
      <div className="area-content">
        {areaViews.commitments === 'cards' ? vCards() : areaViews.commitments === 'friends' ? vSplit() : vD()}
      </div>
    </>
  );
}
// end-view:commitmentsView
