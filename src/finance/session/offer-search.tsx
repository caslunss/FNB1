import { viewList } from '../../services/presentation.ts';
import type { ProductPreview, OfferResult } from '../../types/workspace';
import { errorDetails } from '../../services/errors.ts';
import type { WorkspaceRuntime } from './contracts';

type OfferSearchContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'brl'
  | 'esc'
  | 'offerSearchGeneration'
  | 'offerSearchResult'
  | 'productPreview'
  | 'renderOfferResult'
  | 'renderView'
  | 'safeProductUrl'
  | 'shoppingMoney'
  | 'shoppingRequest'
  | 'updatePlanProjection'
>;

export function createOfferSearch(workspace: OfferSearchContext) {
  function offersSearchView() {
    return (
      <form id="offerSearch" className="compact-form">
        <label>
          {'Produto'}
          <input
            name="query"
            required={true}
            maxLength={160}
            placeholder="Ex.: notebook 16 GB 512 GB"
          />
        </label>
        <button className="btn">{'Pesquisar'}</button>
        <p role="status" id="offerStatus"></p>
      </form>
    );
  }

  function productPreview(p: ProductPreview) {
    return (
      <>
        {p.image ? (
          <img
            className="product-photo"
            src={workspace.esc(p.image)}
            alt={workspace.esc(p.name)}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          ''
        )}
        <h3>{workspace.esc(p.name)}</h3>
        {p.priceCents ? (
          <strong>{workspace.brl(p.priceCents / 100)}</strong>
        ) : (
          <p className="foot">{'Preço não identificado'}</p>
        )}
        <ul>{viewList(p.specs.map((x) => <li>{workspace.esc(x)}</li>))}</ul>
        {p.promotion ? (
          <p className="foot">{workspace.esc(p.promotion)}</p>
        ) : (
          ''
        )}
      </>
    );
  }

  function renderOfferResult(r: OfferResult) {
    return (
      <>
        <p className="foot planning-query-status">
          {'Consulta em '}
          {workspace.esc(new Date(r.checkedAt).toLocaleString('pt-BR'))}
          {'. Confira variante, frete e preço na loja.'}
        </p>
        {r.products.length ? (
          ''
        ) : (
          <p className="foot planning-query-status" role="status">
            {'Nenhum produto encontrado. Tente outro nome ou modelo.'}
          </p>
        )}
        {viewList(
          r.products.map((p) => (
            <article className="card finance-layout-card">
              {p.store ? <p className="foot">{workspace.esc(p.store)}</p> : ''}
              {workspace.productPreview(p)}
              {p.url ? (
                <a
                  className="btn g"
                  href={workspace.esc(p.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {'Ver oferta'}
                </a>
              ) : (
                ''
              )}
            </article>
          )),
        )}
        {r.sources.length ? (
          <section className="card finance-layout-card">
            <h3>{'Fontes'}</h3>
            {viewList(
              r.sources.map((s: { url: unknown; title: unknown }) => (
                <p>
                  <a
                    href={workspace.esc(s.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {workspace.esc(s.title)}
                  </a>
                </p>
              )),
            )}
            {r.suggestions ? (
              <iframe
                title="Sugestões de pesquisa Google"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                srcDoc={workspace.esc(r.suggestions)}
                className="search-suggestions"
              ></iframe>
            ) : (
              ''
            )}
          </section>
        ) : (
          ''
        )}
      </>
    );
  }

  function shoppingRequest(payload: {
    action: 'behavior';
    summary: unknown;
  }): Promise<{ advice: string; checkedAt: string }>;
  function shoppingRequest(
    payload: Record<string, unknown>,
  ): Promise<OfferResult>;
  async function shoppingRequest(payload: Record<string, unknown>) {
    if (!window.planAuth.user) throw Error('Entre com Google para pesquisar.');
    const session = await window.planAuth.client!.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw Error('Entre novamente.');
    const response = await fetch('/api/shopping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.any([
        workspace.scope.signal,
        AbortSignal.timeout(110000),
      ]),
    });
    if (response.status === 404)
      throw Error(
        'Publique o projeto completo com as funções de servidor para ativar a pesquisa.',
      );
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error('Pesquisa não disponível neste ambiente.');
    }
    if (!response.ok) throw Error(data.error || 'Falha na pesquisa.');
    return data;
  }
  return {
    offersSearchView,
    productPreview,
    renderOfferResult,
    shoppingRequest,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'offersSearchView'
    | 'productPreview'
    | 'renderOfferResult'
    | 'shoppingRequest'
  >;
}

export function initializeOfferSearch(workspace: OfferSearchContext) {
  // @workspace-step 298 FirstStatement
  workspace.offerSearchResult = null;
  workspace.offerSearchGeneration = 0;
  // @workspace-end 298

  // @workspace-step 303 ExpressionStatement
  workspace.scope.listen(document, 'submit', async (e) => {
    if ((e.target as HTMLFormElement).id !== 'offerSearch') return;
    e.preventDefault();
    const form = e.target as HTMLFormElement,
      button = form.querySelector('button'),
      status = form.querySelector<HTMLElement>('[role=status]');
    if (button!.disabled) return;
    const generation = ++workspace.offerSearchGeneration;
    button!.disabled = true;
    status!.textContent = 'Pesquisando…';
    try {
      const result = await workspace.shoppingRequest({
        action: 'search',
        query: new FormData(form).get('query'),
      });
      if (
        workspace.scope.disposed ||
        generation !== workspace.offerSearchGeneration
      )
        return;
      workspace.offerSearchResult = result;
      if (form.isConnected) {
        workspace.renderView(
          workspace.$('#offerResults'),
          workspace.renderOfferResult(result),
        );
        status!.textContent = '';
      }
    } catch (error) {
      if (form.isConnected) status!.textContent = errorDetails(error).message;
    } finally {
      button!.disabled = false;
    }
  });
  // @workspace-end 303
  // @workspace-step 304 ExpressionStatement
  workspace.scope.listen(document, 'click', async (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-import-product]',
    );
    if (!button || button.disabled) return;
    const form = button.closest('form'),
      status = form!.querySelector<HTMLElement>('[data-product-status]'),
      url = form!.querySelector<HTMLInputElement>('[name=url]')!.value;
    button.disabled = true;
    status!.textContent = 'Consultando produto…';
    try {
      const checked = workspace.safeProductUrl(url);
      if (!checked) throw Error('Informe o link do produto.');
      const result = await workspace.shoppingRequest({
        action: 'product',
        url: checked,
      });
      if (workspace.scope.disposed || !form!.isConnected) return;
      if (form!.querySelector<HTMLInputElement>('[name=url]')!.value !== url)
        throw Error('O link mudou. Consulte novamente.');
      const p = result.products[0];
      form!.querySelector<HTMLInputElement>('[name=name]')!.value = p.name;
      form!.querySelector<HTMLInputElement>('[name=priceCents]')!.value =
        p.priceCents ? workspace.shoppingMoney(p.priceCents) : '';
      form!.querySelector<HTMLInputElement>('[name=image]')!.value =
        p.image || '';
      form!.querySelector<HTMLInputElement>('[name=specs]')!.value =
        JSON.stringify(p.specs);
      workspace.renderView(
        form!.querySelector<HTMLElement>('[data-product-preview]'),
        workspace.productPreview(p),
      );
      workspace.updatePlanProjection(form!);
      status!.textContent = p.priceCents
        ? 'Confira o produto, a variante e o preço antes de salvar.'
        : 'Preço não confirmado. Informe o preço atual antes de salvar.';
    } catch (error) {
      if (form!.isConnected) status!.textContent = errorDetails(error).message;
    } finally {
      button.disabled = false;
    }
  });
  // @workspace-end 304
}
