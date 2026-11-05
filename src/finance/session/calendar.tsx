import { viewGroup, viewList } from '../../services/presentation.ts';
import { cardCalendarEvents } from '../../services/credit.ts';
import type { WorkspaceRuntime } from './contracts';

type CalendarContext = Pick<
  WorkspaceRuntime,
  | 'CARDS'
  | 'ICON'
  | 'MAX_MONTHS'
  | 'S'
  | 'brl'
  | 'calendarDayLabel'
  | 'dateLong'
  | 'esc'
  | 'itemsInMonth'
  | 'monthDate'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'pad'
  | 'receiptsInMonth'
  | 'sum'
  | 'toCents'
  | 'totalsByDate'
>;

export function createCalendar(workspace: CalendarContext) {
  function totalsByDate() {
    const map: Record<
      string,
      {
        date: string;
        spent: number;
        income: number;
        count: number;
        expenseCount?: number;
      }
    > = {};
    for (const [list, type] of [
      [workspace.itemsInMonth(workspace.S.m), 'spent'],
      [workspace.receiptsInMonth(workspace.S.m), 'income'],
    ] as const)
      for (const x of list) {
        if (!x.date || workspace.monthIndexFromDate(x.date) !== workspace.S.m)
          continue;
        map[x.date] ??= { date: x.date, spent: 0, income: 0, count: 0 };
        map[x.date][type] += workspace.toCents(x.v);
        map[x.date].count++;
        if (type === 'spent')
          map[x.date].expenseCount = (map[x.date].expenseCount || 0) + 1;
      }
    for (const x of Object.values(map)) {
      x.spent /= 100;
      x.income /= 100;
    }
    return map;
  }

  function calendarDayLabel(iso: string, expense: number, income: number) {
    return `${workspace.dateLong(iso)}. Gastos: ${workspace.brl(expense)}. Entradas: ${workspace.brl(income)}.`;
  }

  function vC() {
    const key = workspace.monthKeyForIndex(workspace.S.m),
      [year, month] = key.split('-').map(Number),
      first = new Date(year, month - 1, 1),
      offset = (first.getDay() + 6) % 7,
      days = new Date(year, month, 0).getDate(),
      details = workspace.totalsByDate();
    if (!workspace.S.calDate || workspace.S.calDate.slice(0, 7) !== key)
      workspace.S.calDate = workspace.monthDate(workspace.S.m);
    const cardEvents = cardCalendarEvents(
        workspace.CARDS,
        workspace.S.items,
        key,
      ),
      selected = workspace.S.calDate,
      dayNums = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    let cells = viewList(
      dayNums.map((d) => <div className="cal-weekday">{d}</div>),
    );
    for (let i = 0; i < offset; i++)
      cells = viewGroup(
        cells,
        <div className="cal-empty" aria-hidden="true"></div>,
      );
    for (let day = 1; day <= days; day++) {
      const iso = `${key}-${workspace.pad(day)}`,
        d = details[iso] || { spent: 0, income: 0, count: 0 },
        isSel = iso === selected,
        hasExpense = d.spent > 0,
        hasIncome = d.income > 0;
      cells = viewGroup(
        cells,
        <button
          className={
            'cal-day' +
            String(isSel ? ' selected' : '') +
            String(hasExpense ? ' has-exp' : '') +
            String(hasIncome ? ' has-inc' : '')
          }
          data-a="calday"
          data-date={iso}
          aria-pressed={isSel}
          aria-label={workspace.esc(
            workspace.calendarDayLabel(iso, d.spent, d.income) +
              (cardEvents
                .filter((x) => x.date === iso)
                .map((x) => x.label)
                .join('. ')
                ? ' ' +
                  cardEvents
                    .filter((x) => x.date === iso)
                    .map((x) => x.label)
                    .join('. ')
                : ''),
          )}
        >
          <span className="cal-number">{day}</span>
          <span className="cal-dots">
            {hasExpense ? (
              <i className="expense-dot" aria-hidden="true"></i>
            ) : (
              ''
            )}
            {hasIncome ? <i className="income-dot" aria-hidden="true"></i> : ''}
            {cardEvents.some((x) => x.date === iso) ? (
              <i className="card-date-dot" aria-hidden="true"></i>
            ) : (
              ''
            )}
          </span>
        </button>,
      );
    }
    const dayExpenses = workspace
        .itemsInMonth(workspace.S.m)
        .filter((x) => x.date === selected),
      dayReceipts = workspace
        .receiptsInMonth(workspace.S.m)
        .filter((x) => x.date === selected),
      spentDay = workspace.sum(dayExpenses),
      incomeDay = workspace.sum(dayReceipts);
    const selectedCardEvents = cardEvents.filter((x) => x.date === selected),
      eventRows = viewList(
        selectedCardEvents.map((x) => (
          <div className="calendar-event-row">
            <span>
              <strong>{workspace.esc(x.label)}</strong>
              <small>
                {x.kind === 'best'
                  ? 'Estimativa pelo fechamento informado'
                  : x.kind === 'payment'
                    ? 'Pagamento confirmado manualmente'
                    : x.kind === 'due'
                      ? 'Saldo registrado, sem duplicar gastos'
                      : 'Data informada no cartão'}
              </small>
            </span>
            {x.amountCents != null ? (
              <b>{workspace.brl(x.amountCents / 100)}</b>
            ) : (
              ''
            )}
          </div>
        )),
      );
    const activities: {
      type: string;
      label: string;
      v: number;
      c?: string;
      p?: string;
    }[] = [
      ...dayExpenses.map((x) => ({
        type: 'Gasto',
        label: x.d,
        v: x.v,
        c: x.c,
        p: x.p,
      })),
      ...dayReceipts.map((x) => ({ type: 'Entrada', label: x.d, v: x.v })),
    ];
    const activityRows = viewList(
      activities.map((x) => (
        <div className="item">
          <span style={{ minWidth: '0' }}>
            <span style={{ display: 'block' }}>{workspace.esc(x.label)}</span>
            <span className="foot">
              {x.type}
              {x.c ? ' · ' + workspace.esc(x.c) : ''}
              {x.p ? ' · ' + workspace.esc(x.p) : ''}
            </span>
          </span>
          <b className={x.type === 'Entrada' ? 'ok' : 'bad'}>
            {x.type === 'Entrada' ? '+' : '−'} {workspace.brl(x.v)}
          </b>
        </div>
      )),
    ) || (
      <p className="mut" style={{ margin: '0' }}>
        {'Nenhum lançamento nesta data.'}
      </p>
    );
    const ranking = Object.values(details)
      .filter((x) => x.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
    const rankRows = viewList(
      ranking.map((x, i) => (
        <button className="lrow" data-a="calday" data-date={x.date}>
          <span>
            <span style={{ display: 'block' }}>
              {i + 1}
              {'. '}
              {workspace.dateLong(x.date)}
            </span>
            <span className="foot">
              {x.expenseCount || 0}
              {' gasto(s) registrado(s)'}
            </span>
          </span>
          <b className="bad">{workspace.brl(x.spent)}</b>
          {workspace.ICON.chev}
        </button>
      )),
    ) || (
      <p className="mut" style={{ margin: '0' }}>
        {'Sem registros.'}
      </p>
    );
    return (
      <>
        <section className="card calendar-card">
          <div className="row" style={{ marginBottom: '16px' }}>
            <div>
              <div className="mut">{'Calendário de movimentações'}</div>
              <h2 style={{ margin: '4px 0 0' }}>
                {workspace
                  .dateLong(workspace.monthDate(workspace.S.m))
                  .replace('1 de ', '')
                  .replace(' de ', ' de ')}
              </h2>
            </div>
            <div className="cal-nav">
              <button
                className="ib"
                data-a="prevmonth"
                aria-label="Mês anterior"
                disabled={workspace.S.m === 0}
              >
                {workspace.ICON.left}
              </button>
              <button
                className="ib"
                data-a="nextmonth"
                aria-label="Próximo mês"
                disabled={workspace.S.m === workspace.MAX_MONTHS - 1}
              >
                {workspace.ICON.right}
              </button>
            </div>
          </div>
          <div className="cal-grid">{cells}</div>
          <div className="cal-legend">
            <span>
              <i className="expense-dot"></i>
              {' Dia com gasto'}
            </span>
            <span>
              <i className="income-dot"></i>
              {' Dia com entrada'}
            </span>
            <span>
              <i className="card-date-dot"></i>
              {' Cartão'}
            </span>
          </div>
          <p className="foot" style={{ margin: '12px 0 0' }}></p>
        </section>
        <section className="card">
          <div className="mut">{'Dia selecionado'}</div>
          <h2 style={{ marginTop: '4px' }}>{workspace.dateLong(selected)}</h2>
          <div className="kpis cal-kpis">
            <div className="kpi">
              <div className="foot">{'Total gasto'}</div>
              <div className="kv bad">{workspace.brl(spentDay)}</div>
            </div>
            <div className="kpi">
              <div className="foot">{'Total de entradas'}</div>
              <div className="kv ok">{workspace.brl(incomeDay)}</div>
            </div>
          </div>
          <div className="row" style={{ marginBottom: '8px' }}>
            <h2>{'Lançamentos do dia'}</h2>
            <div className="row" style={{ gap: '4px' }}>
              <button
                type="button"
                className="ib"
                data-a="sheet"
                data-k="launch"
                data-date={selected}
                aria-label="Adicionar lançamento nesta data"
              >
                {workspace.ICON.plus}
              </button>
            </div>
          </div>
          {eventRows}
          {activities.length || !selectedCardEvents.length ? activityRows : ''}
        </section>
        {ranking.length ? (
          <section className="card">
            <h2>{'Dias de maior gasto'}</h2>
            {rankRows}
          </section>
        ) : (
          ''
        )}
      </>
    );
  }
  return { totalsByDate, calendarDayLabel, vC } satisfies Pick<
    WorkspaceRuntime,
    'totalsByDate' | 'calendarDayLabel' | 'vC'
  >;
}
