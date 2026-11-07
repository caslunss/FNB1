import {validateFriendsLedger,emptyFriendsLedger} from '../../services/friends-ledger';
import {reserveUsernameChange} from '../../services/username-policy';
import {readForecastSource} from './forecast-source';
import { isSafeInteger } from '../../services/type-guards.ts';
import type { ShoppingPlan } from '../../types/workspace';
import type { ProductGoal } from '../../types/finance-runtime';
import { finance } from '../../services/finance-runtime.ts';
import {
  normalizeCreditCard,
  cardBalances,
  allocateInvoicePayment,
  cardInvoice,
} from '../../services/credit.ts';
import { getLayout } from '../../services/layout-preferences.ts';
import type { WorkspaceRuntime } from './contracts';

type ServicesContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'PROFILE'
  | 'acceptedFriends'
  | 'friendCode'
  | 'usernames'
  | 'socialUser'
  | 'refreshUsernames'
  | 'saveIncome'
  | 'DEBTS'
  | 'CARDS'
  | 'CART'
  | 'CATS'
  | 'CLOSED_REPORTS'
  | 'GOAL'
  | 'MAX_CENTS'
  | 'MAX_MONTHS'
  | 'MAX_RECORDS'
  | 'S'
  | 'areaViews'
  | 'atomic'
  | 'canonicalCategory'
  | 'defaultDateForMonth'
  | 'draw'
  | 'isMonthClosed'
  | 'monthIndexFromDate'
  | 'monthKeyForIndex'
  | 'monthProjectionCents'
  | 'newId'
  | 'openAccountPanel'
  | 'openSheet'
  | 'parseMoney'
  | 'planProjection'
  | 'purchaseReview'
  | 'receiptsInMonth'
  | 'requireOpenDate'
  | 'resetFinancialData'
  | 'safely'
  | 'saveGoal'
  | 'saveShopping'
  | 'saveWorkspace'
  | 'selectAreaView'
  | 'showNotice'
  | 'toCents'
  | 'todayISO'
>;

