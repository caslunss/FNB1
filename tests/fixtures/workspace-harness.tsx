import React from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {WorkspaceLayout} from '../../src/components/WorkspaceLayout';
import {renderView} from '../../src/components/FinanceView';
import {startWorkspace} from '../../src/finance/workspace';
import {initializeLayout} from '../../src/services/layout-preferences';
import {finance} from '../../src/services/finance-runtime';
import '../../src/styles/app-entry.css';

let root: Root | undefined;
let session: Awaited<ReturnType<typeof startWorkspace>>;
let renders=0;
const auth={user:null,client:undefined,config:undefined,storage:sessionStorage,key:(key:string)=>key,hasAccess:()=>true,guestName:()=> 'Migração',useLocal(){},async signIn(){},async signOut(){},async forgetDeletedAccount(){},ready:Promise.resolve(window.planAuth)};
window.planAuth=auth;
auth.ready=Promise.resolve(auth);
window.planCloud={async prepare(){return{mode:'guest'}},stop:()=>undefined,capture(){},connect(){},flush:()=>undefined,state:{mode:'guest'}};

const harness={
 async boot(fail=false){
  await initializeLayout();
  root=createRoot(document.getElementById('root')!);
  flushSync(()=>root!.render(<WorkspaceLayout/>));
  if(fail)Object.defineProperty(finance,'actionItems',{configurable:true,set(){throw Error('injected initialization failure')}});
  try{session=await startWorkspace({renderView:(target,content)=>{renders++;renderView(target,content)}})}
  catch(error){root.unmount();root=undefined;throw error}
  finally{if(fail)Reflect.deleteProperty(finance,'actionItems')}
 },
 stop(){session?.dispose();root?.unmount();root=undefined},
 get session(){return session},
 get renders(){return renders},
 finance,
};
Object.assign(window,{workspaceHarness:harness});
