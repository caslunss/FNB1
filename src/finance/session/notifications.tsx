import {balanceAlert} from '../../services/balance-alert';
import {readRecurrenceDecisions} from '../../services/recurrence-decisions';
import {forecastModel,readForecastSettings} from '../../services/forecast-settings';
import {getFinanceSnapshot} from '../../services/finance-runtime';
import { viewList } from '../../services/presentation.ts';
import {readSocialPages} from '../../services/social-pagination';
import type {
  ShoppingPlan,
  Friend,
  SharedExpense,
} from '../../types/workspace';
import { errorDetails } from '../../services/errors.ts';
import {
  readDismissedNotifications,
  clearNotificationRows,
  DISMISSED_NOTIFICATIONS_KEY,
} from '../../services/notification-dismissals.ts';
import { finance } from '../../services/finance-runtime.ts';
import { notificationStore } from '../../services/notification-store.ts';
import { readNotificationPreferences } from '../../services/notification-preferences.ts';
import type { WorkspaceRuntime } from './contracts';

type NotificationsContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | '$'
  | 'CLOSED_REPORTS'
  | 'ICON'
  | 'MAX_RECORDS'
  | 'PAY'
  | 'S'
  | 'acceptedFriends'
  | 'accountPanel'
  | 'accountSettingsTab'
  | 'areaViews'
  | 'atomic'
  | 'brl'
  | 'dateLong'
  | 'draw'
  | 'ensureDate'
  | 'esc'
  | 'friendCode'
  | 'friendOptions'
  | 'load'
  | 'localStorage'
  | 'moneyInput'
  | 'normalizeUsername'
  | 'notificationRows'
  | 'notificationUnread'
  | 'notificationsOpen'
  | 'openAccountPanel'
  | 'put'
  | 'refreshSocial'
  | 'refreshUsernames'
  | 'renderAccountPanel'
  | 'renderNotifications'
  | 'renderView'
  | 'saveWorkspace'
  | 'shoppingMoney'
  | 'selectAreaView'
  | 'showError'
  | 'social'
  | 'socialUser'
  | 'toCents'
  | 'todayISO'
  | 'usernames'
  | 'validUsername'
>;

