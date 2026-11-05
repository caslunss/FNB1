import { viewList } from '../../services/presentation.ts';
import { errorDetails } from '../../services/errors.ts';
import type { WorkspaceRuntime } from './contracts';

type ReceiptContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'CATS'
  | 'PAY'
  | 'creditCardOptions'
  | 'draw'
  | 'esc'
  | 'moneyInput'
  | 'openReceipt'
  | 'parseReceiptText'
  | 'readReceipt'
  | 'receiptGeneration'
  | 'receiptWorker'
  | 'renderView'
  | 'saveExpense'
  | 'supportedDate'
  | 'todayISO'
>;

export function createReceipt(workspace: ReceiptContext) {
  function openReceipt() {
    let dialog = workspace.$('#receiptDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'receiptDialog';
      document.body.append(dialog);
    }
    workspace.renderView(
      dialog,
      <>
        <div className="row">
          <h2>{'Ler nota'}</h2>
          <button className="btn g" id="receiptClose">
            {'Cancelar'}
          </button>
        </div>
        <p className="foot">
          {
            'Foto JPG/PNG, XML da NF-e ou texto (até 10 MB). A leitura ocorre neste navegador; imagens precisam de internet para carregar o leitor. PDF não é aceito.'
          }
        </p>
        <label>
          {'Arquivo'}
          <input
            id="receiptFile"
            type="file"
            accept="image/jpeg,image/png,.xml,.txt"
          />
        </label>
        <p id="receiptStatus" role="status"></p>
        <form id="receiptForm" hidden={true} className="compact-form">
          <label>
            {'Itens identificados'}
            <textarea id="receiptItems" rows={5}></textarea>
          </label>
          <p className="foot">
            {
              'Revise itens e total: a leitura pode errar. Será salvo um único gasto.'
            }
          </p>
          <label>
            {'Descrição resumida'}
            <input id="receiptName" maxLength={240} required={true} />
          </label>
          <label>
            {'Total (R$)'}
            <input id="receiptTotal" inputMode="decimal" required={true} />
          </label>
          <label>
            {'Data'}
            <input
              id="receiptDate"
              type="date"
              value={workspace.todayISO()}
              required={true}
            />
          </label>
          <label>
            {'Categoria'}
            <select id="receiptCategory">
              {viewList(
                workspace.CATS.map((c) => <option>{workspace.esc(c)}</option>),
              )}
            </select>
          </label>
          <label>
            {'Pagamento'}
            <select id="receiptPayment">
              {viewList(
                workspace.PAY.map((p) => <option>{workspace.esc(p)}</option>),
              )}
            </select>
          </label>
          <label>
            {'Cartão'}
            <select id="receiptCard">{workspace.creditCardOptions()}</select>
          </label>
          <label className="chk">
            <input type="checkbox" required={true} />
            {'Conferi o total e os dados'}
          </label>
          <button className="btn">{'Registrar gasto'}</button>
        </form>
      </>,
    );
    dialog.showModal();
    workspace.scope.listen(workspace.$('#receiptClose'), 'click', () =>
      dialog.close(),
    );
    dialog.onclose = () => {
      workspace.receiptGeneration++;
      workspace.receiptWorker?.terminate();
      workspace.receiptWorker = null;
    };
    workspace.scope.listen(
      workspace.$('#receiptFile'),
      'change',
      workspace.readReceipt,
    );
    workspace.$('#receiptForm').onsubmit = (e) => {
      e.preventDefault();
      try {
        workspace.saveExpense(
          {
            d: workspace.$('#receiptName').value.trim(),
            v: workspace.moneyInput(workspace.$('#receiptTotal')),
            date: workspace.$('#receiptDate').value,
            c: workspace.$('#receiptCategory').value,
            p: workspace.$('#receiptPayment').value,
            ...(workspace.$('#receiptPayment').value === 'Cartão de crédito'
              ? {
                  creditCardId: workspace.$('#receiptCard').value,
                  creditPaid: false,
                }
              : {}),
          },
          null,
        );
        dialog.close();
        workspace.draw();
      } catch (err) {
        workspace.$('#receiptStatus').textContent = errorDetails(err).message;
      }
    };
  }

  function parseReceiptText(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const candidates = lines.filter(
      (l) =>
        /(total|valor a pagar)/i.test(l) &&
        !/(subtotal|tribut|imposto|desconto|itens)/i.test(l),
    );
    const match = candidates.at(-1)?.match(/\d[\d.]*,\d{2}/g);
    return {
      items: lines
        .filter(
          (l) =>
            /\d+,\d{2}/.test(l) &&
            !/(cnpj|cpf|tribut|total|troco|pagamento)/i.test(l),
        )
        .slice(0, 80)
        .join('\n'),
      total: match?.at(-1) || '',
      name:
        lines
          .filter(
            (l) =>
              /\d+,\d{2}/.test(l) &&
              !/(total|cnpj|cpf|troco|tribut|pagamento)/i.test(l),
          )
          .slice(0, 3)
          .map((l) => l.replace(/\d[\d.]*,\d{2}/g, '').trim())
          .join(', ')
          .slice(0, 230) || 'Compra — nota fiscal',
      date: '',
    };
  }

  async function readReceipt() {
    const f = workspace.$('#receiptFile').files![0];
    if (!f) return;
    const generation = ++workspace.receiptGeneration;
    workspace.$('#receiptForm').hidden = true;
    workspace.$('#receiptStatus').textContent = 'Lendo…';
    let worker;
    try {
      if (f.size > 10 * 1024 * 1024)
        throw Error('Use um arquivo de até 10 MB.');
      let result;
      if (/\.xml$/i.test(f.name)) {
        const text = await f.text();
        if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw Error('XML não suportado.');
        const xml = new DOMParser().parseFromString(text, 'application/xml');
        if (xml.querySelector('parsererror')) throw Error('XML inválido.');
        const tag = (root: Element | Document, n: string) =>
          root.getElementsByTagNameNS('*', n)[0]?.textContent || '';
        const products = [...xml.getElementsByTagNameNS('*', 'det')].map((d) =>
          tag(d, 'xProd'),
        );
        const total = tag(xml, 'vNF');
        if (!/^\d+(\.\d{1,2})?$/.test(total))
          throw Error('Total da NF-e não encontrado.');
        result = {
          items: products.join('\n'),
          name:
            products.slice(0, 3).join(', ').slice(0, 230) ||
            'Compra — nota fiscal',
          total: Number(total).toFixed(2).replace('.', ','),
          date: (tag(xml, 'dhEmi') || tag(xml, 'dEmi')).slice(0, 10),
        };
      } else if (/\.txt$/i.test(f.name)) {
        result = workspace.parseReceiptText(await f.text());
      } else if (['image/jpeg', 'image/png'].includes(f.type)) {
        if (!window.Tesseract)
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src =
              'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
            script.onload = resolve;
            script.onerror = () => {
              script.remove();
              reject(
                Error(
                  'Leitor indisponível. Tente novamente com internet ou use XML.',
                ),
              );
            };
            document.head.append(script);
          });
        if (generation !== workspace.receiptGeneration) return;
        worker = await Tesseract.createWorker('por');
        workspace.receiptWorker = worker;
        const response = await worker.recognize(f);
        result = workspace.parseReceiptText(response.data.text);
      } else throw Error('Envie JPG, PNG, XML ou TXT.');
      if (generation !== workspace.receiptGeneration) return;
      workspace.$('#receiptItems').value = result.items;
      workspace.$('#receiptName').value = result.name;
      workspace.$('#receiptTotal').value = result.total;
      if (result.date && workspace.supportedDate(result.date))
        workspace.$('#receiptDate').value = result.date;
      workspace.$('#receiptForm').hidden = false;
      workspace.$('#receiptStatus').textContent = result.total
        ? 'Leitura concluída. Confira antes de registrar.'
        : 'Total não identificado. Preencha o valor da nota.';
    } catch (err) {
      if (generation === workspace.receiptGeneration)
        workspace.$('#receiptStatus').textContent =
          errorDetails(err).message || 'Não foi possível ler a nota.';
    } finally {
      if (worker) await worker.terminate().catch(() => {});
      if (workspace.receiptWorker === worker) workspace.receiptWorker = null;
    }
  }
  return { openReceipt, parseReceiptText, readReceipt } satisfies Pick<
    WorkspaceRuntime,
    'openReceipt' | 'parseReceiptText' | 'readReceipt'
  >;
}

