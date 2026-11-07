import { viewList } from '../../services/presentation.ts';
import type { WorkspaceViewContext } from '../../types/views';
// Presentation only: controller dependencies are injected at each render.
export function vCart(context: WorkspaceViewContext) {
  const { CART, brl, esc, planCard, purchaseReviewView, shoppingPlanForm } = context;
  const plans = CART.filter((x) => x.status === 'planned' && !x.productGoal).sort(
      (a, b) =>
        ['alta', 'normal', 'baixa'].indexOf(a.priority) - ['alta', 'normal', 'baixa'].indexOf(b.priority),
    ),
    done = CART.filter((x) => x.status === 'purchased');
  return (
    <>
      <section className="card finance-layout-card planning-editor-card">
        <h2>{'Compra planejada'}</h2>
        {shoppingPlanForm()}
      </section>
      {purchaseReviewView()}
      {viewList(plans.map(planCard))}
      {viewList(
        done.map((x) => (
          <article className="card finance-layout-card purchased-card">
            <span className="tag">{'Confirmada'}</span>
            <h2>{esc(x.name)}</h2>
            <strong className="planning-value">{brl((x.purchase?.ownCents || 0) / 100)}</strong>
            <p className="foot">{'Registrada em Lançamentos.'}</p>
          </article>
        )),
      )}
    </>
  );
}
// end-view:vCart
export function vOffers(context: WorkspaceViewContext) {
  const { offerSearchResult, offersSearchView, renderOfferResult, vCart } = context;
  return (
    <>
      <section className="card finance-layout-card offers-search-section" aria-label="Pesquisar ofertas">
        <h2>{'Pesquisar produtos'}</h2>
        <p className="foot">
          {'Google Shopping · Brasil. Confira preço e disponibilidade.'}
        </p>
        {offersSearchView()}
      </section>
      {vCart()}
      <div id="offerResults" className="planning-results">
        {offerSearchResult ? renderOfferResult(offerSearchResult) : ''}
      </div>
    </>
  );
}
// end-view:vOffers
export function planningView(context: WorkspaceViewContext) {
  const { areaNavigation, areaViews, vOffers } = context;
  return (
    <>
      {areaNavigation('planning', 'Seções de planejamento')}
      <div className="area-content offers-panel planning-grid">
        {areaViews.planning === 'goals' ? (
          <div className="product-goals-host" data-product-goals=""></div>
        ) : (
          vOffers()
        )}
      </div>
    </>
  );
}
// end-view:planningView
