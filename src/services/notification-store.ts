import type {NotificationSnapshot} from '../types/finance';
let snapshot: NotificationSnapshot = {isOpen:false,rows:[]};
const listeners = new Set<() => void>();
export const notificationStore = {
 getSnapshot: () => snapshot,
 subscribe(listener: () => void) {listeners.add(listener);return () => {listeners.delete(listener);};},
 publish(next: NotificationSnapshot) {
  if(snapshot.isOpen===next.isOpen&&JSON.stringify(snapshot.rows)===JSON.stringify(next.rows))return;
  snapshot=next;
  for(const listener of listeners)listener();
 },
};
