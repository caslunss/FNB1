import {useEffect,useRef,useState} from 'react';
import {RiCameraLine} from '@remixicon/react';
import {FinanceGlassButton as Button,GlassTextField} from './LiquidControls';
import {auth} from '../services/auth';
import {readProfileAppearance,saveProfileAppearance,prepareProfilePhoto} from '../services/profile-appearance';

export default function ProfileEditor({name,photo,formId,onSaved}:{name:string;photo?:string;formId:string;onSaved:()=>void}){
 const [draft,setDraft]=useState(name),[picture,setPicture]=useState(()=>readProfileAppearance(auth.storage).photo||''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[failedPreview,setFailedPreview]=useState('');
 const sequence=useRef(0),file=useRef<HTMLInputElement>(null),preview=picture||photo;
 useEffect(()=>()=>{sequence.current++},[]);
 async function choose(image:File|undefined){if(!image)return;const token=++sequence.current;setBusy(true);setError('');try{const prepared=await prepareProfilePhoto(image);if(sequence.current===token)setPicture(prepared)}catch{if(sequence.current===token)setError('Não foi possível usar a foto. Escolha PNG, JPEG ou WebP de até 2 MB.')}finally{if(sequence.current===token)setBusy(false)}}
 function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;setError('');try{saveProfileAppearance(auth.storage,draft,picture);onSaved();dispatchEvent(new Event('plan-profile-appearance-change'));}catch{setError('Não foi possível salvar. Verifique o nome e o espaço disponível neste dispositivo.')}}
 return <form id={formId} className="profile-editor" onSubmit={save} aria-busy={busy||undefined}>
  <div className="profile-editor-photo"><div className="profile-card-photo">{preview&&failedPreview!==preview?<img src={preview} alt="Prévia da foto do perfil" referrerPolicy="no-referrer" onError={()=>setFailedPreview(preview)}/>:<span className="profile-card-initial">{draft.trim().slice(0,1).toUpperCase()||'V'}</span>}</div><Button type="button" className="ib" aria-label="Escolher foto do perfil" disabled={busy} onClick={()=>file.current?.click()}><RiCameraLine aria-hidden="true"/></Button></div>
  <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Arquivo da foto do perfil" tabIndex={-1} onChange={event=>{const image=event.currentTarget.files?.[0];event.currentTarget.value='';void choose(image)}}/>
  <label className="profile-name-field"><span>Nome de exibição</span><GlassTextField><input name="displayName" value={draft} onChange={event=>setDraft(event.target.value)} required maxLength={60} autoComplete="name"/></GlassTextField></label>
  <p className="foot">Nome e foto salvos neste dispositivo. A foto deve ter até 2 MB.</p>
  {busy&&<p role="status" className="foot">Preparando foto…</p>}{error&&<p role="alert" className="bad">{error}</p>}
  <Button type="submit" disabled={busy}>Salvar perfil</Button>
 </form>;
}
