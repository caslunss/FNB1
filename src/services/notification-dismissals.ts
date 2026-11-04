export const DISMISSED_NOTIFICATIONS_KEY='plan12notificationDismissed_v1';
export function readDismissedNotifications(storage:Pick<Storage,'getItem'>):Set<string>{
 try{const rows=JSON.parse(storage.getItem(DISMISSED_NOTIFICATIONS_KEY)||'[]');return new Set(Array.isArray(rows)?rows.filter(id=>typeof id==='string'):[])}catch{return new Set<string>()}
}
export function clearNotificationRows(storage:Pick<Storage,'getItem'|'setItem'>,rows:readonly {id:string}[]){
 const ids=readDismissedNotifications(storage);
 for(const row of rows)ids.add(row.id);
 // Only notification identities are persisted. Financial records are never touched.
 storage.setItem(DISMISSED_NOTIFICATIONS_KEY,JSON.stringify([...ids]));
}
