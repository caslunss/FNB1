const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5173';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for(const retryFirst of [false,true]){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
   try {
    const page=await context.newPage(),errors=[];let broken=true,blocked=0;
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/auth/v1/settings',route=>route.fulfill({json:{external:{google:false}}}));
    await page.route('**/*.js*',async route=>{
     const url=new URL(route.request().url());
     if(url.origin!==new URL(base).origin||!url.pathname.startsWith('/assets/login-'))return route.fallback();
     const response=await route.fetch(),source=await response.text();
     if(broken&&source.includes('Login Google aguardando configuração.')){blocked++;return route.abort();}
     return route.fulfill({response});
    });
    await page.route('**/src/services/login.ts*',route=>{if(broken){blocked++;return route.abort();}return route.continue();});
    await page.goto(base+'/login.html');
    const retry=page.getByRole('button',{name:'Tentar novamente',exact:true});await retry.waitFor({state:'visible'});
    assert(blocked>0,'The deferred login module must actually fail');
    assert.match(await page.locator('#loginStatus').innerText(),/Não foi possível carregar/);
    if(retryFirst){broken=false;await Promise.all([page.waitForEvent('load'),retry.click()]);await page.waitForFunction(()=>document.querySelector('#loginStatus')?.textContent==='Google aguardando ativação.');}
    await page.getByRole('button',{name:'Continuar como visitante',exact:true}).click();
    assert.equal(await page.locator('#guestToggle').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#guestName').evaluate(node=>node===document.activeElement),true);
    await page.locator('#guestName').fill('Visitante recuperação');
    await page.locator('#guestForm').getByRole('button',{name:'Entrar',exact:true}).click();
    await page.waitForURL('**/index.html');await page.waitForFunction(()=>window.planAuth?.hasAccess());
    assert.deepEqual(await page.evaluate(()=>[sessionStorage.getItem('plan12-access'),sessionStorage.getItem('plan12-guest-name')]),['local','Visitante recuperação']);
    assert.deepEqual(errors,[],'A handled module failure must not cause an unhandled rejection');
   }finally{await context.close();}
  }
  console.log('PASS login recovery: failed chunk keeps visitor access, retry reloads failed graph, no unhandled rejection');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
