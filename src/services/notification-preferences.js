export const NOTIFICATION_DEFAULTS=Object.freeze({expenses:true,reports:true,friends:true,shares:true});
export const NOTIFICATION_KEY='plan12notificationPreferences';
export function readNotificationPreferences(storage){
  try{const saved=JSON.parse(storage.getItem(NOTIFICATION_KEY)||'{}');return Object.fromEntries(Object.entries(NOTIFICATION_DEFAULTS).map(([key,value])=>[key,typeof saved?.[key]==='boolean'?saved[key]:value]));}catch{return {...NOTIFICATION_DEFAULTS};}
}
export function saveNotificationPreference(storage,key,value){
  if(!Object.hasOwn(NOTIFICATION_DEFAULTS,key)||typeof value!=='boolean')throw Error('Preferência inválida.');
  const next={...readNotificationPreferences(storage),[key]:value};storage.setItem(NOTIFICATION_KEY,JSON.stringify(next));return next;
}
