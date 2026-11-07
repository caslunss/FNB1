import {validFriendPhoto} from './friend-photo.ts';
/** Private receivables ledger. It never creates expenses, income or remote invitations. */
export interface LocalFriend{id:string;name:string;photo?:string;username?:string;accountId?:string}
export interface FriendReceivable{id:string;friendId:string;description:string;cents:number;paid:boolean;sourceDebtId?:string}
export interface FriendsLedger{version:1;localFriends:LocalFriend[];receivables:FriendReceivable[]}
export const emptyFriendsLedger=():FriendsLedger=>({version:1,localFriends:[],receivables:[]});
export function validateFriendsLedger(value:unknown):FriendsLedger{
 if(!value||typeof value!=='object')throw Error('Dados de amigos inválidos.');
 const raw=value as Partial<FriendsLedger>;
 if(raw.version!==1||!Array.isArray(raw.localFriends)||!Array.isArray(raw.receivables)||raw.localFriends.length>200||raw.receivables.length>2000)throw Error('Limite de amigos ou dívidas excedido.');
 const ids=new Set<string>(),accounts=new Set<string>(),records=new Set<string>();
 const localFriends=raw.localFriends.map(friend=>{if(!friend||typeof friend.id!=='string'||!(/^(?:local-)?[a-f0-9-]{36}$/.test(friend.id))||ids.has(friend.id)||typeof friend.name!=='string'||!friend.name.trim()||friend.name.length>80)throw Error('Cadastro de amigo inválido.');if(friend.photo!==undefined&&!validFriendPhoto(friend.photo)||friend.username!==undefined&&!/^[a-z0-9_]{3,40}$/.test(friend.username)||friend.accountId!==undefined&&!/^[a-f0-9-]{36}$/.test(friend.accountId)||!friend.id.startsWith('local-')&&friend.id!==friend.accountId)throw Error('Perfil vinculado inválido.');if(friend.accountId&&accounts.has(friend.accountId))throw Error('Esse usuário já está vinculado a um amigo.');if(friend.accountId)accounts.add(friend.accountId);ids.add(friend.id);return{id:friend.id,name:friend.name.trim(),...(friend.photo?{photo:friend.photo}:{}),...(friend.username?{username:friend.username}:{}),...(friend.accountId?{accountId:friend.accountId}:{})}});
 const receivables=raw.receivables.map(row=>{if(!row||typeof row.id!=='string'||!/^[-a-f0-9]{36}$/.test(row.id)||records.has(row.id)||typeof row.friendId!=='string'||!row.friendId||row.friendId.length>80||row.friendId.startsWith('local-')&&!ids.has(row.friendId)||typeof row.description!=='string'||!row.description.trim()||row.description.length>240||!Number.isSafeInteger(row.cents)||row.cents<1||row.cents>100000000||typeof row.paid!=='boolean'||row.sourceDebtId!==undefined&&(typeof row.sourceDebtId!=='string'||row.sourceDebtId.length>100))throw Error('Dívida de amigo inválida.');records.add(row.id);return{id:row.id,friendId:row.friendId,description:row.description.trim(),cents:row.cents,paid:row.paid,...(row.sourceDebtId?{sourceDebtId:row.sourceDebtId}:{})}});
 return{version:1,localFriends,receivables};
}
export function friendBalance(ledger:FriendsLedger,friendId?:string){return ledger.receivables.filter(row=>!row.paid&&(!friendId||row.friendId===friendId)).reduce((sum,row)=>sum+row.cents,0)}
