import { viewList } from '../../services/presentation.ts';
import type { Expense, Debt } from '../../types/workspace';
import {
  core_debtInstallments,
  core_debtPaidCount,
  core_debtRemainingCents,
} from '../calculations.ts';
import { vR as rendervR, vI as rendervI } from '../views/summary.tsx';
import { vD as rendervD } from '../views/commitments.tsx';
import type { WorkspaceRuntime } from './contracts';

type ChartsContext = Pick<
  WorkspaceRuntime,
  | 'CATS'
  | 'CLOSED_REPORTS'
  | 'DEBTS'
  | 'GOAL'
  | 'ICON'
  | 'M'
  | 'MAX_MONTHS'
  | 'S'
  | 'brl'
  | 'categoryExpenseDetails'
  | 'categoryLabel'
  | 'categoryPercent'
  | 'chartMetric'
  | 'csvConvention'
  | 'csvPreview'
  | 'csvPreviewView'
  | 'dateLabel'
  | 'dateLong'
  | 'debt'
  | 'debtInstallments'
  | 'debtPaidCount'
  | 'debtRemainingCents'
  | 'debtSchedule'
  | 'engineContext'
  | 'esc'
  | 'goalInvestedCents'
  | 'goalMonthProjectionCents'
  | 'goalProjection'
  | 'inc'
  | 'investmentGoalView'
  | 'isMonthClosed'
  | 'itemMonthIndex'
  | 'itemsInMonth'
  | 'lim'
  | 'mf'
  | 'monthKeyForIndex'
  | 'monthLabelFromKey'
  | 'pad'
  | 'receiptsInMonth'
  | 'spent'
  | 'sum'
  | 'toCents'
  | 'viewContext'
>;

