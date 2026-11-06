import type {AuthService} from '../types/browser';
import {errorDetails} from './errors.ts';

/** Visitor access is independent of the deferred Google login module. */
export function bindGuestAccess(
  root: Pick<Document, 'querySelector'> = document,
  getAuth: () => Pick<AuthService, 'useLocal'> = () => window.planAuth,
): () => void {
  const toggle = root.querySelector<HTMLElement>('#guestToggle');
  const form = root.querySelector<HTMLFormElement>('#guestForm');
  const name = root.querySelector<HTMLInputElement>('#guestName');
  const status = root.querySelector<HTMLElement>('#guestStatus');
  if (!toggle || !form || !name || !status) return () => {};
  function open() {
    if (!toggle || !form || !name) return;
    const expanded = form.hidden;
    form.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    if (expanded) name.focus();
  }
  function submit(event: Event) {
    event.preventDefault();
    if (!name || !status) return;
    try { getAuth().useLocal(name.value); }
    catch (error) { status.textContent = errorDetails(error).message || 'Não foi possível entrar como visitante.'; }
  }
  toggle.addEventListener('click', open);
  form.addEventListener('submit', submit);
  return () => {
    toggle.removeEventListener('click', open);
    form.removeEventListener('submit', submit);
  };
}
