import { viewList } from '../../services/presentation.ts';
import type { LedgerRecord, ShoppingPlan } from '../../types/workspace';
import { cardBalances } from '../../services/credit.ts';
import type { WorkspaceRuntime } from './contracts';

type EntryFieldsContext = Pick<
  WorkspaceRuntime,
  'CARDS' | 'MAX_MONTHS' | 'S' | 'brl' | 'esc' | 'monthIndexFromDate'
>;

export function createEntryFields(workspace: EntryFieldsContext) {
  function creditCardOptions(selected = '') {
    return (
      <>
        <option value="">{'Selecione um cartão'}</option>
        {viewList(
          workspace.CARDS.filter((c) => c.active || c.id === selected).map(
            (c) => (
              <option value={workspace.esc(c.id)} selected={c.id === selected}>
                {workspace.esc(c.name)}
                {' · Limite '}
                {workspace.brl(c.limitCents / 100)}
                {c.active ? '' : ' · Arquivado'}
              </option>
            ),
          ),
        )}
      </>
    );
  }

  function creditPlanGuide(
    plan: Pick<ShoppingPlan, 'priceCents' | 'shippingCents'>,
  ) {
    if (!workspace.CARDS.some((c) => c.active)) return '';
    const total = plan.priceCents + plan.shippingCents;
    return (
      <div className="credit-plan-guide">
        <h3>{'Limite para esta compra'}</h3>
        {viewList(
          cardBalances(workspace.CARDS, workspace.S.items)
            .filter((c) => c.active)
            .map(
              (c: {
                name: unknown;
                availableCents: number;
                excessCents: number;
              }) => (
                <div className="report-line">
                  <span>
                    {workspace.esc(c.name)}
                    <small>
                      {'Disponível: '}
                      {workspace.brl(c.availableCents / 100)}
                    </small>
                  </span>
                  <b className={c.availableCents >= total ? 'ok' : 'bad'}>
                    {c.availableCents >= total
                      ? 'Cabe no limite'
                      : 'Faltam ' +
                        workspace.brl(
                          (total - c.availableCents + c.excessCents) / 100,
                        )}
                  </b>
                </div>
              ),
            ),
        )}
        <p className="foot">
          {
            'Produto e frete comprometem o limite total, mesmo com parcelas ou divisão. O limite só é reservado após confirmar.'
          }
        </p>
      </div>
    );
  }

  function recurrenceFields(
    item: Partial<LedgerRecord>,
    date: string,
    repeatDefault = false,
  ) {
    if (item.recurrenceId)
      return (
        <p className="foot full">
          {item.recurrenceStopped
            ? 'Repetição mensal com próximas cobranças canceladas.'
            : `Repetição mensal · ${item.recurrenceIndex! + 1} de ${item.recurrenceCount} meses.`}
          {' Alterações aqui afetam somente este lançamento.'}
        </p>
      );
    const max = workspace.MAX_MONTHS - workspace.monthIndexFromDate(date);
    if (max < 2)
      return (
        <p className="foot full">
          {'Este é o último mês disponível para lançamentos.'}
        </p>
      );
    return (
      <>
        <label className="chk full">
          <input
            id="sr"
            type="checkbox"
            aria-controls="repeatMonths"
            checked={repeatDefault}
          />
          {'Repetir mensalmente'}
        </label>
        <div id="repeatMonths" className="full" hidden={!repeatDefault}>
          <label htmlFor="sn">{'Meses (inclui este)'}</label>
          <input
            id="sn"
            type="number"
            min="2"
            max={max}
            step="1"
            value={Math.min(12, max)}
          />
          <p className="foot">
            {
              'O valor será registrado uma vez por mês. Em meses mais curtos, usamos o último dia disponível.'
            }
          </p>
        </div>
      </>
    );
  }
  return {
    creditCardOptions,
    creditPlanGuide,
    recurrenceFields,
  } satisfies Pick<
    WorkspaceRuntime,
    'creditCardOptions' | 'creditPlanGuide' | 'recurrenceFields'
  >;
}
