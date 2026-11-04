import {auth as sessionAuth} from '../services/auth.ts';
import React,{useEffect,useState} from 'react';
import {FinanceGlassSwitch as GlassSwitch} from './LiquidControls.tsx';
import {NOTIFICATION_KEY,readNotificationPreferences,saveNotificationPreference} from '../services/notification-preferences.ts';

export default function NotificationPreferences(){
  const storage=sessionAuth.storage;
  const [prefs,setPrefs]=useState(()=>readNotificationPreferences(storage)),[error,setError]=useState('');
  useEffect(()=>{
    const sync=()=>setPrefs(readNotificationPreferences(storage));
    const changed=(event:StorageEvent)=>{if(event.key===null||event.key===sessionAuth.key(NOTIFICATION_KEY))sync()};
    addEventListener('storage',changed);addEventListener('plan-notification-preferences-change',sync);
    return()=>{removeEventListener('storage',changed);removeEventListener('plan-notification-preferences-change',sync)};
  },[storage]);
  return <div className="notification-preferences">{[['expenses','Gastos'],['reports','Relatórios'],['friends','Amizades'],['shares','Divisões']].map(([key,label])=><div className="notification-setting" key={key}><GlassSwitch checked={prefs[key]} aria-label={label} onChange={value=>{try{setPrefs(saveNotificationPreference(storage,key,value));setError('');dispatchEvent(new Event('plan-notification-preferences-change'));}catch{setError('Não foi possível salvar. Tente novamente.')}}}/><span>{label}</span></div>)}{error&&<p className="foot" role="alert">{error}</p>}</div>;
}
