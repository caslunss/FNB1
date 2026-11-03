import React,{useId,useSyncExternalStore} from 'react';
import {getLayout,subscribeLayout} from '../services/layout-preferences.js';

const getCircularProgress=()=>getLayout().circularProgress;

export default function ProgressGauge({value,label,status,indicatorKey,known=true,attention=false,limit=false,children}){
  const circularProgress=useSyncExternalStore(subscribeLayout,getCircularProgress);
  const id='progress-'+useId().replace(/[^a-zA-Z0-9_-]/g,''),enabled=true;
  const percentage=Number.isFinite(value)?Math.max(0,value):0,fill=Math.min(100,percentage),text=percentage>0&&percentage<.1?'<0,1%':(Math.floor(percentage*10+1e-9)/10).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
  if(!circularProgress)return <div className="progress-fallback">{children}</div>;
  return <div className={`progress-gauge${attention?' has-attention':''}${limit?' at-limit':''}${enabled?'':' is-disabled'}${known?'':' is-unknown'}`}>
    <svg className="progress-arc" viewBox="0 0 160 160" role="img" aria-label={`${label}: ${known?text:'sem limite'}. ${status}`}>
      <defs><linearGradient id={id} x1="0" y1="1" x2="1" y2="0"><stop stopColor={attention?'var(--redT)':'var(--tint)'} offset="0"/><stop stopColor={attention?'var(--progress-warm)':'var(--progress-mint)'} offset="1"/></linearGradient></defs>
      <path className="progress-arc-track" d="M36.16 123.84 A62 62 0 1 1 123.84 123.84" pathLength="100"/>
      <path className="progress-arc-value" d="M36.16 123.84 A62 62 0 1 1 123.84 123.84" pathLength="100" stroke={limit?'var(--redT)':`url(#${id})`} strokeDasharray={`${fill} 100`} style={{opacity:fill&&known&&enabled?1:0}}/>
    </svg>
    <div className="progress-gauge-center"><strong aria-hidden="true">{known?text:'—'}</strong><small>{status}</small></div>
  </div>;
}
