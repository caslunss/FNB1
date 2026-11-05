import { viewList } from '../../services/presentation.ts';
import { isInteger } from '../../services/type-guards.ts';
import type { LedgerRecord, Expense } from '../../types/workspace';
import type { WorkspaceRuntime } from './contracts';

type EntrySheetContext = Pick<
  WorkspaceRuntime,
  | '$'
  | 'CATS'
  | 'DEBTS'
  | 'ICON'
  | 'LIM'
  | 'M'
  | 'MAX_MONTHS'
  | 'MAX_RECORDS'
  | 'PAY'
  | 'S'
  | 'SH'
  | 'accountPanel'
  | 'atomic'
  | 'clearTransientError'
  | 'closeAccountPanel'
  | 'closeSheet'
  | 'creditCardOptions'
  | 'dateLong'
  | 'defaultDateForMonth'
  | 'draw'
  | 'ensureDate'
  | 'ensureIndex'
  | 'esc'
  | 'isMonthClosed'
  | 'lim'
  | 'moneyInput'
  | 'monthDate'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'openAccountPanel'
  | 'recurrenceFields'
  | 'renderView'
  | 'saveD'
  | 'saveDebt'
  | 'saveExpense'
  | 'saveIncome'
  | 'saveL'
  | 'saveWorkspace'
  | 'showError'
  | 'showNotice'
  | 'suspendedAccountPanel'
  | 'toCents'
  | 'todayISO'
>;

