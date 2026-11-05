import { viewList } from '../../services/presentation.ts';
import { vCarbon as rendervCarbon } from '../views/analysis.tsx';
import { vYou as rendervYou } from '../views/account.tsx';
import { subscriptionSummary } from '../../services/subscriptions.ts';
import { responsibleProgress } from '../../services/responsible-progress.ts';
import type { WorkspaceRuntime } from './contracts';

type ProfileContext = Pick<
  WorkspaceRuntime,
  | 'CATS'
  | 'CLOSED_REPORTS'
  | 'COMMUNITY_PROGRAM'
  | 'ICON'
  | 'PROFILE'
  | 'S'
  | 'debt'
  | 'esc'
  | 'lim'
  | 'load'
  | 'monthIndexFromDate'
  | 'monthLabelFromKey'
  | 'profileIdentity'
  | 'ratingStars'
  | 'toCents'
  | 'todayISO'
  | 'usernameProfile'
  | 'viewContext'
>;

export function createProfile(workspace: ProfileContext) {
  function isBetaTester(
    user: import('@supabase/supabase-js').User | null,
    program = workspace.COMMUNITY_PROGRAM,
    now = Date.now(),
  ) {
    if (!user?.id || !user.created_at) return false;
    const created = Date.parse(user.created_at),
      start = program.betaStartsAt ? Date.parse(program.betaStartsAt) : 0,
      end = program.betaEndsAt ? Date.parse(program.betaEndsAt) : Infinity;
    return (
      Number.isFinite(created) &&
      created > 0 &&
      created <= now &&
      created >= start &&
      created <= end
    );
  }

  function supportProjectCard() {
    const url = workspace.COMMUNITY_PROGRAM.supportUrl;
    let valid = false;
    try {
      const u = new URL(url);
      valid = u.protocol === 'https:' && !u.username && !u.password;
    } catch {}
    return (
      <div className="profile-support-action">
        {valid ? (
          <a
            className="btn"
            href={workspace.esc(url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {workspace.ICON.plus}
            {' Apoiar projeto'}
          </a>
        ) : (
          <button
            className="btn"
            type="button"
            disabled={true}
            aria-label="Apoiar projeto, em breve"
          >
            {'♡ Apoiar projeto'}
          </button>
        )}
      </div>
    );
  }

  function profileIdentity() {
    const user = window.planAuth.user,
      meta = user?.user_metadata || {};
    let photo = '';
    try {
      const url = new URL(meta.avatar_url || meta.picture || '');
      if (
        url.protocol === 'https:' &&
        (url.hostname === 'googleusercontent.com' ||
          url.hostname.endsWith('.googleusercontent.com'))
      )
        photo = url.href;
    } catch {}
    return {
      name: user
        ? String(
            meta.full_name ||
              meta.name ||
              workspace.PROFILE.name ||
              'Sua conta',
          ).slice(0, 120)
        : window.planAuth.guestName(),
      email: user?.email || '',
      photo,
      google: !!user,
    };
  }

  function avatarMarkup(
    person: { name: string; photo?: string },
    cls = 'profile-photo',
  ) {
    return (
      <span className={cls}>
        <span aria-hidden="true">
          {workspace.esc(person.name.trim().slice(0, 1).toUpperCase() || 'V')}
        </span>
        {person.photo ? (
          <img
            src={workspace.esc(person.photo)}
            alt={'Foto de ' + String(workspace.esc(person.name))}
            referrerPolicy="no-referrer"
          />
        ) : (
          ''
        )}
      </span>
    );
  }

  function identitySettingsView() {
    const p = workspace.profileIdentity(),user=window.planAuth.user,provider:unknown=user?.app_metadata?.provider||user?.identities?.[0]?.provider;
    return (
      <>
        <dl className="identity-fields">
          <div>
            <dt>{'Nome'}</dt>
            <dd>{workspace.esc(p.name)}</dd>
          </div>
          <div>
            <dt>{'E-mail'}</dt>
            <dd>{p.email ? workspace.esc(p.email) : 'Sem e-mail vinculado'}</dd>
          </div>
          <div>
            <dt>{'Método de login'}</dt>
            <dd>{!user?'Visitante':provider==='google'?'Google':provider==='email'?'E-mail':'Conta autenticada'}</dd>
          </div>
        </dl>
        {workspace.usernameProfile()}
      </>
    );
  }

  function profileStars() {
    const current = workspace.todayISO().slice(0, 7),
      totals = new Map(),
      row = (key: string) => {
        if (!totals.has(key))
          totals.set(key, {
            key,
            income: 0,
            expenses: 0,
            incomeCount: 0,
            expenseCount: 0,
            spent: new Map(),
          });
        return totals.get(key);
      };
    for (const x of workspace.S.items) {
      const m = row(x.date.slice(0, 7)),
        cents = workspace.toCents(x.v);
      m.expenses += cents;
      m.expenseCount++;
      m.spent.set(x.c, (m.spent.get(x.c) || 0) + cents);
    }
    for (const x of workspace.S.receipts) {
      const m = row(x.date.slice(0, 7));
      m.income += workspace.toCents(x.v);
      m.incomeCount++;
    }
    const months = [...totals.values()].map((m) => {
      const index = workspace.monthIndexFromDate(m.key + '-01');
      return {
        ...m,
        debts: workspace.toCents(workspace.debt(index)),
        categories: workspace.CATS.map((c) => ({
          limit: workspace.toCents(workspace.lim(index, c)),
          spent: m.spent.get(c) || 0,
        })),
      };
    });
    const progress = responsibleProgress(months, current);
    return (
      <div
        className="profile-stars"
        role="img"
        aria-label={String(progress.stars) + ' de 5 estrelas'}
      >
        {viewList(
          Array.from({ length: 5 }, (_, i) => (
            <svg
              className={i < progress.stars ? 'earned' : ''}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9Z"></path>
            </svg>
          )),
        )}
        <span>
          {progress.stars}
          {'/5'}
        </span>
      </div>
    );
  }

  function ratingStars(n: number) {
    return (
      <span
        className="rating-stars"
        role="img"
        aria-label={String(n) + ' de 5 estrelas'}
      >
        {viewList(
          Array.from({ length: 5 }, (_, i) => (
            <span className={i < n ? 'earned' : ''} aria-hidden="true">
              {'★'}
            </span>
          )),
        )}
      </span>
    );
  }

  function monthlyRatings() {
    const reports = Object.values(workspace.CLOSED_REPORTS)
      .filter((r) => r.receipts?.length && r.expenses?.length)
      .sort((a, b) => b.key.localeCompare(a.key));
    return viewList(
      reports.map((r) => {
        const total = r.expenseCents + r.debtCents,
          income = r.incomeCents;
        let stars = 1;
        if (income > 0) {
          stars = 2;
          if (total <= income) stars = 3;
          if (total <= income * 0.9) stars = 4;
          if (total <= income * 0.8) stars = 5;
        }
        const index = workspace.monthIndexFromDate(r.key + '-01'),
          limits = workspace.CATS.filter((c) => workspace.lim(index, c) > 0);
        if (!limits.length) stars = Math.min(stars, 3);
        if (
          limits.some(
            (c) =>
              r.expenses
                .filter((x) => x.c === c)
                .reduce((n, x) => n + workspace.toCents(x.v), 0) >
              workspace.toCents(workspace.lim(index, c)),
          )
        )
          stars = Math.min(stars, 2);
        return (
          <article className="monthly-rating-pill">
            <span className="rating-month-icon" aria-hidden="true">
              {workspace.ICON.c}
            </span>
            <div>
              <h3>{workspace.esc(workspace.monthLabelFromKey(r.key))}</h3>
              <span className="foot">
                {stars === 5
                  ? 'Em equilíbrio'
                  : stars >= 3
                    ? 'Dentro da renda'
                    : 'Em atenção'}
              </span>
            </div>
            {workspace.ratingStars(stars)}
          </article>
        );
      }),
    );
  }

  function streamingPill() {
    return (
      <div
        data-subscriptions={workspace.esc(
          JSON.stringify(
            subscriptionSummary(
              workspace.S.items,
              workspace.todayISO().slice(0, 7),
            ),
          ),
        )}
      ></div>
    );
  }

  function vYou() {
    return rendervYou(workspace.viewContext);
  }

  function cloudSettingsView() {
    return window.planAuth.user ? (
      <section className="card cloud-settings" data-cloud-panel="">
        <h2>{'Sincronização'}</h2>
        <p data-cloud-message="" role="status"></p>
        <p className="foot" data-cloud-last=""></p>
        <div className="settings-actions">
          <button className="btn g" type="button" data-cloud-retry="">
            {'Sincronizar'}
          </button>
          <button
            className="btn g"
            type="button"
            data-cloud-copy-download=""
            hidden={true}
          >
            {'Baixar cópias'}
          </button>
        </div>
        <div className="cloud-conflict" data-cloud-conflict="" hidden={true}>
          <h3>{'Escolha qual versão usar'}</h3>
          <p className="foot">
            {
              'Há alterações diferentes neste dispositivo e na conta. Antes de trocar, o app guarda uma cópia das duas versões neste navegador. Baixe essas cópias para mantê-las fora do dispositivo.'
            }
          </p>
          <div className="settings-actions">
            <button className="btn" type="button" data-cloud-resolve="cloud">
              {'Usar dados da conta'}
            </button>
            <button className="btn g" type="button" data-cloud-resolve="local">
              {'Enviar dados deste dispositivo'}
            </button>
          </div>
          <p className="foot">
            {
              'A versão escolhida substituirá a outra. Se houver um formulário aberto, feche-o antes de continuar.'
            }
          </p>
        </div>
      </section>
    ) : (
      ''
    );
  }

  function carbonRecords() {
    return workspace.load<Record<string, { grams: number; source: string }>>(
      'plan12carbon_v1',
      {},
      (x) => x && typeof x === 'object' && !Array.isArray(x),
    );
  }

  function vCarbon() {
    return rendervCarbon(workspace.viewContext);
  }
  return {
    isBetaTester,
    supportProjectCard,
    profileIdentity,
    avatarMarkup,
    identitySettingsView,
    profileStars,
    ratingStars,
    monthlyRatings,
    streamingPill,
    vYou,
    cloudSettingsView,
    carbonRecords,
    vCarbon,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'isBetaTester'
    | 'supportProjectCard'
    | 'profileIdentity'
    | 'avatarMarkup'
    | 'identitySettingsView'
    | 'profileStars'
    | 'ratingStars'
    | 'monthlyRatings'
    | 'streamingPill'
    | 'vYou'
    | 'cloudSettingsView'
    | 'carbonRecords'
    | 'vCarbon'
  >;
}

export function initializeProfile(workspace: ProfileContext) {
  // @workspace-step 198 FirstStatement
  workspace.COMMUNITY_PROGRAM = Object.freeze({
    betaStartsAt: null,
    betaEndsAt: null,
    supportUrl: '',
  });
  // @workspace-end 198
}
