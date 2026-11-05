import StartupScreen from './components/StartupScreen';
import React, {useEffect,useState} from 'react';
import {WorkspaceLayout} from './components/WorkspaceLayout.tsx';
import {renderView} from './components/FinanceView.tsx';
import {startWorkspace} from './finance/workspace.tsx';
import {initializeLayout} from './services/layout-preferences.ts';

let startup:Promise<void>|undefined;
export default function App(){
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  useEffect(()=>{
    let active=true;
    startup ??= initializeLayout().then(()=>{
      for(const id of ['app','appNotice','scrim'])if(!document.getElementById(id))throw Error('Estrutura indisponível: '+id);
      return startWorkspace({renderView});
    });
    startup.then(()=>{if(active)setState('ready')}).catch((error:unknown)=>{
      if(active)setState('error');
      document.documentElement.classList.remove('auth-pending');
      renderView(document.getElementById('appNotice'),<span>Não foi possível abrir o aplicativo. Recarregue a página. Seus dados foram mantidos.</span>);
      document.getElementById('appNotice')!.hidden=false;
      console.error('Falha ao iniciar TEFinance',error);
    });
    return()=>{active=false};
  },[]);
  return <><div className="startup-content" inert={state!=='ready'||undefined} aria-busy={state==='loading'}><WorkspaceLayout/></div><StartupScreen state={state} message={state==='error'?'Não foi possível concluir a verificação. Seus dados foram mantidos.':'Verificando acesso e preparando seus dados…'}/></>;
}