export function initializeServices(workspace: ServicesContext) {
  finance.friends={getState:()=>({people:[...workspace.acceptedFriends().map(friend=>{const id=workspace.friendCode(friend);return{id,name:'@'+(workspace.usernames[id]||'amigo'),local:false}}),...(workspace.PROFILE.friendLedger?.localFriends||[]).map(friend=>({...friend,local:true}))],ledger:workspace.PROFILE.friendLedger||emptyFriendsLedger(),debts:finance.debtSources()}),saveLedger(value){const next=validateFriendsLedger(value);const allowed=new Set([...workspace.acceptedFriends().map(workspace.friendCode),...next.localFriends.map(friend=>friend.id)]);const previous=workspace.PROFILE.friendLedger||emptyFriendsLedger();for(const row of next.receivables)if(!allowed.has(row.friendId)&&!previous.receivables.some(old=>old.id===row.id&&old.friendId===row.friendId))throw Error('Selecione um amigo adicionado.');workspace.atomic(()=>{workspace.PROFILE.friendLedger=next;workspace.saveWorkspace()});dispatchEvent(new Event('plan-friends-ledger-change'))}};
  workspace.scope.listen(window,'plan-friends-ledger-change',()=>workspace.draw());
  finance.setup={getState:()=>({complete:workspace.PROFILE.onboardingComplete===true,name:workspace.PROFILE.name,username:workspace.usernames[workspace.socialUser()||'']||'',hasSalary:workspace.S.receipts.some(row=>row.incomeKind==='salary'),hasCards:workspace.CARDS.length>0,today:workspace.todayISO()}),async saveUsername(value){
   const username=value.trim().replace(/^@/,'').toLowerCase(),user=workspace.socialUser(),client=window.planAuth.client;
   if(!user||!client)throw Error('Entre com uma conta para escolher seu usuário.');if(!/^[a-z0-9_]{3,40}$/.test(username))throw Error('Use 3–40 letras, números ou _.');
   await workspace.refreshUsernames();if(workspace.scope.disposed||workspace.socialUser()!==user)throw Error('Sua sessão mudou. Entre novamente.');if(workspace.usernames[user]===username)return;const rollback=reserveUsernameChange();
   try{const result=await client.from('app_usernames').update({username}).eq('user_id',user).select('username').single();if(result.error)throw Error(result.error.code==='23505'?'Este usuário já está em uso.':'Não foi possível salvar seu usuário.');if(workspace.scope.disposed||workspace.socialUser()!==user)throw Error('Sua sessão mudou. Entre novamente.');workspace.usernames[user]=result.data.username}catch(error){rollback();throw error}
  },finish(input){if(workspace.PROFILE.onboardingComplete)return;if(!input.name.trim()||input.name.length>60)throw Error('Informe seu nome.');workspace.atomic(()=>{
   if(input.salaryCents!==undefined){if(workspace.S.receipts.some(row=>row.incomeKind==='salary'))throw Error('Salário já cadastrado. Edite em Lançamentos.');if(!Number.isSafeInteger(input.salaryCents)||input.salaryCents<1||!input.salaryDate)throw Error('Revise o salário e a data.');workspace.saveIncome({d:'Salário',v:input.salaryCents/100,date:input.salaryDate,incomeKind:'salary'},undefined,12)}
   if(input.card){if(workspace.CARDS.length>=100)throw Error('Limite de cartões atingido.');workspace.CARDS.push(normalizeCreditCard({...input.card,id:workspace.newId()}))}
   workspace.PROFILE.name=input.name.trim();workspace.PROFILE.onboardingComplete=true;workspace.saveWorkspace();
  });dispatchEvent(new Event('plan-profile-appearance-change'));workspace.draw()}};
  finance.forecast={getState:()=>readForecastSource(workspace)};
  workspace.scope.listen(window,'plan-forecast-settings-change',()=>workspace.draw());
  workspace.scope.listen(window,'plan-recurrence-decisions-change',()=>workspace.draw());
  // @workspace-step 329 ExpressionStatement
  finance.isMonthClosed = () => workspace.isMonthClosed(workspace.S.m);
  // @workspace-end 329
  // @workspace-step 330 ExpressionStatement
  finance.mobile = {
    getState: () => ({
      tab: workspace.S.tab,
      composeDebt:
        workspace.S.tab === 'd' && workspace.areaViews.commitments === 'debts',
      closed: workspace.isMonthClosed(workspace.S.m),
      sections: getLayout().sections,
    }),
    navigate(key) {
      if (
        !['r', 'd', 'o', 'e', 'f','a'].includes(key)
      )
        return;
      workspace.S.tab = key;
      scrollTo(0, 0);
      workspace.draw();
    },
    open: (panel, opener) => workspace.openAccountPanel(panel, opener),
    compose() {
      if (workspace.isMonthClosed(workspace.S.m)) return;
      workspace.openSheet({
        dataset: {
          k:
            workspace.S.tab === 'd' &&
            workspace.areaViews.commitments === 'debts'
              ? 'd'
              : 'launch',
          date: workspace.defaultDateForMonth(workspace.S.m),
        },
      });
    },
    rowAction(action, kind, id) {
      workspace.safely(() => {
        if (
          workspace.isMonthClosed(workspace.S.m) ||
          !['g', 'i'].includes(kind)
        )
          return;
        const item = (
          kind === 'g' ? workspace.S.items : workspace.S.receipts
        ).find((x) => String(x.id) === String(id));
        if (!item) return;
        if (item.splitId) throw Error('Altere esta divisão em Amigos.');
        if (action === 'edit') {
          workspace.openSheet({ dataset: { k: kind, id: item.id } });
          return;
        }
        if (action === 'delete') {
          workspace.atomic(() => {
            if (kind === 'g')
              workspace.S.items = workspace.S.items.filter(
                (x) => x.id !== item.id,
              );
            else
              workspace.S.receipts = workspace.S.receipts.filter(
                (x) => x.id !== item.id,
              );
            workspace.saveWorkspace();
          });
          workspace.draw();
        }
      });
    },
  };
  // @workspace-end 330
  // @workspace-step 331 ExpressionStatement
  finance.productGoals = {
    getState: () => ({
      goals: workspace.CART.filter(
        (x): x is ShoppingPlan & ProductGoal => x.productGoal === true,
      ).map((x) => ({ ...x })),
      cards: cardBalances(workspace.CARDS, workspace.S.items),
      categories: workspace.CATS.filter((x) => x !== 'Investimentos'),
      today: workspace.todayISO(),
    }),
    save(input) {
      const mode = input.goalMode;
      const next = workspace.saveShopping(
        {
          ...input,
          productGoal: true,
          monthlyReserveCents: input.monthlyReserveCents,
          targetCents: input.priceCents,
          shippingCents: 0,
          installments: mode === 'credit' ? input.installments : 1,
          creditCardId: mode === 'credit' ? input.creditCardId : '',
          priority: 'normal',
          goal: false,
          people: [],
          url: '',
          status: 'planned',
        },
        'cart',
      );
      dispatchEvent(new Event('plan-product-goals-change'));
      return next as ShoppingPlan & ProductGoal;
    },
    remove(id) {
      workspace.atomic(() => {
        const goal = workspace.CART.find((x) => x.id === id && x.productGoal);
        if (!goal || goal.status !== 'planned')
          throw Error('A meta foi alterada. Atualize a página.');
        workspace.CART = workspace.CART.filter((x) => x.id !== id);
        workspace.saveWorkspace();
      });
      dispatchEvent(new Event('plan-product-goals-change'));
    },
    context(goal) {
      const simulation = {
          ...goal,
          date:
            goal.date < workspace.todayISO() ? workspace.todayISO() : goal.date,
        },
        projection = workspace.planProjection(simulation),
        first = workspace.monthIndexFromDate(simulation.date),
        count =
          goal.goalMode === 'save'
            ? Math.max(
                1,
                Math.min(
                  12,
                  goal.monthlyReserveCents
                    ? Math.ceil(
                        Math.max(
                          0,
                          goal.priceCents +
                            goal.shippingCents -
                            goal.reservedCents,
                        ) / goal.monthlyReserveCents,
                      )
                    : 1,
                ),
              )
            : goal.installments;
      return {
        asOf: workspace.todayISO(),
        goals: workspace.CART.filter(
          (x): x is ShoppingPlan & ProductGoal =>
            x.productGoal === true && x.status === 'planned',
        ),
        card: cardBalances(workspace.CARDS, workspace.S.items).find(
          (x: { id: string | undefined }) => x.id === goal.creditCardId,
        ),
        months: Array.from(
          { length: Math.min(count, workspace.MAX_MONTHS - first) },
          (_, i) => {
            const m = first + i,
              payment = projection.rows.find((x) => x.m === m),
              overdue = i === 0 ? projection.rows[0]?.overdueCents || 0 : 0,
              available = workspace.monthProjectionCents(m) - overdue;
            return {
              key: workspace.monthKeyForIndex(m),
              availableCents: available,
              purchaseAfterCents: payment ? payment.after : available,
              paymentCents: payment?.cents || 0,
              complete: workspace.receiptsInMonth(m).length > 0,
            };
          },
        ),
      };
    },
    prepare(id) {
      let expected = '';
      workspace.atomic(() => {
        const goal = workspace.CART.find(
          (x) => x.id === id && x.productGoal && x.status === 'planned',
        );
        if (!goal) throw Error('Meta não encontrada.');
        goal.date = workspace.todayISO();
        workspace.saveWorkspace();
        expected = JSON.stringify(goal);
      });
      workspace.purchaseReview = { id, expected };
      workspace.selectAreaView('planning:purchases');
      workspace.draw();
    },
  };
  // @workspace-end 331
  // @workspace-step 332 ExpressionStatement
  finance.taxes = {
    getState: () => ({
      month: workspace.monthKeyForIndex(workspace.S.m),
      today: workspace.todayISO(),
      closedMonths: Object.keys(workspace.CLOSED_REPORTS),
      expenses: workspace.S.items.map((x) => ({
        id: String(x.id),
        description: x.d,
        cents: workspace.toCents(x.v),
        date: x.date,
        category: x.c,
        payment: x.p,
        creditCardId: x.creditCardId || null,
      })),
    }),
    addExpense(input) {
      workspace.requireOpenDate(input.date);
      const cents = workspace.parseMoney(input.value);
      if (!isSafeInteger(cents) || cents < 1 || !input.description?.trim())
        throw Error('Informe descrição, data e valor válidos.');
      if (workspace.S.items.length >= workspace.MAX_RECORDS)
        throw Error('Limite de lançamentos atingido.');
      const item = {
        id: workspace.newId(),
        d: input.description.trim().slice(0, 240),
        v: cents / 100,
        date: input.date,
        c: workspace.canonicalCategory(input.category),
        p: 'Pix',
      };
      workspace.atomic(() => {
        workspace.S.items.push(item);
        workspace.saveWorkspace();
      });
      return {
        id: String(item.id),
        description: item.d,
        cents,
        date: item.date,
        category: item.c,
      };
    },
    importBank(rows) {
      if (!Array.isArray(rows) || rows.length > 100)
        throw Error('Importe até 100 movimentações por vez.');
      let added = 0;
      workspace.atomic(() => {
        for (const x of rows) {
          if (
            !/^of-[a-f0-9]{32}$/.test(x.id) ||
            !isSafeInteger(x.cents) ||
            x.cents < 1 ||
            x.cents > workspace.MAX_CENTS
          )
            throw Error('Movimentação inválida.');
          workspace.requireOpenDate(x.date);
          if (
            x.credit &&
            !workspace.CARDS.some((c) => c.id === x.cardId && c.active)
          )
            throw Error(
              'Selecione um cartão cadastrado para importar a fatura.',
            );
          const list =
            x.type === 'i' ? workspace.S.receipts : workspace.S.items;
          if (list.some((y) => String(y.id) === x.id)) continue;
          if (list.length >= workspace.MAX_RECORDS)
            throw Error('Limite de lançamentos atingido.');
          list.push({
            id: x.id,
            d: String(x.description || 'Movimentação').slice(0, 240),
            v: x.cents / 100,
            date: x.date,
            ...(x.type === 'i'
              ? { incomeKind: 'once' }
              : {
                  c: workspace.canonicalCategory(x.category),
                  p: x.credit ? 'Cartão de crédito' : 'Pix',
                  ...(x.credit ? { creditCardId: x.cardId } : {}),
                }),
          });
          added++;
        }
        workspace.saveWorkspace();
      });
      return added;
    },
  };
  // @workspace-end 332
  // @workspace-step 333 ExpressionStatement
  finance.goal = {
    getState: () => ({
      ...workspace.GOAL,
      today: workspace.todayISO(),
      readonly: workspace.isMonthClosed(workspace.S.m),
    }),
    save(input, { redraw = true } = {}) {
      const result = workspace.saveGoal(input);
      workspace.showNotice('Meta salva.');
      if (redraw) workspace.draw();
      return result;
    },
  };
  // @workspace-end 333
  // @workspace-step 334 ExpressionStatement
  finance.credit = {
    getState: () => ({
      cards: cardBalances(workspace.CARDS, workspace.S.items),
      items: workspace.S.items
        .filter((x) => x.creditCardId)
        .map((x) => ({ ...x })),
    }),
    payInvoice(id, month, amount, date, expected) {
      workspace.atomic(() => {
        const index = workspace.CARDS.findIndex((c) => c.id === id);
        if (index < 0) throw Error('Cartão não encontrado.');
        if (
          cardInvoice(workspace.CARDS[index], workspace.S.items, month)
            .remainingCents !== expected
        )
          throw Error('A fatura mudou. Confira o saldo e confirme novamente.');
        const next = allocateInvoicePayment(
          workspace.CARDS[index],
          workspace.S.items,
          month,
          amount,
          { id: workspace.newId(), date, today: workspace.todayISO() },
        );
        workspace.CARDS[index] = next.card;
        workspace.S.items = next.items;
        workspace.saveWorkspace();
      });
      dispatchEvent(new Event('plan-credit-change'));
    },
    saveCard(input) {
      const card = normalizeCreditCard({
        ...input,
        id: input.id || workspace.newId(),
      });
      workspace.atomic(() => {
        const index = workspace.CARDS.findIndex((c) => c.id === card.id);
        if (index < 0) {
          if (workspace.CARDS.length >= 100)
            throw Error('Use até 100 cartões.');
          workspace.CARDS.push(card);
        } else workspace.CARDS[index] = card;
        workspace.saveWorkspace();
      });
      dispatchEvent(new Event('plan-credit-change'));
      return card;
    },
    setPaid(id, paid) {
      if (typeof paid !== 'boolean') throw Error('Status inválido.');
      workspace.atomic(() => {
        const item = workspace.S.items.find((x) => x.id === id);
        if (!item?.creditCardId || item.p !== 'Cartão de crédito')
          throw Error('Lançamento não encontrado.');
        item.creditPaid = paid;
        workspace.saveWorkspace();
      });
      dispatchEvent(new Event('plan-credit-change'));
    },
  };
  // @workspace-end 334
  // @workspace-step 335 ExpressionStatement
  finance.resetFinancialData = workspace.resetFinancialData;
  // @workspace-end 335
}
