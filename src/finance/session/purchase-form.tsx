import { viewList } from '../../services/presentation.ts';
import type { PurchasePlan } from '../../types/calculations';
import { isSafeInteger } from '../../services/type-guards.ts';
import type { ShoppingPlan } from '../../types/workspace';
import { errorDetails } from '../../services/errors.ts';
import { vCards as rendervCards } from '../views/commitments.tsx';
import {
  vCart as rendervCart,
  vOffers as rendervOffers,
} from '../views/planning.tsx';
import type { WorkspaceRuntime } from './contracts';

type PurchaseFormContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'CARDS'
  | 'CART'
  | 'CATS'
  | 'GOAL'
  | 'ICON'
  | 'MAX_MONTHS'
  | 'MIN_DATE'
  | 'S'
  | 'brl'
  | 'clearTransientError'
  | 'confirmPlannedPurchase'
  | 'creditCardOptions'
  | 'creditPlanGuide'
  | 'dateLong'
  | 'defaultDateForMonth'
  | 'draw'
  | 'editPlanId'
  | 'esc'
  | 'friendDivisionForm'
  | 'monthKeyForIndex'
  | 'monthLabelFromKey'
  | 'parseMoney'
  | 'planProjection'
  | 'planProjectionTimer'
  | 'productPreview'
  | 'projectionView'
  | 'purchaseReview'
  | 'readPlanForm'
  | 'renderView'
  | 'safely'
  | 'saveShopping'
  | 'saveWorkspace'
  | 'shoppingMoney'
  | 'updatePlanProjection'
  | 'validateShopping'
  | 'viewContext'
>;

