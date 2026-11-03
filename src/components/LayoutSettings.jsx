import React, {useEffect, useState, useSyncExternalStore} from 'react';
import {GlassSlider,GlassSwitch} from '@zakisheriff/liquid-glass';
import {FinanceGlassButton as GlassButton,ThemeSwitch} from './LiquidControls.jsx';
import {getLayout,subscribeLayout,updateLayout,resetLayout,selectPalette,setCircularProgress,setSectionEnabled,PALETTES} from '../services/layout-preferences.js';

export default function LayoutSettings(){
  const layout=useSyncExternalStore(subscribeLayout,getLayout);
  const [theme,setTheme]=useState(()=>document.documentElement.dataset.theme==='dark'?'dark':'light');
  const [message,setMessage]=useState('');
  useEffect(()=>{const observer=new MutationObserver(()=>setTheme(document.documentElement.dataset.theme==='dark'?'dark':'light'));observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return ()=>observer.disconnect()},[]);
  function change(field,value){const previous=field==='intensity'?getLayout().intensity:getLayout()[theme][field];if(String(previous).toLowerCase()===String(value).toLowerCase())return;try{updateLayout(theme,field,value);setMessage('Layout salvo.')}catch{setMessage('Não foi possível salvar. Suas cores anteriores foram mantidas.')}}
  return <section className="layout-tab-content" aria-label="Layout" id="layoutEditor">
    <div className="layout-editor-content">
      <ThemeSwitch/>
      <section className="layout-sections"><h3>Abas</h3>{[['credit','Cartões'],['carbon','Carbono'],['calendar','Calendário']].map(([key,label])=><div className="layout-progress-setting" key={key}><span>{label}</span><GlassSwitch checked={layout.sections[key]} aria-label={'Mostrar aba '+label} onChange={next=>{try{setSectionEnabled(key,next);setMessage('Aba atualizada.')}catch{setMessage('Não foi possível salvar.')}}}/></div>)}</section>
      <div className="layout-progress-setting"><span>Indicadores circulares</span><GlassSwitch checked={layout.circularProgress} aria-label="Indicadores circulares" onChange={next=>{try{setCircularProgress(next);setMessage('Layout salvo.')}catch{setMessage('Não foi possível salvar.')}}}/></div>
      <div className="palette-picker" aria-label="Paleta do aplicativo">{['Essencial','Outono','Inverno'].map(season=><section key={season} className="palette-season"><h3>{season}</h3><div className="palette-options">{PALETTES.filter(p=>p.season===season).map(p=><GlassButton key={p.id} type="button" className="palette-choice" aria-pressed={layout.palette===p.id} onClick={()=>{try{selectPalette(p.id);setMessage('Paleta salva.')}catch{setMessage('Não foi possível salvar a paleta.')}}}><span className="palette-swatches" aria-hidden="true">{['surface','background','accent'].map(key=><i key={key} style={{backgroundColor:p[theme][key]}}/>)}</span><span>{p.name}</span><span className="palette-check" aria-hidden="true">{layout.palette===p.id?'✓':''}</span></GlassButton>)}</div></section>)}</div>
      <div className="layout-sliders">{theme==='dark'&&<div className="layout-slider dim-slider"><div><span>Suavidade no escuro</span><output>{layout.dark.dim}%</output></div><GlassSlider min={0} max={100} step={1} value={layout.dark.dim} onChange={next=>change('dim',Math.round(next))} aria-label="Suavidade no escuro"/><p className="foot">Menos reflexos e bordas mais discretas.</p></div>}{[['opacity','Opacidade do vidro',40,95,layout[theme].opacity,'%'],['blur','Desfoque',0,28,layout[theme].blur,' px'],['intensity','Refração',1,10,layout.intensity,'']].map(([field,label,min,max,value,unit])=><div className="layout-slider" key={field}><div><span>{label}</span><output>{value}{unit}</output></div><GlassSlider min={min} max={max} step={1} value={value} onChange={next=>change(field,Math.round(next))} aria-label={label}/></div>)}</div>
      <p className="foot">Preferências salvas neste dispositivo.</p>
      <GlassButton type="button" onClick={()=>{try{resetLayout(theme);setMessage('Padrão restaurado.')}catch{setMessage('Não foi possível restaurar o layout.')}}}>Restaurar padrão</GlassButton>
      <p className="foot" role="status">{message}</p>
    </div>
  </section>;
}
