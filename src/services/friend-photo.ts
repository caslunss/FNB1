import {validProfilePhoto} from './profile-appearance.ts';
export function validFriendPhoto(value:unknown):value is string{
 if(validProfilePhoto(value))return true;
 if(typeof value!=='string'||value.length>2048)return false;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(url.hostname==='googleusercontent.com'||url.hostname.endsWith('.googleusercontent.com'))}catch{return false}
}
