// Presentation only: controller dependencies are injected at each render.
export function vCart(context){
 const {CART,brl,esc,planCard,purchaseReviewView,shoppingPlanForm}=context;
const plans=CART.filter(x=>x.status==='planned'&&!x.productGoal).sort((a,b)=>['alta','normal','baixa'].indexOf(a.priority)-['alta','normal','baixa'].indexOf(b.priority)),done=CART.filter(x=>x.status==='purchased');return `<section class="card finance-layout-card planning-editor-card"><h2>Compra planejada</h2>${shoppingPlanForm()}</section>${purchaseReviewView()}${plans.map(planCard).join('')}${done.map(x=>`<article class="card finance-layout-card purchased-card"><span class="tag">Confirmada</span><h2>${esc(x.name)}</h2><strong class="planning-value">${brl((x.purchase?.ownCents||0)/100)}</strong><p class="foot">Valores registrados na confirmação · ver em Lançamentos.</p></article>`).join('')}`;
}
// end-view:vCart
export function vOffers(context){
 const {offerSearchResult,offersSearchView,renderOfferResult,vCart}=context;
return `<section class="card finance-layout-card offers-search-section" aria-label="Pesquisar ofertas"><h2>Pesquisar produtos</h2><p class="foot">Resultados do Google Shopping no Brasil. Confira preço e disponibilidade na oferta.</p>${offersSearchView()}</section>${vCart()}<div id="offerResults" class="planning-results">${offerSearchResult?renderOfferResult(offerSearchResult):''}</div>`;
}
// end-view:vOffers
export function planningView(context){
 const {areaNavigation,areaViews,vOffers}=context;
return areaNavigation('planning','Seções de planejamento')+`<div class="area-content offers-panel planning-grid">${areaViews.planning==='goals'?'<div class="product-goals-host" data-product-goals></div>':vOffers()}</div>`;
}
// end-view:planningView
