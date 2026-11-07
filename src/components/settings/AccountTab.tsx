import {useEffect,useState,type ReactNode} from 'react';
import {FinanceGlassButton,FinanceGlassCard} from '../LiquidControls';
import {subscribeUsernamePolicy,usernameChangeStatus} from '../../services/username-policy';

export default function AccountTab({identity,username}:{identity:ReactNode;username:ReactNode}){
 const [editing,setEditing]=useState(false),[policy,setPolicy]=useState(()=>usernameChangeStatus());
 useEffect(()=>subscribeUsernamePolicy(()=>setPolicy(usernameChangeStatus())),[]);
 useEffect(()=>{if(editing)window.dispatchEvent(new Event('plan-username-editor-open'));},[editing]);
 const next=policy.nextMonth?new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(policy.nextMonth+'-01T12:00:00')):null;
 return <div className="settings-account grid min-w-0 gap-4">
  <FinanceGlassCard className="card">{identity}</FinanceGlassCard>
  <div>
   <FinanceGlassButton type="button" disabled={!editing&&!policy.allowed} aria-expanded={editing} aria-controls="settingsUsernameEditor" onClick={()=>setEditing(value=>!value)}>{editing?'Fechar':'Alterar usuário'}</FinanceGlassButton>
   <p className="foot" id="settingsUsernameRule">Uma alteração de usuário por mês.</p>
   {!policy.allowed&&<p className="foot" role="status">{policy.unavailable?'Não foi possível verificar o prazo para alteração.':`Disponível novamente em ${next}.`}</p>}
  </div>
  {editing&&<div id="settingsUsernameEditor">{username}</div>}
 </div>;
}