export function createCharts(workspace: ChartsContext) {
  function tiles(m: number, it: Expense[]) {
    return viewList(
      workspace.CATS.map((c) => {
        const records = it.filter((i) => i.c === c),
          value = workspace.sum(records),
          limit = workspace.lim(m, c),
          valueCents = Math.round(value * 100),
          limitCents = Math.round(limit * 100),
          pct = limitCents ? (valueCents * 100) / limitCents : 0,
          reached = limitCents > 0 && valueCents >= limitCents,
          percent = (Math.floor(pct * 10 + 1e-9) / 10).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
          }),
          status = limit
            ? reached
              ? value > limit
                ? 'Acima'
                : 'No limite'
              : percent + '% usado'
            : 'Sem limite';
        if (c === 'Investimentos') return '';
        return (
          <div className="category-gauge-card">
            <div
              className="category-line"
              aria-label={
                String(workspace.esc(c)) + ': ' + String(workspace.brl(value))
              }
            >
              <span className="category-name">
                {workspace.categoryLabel(c)}
              </span>
              <span className="category-value">
                {workspace.brl(value)}
                {limit ? (
                  <small>
                    {' / '}
                    {workspace.brl(limit)}
                  </small>
                ) : (
                  ''
                )}
              </span>
            </div>
            <div
              data-progress-gauge=""
              data-value={pct}
              data-label={workspace.esc(c)}
              data-status={limit ? (reached ? status : 'Usado') : 'Sem limite'}
              data-indicator-key={'category:' + String(workspace.esc(c))}
              data-known={!!limit}
              data-attention={reached}
              data-limit={reached}
            >
              <span
                className={
                  'category-track' + String(reached ? ' is-limit' : '')
                }
                aria-hidden="true"
              >
                <i
                  style={{
                    width: String(Math.max(0, Math.min(100, pct))) + '%',
                  }}
                ></i>
                <span className="category-status">{status}</span>
              </span>
            </div>
            {workspace.categoryExpenseDetails(records)}
          </div>
        );
      }),
    );
  }

  function investmentCategoryTile(
    m: number,
    records: Expense[],
    value: number,
    limit: number,
  ) {
    return (
      <section
        className="card category-gauge-card investment-goal-card"
        aria-label="Investimentos e metas"
      >
        <div
          className="category-line"
          aria-label={'Investimentos no mês: ' + String(workspace.brl(value))}
        >
          <span className="category-name">{'Investimentos'}</span>
          <span
            className={
              'category-value' + String(limit && value >= limit ? ' bad' : '')
            }
          >
            {'No mês · '}
            {workspace.brl(value)}
            {limit ? (
              <small>
                {' / limite '}
                {workspace.brl(limit)}
              </small>
            ) : (
              ''
            )}
          </span>
        </div>
        {workspace.investmentGoalView(m)}
        {workspace.categoryExpenseDetails(records)}
      </section>
    );
  }

  function investmentGoalView(m: number) {
    const invested = workspace.goalInvestedCents(m),
      target = workspace.toCents(workspace.GOAL.v),
      pct = target ? (invested / target) * 100 : 0;
    return (
      <>
        <div
          data-progress-gauge=""
          data-value={pct}
          data-label="Meta de investimentos"
          data-status={
            !target ? 'Sem meta' : pct >= 100 ? 'Meta atingida' : 'Da meta'
          }
          data-known={!!target}
        >
          <span className="habit-track">
            <i style={{ width: String(Math.min(100, pct)) + '%' }}></i>
          </span>
        </div>
        <div className="investment-goal-summary">
          <div>
            <span>{'Investido até o mês'}</span>
            <strong>{workspace.brl(invested / 100)}</strong>
          </div>
          {target ? (
            <p className="foot">
              {'Meta '}
              {workspace.brl(workspace.GOAL.v)}
              {' · '}
              {workspace.GOAL.date
                ? workspace.dateLabel(workspace.GOAL.date)
                : workspace.M[workspace.GOAL.e]}
            </p>
          ) : (
            <p className="foot">
              {'Defina uma meta para acompanhar os aportes.'}
            </p>
          )}
          <button
            type="button"
            className="btn g"
            data-a="goal"
            data-show-goal="true"
          >
            {workspace.isMonthClosed(m)
              ? 'Ver meta'
              : workspace.S.goal
                ? 'Ver meta'
                : workspace.GOAL.v > 0
                  ? 'Editar meta'
                  : 'Definir meta'}
          </button>
        </div>
      </>
    );
  }

  function categoryExpenseDetails(records: Expense[]) {
    if (!records.length) return '';
    const row = (x: { d: unknown; v: unknown }) => (
      <li>
        <span className="category-expense-name" title={workspace.esc(x.d)}>
          {workspace.esc(
            String(x.d || 'Gasto')
              .trim()
              .replace(/\s+/g, ' '),
          )}
        </span>
        <b>{workspace.brl(x.v)}</b>
      </li>
    );
    return (
      <>
        <ul className="category-expenses" aria-label="Gastos da categoria">
          {viewList(records.slice(0, 2).map(row))}
        </ul>
        {records.length > 2 ? (
          <details className="category-expenses-more">
            <summary>
              {'Mais '}
              {records.length - 2}
            </summary>
            <ul className="category-expenses">
              {viewList(records.slice(2).map(row))}
            </ul>
          </details>
        ) : (
          ''
        )}
      </>
    );
  }

  function donut(it: Expense[]) {
    const T = workspace.sum(it);
    if (!T)
      return (
        <p className="mut" style={{ margin: '0' }}>
          {'Sem gastos neste mês.'}
        </p>
      );
    const rows = workspace.CATS.map((c, i) => ({
        c,
        i,
        g: workspace.sum(it.filter((x) => x.c === c)),
      })).filter((r) => r.g > 0),
      R = 52,
      C = 2 * Math.PI * R;
    let off = 0;
    const seg = viewList(
      rows.map((r) => {
        const len = (r.g / T) * C,
          e = (
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              strokeWidth="22"
              strokeDasharray={
                String(Math.max(0, len - 2).toFixed(2)) +
                ' ' +
                String(C.toFixed(2))
              }
              strokeDashoffset={(-off).toFixed(2)}
              transform="rotate(-90 70 70)"
              style={{ stroke: 'var(--c' + String(r.i) + ')' }}
            ></circle>
          );
        off += len;
        return e;
      }),
    );
    return (
      <div className="dn">
        <svg
          viewBox="0 0 140 140"
          role="img"
          aria-label={
            'Distribuição dos gastos de ' +
            String(workspace.M[workspace.S.m]) +
            ' por categoria'
          }
        >
          {seg}
          <text
            x="70"
            y="66"
            textAnchor="middle"
            fontSize="11"
            style={{ fill: 'var(--lb2)' }}
          >
            {'Total'}
          </text>
          <text
            x="70"
            y="86"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            style={{ fill: 'var(--lb)' }}
          >
            {Math.abs(T) >= 10000 ? workspace.mf(T) : workspace.brl(T)}
          </text>
        </svg>
        <div className="dl">
          {viewList(
            rows.map((r) => (
              <div className="item">
                <span
                  className="dot"
                  style={{ background: 'var(--c' + String(r.i) + ')' }}
                ></span>
                <span>{r.c}</span>
                <b>{workspace.categoryPercent(r.g, T)}</b>
              </div>
            )),
          )}
        </div>
      </div>
    );
  }

  function topList(it: Expense[]) {
    const r = [...it].sort((a, b) => b.v - a.v).slice(0, 5);
    if (!r.length)
      return (
        <p className="mut" style={{ margin: '0' }}>
          {'Sem gastos neste mês.'}
        </p>
      );
    return viewList(
      r.map((x, i) => (
        <div className="tp">
          <div className="row">
            <span className="rk">{i + 1}</span>
            <span style={{ flex: '1', minWidth: '0' }}>
              {workspace.esc(x.d)}
              <span className="foot" style={{ display: 'block' }}>
                {workspace.esc(x.c)}
                {x.date ? ' · ' + workspace.dateLabel(x.date) : ''}
              </span>
            </span>
            <b>{workspace.brl(x.v)}</b>
          </div>
          <div className="hb">
            <i
              style={{
                width: String((x.v / r[0].v) * 100) + '%',
                opacity: 1 - i * 0.14,
              }}
            ></i>
          </div>
        </div>
      )),
    );
  }

  function vR() {
    return rendervR(workspace.viewContext);
  }

  function vI() {
    return rendervI(workspace.viewContext);
  }

  function debtInstallments(d: Debt) {
    return core_debtInstallments(workspace.engineContext, d);
  }

  function debtPaidCount(d: Debt) {
    return core_debtPaidCount(workspace.engineContext, d);
  }

  function debtRemainingCents(d: Debt) {
    return core_debtRemainingCents(workspace.engineContext, d);
  }

  function debtSchedule(start: number) {
    const open = workspace.DEBTS.filter(
        (d) => workspace.debtRemainingCents(d) > 0,
      ),
      payments = new Map();
    let last = start;
    open.forEach((d) =>
      workspace.debtInstallments(d).forEach((value, j) => {
        if (j < workspace.debtPaidCount(d)) return;
        const month = Math.max(start, d.s + j);
        payments.set(month, (payments.get(month) || 0) + value);
        last = Math.max(last, month);
      }),
    );
    let balance = open.reduce(
      (total, d) => total + workspace.debtRemainingCents(d),
      0,
    );
    const rows = [{ m: start, v: balance }];
    if (!open.length) return rows;
    for (let month = start; month <= last; month++) {
      balance = Math.max(0, balance - (payments.get(month) || 0));
      rows.push({ m: month + 1, v: balance });
    }
    return rows;
  }

  function debtChart() {
    const rows = workspace.debtSchedule(workspace.S.m),
      max = Math.max(1, ...rows.map((x) => x.v)),
      W = 640,
      H = 214,
      L = 46,
      R = 20,
      T = 20,
      B = 32,
      X = (i: number) =>
        L + (W - L - R) * (rows.length === 1 ? 0.5 : i / (rows.length - 1)),
      Y = (v: number) => T + (H - T - B) * (1 - v / max),
      path = rows
        .map(
          (x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x.v).toFixed(1),
        )
        .join(' ');
    return (
      <svg
        className="debt-chart reference-chart reference-line"
        viewBox={'0 0 ' + String(W) + ' ' + String(H)}
        role="img"
        aria-label={
          'Projeção das dívidas em aberto: de ' +
          String(workspace.brl(rows[0].v / 100)) +
          ' até ' +
          String(workspace.brl(rows.at(-1)!.v / 100)) +
          '.'
        }
      >
        <defs><linearGradient id="debt-reference-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-accent)" stopOpacity=".24"/><stop offset="100%" stopColor="var(--chart-accent)" stopOpacity="0"/></linearGradient></defs>
        <path className="reference-area" d={path + ' L ' + X(rows.length - 1).toFixed(1) + ' ' + Y(0).toFixed(1) + ' L ' + X(0).toFixed(1) + ' ' + Y(0).toFixed(1) + ' Z'} fill="url(#debt-reference-fill)"/>
        {viewList(
          [0, 0.5, 1].map((f) => (
            <>
              <line
                x1={L}
                x2={W - R}
                y1={Y(max * f)}
                y2={Y(max * f)}
                stroke="var(--sep)"
                strokeWidth=".5"
              ></line>
              <text
                x={L - 6}
                y={Y(max * f) + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--lb2)"
              >
                {workspace.mf((max * f) / 100)}
              </text>
            </>
          )),
        )}
        <path
          d={path}
          fill="none"
          stroke="var(--chart-accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        ></path>
        {viewList(
          rows.map((x, i) => (
            <>
              <circle
                cx={X(i)}
                cy={Y(x.v)}
                r={i === 0 || i === rows.length - 1 ? 4 : 2}
                fill="var(--chart-accent)"
              ></circle>
              {i % Math.max(1, Math.ceil(rows.length / 7)) === 0 ||
              i === rows.length - 1 ? (
                <text
                  x={X(i)}
                  y={H - 7}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--lb2)"
                >
                  {i === 0
                    ? 'Atual'
                    : workspace.monthLabelFromKey(
                        workspace.monthKeyForIndex(x.m - 1),
                      )}
                </text>
              ) : (
                ''
              )}
            </>
          )),
        )}
      </svg>
    );
  }

  function vD() {
    return rendervD(workspace.viewContext);
  }

  function financeToolsView() {
    return (
      <section className="card">
        <h2>{'Importar CSV'}</h2>
        <p className="mut">
          {
            'Colunas: data, descrição, valor e tipo (opcional). Revise antes de importar.'
          }
        </p>
        <label htmlFor="csvConvention">
          {'Como interpretar os valores, se não houver coluna tipo?'}
        </label>
        <select id="csvConvention">
          {viewList(
            [
              ['', 'Escolha uma opção'],
              ['signed', 'Positivos são entradas; negativos são gastos'],
              ['expense', 'Todos os valores são gastos'],
              ['income', 'Todos os valores são entradas'],
            ].map(([v, l]) => (
              <option value={v} selected={workspace.csvConvention === v}>
                {l}
              </option>
            )),
          )}
        </select>
        <label htmlFor="csv">{'Arquivo CSV (até 500 KB)'}</label>
        <input
          type="file"
          id="csv"
          accept=".csv,text/csv"
          data-file-name={workspace.esc(workspace.csvPreview?.sourceName || '')}
        />
        <p className="foot" id="csvm" role="status"></p>
        {workspace.csvPreviewView()}
      </section>
    );
  }

  function monthComparison(metric: string, m: number) {
    if (m === 0)
      return <p className="comparison neutral">{'Sem mês anterior.'}</p>;
    const value = (k: number) =>
        metric === 'meta'
          ? workspace.goalProjection(k)
          : metric === 'i'
            ? workspace.inc(k)
            : workspace.spent(k),
      now = workspace.toCents(value(m)),
      prev = workspace.toCents(value(m - 1)),
      delta = now - prev;
    if (!delta)
      return <p className="comparison neutral">{'Sem variação mensal.'}</p>;
    const positive = metric === 'g' ? delta < 0 : delta > 0,
      sign = delta > 0 ? '+' : '−',
      pct =
        prev !== 0
          ? Math.abs((delta / prev) * 100).toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            }) + '%'
          : workspace.brl(Math.abs(delta) / 100);
    return (
      <p className={'comparison ' + String(positive ? 'ok' : 'bad')}>
        {delta > 0 ? '↑' : '↓'} {sign}
        {pct} <span>{'vs. mês anterior'}</span>
      </p>
    );
  }

  function goalChart() {
    const count = Math.max(
        1,
        workspace.M.length,
        workspace.GOAL.v > 0 ? workspace.GOAL.e + 1 : 1,
      ),
      values = (() => {
        let cents = 0;
        return Array.from(
          { length: count },
          (_, k) =>
            (cents +=
              workspace.GOAL.date && k > workspace.GOAL.e
                ? 0
                : workspace.goalMonthProjectionCents(
                    k,
                    '',
                    0,
                    workspace.GOAL.date && k === workspace.GOAL.e
                      ? workspace.GOAL.date
                      : '',
                  )) / 100,
        );
      })(),
      lo = Math.min(0, ...values),
      hi = Math.max(1, workspace.GOAL.v, ...values),
      W = 640,
      H = 212,
      L = 48,
      R = 20,
      T = 25,
      B = 30,
      X = (k: number) =>
        L + (W - L - R) * (count === 1 ? 0.5 : k / (count - 1)),
      Y = (v: number) => T + ((H - T - B) * (hi - v)) / (hi - lo),
      line = values
        .map(
          (v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1),
        )
        .join(' '),
      labels = viewList(
        values.map((_, k) =>
          k % Math.max(1, Math.ceil(count / 8)) ? (
            ''
          ) : (
            <text
              x={X(k)}
              y={H - 5}
              textAnchor="middle"
              fontSize="10"
              fill="var(--lb2)"
            >
              {workspace.esc(
                workspace.M[k] ||
                  workspace.monthLabelFromKey(workspace.monthKeyForIndex(k)),
              )}
            </text>
          ),
        ),
      );
    return (
      <>
        <svg
          className="daily-chart goal-chart"
          viewBox={'0 0 ' + String(W) + ' ' + String(H)}
          role="img"
          aria-label={
            'Projeção acumulada de ' +
            String(workspace.brl(values[0])) +
            ' a ' +
            String(workspace.brl(values[count - 1])) +
            '. ' +
            String(
              workspace.GOAL.v > 0
                ? 'Meta de ' + workspace.brl(workspace.GOAL.v)
                : 'Sem meta definida.',
            )
          }
        >
          {viewList(
            [lo, (hi + lo) / 2, hi].map((v) => (
              <>
                <line
                  x1={L}
                  x2={W - R}
                  y1={Y(v)}
                  y2={Y(v)}
                  stroke="var(--sep)"
                  strokeWidth=".5"
                ></line>
                <text
                  x={L - 6}
                  y={Y(v) + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--lb2)"
                >
                  {workspace.mf(v)}
                </text>
              </>
            )),
          )}
          {workspace.GOAL.v > 0 ? (
            <>
              <line
                x1={L}
                x2={W - R}
                y1={Y(workspace.GOAL.v)}
                y2={Y(workspace.GOAL.v)}
                stroke="var(--greenT)"
                strokeDasharray="5 5"
              ></line>
              <text
                x={W - R}
                y={Y(workspace.GOAL.v) - 8}
                textAnchor="end"
                fontSize="10"
                fill="var(--greenT)"
              >
                {'Meta · '}
                {workspace.brl(workspace.GOAL.v)}
              </text>
            </>
          ) : (
            ''
          )}
          <path
            d={line}
            fill="none"
            stroke="var(--tint)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          ></path>
          {viewList(
            values.map((v, k) => (
              <circle
                cx={X(k)}
                cy={Y(v)}
                r={k === workspace.S.m ? 4 : 2}
                fill="var(--tint)"
              ></circle>
            )),
          )}
          {labels}
        </svg>
        <div className="chart-legend goal-legend">
          <span>{'Projeção acumulada'}</span>
          {workspace.GOAL.v > 0 ? <span>{'Meta definida'}</span> : ''}
        </div>
      </>
    );
  }

  function periodChart() {
    const start = Math.max(
        0,
        Math.min(workspace.MAX_MONTHS - 12, workspace.S.m - 5),
      ),
      totals = new Map();
    for (const record of workspace.S.receipts) {
      const key = workspace.itemMonthIndex(record);
      totals.set(key, (totals.get(key) || 0) + workspace.toCents(record.v));
    }
    const months = Array.from({ length: 12 }, (_, i) => start + i),
      values = months.map((k) =>
        workspace.isMonthClosed(k) &&
        workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(k)]
          ? workspace.sum(
              workspace.CLOSED_REPORTS[workspace.monthKeyForIndex(k)].receipts,
            )
          : (totals.get(k) || 0) / 100,
      ),
      max = Math.max(1, ...values);
    return (
      <div
        className="period-chart reference-period"
        role="group"
        aria-label="Entradas por período"
      >
        {viewList(
          months.map((k, i) => (
            <div
              className={
                'period-column ' + String(k === workspace.S.m ? 'selected' : '')
              }
              aria-label={
                String(
                  workspace.monthLabelFromKey(workspace.monthKeyForIndex(k)),
                ) +
                ': ' +
                String(workspace.brl(values[i]))
              }
            >
              <span className="period-value">{workspace.brl(values[i])}</span>
              <span className="period-track">
                <i
                  style={{
                    height: String(Math.max(0, (values[i] / max) * 100)) + '%',
                  }}
                ></i>
              </span>
              <span className="period-label">
                {workspace.monthLabelFromKey(workspace.monthKeyForIndex(k))}
              </span>
            </div>
          )),
        )}
      </div>
    );
  }

  function dailyBars() {
    const m = workspace.S.m,
      key = workspace.monthKeyForIndex(m),
      [year, month] = key.split('-').map(Number),
      days = Math.max(
        new Date(year, month, 0).getDate(),
        new Date(year, month - 1, 0).getDate(),
      );
    const records =
      workspace.chartMetric === 'i'
        ? workspace.receiptsInMonth
        : workspace.itemsInMonth;
    const source = [...records(m), ...(m > 0 ? records(m - 1) : [])];
    const totals = new Map();
    for (const x of source) {
      const date = x.date;
      if (date)
        totals.set(date, (totals.get(date) || 0) + workspace.toCents(x.v));
    }
    const series = (idx: number) => {
      const k = workspace.monthKeyForIndex(idx);
      return Array.from(
        { length: days },
        (_, i) => (totals.get(`${k}-${workspace.pad(i + 1)}`) || 0) / 100,
      );
    };
    const current = series(m),
      previous = m > 0 ? series(m - 1) : Array(days).fill(0),
      max = Math.max(1, ...current, ...previous),
      w = 640,
      h = 212,
      baseline = 182,
      step = 620 / days,
      bw = Math.min(6, step * 0.31);
    const bars = viewList(
      current.map((v, i) => {
        const x = 10 + i * step,
          hh = v ? Math.max(3, (v / max) * 144) : 0,
          ph = previous[i] ? Math.max(3, (previous[i] / max) * 144) : 0;
        return (
          <>
            <rect
              x={x}
              y={baseline - ph}
              width={bw}
              height={ph}
              rx="3"
              fill="var(--chart-previous)"
            ></rect>
            <rect
              x={x + bw + 2}
              y={baseline - hh}
              width={bw}
              height={hh}
              rx="3"
              fill="var(--chart-accent)"
            ></rect>
            {i % Math.ceil(days / 12) === 0 ? (
              <text
                x={x + bw}
                y="204"
                textAnchor="middle"
                fontSize="10"
                fill="var(--lb2)"
              >
                {i + 1}
              </text>
            ) : (
              ''
            )}
          </>
        );
      }),
    );
    return (
      <svg
        className="daily-chart reference-chart reference-bars"
        viewBox={'0 0 ' + String(w) + ' ' + String(h)}
        role="img"
        aria-label={
          String(workspace.chartMetric === 'i' ? 'Entradas' : 'Gastos') +
          ' por dia de ' +
          String(workspace.M[m]) +
          ', em comparação com o mês anterior.'
        }
      >
        {viewList(
          [38, 86, 134, 182].map((y) => (
            <line
              x1="8"
              x2="632"
              y1={y}
              y2={y}
              stroke="var(--sep)"
              strokeWidth=".5"
            ></line>
          )),
        )}
        {bars}
      </svg>
    );
  }

  function contextActivity() {
    const rows = [
      ...workspace.itemsInMonth(workspace.S.m).map((x) => ({ ...x, k: 'g' })),
      ...workspace
        .receiptsInMonth(workspace.S.m)
        .map((x) => ({ ...x, k: 'i' })),
    ]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5);
    const balance =
      (workspace.toCents(workspace.inc(workspace.S.m)) -
        workspace.toCents(workspace.spent(workspace.S.m)) -
        workspace.toCents(workspace.debt(workspace.S.m))) /
      100;
    return (
      <>
        <div className="context-heading">
          {'Atividade recente '}
          <span className="tag">{rows.length}</span>
        </div>
        {rows.length ? (
          viewList(
            rows.map((x) => (
              <button
                className="context-item"
                data-a="sheet"
                data-k={x.k}
                data-id={x.id}
              >
                <span className="context-icon">{workspace.ICON[x.k]}</span>
                <span>
                  <span className="context-name">{workspace.esc(x.d)}</span>
                  <small>
                    {x.date ? workspace.dateLabel(x.date) : 'Sem data'}
                  </small>
                </span>
                <b className={x.k === 'i' ? 'ok' : ''}>
                  {x.k === 'i' ? '+' : '−'} {workspace.brl(x.v)}
                </b>
              </button>
            )),
          )
        ) : (
          <div className="context-empty">
            <span className="context-icon">{workspace.ICON.g}</span>
            <p>
              <strong>{'Tudo começa com um registro.'}</strong>
              <br />
              {'Seus gastos e entradas mais recentes aparecerão aqui.'}
            </p>
            <button className="context-add" data-a="sheet" data-k="g">
              {'Novo gasto'}
            </button>
          </div>
        )}
        <h2>{'Seu mês em foco'}</h2>
        <div className="timeline">
          <div className="timeline-item">
            <small>{'Saldo disponível'}</small>
            <p>
              <strong className={balance < 0 ? 'bad' : ''}>
                {workspace.brl(balance)}
              </strong>
              <br />
              {'Entradas menos gastos e dívidas.'}
            </p>
          </div>
          <div className="timeline-item">
            <small>{'Compromissos do mês'}</small>
            <p>
              {workspace.brl(workspace.debt(workspace.S.m))}
              {' em parcelas de dívidas.'}
            </p>
          </div>
          <div className="timeline-item">
            <small>{'Planejamento'}</small>
            <p>
              {workspace.GOAL.v > 0
                ? 'Meta de ' +
                  workspace.brl(workspace.GOAL.v) +
                  ' até ' +
                  (workspace.GOAL.date
                    ? workspace.dateLong(workspace.GOAL.date)
                    : workspace.M[workspace.GOAL.e]) +
                  '.'
                : 'Defina limites por categoria para acompanhar seu orçamento.'}
            </p>
          </div>
        </div>
      </>
    );
  }

  return {
    tiles,
    investmentCategoryTile,
    investmentGoalView,
    categoryExpenseDetails,
    donut,
    topList,
    vR,
    vI,
    debtInstallments,
    debtPaidCount,
    debtRemainingCents,
    debtSchedule,
    debtChart,
    vD,
    financeToolsView,
    monthComparison,
    goalChart,
    periodChart,
    dailyBars,
    contextActivity,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'tiles'
    | 'investmentCategoryTile'
    | 'investmentGoalView'
    | 'categoryExpenseDetails'
    | 'donut'
    | 'topList'
    | 'vR'
    | 'vI'
    | 'debtInstallments'
    | 'debtPaidCount'
    | 'debtRemainingCents'
    | 'debtSchedule'
    | 'debtChart'
    | 'vD'
    | 'financeToolsView'
    | 'monthComparison'
    | 'goalChart'
    | 'periodChart'
    | 'dailyBars'
    | 'contextActivity'
    >;
}

export function initializeCharts(workspace: ChartsContext) {
  // @workspace-step 131 FirstStatement
  workspace.categoryLabel = (c: string) => c;
  // @workspace-end 131
  // @workspace-step 132 FirstStatement
  workspace.categoryPercent = (value: number, total: number) =>
    value > 0 && (value / total) * 100 < 1
      ? 'Menos de 1%'
      : value < total && (value / total) * 100 > 99
        ? 'Mais de 99%'
        : Math.round((value / total) * 100) + '%';
  // @workspace-end 132
  // @workspace-step 133 FirstStatement
  workspace.mf = (v: number) =>
    v.toLocaleString('pt-BR', {
      notation: Math.abs(v) >= 1000 ? 'compact' : 'standard',
      maximumFractionDigits: 1,
    });
  // @workspace-end 133
}
