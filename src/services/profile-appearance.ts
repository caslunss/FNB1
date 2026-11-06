export const PROFILE_APPEARANCE_KEY='plan12profile_v1';
export interface ProfileAppearance{name?:string;photo?:string}
type ProfileStorage=Pick<Storage,'getItem'|'setItem'>;
const photoLimit=350_000;
export function validProfilePhoto(value:unknown):value is string{return typeof value==='string'&&value.length<=photoLimit&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)}
export function readProfileAppearance(storage:ProfileStorage):ProfileAppearance{
 try{const raw=storage.getItem(PROFILE_APPEARANCE_KEY);if(!raw||raw.length>photoLimit+1000)return {};const value:unknown=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))return {};const result:ProfileAppearance={};if('name'in value&&typeof value.name==='string'&&value.name.trim()&&value.name.length<=60)result.name=value.name.trim();if('photo'in value&&validProfilePhoto(value.photo))result.photo=value.photo;return result;}catch{return {}}
}
export function saveProfileAppearance(storage:ProfileStorage,name:string,photo:string){
 const clean=name.trim();if(!clean||clean.length>60||/[\u0000-\u001f\u007f]/.test(clean))throw Error('Informe um nome de até 60 caracteres.');
 if(photo&&!validProfilePhoto(photo))throw Error('Use uma foto PNG, JPEG ou WebP válida.');
 const next:ProfileAppearance={name:clean,...(photo?{photo}:{})};storage.setItem(PROFILE_APPEARANCE_KEY,JSON.stringify(next));return next;
}
export function validateProfileImage(file:Pick<File,'type'|'size'>){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<1||file.size>2*1024*1024)throw Error('Escolha uma imagem PNG, JPEG ou WebP de até 2 MB.');}
export async function prepareProfilePhoto(file:File){
 validateProfileImage(file);const url=URL.createObjectURL(file);
 try{const image=new Image();image.src=url;await image.decode();if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>20_000_000)throw Error('Use uma imagem de até 20 megapixels.');const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const context=canvas.getContext('2d');if(!context)throw Error('Não foi possível preparar a foto.');const side=Math.min(image.naturalWidth,image.naturalHeight);context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);const photo=canvas.toDataURL('image/webp',.85);if(!validProfilePhoto(photo))throw Error('A imagem ficou muito grande. Escolha outra foto.');return photo;
 }finally{URL.revokeObjectURL(url)}
}