export function createPurchaseForm(workspace: PurchaseFormContext) {
  function projectionView(plan: PurchasePlan & { reservedCents: number }) {
    try {
      const p = workspace.planProjection(plan);
      return (
        <>
          {workspace.creditPlanGuide(plan)}
          <div className="plan-projection">
            <h3>{'Impacto no planejamento'}</h3>
            <p className="foot">
              {
                'Simulação sem alterar seus dados. Considera gastos, limites e dívidas; atrasos entram no primeiro mês. Gastos cobertos pelo limite não são descontados de novo. Não inclui saldo bancário, renda não cadastrada ou outras compras planejadas.'
              }
            </p>
            <div className="plan-table-wrap">
              <table className="plan-table">
                <thead>
                  <tr>
                    <th>{'Período'}</th>
                    <th>{'Sua parcela'}</th>
                    <th>{'Após compromissos'}</th>
                  </tr>
                </thead>
                <tbody>
                  {viewList(
                    p.rows.map((x) => (
                      <tr>
                        <td data-label="Período">
                          {workspace.monthLabelFromKey(
                            workspace.monthKeyForIndex(x.m),
                          )}
                          {!x.complete ? (
                            <small>{'Sem entradas cadastradas'}</small>
                          ) : (
                            ''
                          )}
                        </td>
                        <td data-label="Sua parcela">
                          {workspace.brl(x.cents / 100)}
                        </td>
                        <td
                          data-label="Após compromissos"
                          className={x.after < 0 ? 'bad' : ''}
                        >
                          {workspace.brl(x.after / 100)}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
            <p className="foot">
              {p.rows.some((x) => !x.complete)
                ? 'Faltam entradas em alguns meses.'
                : p.rows.some((x) => x.after < 0)
                  ? 'A compra ultrapassa o disponível em pelo menos um mês.'
                  : 'A simulação mantém os meses acima de zero com os dados cadastrados.'}
            </p>
            {p.goalAfter !== null ? (
              <p className={'foot ' + String(p.goalAfter < 0 ? 'bad' : '')}>
                {'Meta geral até '}
                {workspace.monthLabelFromKey(
                  workspace.monthKeyForIndex(workspace.GOAL.e),
                )}
                {': '}
                {p.goalAfter < 0
                  ? 'faltariam ' + workspace.brl(-p.goalAfter / 100)
                  : 'restariam ' +
                    workspace.brl(p.goalAfter / 100) +
                    ' além da meta'}
                {
                  ' na projeção acumulada após esta compra. A reserva informada não é adicionada ao saldo.'
                }
              </p>
            ) : (
              ''
            )}
            <p className="foot">
              {'Sua parte: '}
              <b>{workspace.brl(p.totalCents / 100)}</b>
              {' · Reserva: '}
              {workspace.brl(plan.reservedCents / 100)}
              {' (apenas acompanhamento).'}
            </p>
          </div>
        </>
      );
    } catch (e) {
      return (
        <p className="foot bad">{workspace.esc(errorDetails(e).message)}</p>
      );
    }
  }

  function shoppingPlanForm() {
    const x: Omit<ShoppingPlan, 'id' | 'status'> & {
      id?: string;
      status?: string;
    } = workspace.CART.find(
      (x) => x.id === workspace.editPlanId && x.status === 'planned',
    ) || {
      name: '',
      targetCents: 0,
      priceCents: 0,
      shippingCents: 0,
      reservedCents: 0,
      date: workspace.defaultDateForMonth(workspace.S.m),
      installments: 1,
      priority: 'normal',
      category: 'Gastos Essenciais',
      goal: false,
      people: [],
      url: '',
    };
    return (
      <details
        className="plan-editor plan-editor-floating floating-action-editor"
        open={!!workspace.editPlanId}
      >
        <summary className="btn">
          {workspace.ICON.plus}
          <span>
            {workspace.editPlanId ? 'Editar compra' : 'Compra planejada'}
          </span>
        </summary>
        <form
          data-shopping-form="plan"
          data-id={workspace.esc(x.id || '')}
          className="compact-form product-form"
        >
          <label className="full">
            {'Produto'}
            <input
              name="name"
              value={workspace.esc(x.name)}
              maxLength={120}
              placeholder="Nome do produto"
              required={true}
            />
          </label>
          <label>
            {'Preço alvo (R$)'}
            <input
              name="targetCents"
              inputMode="decimal"
              value={
                x.targetCents ? workspace.shoppingMoney(x.targetCents) : ''
              }
              required={true}
            />
          </label>
          <label>
            {'Preço atual (R$)'}
            <input
              name="priceCents"
              inputMode="decimal"
              value={x.priceCents ? workspace.shoppingMoney(x.priceCents) : ''}
              required={true}
            />
          </label>
          <label>
            {'Frete (R$)'}
            <input
              name="shippingCents"
              inputMode="decimal"
              value={workspace.shoppingMoney(x.shippingCents)}
              required={true}
            />
          </label>
          <label>
            {'Reserva (R$)'}
            <input
              name="reservedCents"
              inputMode="decimal"
              value={workspace.shoppingMoney(x.reservedCents)}
              required={true}
            />
          </label>
          <label>
            {'Compra / 1ª parcela'}
            <input
              name="date"
              type="date"
              min={workspace.MIN_DATE}
              max={
                String(workspace.monthKeyForIndex(workspace.MAX_MONTHS - 1)) +
                '-30'
              }
              value={x.date}
              required={true}
            />
          </label>
          <label>
            {'Parcelas'}
            <input
              name="installments"
              type="number"
              min="1"
              max="24"
              value={x.installments}
              required={true}
            />
          </label>
          <label>
            {'Prioridade'}
            <select name="priority">
              {viewList(
                ['alta', 'normal', 'baixa'].map((v) => (
                  <option value={v} selected={v === x.priority}>
                    {v === 'alta' ? 'Alta' : v === 'baixa' ? 'Baixa' : 'Normal'}
                  </option>
                )),
              )}
            </select>
          </label>
          <label>
            {'Categoria'}
            <select name="category">
              {viewList(
                workspace.CATS.map((c) => (
                  <option selected={c === x.category}>{c}</option>
                )),
              )}
            </select>
          </label>
          <label className="full">
            {'Dividir com'}
            <input
              name="people"
              value={workspace.esc(x.people.join(', '))}
              placeholder="Nomes separados por vírgula"
            />
          </label>
          <label className="full">
            {'Link do produto'}
            <input
              name="url"
              type="url"
              value={workspace.esc(x.url)}
              placeholder="https://"
            />
          </label>
          <div className="full">
            <button type="button" className="btn g" data-import-product="">
              {'Buscar produto'}
            </button>
            <p role="status" data-product-status=""></p>
            <div data-product-preview="">
              {x.image || x.specs?.length
                ? workspace.productPreview({ ...x, specs: x.specs || [] })
                : ''}
            </div>
            <input
              type="hidden"
              name="image"
              value={workspace.esc(x.image || '')}
            />
            <input
              type="hidden"
              name="specs"
              value={workspace.esc(JSON.stringify(x.specs || []))}
            />
          </div>
          {workspace.CARDS.length ? (
            <label>
              {'Cartão (opcional)'}
              <select name="creditCardId" aria-label="Cartão (opcional)">
                {workspace.creditCardOptions(x.creditCardId || '')}
              </select>
            </label>
          ) : (
            ''
          )}
          <label className="chk full">
            <input name="goal" type="checkbox" checked={x.goal} />
            {'Incluir na meta'}
          </label>
          <p className="foot full">
            {
              'Preço alvo inclui frete. Inclua juros no preço. Divisão igual, com ajuste de centavos.'
            }
          </p>
          <div id="shoppingLiveProjection" className="full">
            {x.priceCents ? workspace.projectionView(x) : ''}
          </div>
          <div className="plan-actions full">
            <button className="btn">{'Salvar'}</button>
            {workspace.editPlanId ? (
              <button
                type="button"
                className="btn g"
                data-shop-action="cancel-edit"
              >
                {'Cancelar'}
              </button>
            ) : (
              ''
            )}
          </div>
          <p className="foot full" data-shopping-error="" role="alert"></p>
        </form>
      </details>
    );
  }

  function readPlanForm(form: HTMLFormElement) {
    const d = new FormData(form),
      money = (key: string) => {
        const n = workspace.parseMoney(d.get(key));
        if (!isSafeInteger(n))
          throw Error('Preencha os valores com até duas casas decimais.');
        return n;
      };
    return workspace.validateShopping(
      {
        id: form.dataset.id! || 'draft',
        name: String(d.get('name') || ''),
        targetCents: money('targetCents'),
        priceCents: money('priceCents'),
        shippingCents: money('shippingCents'),
        reservedCents: money('reservedCents'),
        date: String(d.get('date')),
        installments: Number(d.get('installments')),
        priority: d.get('priority') as string,
        category: d.get('category') as string,
        goal: d.has('goal'),
        affiliate: !!workspace.CART.find((x) => x.id === form.dataset.id!)
          ?.affiliate,
        creditCardId: String(d.get('creditCardId') || ''),
        people: String(d.get('people') || '')
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean),
        url: String(d.get('url') || ''),
        image: String(d.get('image') || ''),
        specs: JSON.parse(String(d.get('specs') || '[]')),
      },
      'cart',
    );
  }

  function planCard(x: ShoppingPlan) {
    const total = x.priceCents! + x.shippingCents!;
    return (
      <article className="card finance-layout-card plan-card">
        {x.image ? (
          <img
            className="product-photo"
            src={workspace.esc(x.image)}
            alt={workspace.esc(x.name)}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          ''
        )}
        {x.specs?.length ? (
          <ul>{viewList(x.specs.map((v) => <li>{workspace.esc(v)}</li>))}</ul>
        ) : (
          ''
        )}
        <div className="row">
          <div>
            <span className="tag">
              {x.priority === 'alta'
                ? 'Prioridade alta'
                : x.priority === 'baixa'
                  ? 'Sem pressa'
                  : 'Planejado'}
            </span>
            <h2>{workspace.esc(x.name)}</h2>
          </div>
          <strong>{workspace.brl(total / 100)}</strong>
        </div>
        <p className="foot">
          {'Alvo: '}
          {workspace.brl(x.targetCents / 100)}
          {' · '}
          {workspace.dateLong(x.date)}
          {' · '}
          {x.installments}
          {' parcela(s)'}
          {x.people.length ? ' · ' + (x.people.length + 1) + ' pessoas' : ''}
        </p>
        <span className="tag">
          {total <= x.targetCents ? 'Dentro do alvo' : 'Acima do alvo'}
        </span>
        {x.url ? (
          <>
            {' '}
            <a
              className="plan-link"
              href={workspace.esc(x.url)}
              target="_blank"
              rel={
                'noopener noreferrer' + String(x.affiliate ? ' sponsored' : '')
              }
            >
              {x.affiliate ? 'Ver produto · link de afiliado' : 'Ver produto'}
              {' ↗'}
            </a>
          </>
        ) : (
          ''
        )}
        <details className="plan-detail">
          <summary>{'Simulação mensal'}</summary>
          {workspace.projectionView(x)}
        </details>
        <div className="plan-actions">
          <button className="btn g" data-shop-action="edit-plan" data-id={x.id}>
            {'Editar'}
          </button>
          <button
            className="btn"
            data-shop-action="review-purchase"
            data-id={x.id}
          >
            {'Já comprei'}
          </button>
          <button
            className="btn g"
            data-shop-action="delete-plan"
            data-id={x.id}
          >
            {'Remover'}
          </button>
        </div>
        <details className="purchase-friend-share">
          <summary>{'Compartilhar'}</summary>
          {workspace.friendDivisionForm(x)}
        </details>
      </article>
    );
  }

  function purchaseReviewView() {
    const x = workspace.CART.find(
      (x) => x.id === workspace.purchaseReview?.id && x.status === 'planned',
    );
    if (!x) return '';
    return (
      <section
        className="card finance-layout-card purchase-review"
        role="region"
        aria-label="Conferir compra"
      >
        <h2>
          {'Conferir '}
          {workspace.esc(x.name)}
        </h2>
        <p className="foot">
          {'Total final: '}
          {workspace.brl((x.priceCents! + x.shippingCents!) / 100)}
          {'. '}
          {x.installments}
          {' parcela(s), a partir de '}
          {workspace.dateLong(x.date)}
          {'. '}
          {x.people.length
            ? 'Apenas sua parte será registrada; cada parcela terá uma divisão salva.'
            : 'Os gastos serão adicionados ao calendário nas datas das parcelas.'}
          {' Revise o planejamento se preço, frete ou data mudaram.'}
        </p>
        {workspace.projectionView(x)}
        <form data-shopping-form="confirm">
          <label>
            {'Cartão'}
            <select name="purchaseCard" aria-label="Cartão para compra">
              {workspace.creditCardOptions(x.creditCardId || '')}
            </select>
          </label>
          <p className="foot">
            {
              'Obrigatório para parcelamento. Sem cartão, a compra à vista será registrada como Pix.'
            }
          </p>
          <label className="chk">
            <input type="checkbox" name="confirmed" required={true} />
            {'Conferi os valores e já comprei'}
          </label>
          <div className="plan-actions">
            <button className="btn">{'Confirmar'}</button>
            <button
              type="button"
              className="btn g"
              data-shop-action="cancel-review"
            >
              {'Voltar'}
            </button>
          </div>
          <p data-shopping-error="" role="alert" className="foot bad"></p>
        </form>
      </section>
    );
  }

  function vCart() {
    return rendervCart(workspace.viewContext);
  }

  function vCards() {
    return rendervCards(workspace.viewContext);
  }

  function vOffers() {
    return rendervOffers(workspace.viewContext);
  }

  function updatePlanProjection(form: HTMLFormElement) {
    if (!form.isConnected) return;
    const box = form.querySelector<HTMLElement>('#shoppingLiveProjection');
    try {
      workspace.renderView(
        box,
        workspace.projectionView(workspace.readPlanForm(form)),
      );
    } catch {
      workspace.renderView(
        box,
        <p className="foot">
          {
            'Preencha nome, valores, data e parcelas para visualizar a simulação.'
          }
        </p>,
      );
    }
  }
  return {
    projectionView,
    shoppingPlanForm,
    readPlanForm,
    planCard,
    purchaseReviewView,
    vCart,
    vCards,
    vOffers,
    updatePlanProjection,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'projectionView'
    | 'shoppingPlanForm'
    | 'readPlanForm'
    | 'planCard'
    | 'purchaseReviewView'
    | 'vCart'
    | 'vCards'
    | 'vOffers'
    | 'updatePlanProjection'
  >;
}

export function initializePurchaseForm(workspace: PurchaseFormContext) {
  // @workspace-step 226 FirstStatement
  workspace.editPlanId = '';
  workspace.purchaseReview = null;
  // @workspace-end 226
  // @workspace-step 227 FirstStatement
  workspace.shoppingMoney = (n: number) =>
    String((n || 0) / 100).replace('.', ',');
  // @workspace-end 227

  // @workspace-step 237 FirstStatement
  // planProjectionTimer is initialized by the following hydration phase.
  // @workspace-end 237
  // @workspace-step 238 ExpressionStatement
  workspace.scope.listen(document, 'input', (e) => {
    const form = (e.target as HTMLInputElement).closest<HTMLFormElement>(
      '[data-shopping-form="plan"]',
    );
    if (!form) return;
    workspace.scope.cancelTimeout(workspace.planProjectionTimer);
    workspace.planProjectionTimer = workspace.scope.timeout(
      () => workspace.updatePlanProjection(form),
      120,
    );
  });
  // @workspace-end 238
  // @workspace-step 239 ExpressionStatement
  workspace.scope.listen(document, 'submit', (e) => {
    const form = (e.target as HTMLFormElement).closest<HTMLFormElement>(
      '[data-shopping-form]',
    );
    if (!form) return;
    e.preventDefault();
    try {
      if (form.dataset.shoppingForm === 'plan') {
        const record: Partial<ShoppingPlan> = workspace.readPlanForm(form);
        record.id = form.dataset.id! || undefined;
        workspace.saveShopping(record, 'cart');
        workspace.editPlanId = '';
        workspace.purchaseReview = null;
      } else {
        workspace.confirmPlannedPurchase(
          workspace.purchaseReview?.id,
          form.querySelector<HTMLInputElement>('[name="confirmed"]')!.checked,
          workspace.purchaseReview?.expected,
          form.querySelector<HTMLInputElement>('[name="purchaseCard"]')!.value,
        );
        workspace.purchaseReview = null;
      }
      workspace.clearTransientError();
      workspace.draw();
    } catch (error) {
      form
        .querySelectorAll<HTMLElement>('.progressive-fields')
        .forEach((node) =>
          node.dispatchEvent(new Event('plan-expand-details')),
        );
      form.querySelector<HTMLElement>('[data-shopping-error]')!.textContent =
        errorDetails(error).message;
    }
  });
  // @workspace-end 239
  // @workspace-step 240 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-shop-action]',
    );
    if (!b) return;
    const action = b.dataset.shopAction!,
      id = b.dataset.id!;
    workspace.safely(() => {
      if (action === 'edit-plan') {
        workspace.editPlanId = id;
        workspace.purchaseReview = null;
      }
      if (action === 'cancel-edit') workspace.editPlanId = '';
      if (action === 'delete-plan') {
        workspace.CART = workspace.CART.filter(
          (x) => x.id !== id || x.status === 'purchased',
        );
        if (workspace.editPlanId === id) workspace.editPlanId = '';
        if (workspace.purchaseReview?.id === id)
          workspace.purchaseReview = null;
        workspace.saveWorkspace();
      }
      if (action === 'review-purchase') {
        const p = workspace.CART.find(
          (x) => x.id === id && x.status === 'planned',
        );
        if (p) workspace.purchaseReview = { id, expected: JSON.stringify(p) };
      }
      if (action === 'cancel-review') workspace.purchaseReview = null;
      workspace.draw();
    });
    if (['edit-plan', 'review-purchase'].includes(action)) {
      scrollTo(0, 0);
      const target =
        action === 'review-purchase'
          ? workspace.$('.purchase-review h2')
          : workspace.$('.plan-editor input');
      target?.setAttribute('tabindex', '-1');
      target?.focus();
    }
  });
  // @workspace-end 240
}