export function initializeReceipt(workspace: ReceiptContext) {
  // @workspace-step 286 FirstStatement
  workspace.receiptWorker = null;
  workspace.receiptGeneration = 0;
  workspace.scope.own(() => {
    workspace.receiptGeneration++;
    const worker = workspace.receiptWorker;
    workspace.receiptWorker = null;
    void worker?.terminate().catch(() => {});
  });
  // @workspace-end 286

  // @workspace-step 290 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if ((e.target as HTMLElement).closest<HTMLElement>('[data-read-receipt]'))
      workspace.openReceipt();
  });
  // @workspace-end 290
  // @workspace-step 291 ExpressionStatement
  workspace.scope.listen(document, 'change', (e) => {
    if (
      (e.target as HTMLInputElement).id === 'receiptCard' &&
      (e.target as HTMLInputElement).value &&
      workspace.$('#receiptPayment')
    )
      workspace.$('#receiptPayment').value = 'Cartão de crédito';
    if (
      (e.target as HTMLInputElement).id === 'receiptPayment' &&
      (e.target as HTMLInputElement).value !== 'Cartão de crédito' &&
      workspace.$('#receiptCard')
    )
      workspace.$('#receiptCard').value = '';
    if (
      (e.target as HTMLInputElement).id === 'expenseCard' &&
      (e.target as HTMLInputElement).value &&
      workspace.$('#sp')
    )
      workspace.$('#sp').value = 'Cartão de crédito';
    if (
      (e.target as HTMLInputElement).id === 'sp' &&
      (e.target as HTMLInputElement).value !== 'Cartão de crédito'
    ) {
      const card = workspace.$('#expenseCard'),
        paid = workspace.$('#expenseCardPaid');
      if (card) card.value = '';
      if (paid) paid.checked = false;
    }
  });
  // @workspace-end 291
}
