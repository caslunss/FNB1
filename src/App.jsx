import React, {useEffect} from 'react';
import {WorkspaceLayout} from './components/WorkspaceLayout.jsx';
import {renderHTML} from './components/TemplateView.jsx';
import {startWorkspace} from './finance/workspace.js';
import {initializeLayout} from './services/layout-preferences.js';

let startup;
export default function App(){
  useEffect(()=>{
    startup ??= initializeLayout().then(()=>startWorkspace({renderHTML}));
    startup.catch(error=>{
      document.documentElement.classList.remove('auth-pending');
      renderHTML(document.getElementById('appNotice'),'<span>Não foi possível abrir o aplicativo. Recarregue a página. Seus dados foram mantidos.</span>');
      document.getElementById('appNotice').hidden=false;
      console.error('Falha ao iniciar TEFinance',error);
    });
  },[]);
  return <WorkspaceLayout/>;
}
