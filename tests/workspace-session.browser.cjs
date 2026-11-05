const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5173';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/tests/fixtures/workspace-lifecycle.html');
  await page.waitForFunction(()=>window.workspaceHarness);
  await page.evaluate(()=>{
   const originalAdd=window.addEventListener.bind(window),originalRemove=window.removeEventListener.bind(window),active=new Set();
   window.addEventListener=function(type,fn,options){if(type==='plan-segment-request')active.add(fn);return originalAdd(type,fn,options)};
   window.removeEventListener=function(type,fn,options){if(type==='plan-segment-request')active.delete(fn);return originalRemove(type,fn,options)};
   window.workspaceListenerCount=()=>active.size;
  });
  const failure=await page.evaluate(async()=>{try{await window.workspaceHarness.boot(true);return ''}catch(error){return error.message}});
  assert.match(failure,/injected initialization failure/);
  assert.equal(await page.evaluate(()=>window.workspaceListenerCount()),0);
  assert.equal(await page.evaluate(()=>Object.keys(window.workspaceHarness.finance).length),0,'failed initialization restores the registry');
  await page.evaluate(()=>window.workspaceHarness.boot());
  assert.equal(await page.evaluate(()=>window.workspaceListenerCount()),1);
  const state=await page.evaluate(()=>{
   const {session,finance}=window.workspaceHarness,date=session.todayISO();
   session.saveIncome({d:'Renda da migração',v:1000,date});
   session.saveExpense({d:'Gasto da migração',v:12.34,date,c:'Gastos Essenciais',p:'Pix'});
   finance.mobile.open('settings');
   const stored=sessionStorage.getItem('plan12workspace_v3');
   window.workspaceHarness.stop();
   return {stored,closed:!document.querySelector('dialog[open]'),unlocked:document.body.style.overflow==='',disposed:session.scope.disposed};
  });
  assert(state.closed&&state.unlocked&&state.disposed);
  assert.equal(await page.evaluate(()=>window.workspaceListenerCount()),0);
  await page.evaluate(()=>{
   const before=window.workspaceHarness.renders;
   dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind:'data-summary-mode',value:'entries'}}));
   if(window.workspaceHarness.renders!==before)throw Error('a disposed session rendered');
  });
  await page.evaluate(()=>window.workspaceHarness.boot());
  assert.equal(await page.evaluate(()=>window.workspaceListenerCount()),1,'restart has exactly one controller listener');
  assert.equal(await page.evaluate(()=>window.workspaceHarness.session.S.items[0].v),12.34);
  assert.equal(await page.evaluate(()=>window.workspaceHarness.session.S.receipts[0].v),1000);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('plan12workspace_v3')).data),JSON.parse(state.stored).data);
  const abort=await page.evaluate(async()=>{
   window.planAuth.user={id:'test-user'};
   window.planAuth.client={auth:{getSession:async()=>({data:{session:{access_token:'test-token'}}})}};
   const original=window.fetch;
   window.fetch=(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('cancelled','AbortError')),{once:true}));
   const session=window.workspaceHarness.session,pending=session.shoppingRequest({action:'search',query:'notebook'}).catch(error=>error.name);
   await new Promise(resolve=>queueMicrotask(()=>queueMicrotask(resolve)));
   window.workspaceHarness.stop();
   const result=await pending;window.fetch=original;
   let rejected=false;try{session.saveIncome({d:'Tarde',v:1,date:session.todayISO()})}catch{rejected=true}
   return {result,rejected};
  });
  assert.equal(abort.result,'AbortError');assert.equal(abort.rejected,true);
  assert.deepEqual(errors,[]);
  console.log('PASS workspace session: partial startup cleanup, registry restoration, single listeners, restart persistence, unlocked overlays and request abort');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
