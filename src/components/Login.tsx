import {LoginEntrance,LoginItem} from './motion/LoginEntrance.tsx';
import React, {useEffect,useState} from 'react';
import {FinanceSegmentedControl,GlassTextField,FinanceGlassButton as GlassButton} from './LiquidControls.tsx';
import {initializeLayout} from '../services/layout-preferences.ts';

let initialized:Promise<unknown>|undefined;
function LoginThemeControl(){
  const [dark,setDark]=useState(()=>document.documentElement.dataset.theme==='dark');
  useEffect(()=>{const observer=new MutationObserver(()=>setDark(document.documentElement.dataset.theme==='dark'));observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return ()=>observer.disconnect()},[]);
  function change(index:number){
    const mode=index===1?'dark':'light';
    try{localStorage.setItem('plan12appearance',JSON.stringify(mode));}catch{}
    document.documentElement.dataset.theme=mode;
    setDark(index===1);
  }
  const icon=(path:React.ReactNode)=><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>;
  return <div className="login-theme-control"><FinanceSegmentedControl aria-label="Tema da tela de login" value={dark?1:0} onChange={change} options={[
    {label:'Modo claro',icon:icon(<><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>)},
    {label:'Modo escuro',icon:icon(<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>)},
  ]}/></div>;
}
export default function Login(){
  useEffect(()=>{
    initializeLayout();
    initialized ??= Promise.all([
      import('../services/login-transition.ts'),
    ]).then(()=>import('../services/login.ts'));
  },[]);
  return <>
    <div className="login-still-background" aria-hidden="true"/>
    <div className="login-background-shade" aria-hidden="true"/>
    <LoginThemeControl/>
    <main className="login-shell login-fullscreen" aria-label="Acesso">
      <section className="login-introduction"><h1>Mais equilíbrio.<br/>Mais possibilidades.</h1></section>
      <LoginEntrance className="login-access"><LoginItem className="login-access-heading"><div className="login-brand"><img src="./assets/tefinance-logo.png" alt="TEFinance" width="48" height="48"/></div><div><h2>Entre para organizar<br/>o que importa.</h2></div></LoginItem>
      <div className="login-actions"><LoginItem className="login-providers">
        <div id="googleButton" className="google-area"><button className="google-placeholder" type="button" disabled aria-describedby="loginStatus" title="Carregando login Google"><img src="./assets/google-g.png" alt="" width="20" height="20"/>Entrar com Google</button></div>
        <div className="apple-provider"><button id="appleButton" type="button" disabled aria-label="Entrar com Apple — disponível após configuração"><img src="./assets/apple-signin.png" alt="Entrar com Apple" width="320" height="44"/></button></div>
      </LoginItem>
      <LoginItem><GlassButton id="guestToggle" className="local-link" type="button" intensity={3} aria-expanded="false" aria-controls="guestForm">Continuar como visitante</GlassButton></LoginItem>
      <form id="guestForm" hidden><label htmlFor="guestName" className="lg-input__label">Seu nome</label><GlassTextField><input id="guestName" name="name" autoComplete="given-name" maxLength={60} required/></GlassTextField><p className="guest-note">Dados temporários nesta aba do navegador.</p><GlassButton className="local-link" type="submit" intensity={3}>Entrar</GlassButton><p id="guestStatus" className="login-error" role="status"/></form>
      <GlassButton id="loginRetry" type="button" hidden>Tentar novamente</GlassButton>
      <p id="loginStatus" className="sr-only" role="status" aria-live="polite">Carregando login Google.</p></div>
      </LoginEntrance>
    </main>
  </>;
}
