import { errorDetails } from '../../services/errors.ts';
import {reserveUsernameChange,usernameChangeStatus} from '../../services/username-policy';
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
  workspace.scope.listen(window,'plan-username-editor-open',()=>{
    const user=workspace.socialUser(),input=document.querySelector<HTMLInputElement>('#profileUsername');
    if(user&&input){input.value=workspace.usernames[user]||'';input.focus({preventScroll:true});}
  });
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
    if (!button||!status||button.disabled) return;
    button.disabled = true;
    let rollback:(()=>void)|undefined;
    try {
      const user=workspace.socialUser(),client=window.planAuth.client;
      if(!user||!client)throw Error('Entre novamente para alterar seu usuário.');
      const username = workspace.normalizeUsername(
        new FormData(form).get('username'),
      );
      if (!workspace.validUsername(username))
        throw Error('Use de 3 a 40 letras, números ou sublinhado.');
      if(username===workspace.usernames[user]){status.textContent='Este já é seu nome de usuário.';return;}
      rollback=reserveUsernameChange();
      const result = await client.from('app_usernames')
        .update({ username })
        .eq('user_id', user)
        .select('username')
        .single();
      if (result.error)
        throw Error(
          result.error.code === '23505'
            ? 'Este usuário já está em uso. Escolha outro.'
            : 'Não foi possível salvar. Tente novamente.',
        );
      rollback=undefined;
      workspace.usernames[user] = result.data.username;
      if(form.isConnected)status.textContent = 'Usuário salvo: @' + result.data.username;
    } catch (error) {
      try{rollback?.();}catch{}
      if (form.isConnected) status.textContent = errorDetails(error).message;
    } finally {
      button.disabled = !usernameChangeStatus().allowed;
    }
  });
  // @workspace-end 297
}