export function createNotifications(workspace: NotificationsContext) {
  function friendCode(f: Friend) {
    return f.sender === workspace.socialUser() ? f.recipient : f.sender;
  }

  function acceptedFriends() {
    return workspace.social.friends.filter((f) => f.status === 'accepted');
  }

  function friendOptions() {
    return viewList(
      workspace
        .acceptedFriends()
        .map((f) => (
          <option value={workspace.esc(workspace.friendCode(f))}>
            {workspace.esc(
              workspace.usernames[workspace.friendCode(f)]
                ? '@' + workspace.usernames[workspace.friendCode(f)]
                : 'Amigo',
            )}
          </option>
        )),
    );
  }

  function friendDivisionForm(plan?: ShoppingPlan) {
    if (!workspace.socialUser())
      return (
        <p className="foot">{'Entre com Google para dividir com amigos.'}</p>
      );
    if (!workspace.acceptedFriends().length)
      return (
        <p className="foot">
          {'Adicione um amigo e aguarde o aceite para compartilhar.'}
        </p>
      );
    return (
      <form data-social="share" className="compact-form product-form">
        <label>
          {'Amigo'}
          <select name="friend" required={true}>
            <option value="">{'Selecione'}</option>
            {workspace.friendOptions()}
          </select>
        </label>
        <label>
          {'Descrição'}
          <input
            name="description"
            maxLength={120}
            required={true}
            value={workspace.esc(
              plan ? ('Compra planejada: ' + plan.name).slice(0, 120) : '',
            )}
          />
        </label>
        <label>
          {'Total (R$)'}
          <input
            name="amount"
            inputMode="decimal"
            required={true}
            value={
              plan
                ? workspace.shoppingMoney(plan.priceCents + plan.shippingCents)
                : ''
            }
          />
        </label>
        <button className="btn" type="submit">
          {plan ? 'Compartilhar compra' : 'Enviar divisão'}
        </button>
        <p className="foot full">
          {
            'Divisão igual. Cada pessoa confirma sua parte; enviar não cria gastos.'
          }
        </p>
      </form>
    );
  }

  function socialView() {
    if (!workspace.socialUser())
      return (
        <section className="card">
          <h2>{'Adicionar amigos'}</h2>
          <button className="btn" type="button" disabled={true}>
            {'Adicionar amigo'}
          </button>
          <p className="foot">{'Entre com Google para adicionar amigos.'}</p>
          <h3>{'Seus amigos'}</h3>
          <p className="foot">{'Nenhum amigo adicionado.'}</p>
        </section>
      );
    return (
      <>
        <section className="card finance-layout-card"><h2>Adicionar amigos</h2>
          <form data-social="friend" className="compact-form">
            <label>
              {'Usuário do amigo'}
              <input
                name="code"
                required={true}
                maxLength={41}
                placeholder="@usuario"
              />
            </label>
            <button className="btn" type="submit">
              {'Enviar pedido'}
            </button>
          </form>
          <h3>{'Seus amigos'}</h3>
          {workspace.social.error ? (
            <p role="alert" className="bad">
              {workspace.esc(workspace.social.error)}
            </p>
          ) : (
            ''
          )}
          {viewList(
            workspace.social.friends.map((f) => (
              <div className="social-row">
                <span>
                  {workspace.esc(
                    workspace.usernames[workspace.friendCode(f)]
                      ? '@' + workspace.usernames[workspace.friendCode(f)]
                      : 'Amigo',
                  )}
                  <small>
                    {f.status === 'accepted'
                      ? 'Adicionado'
                      : f.status === 'declined'
                        ? 'Recusado'
                        : 'Pendente'}
                  </small>
                </span>
                {f.recipient === workspace.socialUser() &&
                f.status === 'pending' ? (
                  <>
                    <button
                      className="btn"
                      data-social-action="friend-accept"
                      data-id={f.id}
                    >
                      {'Aceitar'}
                    </button>
                    <button
                      className="btn g"
                      data-social-action="friend-decline"
                      data-id={f.id}
                    >
                      {'Recusar'}
                    </button>
                  </>
                ) : (
                  ''
                )}
              </div>
            )),
          ) || <p className="foot">{'Nenhum amigo adicionado.'}</p>}
          <button className="btn g" data-social-action="refresh">
            {'Atualizar'}
          </button>
        </section>
      </>
    );
  }

  function shareMarkup(x: SharedExpense) {
    const mine = x.sender === workspace.socialUser(),
      c = mine ? Math.ceil(x.cents / 2) : Math.floor(x.cents / 2);
    return (
      <div className="social-row">
        <span>
          {workspace.esc(x.description)}
          <small>
            {mine ? 'Enviada' : 'Recebida'}
            {' · '}
            {workspace.dateLong(x.expense_date)}
            {' · Sua parte '}
            {workspace.brl(c / 100)}
            {' · '}
            {x.status === 'accepted'
              ? 'Aceita'
              : x.status === 'declined'
                ? 'Recusada'
                : 'Pendente'}
          </small>
        </span>
        {!mine && x.status === 'pending' ? (
          <>
            <button
              className="btn"
              data-social-action="share-accept"
              data-id={x.id}
            >
              {'Aceitar'}
            </button>
            <button
              className="btn g"
              data-social-action="share-decline"
              data-id={x.id}
            >
              {'Recusar'}
            </button>
          </>
        ) : (
          ''
        )}
        {(mine || x.status === 'accepted') &&
        !workspace.S.items.some((i) => i.id === 'shared-' + x.id) ? (
          <button className="btn g" data-social-action="record" data-id={x.id}>
            {'Registrar parte'}
          </button>
        ) : (
          ''
        )}
      </div>
    );
  }

  async function refreshSocial(redraw = true) {
    if (
      workspace.scope.disposed ||
      !workspace.socialUser() ||
      workspace.social.busy
    )
      return;
    workspace.social.busy = true;
    try {
      const pageSize = 100;
      const client = window.planAuth.client;
      if (!client) throw Error('Serviço de conta indisponível.');
      const results = await Promise.all([
        client.from('app_friends')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(pageSize),
        client.from('app_shared_expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(pageSize),
      ]);
      if (workspace.scope.disposed) return;
      for (const r of results) if (r.error) throw r.error;
      const fetchPage = (table: 'app_friends' | 'app_shared_expenses', cursor: import('../../services/social-pagination').SocialCursor | undefined) => {
        let query = client.from(table).select('*')
          .order('created_at', {ascending: false}).order('id', {ascending: false})
          .limit(pageSize).abortSignal(workspace.scope.signal);
        if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
        return query;
      };
      const [friends, shares] = await Promise.all([
        results[0].data?.length === pageSize
          ? readSocialPages<Friend>(cursor => fetchPage('app_friends', cursor), workspace.scope.signal)
          : Promise.resolve(results[0].data || []),
        results[1].data?.length === pageSize
          ? readSocialPages<SharedExpense>(cursor => fetchPage('app_shared_expenses', cursor), workspace.scope.signal)
          : Promise.resolve(results[1].data || []),
      ]);
      if (workspace.scope.disposed) return;
      workspace.social.friends = friends;
      workspace.social.shares = shares;
      await workspace.refreshUsernames();
      workspace.social.error = '';
    } catch (e) {
      workspace.social.error =
        'Não foi possível atualizar amigos e divisões. Tente novamente.';
    } finally {
      workspace.social.busy = false;
      if (workspace.scope.disposed) return;
      workspace.renderNotifications();
      if (
        redraw &&
        ['friends', 'profile'].includes(workspace.accountPanel!) &&
        workspace.$('#accountOverlay')?.open
      ) {
        workspace.renderAccountPanel();
        workspace
          .$('#accountOverlay [data-close-account]')
          ?.focus({ preventScroll: true });
      } else if (
        redraw &&
        (['s', 'u', 'i', 'k','a'].includes(workspace.S.tab) ||
          (workspace.S.tab === 'd' &&
            workspace.areaViews.commitments === 'friends')) &&
        !document.activeElement?.closest('form')
      )
        workspace.draw();
    }
  }

  function notificationRows() {
    const prefs = readNotificationPreferences(workspace.localStorage),
      dismissed = readDismissedNotifications(workspace.localStorage);
    const source=finance.forecast?getFinanceSnapshot('forecast'):null;
    const forecastRows=source?balanceAlert(forecastModel(source,readForecastSettings(workspace.localStorage,source.today),readRecurrenceDecisions(workspace.localStorage)),source.today):[];
    return [
      ...forecastRows,
      ...workspace.social.friends
        .filter(
          (f) =>
            f.recipient === workspace.socialUser() && f.status === 'pending',
        )
        .map((f) => ({
          id: 'friend-' + f.id,
          date: f.created_at,
          title: 'Pedido de amizade',
          subtitle: 'Convite recebido',
          text: 'Novo pedido de amizade',
          tab: 's',
          kind: 'friends' as const,
        })),
      ...workspace.social.shares.map((x) => ({
        id: 'share-' + x.id + '-' + x.status,
        date: x.updated_at || x.created_at || x.expense_date,
        title: x.description,
        subtitle:
          x.sender === workspace.socialUser()
            ? 'Divisão enviada'
            : 'Divisão recebida',
        recipient: workspace.usernames[x.recipient]
          ? 'Para: @' + workspace.usernames[x.recipient]
          : '',
        amount: workspace.brl(x.cents / 100),
        status:
          x.status === 'declined'
            ? 'Recusada'
            : x.status === 'accepted'
              ? 'Aceita'
              : 'Pendente',
        error: x.status === 'declined',
        text:
          (x.sender === workspace.socialUser()
            ? 'Divisão enviada: '
            : 'Divisão recebida: ') +
          x.description +
          ' · ' +
          (x.status === 'pending'
            ? 'Pendente'
            : x.status === 'accepted'
              ? 'Aceita'
              : 'Recusada'),
        tab: 's',
        kind: 'shares' as const,
      })),
      ...Object.values(workspace.CLOSED_REPORTS).map((r) => ({
        id: 'report-' + r.key,
        date: r.closedOn,
        title: 'Relatório mensal',
        subtitle: r.label,
        text: 'Relatório mensal disponível: ' + r.label,
        tab: 'reports',
        kind: 'reports' as const,
      })),
      ...workspace.S.items
        .slice(-30)
        .reverse()
        .map((i) => ({
          id: 'expense-' + i.id,
          date: i.date,
          title: i.d,
          subtitle: i.c,
          amount: workspace.brl(i.v),
          text: 'Gasto registrado: ' + i.d + ' · ' + workspace.brl(i.v),
          tab: 'i',
          kind: 'expenses' as const,
        })),
    ].filter((row) => prefs[row.kind] && !dismissed.has(row.id));
  }

  function renderNotifications() {
    const button = workspace.$('#notificationButton');
    if (!button) return;
    const rows = workspace.notificationRows(),
      seen = workspace.load<string[]>('plan12notifications', [], Array.isArray);
    workspace.renderView(
      button,
      <>
        <svg
          className="i"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4"></path>
        </svg>
        <span>{rows.filter((r) => !seen.includes(r.id)).length || ''}</span>
      </>,
    );
    button.setAttribute('aria-expanded', String(workspace.notificationsOpen));
    button.setAttribute('aria-haspopup', 'dialog');
    notificationStore.publish(finance.notifications.getState());
    dispatchEvent(new Event('plan-notifications-change'));
  }
  return {
    friendCode,
    acceptedFriends,
    friendOptions,
    friendDivisionForm,
    socialView,
    shareMarkup,
    refreshSocial,
    notificationRows,
    renderNotifications,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'friendCode'
    | 'acceptedFriends'
    | 'friendOptions'
    | 'friendDivisionForm'
    | 'socialView'
    | 'shareMarkup'
    | 'refreshSocial'
    | 'notificationRows'
    | 'renderNotifications'
  >;
}

export function initializeNotifications(workspace: NotificationsContext) {
  // @workspace-step 261 FirstStatement
  workspace.social = { friends: [], shares: [], error: '', busy: false };
  workspace.notificationsOpen = false;
  // @workspace-end 261
  // @workspace-step 262 FirstStatement
  workspace.socialUser = () => window.planAuth.user?.id;
  // @workspace-end 262

  // @workspace-step 271 FirstStatement
  workspace.notificationUnread = [];
  // @workspace-end 271
  // @workspace-step 272 ExpressionStatement
  finance.notifications = {
    getState: () => ({
      isOpen: workspace.notificationsOpen,
      rows: workspace.notificationRows().map((r) => ({
        ...r,
        unread: workspace.notificationUnread.includes(r.id),
      })),
    }),
    close() {
      workspace.notificationsOpen = false;
      workspace.renderNotifications();
    },
    clear() {
      clearNotificationRows(
        workspace.localStorage,
        workspace.notificationRows(),
      );
      workspace.notificationUnread = [];
      workspace.renderNotifications();
    },
    settings() {
      workspace.accountSettingsTab = 'notifications';
      workspace.openAccountPanel(
        'settings',
        workspace.$('#notificationButton'),
      );
    },
  };
  // @workspace-end 272

  // @workspace-step 274 ExpressionStatement
  workspace.scope.listen(document, 'submit', async (e) => {
    const f = (e.target as HTMLFormElement).closest<HTMLFormElement>(
      '[data-social]',
    );
    if (!f) return;
    e.preventDefault();
    if (workspace.social.busy) return;
    workspace.social.busy = true;
    const submit = f.querySelector('button');
    submit!.disabled = true;
    try {
      const data = new FormData(f),
        me = workspace.socialUser();
      if (!me) throw Error('Entre com Google.');
      let result;
      if (f.dataset.social === 'friend') {
        const username = workspace.normalizeUsername(data.get('code'));
        if (!workspace.validUsername(username))
          throw Error('Informe um @usuário válido.');
        const lookup = await window.planAuth
          .client!.from('app_usernames')
          .select('user_id')
          .eq('username', username)
          .maybeSingle();
        if (lookup.error) throw Error('Não foi possível buscar este usuário.');
        const code = lookup.data?.user_id;
        if (!code) throw Error('Usuário não encontrado.');
        if (code === me) throw Error('Escolha outra pessoa.');
        if (
          workspace.social.friends.some(
            (x) => workspace.friendCode(x) === code && x.status !== 'declined',
          )
        )
          throw Error('Já existe um pedido para essa pessoa.');
        result = await window.planAuth
          .client!.from('app_friends')
          .insert({ sender: me, recipient: code });
      } else {
        const cents = workspace.toCents(
            workspace.moneyInput(
              f.querySelector<HTMLInputElement>('[name=amount]'),
            ),
          ),
          recipient = String(data.get('friend')),
          description = String(data.get('description')).trim();
        if (
          !description ||
          description.length > 120 ||
          cents < 2 ||
          cents > 100000000 ||
          !workspace.social.friends.some(
            (x) =>
              x.status === 'accepted' && workspace.friendCode(x) === recipient,
          )
        )
          throw Error(
            'Confira o amigo, a descrição e o valor (mínimo R$ 0,02).',
          );
        result = await window.planAuth
          .client!.from('app_shared_expenses')
          .insert({
            sender: me,
            recipient,
            description,
            cents,
            expense_date: workspace.todayISO(),
          });
      }
      if (result.error)
        throw Error(
          'Não foi possível enviar. Confira o usuário, a conexão e se o pedido já existe.',
        );
      f.reset();
      workspace.social.error = '';
    } catch (e) {
      workspace.social.error = errorDetails(e).message;
    } finally {
      workspace.social.busy = false;
      submit!.disabled = false;
      if (workspace.social.error) {
        workspace.showError(Error(workspace.social.error));
      } else await workspace.refreshSocial();
    }
  });
  // @workspace-end 274
  // @workspace-step 275 ExpressionStatement
  workspace.scope.listen(document, 'click', async (e) => {
    const toggle = (e.target as HTMLElement).closest<HTMLElement>(
        '#notificationButton',
      ),
      go = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-notification-tab]',
      );
    if (toggle) {
      workspace.notificationsOpen = !workspace.notificationsOpen;
      if (workspace.notificationsOpen) {
        const seen = workspace.load<string[]>(
          'plan12notifications',
          [],
          Array.isArray,
        );
        workspace.notificationUnread = workspace
          .notificationRows()
          .filter((x) => !seen.includes(x.id))
          .map((x) => x.id);
        workspace.put(
          'plan12notifications',
          workspace.notificationRows().map((x) => x.id),
        );
      }
      workspace.renderNotifications();
      return;
    }
    if (go) {
      workspace.notificationsOpen = false;
      workspace.renderNotifications();
      if (go.dataset.notificationTab === 'forecast') {
        workspace.selectAreaView('planning:forecast');workspace.draw();
      } else if (go.dataset.notificationTab! === 'reports') {
        workspace.renderNotifications();
        workspace.openAccountPanel('reports');
      } else {
        workspace.S.tab = go.dataset.notificationTab!;
        workspace.draw();
      }
      return;
    }
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-social-action]',
    );
    if (!b) return;
    const a = b.dataset.socialAction!,
      id = b.dataset.id!;
    if (a === 'close-notifications') {
      workspace.notificationsOpen = false;
      workspace.renderNotifications();
      return;
    }
    if (a === 'refresh') {
      await workspace.refreshSocial();
      return;
    }
    if (workspace.social.busy) return;
    b.disabled = true;
    try {
      if (a === 'record') {
        const x = workspace.social.shares.find((x) => x.id === id);
        if (
          !x ||
          (x.sender !== workspace.socialUser() && x.status !== 'accepted')
        )
          throw Error('Aceite a divisão primeiro.');
        workspace.atomic(() => {
          const key = 'shared-' + x.id;
          if (workspace.S.items.some((i) => i.id === key)) return;
          workspace.ensureDate(x.expense_date);
          if (workspace.S.items.length >= workspace.MAX_RECORDS)
            throw Error('Limite de registros atingido.');
          workspace.S.items.push({
            id: key,
            d: x.description,
            v:
              (x.sender === workspace.socialUser()
                ? Math.ceil(x.cents / 2)
                : Math.floor(x.cents / 2)) / 100,
            c: 'Gastos Variáveis',
            p: workspace.PAY[0],
            date: x.expense_date,
          });
          workspace.saveWorkspace();
        });
        workspace.draw();
      } else {
        const table = a.startsWith('friend-')
            ? 'app_friends'
            : 'app_shared_expenses',
          status = a.endsWith('accept') ? 'accepted' : 'declined';
        const r = await window.planAuth
          .client!.from(table)
          .update({ status })
          .eq('id', id)
          .eq('recipient', workspace.socialUser())
          .eq('status', 'pending')
          .select('id');
        if (r.error || !r.data?.length)
          throw Error('Não foi possível atualizar este convite.');
        await workspace.refreshSocial();
      }
    } catch (err) {
      workspace.showError(err);
    } finally {
      b.disabled = false;
    }
  });
  // @workspace-end 275
  // @workspace-step 276 ExpressionStatement
  workspace.scope.listen(window, 'plan-navigation-change', () =>
    workspace.renderNotifications(),
  );
  // @workspace-end 276
  // @workspace-step 277 ExpressionStatement
  workspace.scope.listen(window, 'plan-notification-preferences-change', () =>
    workspace.renderNotifications(),
  );
  // @workspace-end 277
  // @workspace-step 278 ExpressionStatement
  workspace.scope.listen(window, 'storage', (e) => {
    if (
      e.key === null ||
      [
        window.planAuth.key('plan12notificationPreferences'),
        window.planAuth.key('plan12notifications'),
        window.planAuth.key(DISMISSED_NOTIFICATIONS_KEY),
      ].includes(e.key)
    )
      workspace.renderNotifications();
  });
  // @workspace-end 278
  // @workspace-step 279 ExpressionStatement
  workspace.scope.interval(() => {
    if (document.visibilityState === 'visible') workspace.refreshSocial(false);
  }, 30000);
  // @workspace-end 279
  // @workspace-step 280 ExpressionStatement
  workspace.scope.microtask(() => workspace.refreshSocial());
  // @workspace-end 280
}
