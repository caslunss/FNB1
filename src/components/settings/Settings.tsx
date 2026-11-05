import {useEffect,useRef,useState,type ReactNode} from 'react';
import {FinanceGlassButton,FinanceGlassCard} from '../LiquidControls';
import PageTransition from '../motion/PageTransition';
import {settingsScreen,SETTINGS_TITLES,type SettingsScreen} from '../../services/settings-navigation';
import SettingsIcon from './SettingsIcon';
import AccountTab from './AccountTab';
import PreferencesTab from './PreferencesTab';
import NotificationsTab from './NotificationsTab';
import DataConnectionsTab from './DataConnectionsTab';
import SecurityTab from './SecurityTab';

export interface SettingsProps{initialScreen?:string;isVisitor:boolean;identity:ReactNode;username:ReactNode;sync:ReactNode;data:ReactNode;connections:ReactNode}
export default function Settings({initialScreen,isVisitor,identity,username,sync,data,connections}:SettingsProps){
 const [screen,setScreen]=useState<SettingsScreen>(()=>settingsScreen(initialScreen,isVisitor)),[direction,setDirection]=useState<1|-1>(1);
 const title=useRef<HTMLHeadingElement>(null),initial=useRef(true);
 useEffect(()=>{if(initial.current){initial.current=false;return;}title.current?.focus({preventScroll:true});},[screen]);
 function navigate(next:SettingsScreen){setDirection(next==='home'?-1:1);setScreen(settingsScreen(next,isVisitor));}
 const groups:{label:string;items:Exclude<SettingsScreen,'home'>[]}[]=[{label:'Conta',items:['account']},{label:'Personalização',items:['layout','notifications']},{label:'Gerenciamento',items:['connections','security']}];
 function row(key:Exclude<SettingsScreen,'home'>){return <div className="settings-menu-item" key={key}><FinanceGlassButton type="button" control="option" id={'settingsTab-'+key} data-account-settings-tab={key} className="settings-menu-row" onClick={()=>navigate(key)}><span className="settings-row-content grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"><SettingsIcon name={key}/><span>{SETTINGS_TITLES[key]}</span><SettingsIcon name="next"/></span></FinanceGlassButton></div>}
 return <section className="settings-navigation w-full min-w-0" data-settings-screen={screen} onKeyDown={event=>{if(event.key==='Escape'&&screen!=='home'&&event.target instanceof Element&&event.target.closest('dialog')===event.currentTarget.closest('dialog')){event.preventDefault();event.stopPropagation();navigate('home');const root=event.currentTarget;root.dispatchEvent(new CustomEvent('plan-settings-home',{bubbles:true}));}}}>
  <header className="settings-navigation-header">
   <FinanceGlassButton type="button" className="ib settings-back" data-close-account={screen==='home'?'':undefined} aria-label={screen==='home'?'Fechar configurações':'Voltar para configurações'} onClick={event=>{if(screen!=='home'){event.stopPropagation();event.currentTarget.dispatchEvent(new CustomEvent('plan-settings-home',{bubbles:true}));navigate('home');}}}><SettingsIcon name="back"/></FinanceGlassButton>
   <h2 id="accountOverlayTitle" ref={title} tabIndex={-1}>{SETTINGS_TITLES[screen]}</h2><span aria-hidden="true"/>
  </header>
  <div className="settings-page-viewport"><PageTransition routeKey={screen} direction={direction} initial={false} className="settings-navigation-content">
   {screen==='home'?<nav className="settings-main-menu grid gap-6" aria-label="Configurações">{groups.filter(group=>!isVisitor||group.items[0]!=='account').map(group=><section key={group.label} aria-label={group.label}><h3 className="settings-group-title">{group.label}</h3><FinanceGlassCard className="settings-list-group" padding="0px">{group.items.map(row)}</FinanceGlassCard></section>)}</nav>:screen==='account'?<AccountTab identity={identity} username={username}/>:screen==='layout'?<PreferencesTab/>:screen==='notifications'?<NotificationsTab/>:screen==='connections'?<DataConnectionsTab sync={sync} data={data} connections={connections}/>:<SecurityTab/>}
  </PageTransition></div>
 </section>;
}
