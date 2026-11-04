import React, {useEffect} from 'react';
import {WorkspaceLayout} from './components/WorkspaceLayout.tsx';
import {renderView} from './components/FinanceView.tsx';
import {startWorkspace} from './finance/workspace.tsx';
import {initializeLayout} from './services/layout-preferences.ts';

let startup:Promise<void>|undefined;
export default function App(){
  useEffect(()=>{
    startup ??= initializeLayout().then(()=>startWorkspace({renderView}));
    startup.catch((error:unknown)=>{
      document.documentElement.classList.remove('auth-pending');
      renderView(document.getElementById('appNotice'),<span>Não foi possível abrir o aplicativo. Recarregue a página. Seus dados foram mantidos.</span>);
      document.getElementById('appNotice')!.hidden=false;
      console.error('Falha ao iniciar TEFinance',error);
    });
  },[]);
  return <WorkspaceLayout/>;
}
