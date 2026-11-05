import { requestFinancePublish } from '../../services/finance-runtime';
import { isObject, includesValue } from '../../services/type-guards';
import { isSafeInteger, isInteger } from '../../services/type-guards.ts';
import type {
  WorkspaceSnapshot,
  LedgerRecord,
  Expense,
  ShoppingPlan,
  ShoppingOffer,
} from '../../types/workspace';
import { errorDetails } from '../../services/errors.ts';
import { DISMISSED_NOTIFICATIONS_KEY } from '../../services/notification-dismissals.ts';
import { normalizeCreditCard } from '../../services/credit.ts';
import type { WorkspaceRuntime } from './contracts';

type PersistenceContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'BACKUP_KEY'
  | 'CARDS'
  | 'CART'
  | 'CLOSED_REPORTS'
  | 'DEBTS'
  | 'GOAL'
  | 'LEGACY_KEYS'
  | 'LIM'
  | 'M'
  | 'MAX_CENTS'
  | 'MAX_MONTHS'
  | 'MAX_RECORDS'
  | 'OFFERS'
  | 'PAY'
  | 'PROFILE'
  | 'S'
  | 'SPLITS'
  | 'WORKSPACE_KEY'
  | 'allowClosedReset'
  | 'assertClosedUnchanged'
  | 'atomic'
  | 'backupReady'
  | 'behaviorAdvice'
  | 'behaviorError'
  | 'boot'
  | 'bootRecovery'
  | 'canonicalCategory'
  | 'chartMetric'
  | 'cleanWorkspace'
  | 'convertMoney'
  | 'csvPreview'
  | 'defaultDateForMonth'
  | 'draw'
  | 'drawPending'
  | 'editPlanId'
  | 'emptyFinancialSnapshot'
  | 'entryFilter'
  | 'indexFromKey'
  | 'isMonthClosed'
  | 'issuedIds'
  | 'itemMonthIndex'
  | 'load'
  | 'localStorage'
  | 'migrateReportCategories'
  | 'monthCount'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'monthLabelFromKey'
  | 'monthlyExpenseDate'
  | 'newId'
  | 'noticeError'
  | 'noticeMessage'
  | 'oldAmount'
  | 'parseRaw'
  | 'pendingSave'
  | 'persist'
  | 'purchaseReview'
  | 'rawSource'
  | 'readBlocked'
  | 'readRaw'
  | 'recovery'
  | 'refreshMonths'
  | 'rejected'
  | 'renderNotifications'
  | 'restore'
  | 'saveD'
  | 'saveG'
  | 'saveI'
  | 'saveL'
  | 'saveMonthCount'
  | 'saveNumber'
  | 'saveReceipts'
  | 'saveWorkspace'
  | 'savedMonthBaseline'
  | 'snapshot'
  | 'splitShares'
  | 'storageBase'
  | 'supportedDate'
  | 'toCents'
  | 'todayISO'
  | 'transactionDepth'
  | 'validDate'
  | 'validateShopping'
  | 'writeStorage'
>;

