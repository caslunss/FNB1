import { errorDetails } from '../../services/errors.ts';
import type { WorkspaceRuntime } from './contracts';

type UsernameContext = Pick<
  WorkspaceRuntime,
  | 'scope'
  | 'esc'
  | 'friendCode'
  | 'normalizeUsername'
  | 'social'
  | 'socialUser'
  | 'usernames'
  | 'validUsername'
>;

export function createUsername(workspace: UsernameContext) {
  function normalizeUsername(value: unknown) {
    return String(value || '')
      .trim()
      .replace(/^@/, '')
      .toLowerCase();
  }

  function validUsername(value: string) {
    return /^[a-z0-9_]{3,40}$/.test(value);
  }

  async function refreshUsernames() {
    const me = workspace.socialUser();
    if (!me || workspace.scope.disposed) return;
    const client = window.planAuth.client;
    const created = await client!
      .from('app_usernames')
      .upsert(
        { user_id: me, username: 'u_' + me.replaceAll('-', '') },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );
    if (workspace.scope.disposed) return;
    if (created.error) throw created.error;
    const ids = [
      ...new Set([me, ...workspace.social.friends.map(workspace.friendCode)]),
    ];
    const result = await client!
      .from('app_usernames')
      .select('user_id,username')
      .in('user_id', ids);
    if (workspace.scope.disposed) return;
    if (result.error) throw result.error;
    workspace.usernames = Object.fromEntries(
      result.data.map((x) => [x.user_id, x.username]),
    );
  }

  function usernameProfile() {
    return workspace.socialUser() ? (
      <section className="card username-card">
        <h3>{'@usuário'}</h3>
        <form id="usernameForm">
          <label className="sr-only" htmlFor="profileUsername">
            {'Nome de usuário'}
          </label>
          <div className="username-fields">
            <input
              id="profileUsername"
              name="username"
              aria-describedby="usernameHint"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              minLength={3}
              maxLength={40}
              required={true}
              pattern="[a-zA-Z0-9_]{3,40}"
              value={workspace.esc(
                workspace.usernames[workspace.socialUser()!] || '',
              )}
              placeholder="seu_usuario"
            />
            <button className="btn">{'Salvar'}</button>
          </div>
          <small id="usernameHint">{'3–40 letras, números ou _'}</small>
          <p role="status" id="usernameStatus"></p>
        </form>
      </section>
    ) : (
      ''
    );
  }
  return {
    normalizeUsername,
    validUsername,
    refreshUsernames,
    usernameProfile,
  } satisfies Pick<
    WorkspaceRuntime,
    | 'normalizeUsername'
    | 'validUsername'
    | 'refreshUsernames'
    | 'usernameProfile'
  >;
}

export function initializeUsername(workspace: UsernameContext) {
  // @workspace-step 292 FirstStatement
  workspace.usernames = {};
  // @workspace-end 292

  // @workspace-step 297 ExpressionStatement
  workspace.scope.listen(document, 'submit', async (e) => {
    if ((e.target as HTMLFormElement).id !== 'usernameForm') return;
    e.preventDefault();
    const form = e.target as HTMLFormElement,
      button = form.querySelector('button'),
      status = form.querySelector<HTMLElement>('#usernameStatus');
    if (button!.disabled) return;
    button!.disabled = true;
    try {
      const username = workspace.normalizeUsername(
        new FormData(form).get('username'),
      );
      if (!workspace.validUsername(username))
        throw Error('Use de 3 a 40 letras, números ou sublinhado.');
      const result = await window.planAuth
        .client!.from('app_usernames')
        .update({ username })
        .eq('user_id', workspace.socialUser())
        .select('username')
        .single();
      if (result.error)
        throw Error(
          result.error.code === '23505'
            ? 'Este usuário já está em uso. Escolha outro.'
            : 'Não foi possível salvar. Tente novamente.',
        );
      workspace.usernames[workspace.socialUser()!] = result.data.username;
      status!.textContent = 'Usuário salvo: @' + result.data.username;
    } catch (error) {
      if (form.isConnected) status!.textContent = errorDetails(error).message;
    } finally {
      button!.disabled = false;
    }
  });
  // @workspace-end 297
}
