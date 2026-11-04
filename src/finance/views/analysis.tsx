import { viewList } from '../../services/presentation.ts';
import type { WorkspaceViewContext } from '../../types/views';
import { isSafeInteger } from '../../services/type-guards.ts';
// Presentation only: controller dependencies are injected at each render.
export function vCarbon(context: WorkspaceViewContext) {
  const { M, S, carbonRecords, dateLabel, esc, itemsInMonth } = context;
  const records = carbonRecords(),
    rows = itemsInMonth(S.m)
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    known = rows.filter((x) => isSafeInteger(records[x.id]?.grams) && records[x.id].grams >= 0),
    total = known.reduce((n, x) => n + records[x.id].grams / 1000, 0),
    kg = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  return (
    <>
      <section className="card carbon-total">
        <span className="profile-kicker">
          {M[S.m]}
          {' · ESTIMATIVAS INFORMADAS'}
        </span>
        <h2>{'Carbono das compras'}</h2>
        <strong className="num">{known.length ? kg(total) + ' kg CO₂e' : '—'}</strong>
        <p>
          {known.length}
          {' de '}
          {rows.length}
          {' lançamentos com estimativa'}
        </p>
        <p className="foot">
          {
            'Estimativa parcial; preço não determina emissões. Use uma fonte e distribua a emissão entre as parcelas.'
          }
        </p>
      </section>
      {rows.length ? (
        <section className="card">
          <h2>{'Registrar emissão'}</h2>
          <form id="carbonForm" className="grid">
            <label className="full">
              {'Compra'}
              <select name="purchase" required={true}>
                {viewList(
                  rows.map((x) => (
                    <option value={esc(x.id)}>
                      {esc(x.d)}
                      {' · '}
                      {x.date ? dateLabel(x.date) : 'Sem data'}
                    </option>
                  )),
                )}
              </select>
            </label>
            <label>
              {'Estimativa (kg CO₂e)'}
              <input name="kg" inputMode="decimal" required={true} placeholder="Ex.: 2,5" />
            </label>
            <label>
              {'Fonte (opcional)'}
              <input name="source" maxLength={240} placeholder="Fabricante ou cálculo utilizado" />
            </label>
            <button className="btn" type="submit">
              {'Salvar estimativa'}
            </button>
            <p className="foot full">
              {'Salvo neste dispositivo. Editar uma compra aqui substitui apenas sua estimativa de carbono.'}
            </p>
            <p id="carbonStatus" className="full" role="status"></p>
          </form>
        </section>
      ) : (
        ''
      )}
      <section className="card">
        <h2>{'Histórico de compras'}</h2>
        {viewList(
          rows.slice(0, 100).map((x) => {
            const record = records[x.id],
              valid = isSafeInteger(record?.grams) && record.grams >= 0;
            return (
              <div className="report-line">
                <span>
                  {esc(x.d)}
                  <small>
                    {x.date ? dateLabel(x.date) : 'Sem data'}
                    {' · '}
                    {esc(x.c)}
                    {valid && record.source ? ' · ' + esc(record.source) : ''}
                  </small>
                </span>
                <b>{valid ? kg(record.grams / 1000) + ' kg CO₂e' : 'Pendente'}</b>
              </div>
            );
          }),
        ) || <p className="foot">{'Sem compras.'}</p>}
        {rows.length > 100 ? (
          <p className="foot">{'Exibindo os 100 lançamentos mais recentes do mês.'}</p>
        ) : (
          ''
        )}
      </section>
    </>
  );
}
// end-view:vCarbon
export function analysisView(context: WorkspaceViewContext) {
  const { areaNavigation, areaViews, reportsView, vCarbon } = context;
  return (
    <>
      {areaNavigation('analysis', 'Seções de análises')}
      <div className="area-content">
        {areaViews.analysis === 'reports' ? (
          reportsView()
        ) : areaViews.analysis === 'carbon' ? (
          vCarbon()
        ) : (
          <div data-taxes-hub=""></div>
        )}
      </div>
    </>
  );
}
// end-view:analysisView