export function createPersistence(workspace: PersistenceContext) {
  function readRaw(key: string) {
    try {
      const raw = workspace.localStorage.getItem(key);
      if (raw !== null) workspace.rawSource[key] = raw;
      return raw;
    } catch {
      workspace.readBlocked = true;
      workspace.noticeMessage =
        'Não foi possível acessar os dados deste navegador. Recarregue antes de salvar.';
      workspace.noticeError = true;
      return null;
    }
  }

  function parseRaw<T>(key: string, fallback: T): T {
    const raw = workspace.rawSource[key];
    if (raw === undefined) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      workspace.recovery.push({ key, reason: 'JSON inválido', raw });
      return fallback;
    }
  }

  function rejected(key: string, value: unknown, reason: string) {
    workspace.recovery.push({ key, reason, value });
  }

  function oldAmount(value: unknown, max: number = workspace.MAX_CENTS) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw Error('Valor inválido');
    const cents = workspace.toCents(n);
    if (cents > max) throw Error('Valor fora do limite permitido.');
    if (Math.abs(n * 100 - cents) > 0.00001)
      workspace.rejected(
        'valor',
        value,
        'Valor antigo arredondado para centavos; original preservado no backup',
      );
    return cents / 100;
  }

  function cleanWorkspace(raw: Partial<WorkspaceSnapshot>) {
    const object = isObject,
      list = <T,>(x: T[] | undefined, key: string): T[] => {
        if (!Array.isArray(x)) {
          if (x !== undefined) workspace.rejected(key, x, 'Lista inválida');
          return [];
        }
        if (x.length > workspace.MAX_RECORDS)
          workspace.rejected(
            key,
            x.slice(workspace.MAX_RECORDS),
            'Registros excedentes preservados para recuperação',
          );
        return x.slice(0, workspace.MAX_RECORDS);
      };
    const state: WorkspaceSnapshot = {
        items: [],
        receipts: [],
        debts: [],
        limits: [],
        goal: { v: 0, e: 0 },
        profile: { name: '' },
        splits: [],
        reports: {},
        monthCount: 1,
        offers: [],
        cart: [],
        creditCards: [],
      },
      idCounts = new Map(),
      itemMap = new Map();
    const cleanRecords = (
      records: LedgerRecord[] | undefined,
      key: string,
    ): LedgerRecord[] =>
      list(records, key).flatMap((x) => {
        try {
          if (!object(x) || typeof x.d !== 'string' || !x.d.trim())
            throw Error('Lançamento incompleto');
          const v = workspace.oldAmount(x.v);
          if (v <= 0) throw Error('Valor deve ser positivo');
          const oldId = String(x.id ?? ''),
            id =
              /^[\w-]{1,100}$/.test(oldId) && !workspace.issuedIds.has(oldId)
                ? oldId
                : workspace.newId();
          workspace.issuedIds.add(id);
          if (key === 'items')
            idCounts.set(oldId, (idCounts.get(oldId) || 0) + 1);
          const date = workspace.supportedDate(x.date) ? x.date : '';
          if (x.date && !date)
            workspace.rejected(
              key,
              x,
              'Data inválida preservada como lançamento sem data',
            );
          const legacyMonth = isInteger(x.legacyMonth!)
            ? x.legacyMonth
            : isInteger(x.m)
              ? x.m!
              : 0;
          if (!date && (legacyMonth < 0 || legacyMonth >= workspace.MAX_MONTHS))
            throw Error('Mês fora do intervalo');
          const record: LedgerRecord = {
            id,
            d: x.d.trim().slice(0, 240),
            v,
            date,
            ...(!date ? { legacyMonth } : {}),
            ...(key === 'items'
              ? {
                  c: workspace.canonicalCategory(x.c),
                  ...(x.subscription === true || x.c === 'Assinaturas'
                    ? { subscription: true }
                    : {}),
                  p: includesValue(workspace.PAY, x.p)
                    ? x.p
                    : x.p === 'Cartão'
                      ? 'Cartão de crédito'
                      : 'Pix',
                }
              : {}),
          };
          if (
            key === 'items' &&
            record.p === 'Cartão de crédito' &&
            /^[\w-]{1,100}$/.test(x.creditCardId || '')
          ) {
            record.creditCardId = x.creditCardId;
            record.creditPaid = x.creditPaid === true;
            if (
              isSafeInteger(x.creditPaidCents) &&
              x.creditPaidCents >= 0 &&
              x.creditPaidCents <=
                (isSafeInteger(x.creditChargeCents) && x.creditChargeCents > 0
                  ? x.creditChargeCents
                  : Math.round(v * 100))
            )
              record.creditPaidCents = x.creditPaidCents;
            if (
              isSafeInteger(x.creditChargeCents) &&
              x.creditChargeCents > 0 &&
              x.creditChargeCents <= workspace.MAX_CENTS
            )
              record.creditChargeCents = x.creditChargeCents;
          }
          if (x.recurrenceId) {
            if (
              /^[\w-]{1,100}$/.test(String(x.recurrenceId)) &&
              isInteger(x.recurrenceCount) &&
              x.recurrenceCount > 1 &&
              x.recurrenceCount <= workspace.MAX_MONTHS &&
              isInteger(x.recurrenceIndex) &&
              x.recurrenceIndex >= 0 &&
              x.recurrenceIndex < x.recurrenceCount &&
              workspace.supportedDate(x.recurrenceOrigin) &&
              workspace.monthIndexFromDate(x.recurrenceOrigin) +
                x.recurrenceIndex <
                workspace.MAX_MONTHS &&
              record.date ===
                workspace.monthlyExpenseDate(
                  x.recurrenceOrigin,
                  x.recurrenceIndex,
                )
            )
              Object.assign(record, {
                recurrenceId: x.recurrenceId,
                recurrenceIndex: x.recurrenceIndex,
                recurrenceCount: x.recurrenceCount,
                recurrenceOrigin: x.recurrenceOrigin,
                ...(x.recurrenceStopped ? { recurrenceStopped: true } : {}),
              });
            else
              workspace.rejected(
                key,
                x,
                'Metadados de repetição inválidos; gasto preservado sem repetição',
              );
          }
          if (
            key === 'receipts' &&
            includesValue(['salary', 'monthly', 'once'], x.incomeKind)
          )
            record.incomeKind = x.incomeKind;
          if (key === 'items' && !itemMap.has(oldId))
            itemMap.set(oldId, record);
          return [record];
        } catch (e) {
          workspace.rejected(key, x, errorDetails(e).message);
          return [];
        }
      });
    const cardIds = new Set();
    state.creditCards = list(raw.creditCards, 'creditCards')
      .slice(0, 100)
      .flatMap((x) => {
        try {
          const card = normalizeCreditCard(x);
          if (cardIds.has(card.id)) throw Error('Cartão duplicado.');
          cardIds.add(card.id);
          return [card];
        } catch (e) {
          workspace.rejected('creditCards', x, errorDetails(e).message);
          return [];
        }
      });
    state.items = cleanRecords(raw.items, 'items') as Expense[];
    state.receipts = cleanRecords(raw.receipts, 'receipts');
    state.debts = list(raw.debts, 'debts').flatMap((x) => {
      try {
        if (!object(x) || typeof x.n !== 'string' || !x.n.trim())
          throw Error('Dívida incompleta');
        const v = workspace.oldAmount(x.v);
        if (
          v <= 0 ||
          !isInteger(x.p) ||
          x.p < 1 ||
          x.p > workspace.MAX_MONTHS ||
          !isInteger(x.s) ||
          x.s < 0 ||
          x.s + x.p > workspace.MAX_MONTHS
        )
          throw Error('Parcelamento fora do intervalo');
        const paid = x.paid ?? 0;
        if (!isInteger(paid) || paid < 0 || paid > x.p)
          throw Error('Parcelas pagas inválidas');
        return [
          {
            n: x.n.trim().slice(0, 240),
            v,
            p: x.p,
            s: x.s,
            paid,
            ...(/^sd-[a-f0-9-]{36}$/.test(x.sharedRef || '')
              ? { sharedRef: x.sharedRef }
              : {}),
          },
        ];
      } catch (e) {
        workspace.rejected('debts', x, errorDetails(e).message);
        return [];
      }
    });
    list(raw.limits, 'limits')
      .slice(0, workspace.MAX_MONTHS)
      .forEach((record, i) => {
        state.limits[i] = {};
        if (!object(record)) return;
        for (const [key, value] of Object.entries(record)) {
          try {
            const category = workspace.canonicalCategory(key),
              v = workspace.oldAmount(value, workspace.MAX_CENTS * 20);
            if (v > 0)
              state.limits[i][category] =
                (workspace.toCents(state.limits[i][category] || 0) +
                  workspace.toCents(v)) /
                100;
          } catch (e) {
            workspace.rejected(
              'limits',
              { i, key, value },
              errorDetails(e).message,
            );
          }
        }
      });
    try {
      if (object(raw.goal)) {
        const v = workspace.oldAmount(raw.goal.v);
        if (
          !isInteger(raw.goal.e) ||
          raw.goal.e < 0 ||
          raw.goal.e >= workspace.MAX_MONTHS
        )
          throw Error('Prazo inválido');
        state.goal = { v, e: raw.goal.e };
        if (
          includesValue(['months', 'date'], raw.goal.mode) &&
          workspace.supportedDate(raw.goal.date)
        ) {
          Object.assign(state.goal, {
            e: workspace.monthIndexFromDate(raw.goal.date),
            mode: raw.goal.mode,
            date: raw.goal.date,
            months:
              isInteger(raw.goal.months) &&
              raw.goal.months > 0 &&
              raw.goal.months <= workspace.MAX_MONTHS
                ? raw.goal.months
                : 1,
          });
        }
      }
    } catch (e) {
      workspace.rejected('goal', raw.goal, errorDetails(e).message);
    }
    if (object(raw.profile) && typeof raw.profile.name === 'string')
      state.profile.name = raw.profile.name.slice(0, 60);
    state.splits = list(raw.splits, 'splits').flatMap((x) => {
      try {
        if (
          !object(x) ||
          typeof x.name !== 'string' ||
          !x.name.trim() ||
          !isSafeInteger(x.cents) ||
          x.cents < 1 ||
          x.cents > workspace.MAX_CENTS ||
          !Array.isArray(x.people) ||
          x.people.length < 2 ||
          x.people.length > 100 ||
          x.people.some(
            (p) => typeof p !== 'string' || !p.trim() || p.length > 100,
          )
        )
          throw Error('Divisão inválida');
        const oldId = String(x.id ?? ''),
          id =
            /^[\w-]{1,100}$/.test(oldId) && !workspace.issuedIds.has(oldId)
              ? oldId
              : workspace.newId();
        workspace.issuedIds.add(id);
        const ownIndex = x.ownIndex ?? 0;
        if (!isInteger(ownIndex) || ownIndex < 0 || ownIndex >= x.people.length)
          throw Error('Participante inválido');
        const oldExpense = String(x.expenseId ?? ''),
          expense =
            idCounts.get(oldExpense) === 1 ? itemMap.get(oldExpense) : null,
          expected = workspace.splitShares(
            x.cents,
            x.people.length,
            x.shareOffset ?? 0,
          )[ownIndex];
        let expenseId = expense?.id || null,
          status = x.status || '';
        if (
          expense &&
          (workspace.toCents(expense.v) !== expected || expense.splitId)
        ) {
          expenseId = null;
          status =
            'Vínculo antigo inconsistente. A despesa foi preservada; refaça a divisão se necessário.';
          workspace.rejected('splits', x, status);
        }
        if (expenseId) expense.splitId = id;
        return [
          {
            id,
            name: x.name.trim().slice(0, 240),
            cents: x.cents,
            shareOffset: x.shareOffset ?? 0,
            people: x.people.map((p) => p.trim()),
            ownIndex,
            date: workspace.supportedDate(x.date) ? x.date : '',
            expenseId,
            status,
            paid: x.people.map((_, i) => x.paid?.[i] === true),
          },
        ];
      } catch (e) {
        workspace.rejected('splits', x, errorDetails(e).message);
        return [];
      }
    });
    if (object(raw.reports))
      for (const [key, r] of Object.entries(raw.reports)) {
        try {
          if (
            workspace.indexFromKey(key) < 0 ||
            workspace.indexFromKey(key) >= workspace.MAX_MONTHS ||
            !object(r) ||
            r.key !== key ||
            ![r.incomeCents, r.expenseCents, r.debtCents, r.balanceCents].every(
              Number.isSafeInteger,
            ) ||
            !Array.isArray(r.categories) ||
            !Array.isArray(r.expenses) ||
            !Array.isArray(r.receipts) ||
            !r.categories.every(
              (c) =>
                object(c) &&
                typeof c.name === 'string' &&
                isSafeInteger(c.cents),
            ) ||
            ![...r.expenses, ...r.receipts].every(
              (t) =>
                object(t) &&
                typeof t.d === 'string' &&
                Number.isFinite(t.v) &&
                (!t.date || workspace.validDate(t.date)),
            )
          )
            throw Error('Relatório inválido');
          state.reports[key] = workspace.migrateReportCategories(r);
        } catch (e) {
          workspace.rejected('reports', r, errorDetails(e).message);
        }
      }
    // Compras planejadas e ofertas usam centavos explícitos, inclusive nos backups.
    for (const key of ['cart', 'offers'] as const) {
      const cleaned = list<Partial<ShoppingPlan & ShoppingOffer>>(
        raw[key],
        key,
      ).flatMap((x) => {
        try {
          return [
            workspace.validateShopping(
              { ...x, category: workspace.canonicalCategory(x.category || '') },
              key,
              true,
            ),
          ];
        } catch (e) {
          workspace.rejected(key, x, errorDetails(e).message);
          return [];
        }
      });
      if (key === 'cart') state.cart = cleaned as ShoppingPlan[];
      else state.offers = cleaned as ShoppingOffer[];
    }
    const indices = [
      0,
      ...state.items.map((x) =>
        x.date ? workspace.monthIndexFromDate(x.date) : x.legacyMonth!,
      ),
      ...state.receipts.map((x) =>
        x.date ? workspace.monthIndexFromDate(x.date) : x.legacyMonth!,
      ),
      ...state.debts.map((d) => d.s + d.p - 1),
      ...state.limits.map((l, i) => (Object.keys(l).length ? i : 0)),
      state.goal.e,
    ];
    const stored =
      isInteger(raw.monthCount) &&
      raw.monthCount > 0 &&
      raw.monthCount <= workspace.MAX_MONTHS
        ? raw.monthCount
        : 1;
    state.monthCount = Math.max(stored, ...indices.map((i) => i + 1));
    return state;
  }

  function convertMoney(
    state: WorkspaceSnapshot,
    direction: 'encode' | 'decode',
  ) {
    const next = JSON.parse(JSON.stringify(state)),
      convert =
        direction === 'encode'
          ? workspace.toCents
          : (v: unknown) => {
              return isSafeInteger(v) && Math.abs(v) <= workspace.MAX_CENTS
                ? v / 100
                : NaN;
            };
    for (const key of ['items', 'receipts', 'debts'])
      for (const x of Array.isArray(next[key]) ? next[key] : [])
        if (x && typeof x === 'object') x.v = convert(x.v);
    for (const row of Array.isArray(next.limits) ? next.limits : [])
      if (row && typeof row === 'object')
        for (const key of Object.keys(row))
          row[key] =
            direction === 'encode'
              ? workspace.toCents(row[key])
              : isSafeInteger(row[key]) &&
                  row[key] >= 0 &&
                  row[key] <= workspace.MAX_CENTS * 20
                ? row[key] / 100
                : NaN;
    if (next.goal) next.goal.v = convert(next.goal.v);
    return next;
  }

  function refreshMonths() {
    if (
      !isInteger(workspace.monthCount) ||
      workspace.monthCount < 1 ||
      workspace.monthCount > workspace.MAX_MONTHS
    )
      throw Error('Limite de ' + workspace.MAX_MONTHS + ' meses atingido.');
    workspace.M = Array.from({ length: workspace.monthCount }, (_, i) =>
      workspace.monthLabelFromKey(workspace.monthKeyForIndex(i)),
    );
    while (workspace.LIM.length < workspace.monthCount) workspace.LIM.push({});
  }

  function snapshot() {
    return {
      items: workspace.S.items,
      receipts: workspace.S.receipts,
      debts: workspace.DEBTS,
      limits: workspace.LIM,
      goal: workspace.GOAL,
      profile: workspace.PROFILE,
      splits: workspace.SPLITS,
      reports: workspace.CLOSED_REPORTS,
      monthCount: workspace.monthCount,
      cart: workspace.CART,
      offers: workspace.OFFERS,
      creditCards: workspace.CARDS,
    };
  }

  function restore(state: WorkspaceSnapshot) {
    workspace.S.items = state.items;
    workspace.S.receipts = state.receipts;
    workspace.DEBTS = state.debts;
    workspace.LIM = state.limits;
    workspace.GOAL = state.goal;
    workspace.PROFILE = state.profile;
    workspace.SPLITS = state.splits;
    workspace.CLOSED_REPORTS = state.reports;
    workspace.monthCount = state.monthCount;
    workspace.CART = state.cart;
    workspace.OFFERS = state.offers;
    workspace.CARDS = state.creditCards || [];
    workspace.refreshMonths();
    workspace.S.m = Math.min(workspace.S.m, workspace.M.length - 1);
  }

  function isMonthClosed(
    m: number,
    reports = workspace.CLOSED_REPORTS,
    date = workspace.todayISO(),
  ) {
    return (
      m >= 0 &&
      (m < workspace.monthIndexFromDate(date) ||
        !!reports?.[workspace.monthKeyForIndex(m)])
    );
  }

  function requireOpenDate(date: string) {
    if (
      !workspace.supportedDate(date) ||
      workspace.isMonthClosed(workspace.monthIndexFromDate(date))
    )
      throw Error(
        'Mês encerrado: disponível somente para visualização. Escolha um mês aberto.',
      );
  }

  function assertClosedUnchanged(
    before: WorkspaceSnapshot,
    after: WorkspaceSnapshot,
  ) {
    if (workspace.allowClosedReset) return;
    const closed = (x: { date: string; legacyMonth?: number }) =>
        workspace.isMonthClosed(workspace.itemMonthIndex(x), before.reports),
      canonical = (x: object) =>
        JSON.stringify(
          Object.fromEntries(
            Object.entries(x)
              .filter(
                ([k]) =>
                  ![
                    'creditPaid',
                    'creditPaidCents',
                    'recurrenceStopped',
                    'paid',
                    'status',
                  ].includes(k),
              )
              .sort(([a], [b]) => a.localeCompare(b)),
          ),
        );
    for (const key of ['items', 'receipts', 'splits'] as const) {
      const fingerprint = (list: { date: string; legacyMonth?: number }[]) =>
        (list || []).filter(closed).map(canonical).sort();
      if (
        JSON.stringify(fingerprint(before[key])) !==
        JSON.stringify(fingerprint(after[key]))
      )
        throw Error(
          'Mês encerrado: os lançamentos estão disponíveis somente para visualização.',
        );
    }
    for (
      let m = 0;
      m < Math.max(before.limits?.length || 0, after.limits?.length || 0);
      m++
    )
      if (
        workspace.isMonthClosed(m, before.reports) &&
        canonical(before.limits?.[m] || {}) !==
          canonical(after.limits?.[m] || {})
      )
        throw Error('Não é possível alterar limites de um mês encerrado.');
    for (const [key, report] of Object.entries(before.reports || {}))
      if (JSON.stringify(report) !== JSON.stringify(after.reports?.[key]))
        throw Error('O relatório de um mês encerrado não pode ser alterado.');
  }

  function writeStorage(key: string, text: string) {
    try {
      workspace.localStorage.setItem(key, text);
    } catch {
      throw Error(
        'Não foi possível salvar neste navegador. Libere espaço ou exporte um backup; a alteração não foi aplicada.',
      );
    }
  }

  function persist() {
    workspace.assertClosedUnchanged(
      workspace.savedMonthBaseline,
      workspace.snapshot(),
    );
    if (workspace.readBlocked)
      throw Error(
        'Os dados precisam ser recuperados antes de salvar. Exporte o backup e recarregue.',
      );
    const current = workspace.localStorage.getItem(workspace.WORKSPACE_KEY);
    if (current !== workspace.storageBase)
      throw Error(
        'Os dados foram alterados em outra aba. Recarregue antes de salvar novamente.',
      );
    if (
      !workspace.backupReady &&
      Object.keys(workspace.rawSource).some((k) =>
        workspace.LEGACY_KEYS.includes(k),
      )
    ) {
      workspace.writeStorage(
        workspace.BACKUP_KEY,
        JSON.stringify({
          createdAt: new Date().toISOString(),
          raw: workspace.rawSource,
        }),
      );
      workspace.backupReady = true;
    }
    if (
      workspace.storageBase &&
      JSON.parse(workspace.storageBase).categoryVersion !== 2 &&
      !workspace.localStorage.getItem('plan12categories_before_v2')
    )
      workspace.writeStorage(
        'plan12categories_before_v2',
        workspace.storageBase,
      );
    const record = {
      schemaVersion: 3,
      categoryVersion: 2,
      moneyUnit: 'centavos',
      data: workspace.convertMoney(workspace.snapshot(), 'encode'),
      recovery: [...workspace.bootRecovery, ...workspace.recovery],
    };
    const text = JSON.stringify(record);
    try {
      workspace.localStorage.setItem(workspace.WORKSPACE_KEY, text);
    } catch {
      throw Error(
        'Não foi possível salvar neste navegador. Libere espaço ou exporte um backup; a alteração não foi aplicada.',
      );
    }
    workspace.storageBase = text;
    workspace.savedMonthBaseline = JSON.parse(
      JSON.stringify(workspace.snapshot()),
    );
    workspace.saveNumber++;
    globalThis.planCloud?.capture(text);
    requestFinancePublish();
  }

  function atomic<T>(action: () => T): T {
    if (workspace.scope.disposed)
      throw Error('Sessão encerrada. Reabra o aplicativo.');
    if (workspace.transactionDepth) return action();
    const before = JSON.parse(JSON.stringify(workspace.snapshot())),
      ui = {
        m: workspace.S.m,
        calDate: workspace.S.calDate,
        tab: workspace.S.tab,
        goal: workspace.S.goal,
      };
    workspace.transactionDepth = 1;
    workspace.pendingSave = false;
    workspace.drawPending = false;
    let value;
    try {
      value = action();
      if (workspace.pendingSave) {
        workspace.assertClosedUnchanged(before, workspace.snapshot());
        workspace.persist();
      }
    } catch (e) {
      workspace.transactionDepth = 0;
      workspace.pendingSave = false;
      workspace.drawPending = false;
      workspace.restore(before);
      Object.assign(workspace.S, ui);
      throw e;
    }
    workspace.transactionDepth = 0;
    const render = workspace.drawPending;
    workspace.drawPending = false;
    if (render) workspace.draw();
    return value;
  }

  function saveWorkspace() {
    if (workspace.transactionDepth) {
      workspace.pendingSave = true;
      return;
    }
    workspace.atomic(() => {
      workspace.pendingSave = true;
    });
  }

  function emptyFinancialSnapshot(state: WorkspaceSnapshot) {
    return {
      ...state,
      items: [],
      receipts: [],
      debts: [],
      limits: Array.from({ length: state.monthCount }, () => ({})),
      goal: { v: 0, e: Math.max(0, state.monthCount - 1) },
      splits: [],
      reports: {},
      cart: [],
      offers: [],
      creditCards: [],
    };
  }

  async function resetFinancialData() {
    if (
      window.planAuth.user &&
      ['conflict', 'updates', 'loading', 'error'].includes(
        window.planCloud?.state.mode,
      )
    )
      throw Error('Resolva a sincronização antes de zerar os dados.');
    const previousRecovery = [...workspace.recovery],
      previousBoot = [...workspace.bootRecovery];
    try {
      workspace.allowClosedReset = true;
      workspace.atomic(() => {
        workspace.recovery.length = 0;
        workspace.bootRecovery.length = 0;
        workspace.restore(
          workspace.emptyFinancialSnapshot(workspace.snapshot()),
        );
        workspace.saveWorkspace();
      });
    } catch (error) {
      workspace.recovery.push(...previousRecovery);
      workspace.bootRecovery.push(...previousBoot);
      throw error;
    } finally {
      workspace.allowClosedReset = false;
    }
    for (const key of [
      ...workspace.LEGACY_KEYS,
      workspace.BACKUP_KEY,
      'plan12categories_before_v2',
      'plan12carbon_v1',
      'plan12notifications',
      DISMISSED_NOTIFICATIONS_KEY,
      'plan12cloudcopies_v1',
    ]) {
      try {
        workspace.localStorage.removeItem?.(key);
      } catch {}
    }
    Object.keys(workspace.rawSource).forEach(
      (key) => delete workspace.rawSource[key],
    );
    workspace.editPlanId = '';
    workspace.purchaseReview = null;
    workspace.csvPreview = null;
    workspace.behaviorAdvice = null;
    workspace.behaviorError = null;
    workspace.renderNotifications();
    const result = await window.planCloud?.flush();
    try {
      await window.planClearTaxData?.();
    } catch {
      return 'Dados financeiros zerados. Não foi possível apagar as análises tributárias; tente novamente conectado.';
    }
    // Keep the confirmation component mounted until it can report completion.
    return window.planAuth.user && result?.mode !== 'synced'
      ? 'Dados zerados neste aparelho. A sincronização está pendente; confira a conexão e as configurações.'
      : 'Dados financeiros zerados.';
  }

  function put(key: string, value: unknown) {
    if (['plan12appearance', 'plan12notifications'].includes(key)) {
      try {
        workspace.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        throw Error('Não foi possível salvar a aparência.');
      }
      return;
    }
    workspace.saveWorkspace();
  }
  return {
    readRaw,
    parseRaw,
    rejected,
    oldAmount,
    cleanWorkspace,
    convertMoney,
    refreshMonths,
    snapshot,
    restore,
    isMonthClosed,
    requireOpenDate,
    assertClosedUnchanged,
    writeStorage,
    persist,
    atomic,
    saveWorkspace,
    emptyFinancialSnapshot,
    resetFinancialData,
    put,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'readRaw'
    | 'parseRaw'
    | 'rejected'
    | 'oldAmount'
    | 'cleanWorkspace'
    | 'convertMoney'
    | 'refreshMonths'
    | 'snapshot'
    | 'restore'
    | 'isMonthClosed'
    | 'requireOpenDate'
    | 'assertClosedUnchanged'
    | 'writeStorage'
    | 'persist'
    | 'atomic'
    | 'saveWorkspace'
    | 'emptyFinancialSnapshot'
    | 'resetFinancialData'
    | 'put'
  >;
}

