import { viewList } from '../../services/presentation.ts';
import { errorDetails } from '../../services/errors.ts';
import { summaryView as rendersummaryView } from '../views/summary.tsx';
import type { WorkspaceRuntime } from './contracts';

type BehaviorContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'CATS'
  | 'M'
  | 'S'
  | 'arrangeCards'
  | 'behaviorAdvice'
  | 'behaviorAggregate'
  | 'behaviorError'
  | 'behaviorLoading'
  | 'brl'
  | 'draw'
  | 'esc'
  | 'habitBars'
  | 'itemsInMonth'
  | 'monthKeyForIndex'
  | 'shoppingRequest'
  | 'summaryMode'
  | 'toCents'
  | 'todayISO'
  | 'viewContext'
>;

export function createBehavior(workspace: BehaviorContext) {
  function behaviorAggregate() {
    const cutoff = workspace.todayISO(),
      prefix = workspace.monthKeyForIndex(workspace.S.m),
      now = workspace
        .itemsInMonth(workspace.S.m)
        .filter((x) => x.date && x.date <= cutoff && x.date.startsWith(prefix)),
      prev =
        workspace.S.m > 0
          ? workspace
              .itemsInMonth(workspace.S.m - 1)
              .filter(
                (x) =>
                  x.date &&
                  x.date <= cutoff &&
                  x.date.startsWith(
                    workspace.monthKeyForIndex(workspace.S.m - 1),
                  ),
              )
          : [];
    const cents = (rows: readonly { v: number }[]) =>
      rows.reduce(
        (n: number, x: { v: unknown }) => n + workspace.toCents(x.v),
        0,
      );
    const weekdays = Array<number>(7).fill(0);
    for (const x of now)
      weekdays[new Date(x.date + 'T12:00:00').getDay()] += workspace.toCents(
        x.v,
      );
    return {
      month: prefix,
      asOf: cutoff,
      count: now.length,
      totalCents: cents(now),
      previousTotalCents: cents(prev),
      partial: prefix === cutoff.slice(0, 7),
      categories: workspace.CATS.map((name) => ({
        name,
        cents: cents(now.filter((x) => x.c === name)),
        count: now.filter((x) => x.c === name).length,
      })),
      weekdays: weekdays.map((value, day) => ({ day, cents: value })),
      months: Array.from({ length: Math.min(workspace.S.m + 1, 6) }, (_, i) => {
        const index = workspace.S.m - Math.min(workspace.S.m, 5) + i;
        return {
          month: workspace.monthKeyForIndex(index),
          cents: cents(
            workspace
              .itemsInMonth(index)
              .filter(
                (x) =>
                  x.date &&
                  x.date <= cutoff &&
                  x.date.startsWith(workspace.monthKeyForIndex(index)),
              ),
          ),
        };
      }),
    };
  }

  function habitBars(
    rows: { label: string; cents: number; attention?: boolean }[],
  ) {
    const total = rows.reduce((n, x) => n + x.cents, 0);
    if (!total) return <p className="foot">{'Sem gastos.'}</p>;
    return (
      <div className="habit-bars gauge-grid">
        {viewList(
          rows
            .filter((x: { cents: number }) => x.cents > 0)
            .map((x) => {
              const pct = (x.cents / total) * 100;
              return (
                <div className="habit-line gauge-tile">
                  <div className="row">
                    <span>{workspace.esc(x.label)}</span>
                    <strong>{workspace.brl(x.cents / 100)}</strong>
                    {x.attention ? (
                      <small className="habit-attention">
                        {'Concentração'}
                      </small>
                    ) : (
                      ''
                    )}
                  </div>
                  <div
                    data-progress-gauge=""
                    data-value={pct}
                    data-label={workspace.esc(x.label)}
                    data-status="Do total"
                    data-indicator-key={
                      'habit:' + String(workspace.esc(x.label))
                    }
                    data-attention={!!x.attention}
                  >
                    <div className="habit-track">
                      <i
                        className={x.attention ? 'attention' : ''}
                        style={{ width: String(pct) + '%' }}
                      ></i>
                    </div>
                  </div>
                </div>
              );
            }),
        )}
      </div>
    );
  }

  function behaviorView() {
    const a = workspace.behaviorAggregate(),
      key = JSON.stringify(a),
      advice =
        workspace.behaviorAdvice?.key === key ? workspace.behaviorAdvice : null;
    return (
      <>
        <section className="card finance-layout-card habits-summary-card">
          <h2>{'Hábitos de gastos'}</h2>
          <p className="foot">
            {workspace.esc(workspace.M[workspace.S.m])}
            {a.partial ? ' · Mês em andamento' : ''}
            {' · '}
            {a.count}
            {' gastos registrados'}
          </p>
          <strong className="overview-total">
            {workspace.brl(a.totalCents / 100)}
          </strong>
          {a.count ? (
            <p className="foot">
              {
                'Atenção indica concentração de gastos, não uma avaliação do seu comportamento.'
              }
            </p>
          ) : (
            <p className="mut">{'Sem gastos registrados.'}</p>
          )}
        </section>
        <section className="card finance-layout-card category-chart-preserved">
          <h2>{'Por categoria'}</h2>
          {workspace.habitBars(
            a.categories.map((x) => ({
              ...x,
              label: x.name,
              attention: a.totalCents > 0 && x.cents / a.totalCents >= 0.5,
            })),
          )}
        </section>
        <section className="card finance-layout-card">
          <h2>{'Dias da semana'}</h2>
          {workspace.habitBars(
            a.weekdays.map((x) => ({
              ...x,
              label: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][x.day],
              attention: a.totalCents > 0 && x.cents / a.totalCents >= 0.35,
            })),
          )}
        </section>
        <section className="card finance-layout-card">
          <h2>{'Últimos meses'}</h2>
          {workspace.habitBars(a.months.map((x) => ({ ...x, label: x.month })))}
        </section>
        <section className="card finance-layout-card">
          <h2>{'Dicas para você'}</h2>
          <p className="foot">
            {
              'A análise envia ao Gemini totais por categoria, dia e mês, sem descrições ou dados de perfil. Não inclui gastos futuros.'
            }
          </p>
          <button
            className="btn"
            data-behavior-analyze=""
            disabled={!a.count || workspace.behaviorLoading}
          >
            {workspace.behaviorLoading ? 'Analisando…' : 'Analisar'}
          </button>
          <p role="status" id="behaviorStatus">
            {workspace.behaviorError?.key === key
              ? workspace.esc(workspace.behaviorError.message)
              : ''}
          </p>
          {advice ? (
            <>
              <p className="foot">
                {'Análise de '}
                {workspace.esc(new Date(advice.at).toLocaleString('pt-BR'))}
              </p>
              <div className="behavior-advice">
                {workspace.esc(advice.text)}
              </div>
            </>
          ) : (
            ''
          )}
        </section>
      </>
    );
  }

  function summarySwitch() {
    const mode = workspace.S.tab === 'i' ? 'entries' : 'overview';
    return (
      <div className="segments summary-switch" aria-label="Visão do resumo">
        {viewList(
          [
            ['overview', 'Visão geral'],
            ['entries', 'Lançamentos'],
          ].map(([key, label]) => (
            <button data-summary-mode={key} aria-pressed={mode === key}>
              {label}
            </button>
          )),
        )}
      </div>
    );
  }

  function summaryView() {
    return rendersummaryView(workspace.viewContext);
  }
  return {
    behaviorAggregate,
    habitBars,
    behaviorView,
    summarySwitch,
    summaryView,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'behaviorAggregate'
    | 'habitBars'
    | 'behaviorView'
    | 'summarySwitch'
    | 'summaryView'
  >;
}

