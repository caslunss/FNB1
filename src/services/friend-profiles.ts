import {finance} from './finance-runtime';
import {auth} from './auth';
import {validProfilePhoto} from './profile-appearance';
import {validFriendPhoto} from './friend-photo';
export interface FriendProfile{id:string;username:string;name:string;photo?:string}
export async function lookupFriendProfile(value:string,signal?:AbortSignal):Promise<FriendProfile>{
 const username=value.trim().replace(/^@/,'').toLowerCase();
 if(!/^[a-z0-9_]{3,40}$/.test(username))throw Error('Use de 3 a 40 letras, números ou _.');
 if(!auth.user||!auth.client)throw Error('Entre com sua conta para vincular um @usuário.');
 const {data,error}=await auth.client.auth.getSession();if(error||!data.session)throw Error('Entre novamente para buscar o amigo.');
 const response=await fetch('/api/friend-profile?username='+encodeURIComponent(username),{headers:{Authorization:'Bearer '+data.session.access_token},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});
 const result=await response.json();if(!response.ok)throw Error(typeof result.error==='string'?result.error:'Não foi possível buscar esse amigo.');
 if(!result||typeof result.id!=='string'||!/^[a-f0-9-]{36}$/.test(result.id)||result.username!==username||typeof result.name!=='string'||!result.name.trim()||result.name.length>80||result.photo!==undefined&&!validFriendPhoto(result.photo))throw Error('Perfil do amigo inválido.');
 return{id:result.id,username,name:result.name,...(result.photo?{photo:result.photo}:{})};
}
/** Only the signed-in user's chosen display identity is shared with accepted friends. */
export async function publishFriendAppearance(name:string,photo:string){
 if(!name.trim()||name.length>60||/[\u0000-\u001f\u007f]/.test(name)||photo&&!validProfilePhoto(photo))throw Error('Revise o nome e a foto.');
 if(!auth.user||!auth.client)return;
 finance.friends.saveIdentity(name,photo);
 const result=await window.planCloud?.flush();if(result&&result.mode!=='synced')throw Error('Nome e foto salvos neste dispositivo. Aguarde a sincronização para compartilhar com amigos.');
}