export function initializePersistence(workspace: PersistenceContext) {
  // @workspace-step 51 FirstStatement
  workspace.recovery = [];
  workspace.rawSource = {};
  // @workspace-end 51
  // @workspace-step 52 FirstStatement
  workspace.readBlocked = false;
  workspace.storageBase = null;
  workspace.backupReady = false;
  workspace.noticeMessage = '';
  workspace.noticeError = false;
  // @workspace-end 52

  // @workspace-step 55 FirstStatement
  workspace.load = <T,>(
    key: string,
    fallback: T,
    ok: (value: T) => unknown,
  ): T => {
    try {
      const value = JSON.parse(workspace.localStorage.getItem(key) || 'null');
      return ok(value) ? value : fallback;
    } catch {
      return fallback;
    }
  };
  // @workspace-end 55

  // @workspace-step 60 ExpressionStatement
  workspace.LEGACY_KEYS.forEach(workspace.readRaw);
  // @workspace-end 60
  // @workspace-step 61 ExpressionStatement
  workspace.storageBase = workspace.readRaw(workspace.WORKSPACE_KEY);
  // @workspace-end 61
  // @workspace-step 62 ExpressionStatement
  workspace.backupReady = workspace.readRaw(workspace.BACKUP_KEY) !== null;
  // @workspace-end 62
  // @workspace-step 63 ExpressionStatement
  workspace.readRaw('plan12categories_before_v2');
  // @workspace-end 63
  // @workspace-step 64 FirstStatement
  // boot is initialized by the following hydration phase.
  // @workspace-end 64
  // @workspace-step 65 IfStatement
  if (workspace.storageBase !== null) {
    try {
      const record = JSON.parse(workspace.storageBase);
      if (
        record.schemaVersion !== 3 ||
        record.moneyUnit !== 'centavos' ||
        !record.data
      )
        throw Error('Formato desconhecido');
      workspace.boot = workspace.cleanWorkspace(
        workspace.convertMoney(record.data, 'decode'),
      );
    } catch (e) {
      workspace.readBlocked = true;
      workspace.noticeMessage =
        'O arquivo de dados deste navegador precisa de recuperação. Exporte o backup antes de continuar.';
      workspace.noticeError = true;
      workspace.rejected(
        workspace.WORKSPACE_KEY,
        workspace.storageBase,
        errorDetails(e).message,
      );
      workspace.boot = workspace.cleanWorkspace({});
    }
  } else {
    workspace.boot = workspace.cleanWorkspace({
      items: workspace.parseRaw('plan12', []),
      receipts: workspace.parseRaw('plan12receipts', []),
      debts: workspace.parseRaw('plan12debts', []),
      limits: workspace.parseRaw('plan12lim', []),
      goal: workspace.parseRaw('plan12goal', { v: 0, e: 0 }),
      profile: workspace.parseRaw('plan12profile', { name: '' }),
      splits: workspace.parseRaw('plan12splits', []),
      reports: workspace.parseRaw('plan12closedReports', {}),
      monthCount: workspace.parseRaw('plan12monthCount', 1),
    });
  }
  // @workspace-end 65
  // @workspace-step 66 FirstStatement
  workspace.LIM = workspace.boot.limits;
  workspace.GOAL = workspace.boot.goal;
  workspace.DEBTS = workspace.boot.debts;
  workspace.PROFILE = workspace.boot.profile;
  workspace.SPLITS = workspace.boot.splits;
  workspace.CLOSED_REPORTS = workspace.boot.reports;
  workspace.monthCount = Math.max(
    workspace.boot.monthCount,
    Math.min(
      workspace.MAX_MONTHS,
      workspace.monthIndexFromDate(workspace.todayISO()) + 1,
    ),
  );
  workspace.CART = workspace.boot.cart;
  workspace.OFFERS = workspace.boot.offers;
  workspace.CARDS = workspace.boot.creditCards;
  // @workspace-end 66
  // @workspace-step 67 FirstStatement
  workspace.M = [];
  workspace.chartMetric = 'i';
  workspace.entryFilter = 'all';
  // @workspace-end 67

  // @workspace-step 69 ExpressionStatement
  workspace.refreshMonths();
  // @workspace-end 69
  // @workspace-step 70 FirstStatement
  workspace.S = {
    m: Math.min(
      Math.max(0, workspace.monthIndexFromDate(workspace.todayISO())),
      workspace.monthCount - 1,
    ),
    tab: 'r',
    goal: false,
    q: '',
    items: workspace.boot.items,
    receipts: workspace.boot.receipts,
    calDate: workspace.defaultDateForMonth(0),
    bank: false,
  };
  // @workspace-end 70
  // @workspace-step 71 FirstStatement
  workspace.transactionDepth = 0;
  workspace.pendingSave = false;
  workspace.drawPending = false;
  workspace.saveNumber = 0;
  workspace.allowClosedReset = false;
  // @workspace-end 71
  // @workspace-step 72 FirstStatement
  workspace.savedMonthBaseline = JSON.parse(
    JSON.stringify(workspace.snapshot()),
  );
  // @workspace-end 72

  // @workspace-step 80 FirstStatement
  workspace.bootRecovery =
    workspace.storageBase !== null
      ? (() => {
          try {
            const data = JSON.parse(workspace.storageBase).recovery;
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })()
      : [];
  // @workspace-end 80

  // @workspace-step 85 EmptyStatement
  // @workspace-end 85

  // @workspace-step 87 FirstStatement
  workspace.saveI = workspace.saveWorkspace;
  workspace.saveReceipts = workspace.saveWorkspace;
  workspace.saveL = workspace.saveWorkspace;
  workspace.saveG = workspace.saveWorkspace;
  workspace.saveD = workspace.saveWorkspace;
  workspace.saveMonthCount = workspace.saveWorkspace;
  // @workspace-end 87
}
