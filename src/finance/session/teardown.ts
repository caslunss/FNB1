import { notificationStore } from '../../services/notification-store';

/** Release presentation locks without changing or deleting financial records. */
export function releaseWorkspacePresentation() {
  notificationStore.publish({ isOpen: false, rows: [] });
  document.body.style.overflow = '';
  for (const element of document.querySelectorAll<HTMLElement>(
    '.workspace-frame,.account-toolbar,.theme-mobile',
  ))
    element.inert = false;
  for (const selector of [
    '#accountOverlay',
    '#receiptDialog',
    '#incomingDebtDialog',
  ]) {
    const dialog = document.querySelector<HTMLDialogElement>(selector);
    if (dialog?.open) dialog.close();
  }
  document.querySelector('#incomingDebtDialog')?.remove();
}