export function initializeBehavior(workspace: BehaviorContext) {
  // @workspace-step 305 FirstStatement
  workspace.summaryMode = 'overview';
  workspace.behaviorAdvice = null;
  workspace.behaviorLoading = false;
  workspace.behaviorError = null;
  // @workspace-end 305

  // @workspace-step 311 ExpressionStatement
  workspace.scope.listen(document, 'click', async (e) => {
    const tab = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-summary-mode]',
    );
    if (tab) {
      workspace.summaryMode = tab.dataset.summaryMode!;
      workspace.S.tab = workspace.summaryMode === 'entries' ? 'i' : 'r';
      workspace.arrangeCards = false;
      workspace.draw();
      return;
    }
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-behavior-analyze]',
    );
    if (!button || workspace.behaviorLoading) return;
    workspace.behaviorLoading = true;
    workspace.behaviorError = null;
    button.disabled = true;
    const snapshot = workspace.behaviorAggregate(),
      key = JSON.stringify(snapshot);
    try {
      const data = await workspace.shoppingRequest({
        action: 'behavior',
        summary: snapshot,
      });
      workspace.behaviorAdvice = { key, text: data.advice, at: data.checkedAt };
    } catch (err) {
      workspace.behaviorError = {
        key,
        message:
          errorDetails(err).message ||
          'Não foi possível analisar. Tente novamente.',
      };
    } finally {
      workspace.behaviorLoading = false;
      if (button.isConnected) button.disabled = false;
      if (workspace.S.tab === 'r' && workspace.summaryMode !== 'entries')
        workspace.draw();
    }
  });
  // @workspace-end 311
}