export function createEntrySheet(workspace: EntrySheetContext) {
  function openSheet(a: { dataset: DOMStringMap }) {
    const opener = workspace.SH?.opener || document.activeElement;
    const k = a.dataset.k!,
      id =
        a.dataset.id !== undefined && a.dataset.id !== ''
          ? a.dataset.k! === 'd'
            ? Number(a.dataset.id!)
            : a.dataset.id!
          : null,
      m = workspace.S.m;
    let t, b;
    if (
      workspace.isMonthClosed(m) &&
      ['launch', 'g', 'i', 'l', 'd'].includes(k)
    ) {
      workspace.showNotice(
        'Mês encerrado: disponível somente para visualização.',
        false,
      );
      return;
    }
    if (k === 'launch') {
      workspace.SH = {
        k,
        date: a.dataset.date! || workspace.defaultDateForMonth(m),
      };
      t = 'Novo lançamento';
      b = (
        <>
          <p className="mut">{'O que você quer registrar?'}</p>
          <div className="launch-options">
            <button
              className="launch-option"
              data-a="sheet"
              data-k="i"
              data-date={workspace.SH!.date}
            >
              {workspace.ICON.i}
              <strong>{'Entrada'}</strong>
              <span>{'Dinheiro que entrou'}</span>
            </button>
            <button
              className="launch-option"
              data-a="sheet"
              data-k="g"
              data-date={workspace.SH!.date}
            >
              {workspace.ICON.g}
              <strong>{'Gasto'}</strong>
              <span>{'Dinheiro que saiu'}</span>
            </button>
          </div>
        </>
      );
    } else if (k === 'g') {
      const it: Partial<Expense> =
        id !== null ? workspace.S.items.find((i) => i.id === id) || {} : {};
      if (it.splitId) {
        workspace.showNotice(
          'Este gasto pertence a uma divisão. Para alterar o valor, exclua e refaça a divisão na aba Amigos.',
          false,
        );
        return;
      }
      workspace.SH = { k, id: it.id };
      t = it.id ? 'Editar gasto' : 'Novo gasto';
      const selectedDate =
        a.dataset.date! ||
        it.date ||
        workspace.defaultDateForMonth(it.legacyMonth ?? m);
      workspace.SH!.date = selectedDate;
      b = (
        <div className="grid">
          <div className="full">
            <label htmlFor="sd">{'Descrição'}</label>
            <input
              id="sd"
              autoComplete="off"
              required={true}
              value={workspace.esc(it.d || '')}
              placeholder="Descrição"
            />
          </div>
          <div>
            <label htmlFor="sv">{'Valor (R$)'}</label>
            <input
              id="sv"
              inputMode="decimal"
              required={true}
              placeholder="0,00"
              value={it.v ? String(it.v).replace('.', ',') : ''}
            />
          </div>
          <div>
            <label htmlFor="sp">{'Pagamento'}</label>
            <select id="sp">
              {viewList(
                workspace.PAY.map((p) => (
                  <option selected={p === (it.p || workspace.PAY[0])}>
                    {p}
                  </option>
                )),
              )}
            </select>
          </div>
          <p className="entry-date full">
            {'Registro em '}
            {workspace.dateLong(selectedDate)}
          </p>
          <div className="full">
            <label htmlFor="sc">{'Categoria'}</label>
            <select id="sc">
              {viewList(
                workspace.CATS.map((c) => (
                  <option selected={c === (it.c || workspace.CATS[0])}>
                    {c}
                  </option>
                )),
              )}
            </select>
          </div>
          {
            <>
              <div className="full">
                <label htmlFor="expenseCard">{'Cartão'}</label>
                <select id="expenseCard">
                  {workspace.creditCardOptions(it.creditCardId || '')}
                </select>
              </div>
              <label className="chk full">
                <input
                  id="expenseSubscription"
                  type="checkbox"
                  checked={it.subscription}
                />
                {'Assinatura'}
              </label>
              <label className="chk full">
                <input
                  id="expenseCardPaid"
                  type="checkbox"
                  disabled={(it.creditPaidCents || 0) > 0}
                  checked={it.creditPaid}
                />
                {'Já pago'}
              </label>
            </>
          }
          {workspace.recurrenceFields(it, selectedDate)}
        </div>
      );
    } else if (k === 'i') {
      const it: Partial<LedgerRecord> =
        id !== null ? workspace.S.receipts.find((i) => i.id === id) || {} : {};
      workspace.SH = { k, id: it.id };
      t = it.id ? 'Editar entrada' : 'Nova entrada';
      workspace.SH!.incomeKind =
        a.dataset.incomeKind || it.incomeKind || 'once';
      const selectedDate =
        a.dataset.date! ||
        it.date ||
        workspace.defaultDateForMonth(it.legacyMonth ?? m);
      workspace.SH!.date = selectedDate;
      b = (
        <div className="grid">
          <div className="full">
            <label htmlFor="incomeKind">{'Tipo de ganho'}</label>
            <select id="incomeKind">
              {viewList(
                [
                  ['salary', 'Salário mensal'],
                  ['monthly', 'Outro ganho mensal'],
                  ['once', 'Ganho pontual'],
                ].map(([key, label]) => (
                  <option
                    value={key}
                    selected={key === workspace.SH!.incomeKind}
                  >
                    {label}
                  </option>
                )),
              )}
            </select>
          </div>
          <div className="full">
            <label htmlFor="sd">{'Descrição'}</label>
            <input
              id="sd"
              autoComplete="off"
              required={true}
              placeholder="Descrição"
              value={workspace.esc(
                it.d ||
                  (workspace.SH!.incomeKind === 'salary' ? 'Salário' : ''),
              )}
            />
          </div>
          <div className="full">
            <label htmlFor="sv">{'Valor da entrada (R$)'}</label>
            <input
              id="sv"
              inputMode="decimal"
              required={true}
              placeholder="0,00"
              value={it.v ? String(it.v).replace('.', ',') : ''}
            />
          </div>
          <div className="full">
            <label htmlFor="incomeDate">{'Recebimento'}</label>
            <input
              id="incomeDate"
              type="date"
              min={workspace.monthDate(
                Math.max(0, workspace.monthIndexFromDate(workspace.todayISO())),
              )}
              max={
                String(workspace.monthKeyForIndex(workspace.MAX_MONTHS - 1)) +
                '-30'
              }
              value={selectedDate}
              required={true}
            />
          </div>
          {workspace.recurrenceFields(
            it,
            selectedDate,
            !it.id && workspace.SH!.incomeKind !== 'once',
          )}
        </div>
      );
    } else if (k === 'l') {
      const c =
          a.dataset.c ||
          workspace.CATS.find((x) => !workspace.lim(m, x)) ||
          workspace.CATS[0],
        has = workspace.lim(m, c) > 0;
      workspace.SH = { k, c };
      t = has ? 'Limite de ' + c : 'Novo limite';
      b = (
        <div className="grid">
          <div className="full">
            <label htmlFor="sc">{'Categoria'}</label>
            <select id="sc" disabled={has}>
              {viewList(
                workspace.CATS.map((x) => (
                  <option selected={x === c}>{x}</option>
                )),
              )}
            </select>
          </div>
          <div className="full">
            <label htmlFor="sv">
              {'Limite em '}
              {workspace.M[m]}
              {' (R$)'}
            </label>
            <input
              id="sv"
              inputMode="decimal"
              required={true}
              placeholder="0,00"
              value={has ? String(workspace.lim(m, c)).replace('.', ',') : ''}
            />
          </div>
          <label className="chk full">
            <input type="checkbox" id="sa" />
            {'Todos os meses'}
          </label>
          {has ? (
            <button className="btn d full" data-a="srem">
              {'Remover limite'}
            </button>
          ) : (
            ''
          )}
        </div>
      );
    } else if (k === 'd') {
      const hi = id !== null,
        d = hi ? workspace.DEBTS[Number(id)] : { n: '', v: 0, s: m, p: 1 };
      workspace.SH = { k, i: hi ? Number(id) : undefined };
      t = hi ? 'Editar dívida' : 'Nova dívida';
      b = (
        <div className="grid">
          <div className="full">
            <label htmlFor="sd">{'Credor'}</label>
            <input
              id="sd"
              autoComplete="off"
              required={true}
              value={workspace.esc(d.n || '')}
            />
          </div>
          <div>
            <label htmlFor="sv">{'Valor total (R$)'}</label>
            <input
              id="sv"
              inputMode="decimal"
              required={true}
              placeholder="0,00"
              value={d.v ? String(d.v).replace('.', ',') : ''}
            />
          </div>
          <div>
            <label htmlFor="sp">{'Parcelas'}</label>
            <input
              id="sp"
              inputMode="numeric"
              type="number"
              min="1"
              max="240"
              step="1"
              value={d.p || 1}
            />
          </div>
          <div>
            <label htmlFor="sdpaid">{'Parcelas já pagas'}</label>
            <input
              id="sdpaid"
              type="number"
              min="0"
              step="1"
              max="240"
              value={d.paid || 0}
            />
          </div>
          <div className="full">
            <label htmlFor="sm">{'Mês de início'}</label>
            <select id="sm">
              {viewList(
                workspace.M.map((x, j) => (
                  <option value={j} selected={j === d.s}>
                    {x}
                  </option>
                )),
              )}
            </select>
          </div>
          {hi ? (
            <button className="btn d full" data-a="srem">
              {'Apagar dívida'}
            </button>
          ) : (
            ''
          )}
        </div>
      );
    } else {
      return;
    }
    workspace.SH!.opener = opener;
    if (workspace.$('#accountOverlay')?.open) {
      workspace.suspendedAccountPanel = workspace.accountPanel;
      workspace.closeAccountPanel({ immediate: true });
      workspace.accountPanel = null;
    }
    const s = workspace.$('#scrim');
    workspace.renderView(
      s,
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="st"
      >
        <div className="grab" aria-hidden="true"></div>
        <div className="sh">
          <button className="btn p" data-a="sclose">
            {'Cancelar'}
          </button>
          <h2 id="st">{workspace.esc(t)}</h2>
          {k === 'launch' ? (
            ''
          ) : (
            <button className="btn save" data-a="ssave">
              {'Salvar'}
            </button>
          )}
        </div>
        {b}
      </div>,
    );
    s.hidden = false;
    document.body.style.overflow = 'hidden';
    document.querySelector<HTMLElement>('.workspace-frame')!.inert = true;
    document
      .querySelector<HTMLElement>('.account-toolbar')
      ?.setAttribute('inert', '');
    document
      .querySelector<HTMLElement>('.theme-mobile')
      ?.setAttribute('inert', '');
    const f =
      s.querySelector<HTMLInputElement>(
        'input:not([type=checkbox]),select:not([disabled])',
      ) || s.querySelector('button');
    f?.focus();
  }

  function closeSheet() {
    document.querySelector<HTMLElement>('.workspace-frame')!.inert = false;
    document
      .querySelector<HTMLElement>('.account-toolbar')
      ?.removeAttribute('inert');
    document
      .querySelector<HTMLElement>('.theme-mobile')
      ?.removeAttribute('inert');
    const s = workspace.$('#scrim');
    s.hidden = true;
    workspace.renderView(s, '');
    document.body.style.overflow = '';
    if (
      workspace.SH &&
      workspace.SH!.opener &&
      workspace.SH!.opener.isConnected
    )
      (workspace.SH!.opener as HTMLElement).focus();
    workspace.SH = null;
    if (workspace.suspendedAccountPanel) {
      const panel = workspace.suspendedAccountPanel;
      workspace.suspendedAccountPanel = null;
      workspace.openAccountPanel(panel);
    }
  }

  function saveSheet() {
    if (!workspace.SH || workspace.SH!.k === 'launch') return;
    try {
      workspace.atomic(() => {
        const v = workspace.moneyInput(workspace.$('#sv')),
          all = !!workspace.$('#sa')?.checked;
        if (workspace.SH!.k === 'g' || workspace.SH!.k === 'i') {
          const label = workspace.$('#sd').value.trim(),
            date =
              workspace.SH!.k === 'i'
                ? workspace.$('#incomeDate').value
                : workspace.SH!.date || workspace.todayISO();
          if (!label || label.length > 240) {
            workspace.$('#sd').focus();
            throw Error('Informe uma descrição de até 240 caracteres.');
          }
          workspace.ensureDate(date);
          const list =
              workspace.SH!.k === 'g'
                ? workspace.S.items
                : workspace.S.receipts,
            existing = workspace.SH!.id
              ? list.find((x) => x.id === workspace.SH!.id)
              : null;
          if (existing?.splitId)
            throw Error(
              'Este valor pertence a uma divisão. Altere a divisão para manter os valores consistentes.',
            );
          if (!existing && list.length >= workspace.MAX_RECORDS)
            throw Error('Limite de lançamentos atingido.');
          const record: Omit<LedgerRecord, 'id'> = {
            d: label,
            v,
            date,
            ...(workspace.SH!.k === 'g'
              ? { c: workspace.$('#sc').value, p: workspace.$('#sp').value }
              : {}),
          };
          if (workspace.SH!.k === 'g') {
            const cardId = workspace.$('#expenseCard')?.value || '';
            record.subscription = !!workspace.$('#expenseSubscription')
              ?.checked;
            record.creditCardId = cardId;
            record.creditPaid = !!workspace.$('#expenseCardPaid')?.checked;
            if (cardId) {
              record.p = 'Cartão de crédito';
              record.creditChargeCents = workspace.toCents(v);
            }
            const count = workspace.$('#sr')?.checked
              ? Number(workspace.$('#sn').value)
              : 1;
            if (workspace.$('#sr')?.checked && count < 2)
              throw Error(
                'Para repetir, informe pelo menos 2 meses, incluindo este mês.',
              );
            workspace.saveExpense(
              record as Omit<Expense, 'id'>,
              workspace.SH!.id,
              count,
            );
          } else {
            record.incomeKind = workspace.$('#incomeKind').value;
            const count = workspace.$('#sr')?.checked
              ? Number(workspace.$('#sn')?.value)
              : 1;
            if (workspace.$('#sr')?.checked && count < 2)
              throw Error('Informe pelo menos 2 meses para repetir.');
            workspace.saveIncome(record, workspace.SH!.id, count);
          }
          workspace.S.m = workspace.monthIndexFromDate(date);
          workspace.S.calDate = date;
        } else if (workspace.SH!.k === 'd') {
          workspace.saveDebt(
            {
              n: workspace.$('#sd').value,
              v,
              p: Number(workspace.$('#sp').value),
              s: Number(workspace.$('#sm').value),
              paid: Number(workspace.$('#sdpaid').value),
              ...(workspace.SH!.sharedRef
                ? { sharedRef: workspace.SH!.sharedRef }
                : {}),
            },
            workspace.SH!.i,
          );
        } else if (workspace.SH!.k === 'l') {
          const category = workspace.$('#sc').value;
          if (!workspace.CATS.includes(category))
            throw Error('Categoria inválida.');
          const targets = all
            ? Array.from({ length: workspace.M.length }, (_, i) => i).filter(
                (i) => !workspace.isMonthClosed(i),
              )
            : [workspace.S.m];
          targets.forEach((i) => {
            workspace.LIM[i] ??= {};
            workspace.LIM[i][category] = v;
          });
          workspace.saveWorkspace();
        }
      });
      if (workspace.SH?.sharedRef) {
        sessionStorage.removeItem('plan12-pending-debt');
        history.replaceState(null, '', location.pathname + location.search);
      }
      workspace.clearTransientError();
      workspace.closeSheet();
      workspace.draw();
    } catch (e) {
      workspace.showError(e);
    }
  }

  function removeLim() {
    if (!workspace.SH) return;
    try {
      workspace.atomic(() => {
        if (workspace.SH!.k === 'd') {
          workspace.DEBTS.splice(workspace.SH!.i!, 1);
          workspace.saveD();
          return;
        }
        const all = !!workspace.$('#sa')?.checked,
          targets = all
            ? Array.from({ length: workspace.M.length }, (_, i) => i).filter(
                (i) => !workspace.isMonthClosed(i),
              )
            : [workspace.S.m];
        targets.forEach((i) => {
          if (workspace.LIM[i]) delete workspace.LIM[i][workspace.SH!.c!];
        });
        workspace.saveL();
      });
      if (workspace.SH?.sharedRef) {
        sessionStorage.removeItem('plan12-pending-debt');
        history.replaceState(null, '', location.pathname + location.search);
      }
      workspace.clearTransientError();
      workspace.closeSheet();
      workspace.draw();
    } catch (e) {
      workspace.showError(e);
    }
  }

  function switchMonth(m: string | number) {
    const idx = Number(m);
    if (!isInteger(idx) || idx < 0) return;
    workspace.ensureIndex(idx);
    workspace.S.m = Math.min(idx, workspace.M.length - 1);
    workspace.S.calDate = workspace.monthDate(workspace.S.m);
    workspace.draw();
  }
  return {
    openSheet,
    closeSheet,
    saveSheet,
    removeLim,
    switchMonth,
  } satisfies Pick<
    WorkspaceRuntime,
    'openSheet' | 'closeSheet' | 'saveSheet' | 'removeLim' | 'switchMonth'
  >;
}

export function initializeEntrySheet(workspace: EntrySheetContext) {
  // @workspace-step 160 FirstStatement
  workspace.SH = null;
  // @workspace-end 160
}
