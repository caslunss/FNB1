import {finance} from '../services/finance-runtime.ts';
import React,{useId,useState} from 'react';
import {RiArrowLeftSLine,RiSettings3Line,RiLogoutBoxRLine,RiPencilLine} from '@remixicon/react';
import {FinanceGlassButton as Button,FinanceGlassCard as Card} from './LiquidControls.tsx';
import PageTransition from './motion/PageTransition';
import ProfileEditor from './ProfileEditor';

/** Shared native dialog retains backdrop, focus trapping and logout behavior. */
export default function ProfileCard({name,photo,email,verified=false,tester=false,supporter=false,children}:{name:string;photo?:string;email?:string;verified?:boolean;tester?:boolean;supporter?:boolean;children?:React.ReactNode}){
 const title=useId(),form=useId(),[failedPhoto,setFailedPhoto]=useState(''),[editing,setEditing]=useState(false);
 const image=photo&&failedPhoto!==photo;
 return <Card className="card finance-layout-card profile-hover-card" padding="0px" aria-labelledby="accountOverlayTitle" onKeyDown={event=>{if(editing&&event.key==='Escape'){event.preventDefault();event.stopPropagation();setEditing(false)}}}>
  <header className="profile-menu-header account-progressive-header">
   <Button type="button" className="ib account-overlay-close" data-close-account={!editing?'':undefined} aria-label={editing?'Voltar para o perfil':'Fechar Perfil'} onClick={()=>{if(editing)setEditing(false)}}><RiArrowLeftSLine aria-hidden="true"/></Button>
   <h2 id="accountOverlayTitle">{editing?'Editar perfil':'Meu perfil'}</h2>
   {editing?<span aria-hidden="true"/>:<Button type="button" className="ib" aria-label="Configurações" onClick={()=>finance.mobile?.open('settings')}><RiSettings3Line aria-hidden="true"/></Button>}
  </header>
  <PageTransition routeKey={editing?'edit':'profile'} direction={editing?1:-1} initial={false} className="profile-popup-content">
   {editing?<ProfileEditor name={name} photo={photo} formId={form} onSaved={()=>setEditing(false)}/>:<>
    <section className="profile-menu-identity" aria-labelledby={title}>
     <div className="profile-card-photo" aria-hidden="true">{image?<img src={photo} alt="" referrerPolicy="no-referrer" onError={()=>setFailedPhoto(photo)}/>:<span className="profile-card-initial">{name.trim().slice(0,1).toUpperCase()||'V'}</span>}</div>
     <div className="profile-card-identity"><h3 id={title}>{name||'Visitante'}{verified&&<svg className="profile-verified" viewBox="0 0 24 24" role="img" aria-label="E-mail verificado"><circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/></svg>}</h3>{email&&<p className="profile-email">{email}</p>}{(tester||supporter)&&<div className="profile-card-badges">{tester&&<span>Testador</span>}{supporter&&<span>Apoiador</span>}</div>}<Button type="button" onClick={()=>setEditing(true)}><RiPencilLine aria-hidden="true"/>Editar perfil</Button></div>
    </section>
    <div className="profile-card-content">{children}</div>
    <footer className="profile-card-actions"><Button type="button" id="accountSignOut"><RiLogoutBoxRLine aria-hidden="true"/>Sair</Button></footer>
   </>}
  </PageTransition>
 </Card>;
}
