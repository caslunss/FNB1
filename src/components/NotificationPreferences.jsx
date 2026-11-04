import React,{useState} from 'react';
import {FinanceGlassSwitch as GlassSwitch} from './LiquidControls.jsx';
import {readNotificationPreferences,saveNotificationPreference} from '../services/notification-preferences.js';

export default function NotificationPreferences(){
  const storage=window.planAuth.storage;
  const [prefs,setPrefs]=useState(()=>readNotificationPreferences(storage)),[error,setError]=useState('');
  return <div className="notification-preferences">{[['expenses','Gastos'],['reports','Relatórios'],['friends','Amizades'],['shares','Divisões']].map(([key,label])=><div className="notification-setting" key={key}><GlassSwitch checked={prefs[key]} aria-label={label} onChange={value=>{try{setPrefs(saveNotificationPreference(storage,key,value));setError('');dispatchEvent(new Event('plan-notification-preferences-change'));}catch{setError('Não foi possível salvar. Tente novamente.')}}}/><span>{label}</span></div>)}{error&&<p className="foot" role="alert">{error}</p>}</div>;
}
