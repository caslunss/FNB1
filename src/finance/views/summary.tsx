import { viewList } from '../../services/presentation.ts';
import type { WorkspaceViewContext } from '../../types/views';
// Presentation only: controller dependencies are injected at each render.
export function vR(context: WorkspaceViewContext) {
  const {
    DEBTS,
    GOAL,
    M,
    S,
    brl,
    chartMetric,
    dailyBars,
    dateLong,
    debt,
    dm,
    donut,
    esc,
    goalChart,
    goalProjection,
    inc,
    investmentCategoryTile,
    itemsInMonth,
    lim,
    mbtn,
    monthComparison,
    spent,
    sum,
    tiles,
    topList,
  } = context;

  const m = S.m,
    it = itemsInMonth(m),
    isGoal = chartMetric === 'meta',
    value = isGoal ? goalProjection(m) : chartMetric === 'i' ? inc(m) : spent(m);
  const activeDebts = DEBTS.map((x, id) => ({ ...x, id })).filter((x) => dm(x, m) > 0);
  const goalForm = S.goal ? <div data-goal-editor=""></div> : '';
  return (
    <>
      <section className="overview" aria-label="Gráficos financeiros">
        <div className="chart-toolbar">
          <div className="segments" aria-label="Dados do gráfico">
            <button data-chart="i" aria-pressed={chartMetric === 'i'}>
              {'Entradas'}
            </button>
            <button data-chart="g" aria-pressed={chartMetric === 'g'}>
              {'Gastos'}
            </button>
            <button data-chart="meta" aria-pressed={isGoal}>
              {'Metas'}
            </button>
          </div>
          <span className="chart-caption">
            {isGoal ? 'Projeção acumulada' : 'Movimentação diária'}
            {' · '}
            {M[m]}
          </span>
        </div>
        <div className="overview-total">{brl(value)}</div>
        <div className="foot">
          {isGoal ? 'Projeção da meta' : chartMetric === 'i' ? 'Entradas do mês' : 'Gastos do mês'}
        </div>
        {monthComparison(chartMetric, m)}
        <div
          className="chart-scroll"
          tabIndex={0}
          role="region"
          aria-label="Gráfico financeiro, deslize para explorar"
        >
          {isGoal ? goalChart() : dailyBars()}
        </div>
        {isGoal ? (
          <>
            <div className="row goal-summary">
              <span className="foot">
                {GOAL.v > 0
                  ? 'Meta de ' + brl(GOAL.v) + ' até ' + (GOAL.date ? dateLong(GOAL.date) : M[GOAL.e])
                  : 'Nenhuma meta definida'}
              </span>
              <button className="btn g" data-a="goal" aria-expanded={S.goal}>
                {S.goal ? 'Fechar' : GOAL.v > 0 ? 'Editar meta' : 'Definir meta'}
              </button>
            </div>
            {goalForm}
            <p className="foot">
              {'Projeção: saldo após limites e dívidas, mais aportes registrados. Não presume rendimentos.'}
            </p>
          </>
        ) : (
          <>
            <div className="chart-legend">
              <span>{'Mês selecionado'}</span>
              <span>{'Mês anterior'}</span>
            </div>
            {!value ? <p className="chart-empty">{'Sem lançamentos.'}</p> : ''}
          </>
        )}
      </section>
      <div className="lower-insights">
        <section className="card">
          <h2>{'Distribuição dos gastos'}</h2>
          {donut(it)}
        </section>
        <section className="card">
          <h2>{'Maiores gastos'}</h2>
          {topList(it)}
        </section>
      </div>
      <section className="stage categories-min">
        <div className="row">
          <h2>{'Categorias'}</h2>
          {mbtn('l', 0, 'Limites por categoria')}
        </div>
        <div className="category-list">{tiles(m, it)}</div>
      </section>
      {investmentCategoryTile(
        m,
        it.filter((x) => x.c === 'Investimentos'),
        sum(it.filter((x) => x.c === 'Investimentos')),
        lim(m, 'Investimentos'),
      )}
      <section className="card debt-min">
        <div className="row">
          <h2>{'Dívidas do mês'}</h2>
          <span className="debt-total">{brl(debt(m))}</span>
        </div>
        {viewList(
          activeDebts.map((x) => (
            <button className="debt-line" data-a="sheet" data-k="d" data-id={x.id}>
              <span>
                {esc(x.n)}
                <small>{x.p > 1 ? x.p + ' parcelas' : 'À vista'}</small>
              </span>
              <b>{brl(dm(x, m))}</b>
            </button>
          )),
        ) || <p className="foot">{'Sem parcelas.'}</p>}
      </section>
    </>
  );
}
// end-view:vR
export function vI(context: WorkspaceViewContext) {
  const {
    ICON,
    MAX_MONTHS,
    S,
    brl,
    dateLong,
    entryFilter,
    esc,
    inc,
    itemsInMonth,
    mbtn,
    periodChart,
    receiptsInMonth,
    spent,
  } = context;

  const q = S.q.trim().toLowerCase(),
    rows = [
      ...itemsInMonth(S.m).map((x) => ({ ...x, type: 'g' })),
      ...receiptsInMonth(S.m).map((x) => ({ ...x, type: 'i' })),
    ]
      .filter(
        (x) =>
          (entryFilter === 'all' || entryFilter === x.type) &&
          (!q || (x.d + ' ' + (x.c || '') + ' ' + (x.p || '')).toLowerCase().includes(q)),
      )
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(b.id).localeCompare(String(a.id)));
  return (
    <>
      <section className="entry-summary">
        <div>
          <span className="foot">{'Entradas'}</span>
          <strong className="ok">{brl(inc(S.m))}</strong>
        </div>
        <div>
          <span className="foot">{'Gastos'}</span>
          <strong>{brl(spent(S.m))}</strong>
        </div>
        <div className="ledger-balance">
          <span className="foot">{'Saldo após gastos'}</span>
          <strong className={inc(S.m) - spent(S.m) < 0 ? 'bad' : ''}>{brl(inc(S.m) - spent(S.m))}</strong>
        </div>
      </section>
      <div
        className="row entry-toolbar entry-toolbar-floating"
        role="group"
        aria-label="Controles de lançamentos"
      >
        <div className="segments" aria-label="Filtrar lançamentos">
          {viewList(
            [
              ['all', 'Todos'],
              ['i', 'Entradas'],
              ['g', 'Gastos'],
            ].map(([key, label]) => (
              <button data-entry-filter={key} aria-pressed={entryFilter === key}>
                {label}
              </button>
            )),
          )}
        </div>
        <button
          className="btn g ledger-add"
          type="button"
          data-glass-actions="ledger"
          aria-label="Adicionar lançamento"
        >
          {ICON.plus}
          <span>{'Adicionar'}</span>
        </button>
      </div>
      <section className={'card unified-ledger ' + String(rows.length ? 'has-records' : 'is-empty')}>
        {rows.length ? (
          viewList(
            rows.map((x, index) => (
              <>
                {index === 0 || rows[index - 1].date !== x.date ? (
                  <h3 className="ledger-date">{x.date ? dateLong(x.date) : 'Sem data'}</h3>
                ) : (
                  ''
                )}
                <div className="ledger-row">
                  <span className={'ledger-icon ' + String(x.type === 'i' ? 'ok' : '')}>{ICON[x.type]}</span>
                  <button
                    className="ledger-detail"
                    aria-label={String(esc(x.d)) + ' · ' + String(x.date ? dateLong(x.date) : 'Sem data')}
                    data-a="sheet"
                    data-k={x.type}
                    data-id={x.id}
                  >
                    <strong>{esc(x.d)}</strong>
                    <small>
                      {x.type === 'i' ? 'Entrada' : esc(x.c)}
                      {x.recurrenceId ? ' · Mensal' : ''}
                    </small>
                  </button>
                  <b className={x.type === 'i' ? 'ok' : ''}>
                    {x.type === 'i' ? '+' : '−'} {brl(x.v)}
                  </b>
                  {mbtn(x.type, x.id, 'Mais ações para ' + esc(x.d))}
                </div>
              </>
            )),
          )
        ) : (
          <p className="foot">
            {q || entryFilter !== 'all'
              ? 'Nenhum lançamento para este filtro.'
              : 'Nenhum lançamento neste mês. Use Adicionar para começar.'}
          </p>
        )}
      </section>
      <details className="card ledger-evolution">
        <summary>{'Ver evolução'}</summary>
        <div className="ledger-evolution-content">
          {periodChart()}
          <div className="row period-totals">
            <span className="foot">{'Entradas no período'}</span>
            <strong>
              {brl(
                Array.from(
                  { length: 12 },
                  (_, i) => Math.max(0, Math.min(MAX_MONTHS - 12, S.m - 5)) + i,
                ).reduce((n, m) => n + inc(m), 0),
              )}
            </strong>
          </div>
        </div>
      </details>
    </>
  );
}
// end-view:vI
export function summaryView(context: WorkspaceViewContext) {
  const { S, behaviorView, summaryMode, vI, vR } = context;
  const mode = S.tab === 'i' ? 'entries' : summaryMode === 'entries' ? 'overview' : summaryMode;
  return mode === 'entries' ? (
    vI()
  ) : (
    <>
      {vR()}
      <section className="summary-behavior" aria-label="Comportamento financeiro">
        {behaviorView()}
      </section>
    </>
  );
}
// end-view:summaryView
