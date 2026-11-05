import type { PurchasePlan } from '../../types/calculations';
import { includesValue } from '../../services/type-guards';
import { isSafeInteger, isInteger } from '../../services/type-guards.ts';
import type {
  Expense,
  ShoppingPlan,
  ShoppingOffer,
} from '../../types/workspace';
import { core_planSchedule, core_planProjection } from '../calculations.ts';
import type { WorkspaceRuntime } from './contracts';

type PurchasesContext = Pick<
  WorkspaceRuntime,
  | 'CARDS'
  | 'CART'
  | 'CATS'
  | 'MAX_CENTS'
  | 'MAX_MONTHS'
  | 'MAX_RECORDS'
  | 'MIG'
  | 'S'
  | 'SPLITS'
  | 'atomic'
  | 'engineContext'
  | 'ensureDate'
  | 'issuedIds'
  | 'monthIndexFromDate'
  | 'newId'
  | 'planSchedule'
  | 'registerSplit'
  | 'safeProductUrl'
  | 'saveWorkspace'
  | 'supportedDate'
  | 'todayISO'
  | 'validateShopping'
>;

export function createPurchases(workspace: PurchasesContext) {
  function safeProductUrl(value: unknown) {
    if (!value) return '';
    try {
      const u = new URL(String(value));
      if (u.protocol !== 'https:' || u.username || u.password) throw 0;
      return u.href;
    } catch {
      throw Error('Use um link HTTPS válido.');
    }
  }

  function validateShopping(
    x: Partial<ShoppingPlan & ShoppingOffer>,
    kind: 'cart',
    loading?: boolean,
  ): ShoppingPlan;

  function validateShopping(
    x: Partial<ShoppingPlan & ShoppingOffer>,
    kind: string,
    loading?: boolean,
  ): ShoppingPlan | ShoppingOffer;

  function validateShopping(
    x: Partial<ShoppingPlan & ShoppingOffer>,
    kind: string,
    loading = false,
  ): ShoppingPlan | ShoppingOffer {
    if (x && typeof x === 'object')
      x = { ...x, category: workspace.MIG[x.category || ''] || x.category };
    if (
      !x ||
      typeof x !== 'object' ||
      typeof x.name !== 'string' ||
      !x.name.trim() ||
      x.name.length > 120
    )
      throw Error('Informe um nome de até 120 caracteres.');
    const money = (n: unknown, positive = false) => {
      if (
        !isSafeInteger(n) ||
        n < (positive ? 1 : 0) ||
        n > workspace.MAX_CENTS
      )
        throw Error('Revise os valores, com até duas casas decimais.');
      return n;
    };
    const hasId = typeof x.id === 'string' && /^[\w-]{1,100}$/.test(x.id),
      id = hasId ? x.id : workspace.newId();
    if (x.creditCardId && !/^[\w-]{1,100}$/.test(x.creditCardId))
      throw Error('Cartão inválido.');
    if (
      x.creditCardId &&
      !loading &&
      !workspace.CARDS.some((c) => c.id === x.creditCardId && c.active)
    )
      throw Error('Escolha um cartão ativo para a compra.');
    const base = {
      id,
      name: x.name.trim(),
      url: workspace.safeProductUrl(x.url),
      ...(x.creditCardId ? { creditCardId: x.creditCardId } : {}),
    };
    if (
      !isSafeInteger(x.priceCents! + x.shippingCents!) ||
      x.priceCents! + x.shippingCents! > workspace.MAX_CENTS
    )
      throw Error('O total ultrapassa o limite permitido.');
    if (loading) {
      if (hasId && workspace.issuedIds.has(id))
        throw Error('Identificador duplicado.');
      workspace.issuedIds.add(id);
    }
    if (kind === 'cart') {
      if (
        !workspace.supportedDate(x.date) ||
        !isInteger(x.installments) ||
        x.installments < 1 ||
        x.installments > 24 ||
        workspace.monthIndexFromDate(x.date) + x.installments >
          workspace.MAX_MONTHS
      )
        throw Error('Revise a data e as parcelas (até 24).');
      if (
        !includesValue(['alta', 'normal', 'baixa'], x.priority) ||
        !includesValue(workspace.CATS, x.category)
      )
        throw Error('Revise a prioridade e a categoria.');
      if (
        x.people !== undefined &&
        (!Array.isArray(x.people) ||
          x.people.length > 99 ||
          x.people.some(
            (n: string) => typeof n !== 'string' || !n.trim() || n.length > 100,
          ))
      )
        throw Error('Informe até 99 outras pessoas.');
      if (
        x.status === 'purchased' &&
        (!x.purchase ||
          !workspace.supportedDate(x.purchase.date) ||
          ![
            x.purchase.totalCents,
            x.purchase.ownCents,
            x.purchase.targetCents,
          ].every(
            (n) => isSafeInteger(n) && n >= 0 && n <= workspace.MAX_CENTS,
          ))
      )
        throw Error('Histórico de compra inválido');
      if (x.productGoal === true) {
        if (!includesValue(['save', 'cash', 'credit'], x.goalMode))
          throw Error('Escolha como pretende comprar.');
        money(x.monthlyReserveCents);
        if (
          x.goalMode === 'save' &&
          x.reservedCents! < x.priceCents! + x.shippingCents! &&
          x.monthlyReserveCents! < 1
        )
          throw Error('Informe a reserva mensal.');
        if (x.goalMode === 'credit' && !x.creditCardId && !loading)
          throw Error('Selecione um cartão para simular o crédito.');
        if (x.goalMode !== 'credit' && x.installments !== 1)
          throw Error('Parcelas somente no crédito.');
      }
      return {
        ...base,
        ...(x.productGoal === true
          ? {
              productGoal: true,
              goalMode: x.goalMode,
              monthlyReserveCents: x.monthlyReserveCents,
            }
          : {}),
        image: workspace.safeProductUrl(x.image || ''),
        specs: Array.isArray(x.specs)
          ? x.specs
              .filter((v) => typeof v === 'string')
              .slice(0, 8)
              .map((v) => v.slice(0, 180))
          : [],
        targetCents: money(x.targetCents, true),
        priceCents: money(x.priceCents, true),
        shippingCents: money(x.shippingCents),
        reservedCents: money(x.reservedCents),
        date: x.date,
        installments: x.installments,
        priority: x.priority,
        category: x.category,
        goal: !!x.goal,
        affiliate: !!x.affiliate,
        people: (x.people || []).map((n: string) => n.trim()),
        status: x.status === 'purchased' ? 'purchased' : 'planned',
        purchase: x.status === 'purchased' ? x.purchase || null : null,
      } as ShoppingPlan;
    }
    if (
      typeof x.planId !== 'string' ||
      typeof x.store !== 'string' ||
      !['Amazon', 'Mercado Livre', 'TikTok Shop', 'Outra loja'].includes(
        x.store,
      ) ||
      typeof x.condition !== 'string' ||
      x.condition.length > 240 ||
      !workspace.supportedDate(x.checkedOn)
    )
      throw Error('Revise a loja, a compra vinculada e a data da consulta.');
    return {
      ...base,
      planId: x.planId,
      store: x.store,
      priceCents: money(x.priceCents, true),
      shippingCents: money(x.shippingCents),
      condition: x.condition.trim(),
      checkedOn: x.checkedOn,
      affiliate: !!x.affiliate,
    } as ShoppingOffer;
  }

  function saveShopping(record: Partial<ShoppingPlan>, kind: string) {
    if (kind !== 'cart')
      throw Error('Ofertas estará disponível após a integração.');
    return workspace.atomic(() => {
      const list = workspace.CART,
        old = record.id ? list.find((x) => x.id === record.id) : null;
      if (record.id && !old) throw Error('Registro não encontrado.');
      if (old?.status === 'purchased')
        throw Error('Uma compra confirmada não pode ser alterada aqui.');
      if (!old && list.length >= workspace.MAX_RECORDS)
        throw Error('Limite de registros atingido.');
      const next = workspace.validateShopping(
        { ...record, id: old?.id || workspace.newId() },
        'cart',
      );
      workspace.planSchedule(next);
      if (old) {
        Object.assign(old, next);
        if (!next.creditCardId) delete old.creditCardId;
      } else list.push(next);
      workspace.saveWorkspace();
      return next;
    });
  }

  function planSchedule(plan: PurchasePlan) {
    return core_planSchedule(workspace.engineContext, plan);
  }

  function planProjection(plan: PurchasePlan) {
    return core_planProjection(workspace.engineContext, plan);
  }

  function confirmPlannedPurchase(
    id: string | undefined,
    confirmed: boolean,
    expected: string | undefined,
    selectedCard?: string,
  ) {
    return workspace.atomic(() => {
      if (confirmed !== true)
        throw Error('Confirme a compra antes de registrar os gastos.');
      const plan = workspace.CART.find((x) => x.id === id);
      if (!plan || plan.status !== 'planned')
        throw Error('Esta compra já foi confirmada ou removida.');
      if (expected !== JSON.stringify(plan))
        throw Error('O planejamento mudou. Revise a compra novamente.');
      if (selectedCard !== undefined) {
        if (
          selectedCard &&
          !workspace.CARDS.some((c) => c.id === selectedCard && c.active)
        )
          throw Error('Escolha um cartão ativo para a compra.');
        plan.creditCardId = selectedCard;
      }
      if (plan.installments > 1 && !plan.creditCardId)
        throw Error('Selecione um cartão cadastrado para a compra parcelada.');
      const schedule = workspace.planSchedule(plan);
      if (
        workspace.S.items.length + schedule.length > workspace.MAX_RECORDS ||
        (plan.people.length &&
          workspace.SPLITS.length + schedule.length > workspace.MAX_RECORDS)
      )
        throw Error('Limite de registros atingido.');
      const cardExpenses: {
        expense:
          | Expense
          | {
              id: string;
              d: string;
              v: number;
              c: string;
              p: string;
              date: string;
            };
        totalCents: number;
      }[] = [];
      schedule.forEach((x, i) => {
        workspace.ensureDate(x.date);
        const d =
          plan.name +
          (schedule.length > 1 ? ' · ' + (i + 1) + '/' + schedule.length : '');
        if (plan.people.length) {
          const split = workspace.registerSplit(
              d,
              x.totalCents,
              plan.people,
              x.date,
              x.shareOffset,
            ),
            expense = workspace.S.items.find((e) => e.id === split.expenseId);
          if (expense) {
            expense.c = plan.category;
            expense.p = plan.installments > 1 ? 'Cartão de crédito' : 'Pix';
            cardExpenses.push({ expense, totalCents: x.totalCents });
          }
        } else {
          const expense = {
            id: workspace.newId(),
            d,
            v: x.cents / 100,
            c: plan.category,
            p: plan.installments > 1 ? 'Cartão de crédito' : 'Pix',
            date: x.date,
          };
          workspace.S.items.push(expense);
          cardExpenses.push({ expense, totalCents: x.totalCents });
        }
      });
      if (plan.creditCardId) {
        if (
          !workspace.CARDS.some((c) => c.id === plan.creditCardId && c.active)
        )
          throw Error(
            'O cartão foi arquivado. Edite a compra antes de confirmar.',
          );
        const unrepresented =
          schedule.reduce((n, x) => n + x.totalCents, 0) -
          cardExpenses.reduce((n, x) => n + x.totalCents, 0);
        for (const [index, { expense, totalCents }] of cardExpenses.entries())
          Object.assign(expense, {
            p: 'Cartão de crédito',
            creditCardId: plan.creditCardId,
            creditPaid: false,
            creditChargeCents: totalCents + (index === 0 ? unrepresented : 0),
          });
      }
      plan.status = 'purchased';
      plan.purchase = {
        date: workspace.todayISO(),
        totalCents: plan.priceCents + plan.shippingCents,
        ownCents: schedule.reduce((n, x) => n + x.cents, 0),
        targetCents: plan.targetCents,
      };
      workspace.saveWorkspace();
      return plan;
    });
  }
  return {
    safeProductUrl,
    validateShopping,
    saveShopping,
    planSchedule,
    planProjection,
    confirmPlannedPurchase,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'safeProductUrl'
    | 'validateShopping'
    | 'saveShopping'
    | 'planSchedule'
    | 'planProjection'
    | 'confirmPlannedPurchase'
  >;
}
