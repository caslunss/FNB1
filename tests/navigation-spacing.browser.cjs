const assert=require('node:assert/strict');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5200';
const screens=['commitments:debts','commitments:cards','commitments:friends','planning:purchases','planning:goals','analysis:taxes','analysis:reports'];
async function ready(page){await page.waitForFunction(()=>window.planMobile&&window.planTaxes&&document.documentElement.dataset.layoutReady);}
async function closeSettings(page){await page.keyboard.press('Escape');await page.waitForSelector('.settings-main-menu');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));}
async function mode(page,label){await page.evaluate(()=>window.planMobile.open('settings'));await page.getByRole('button',{name:'Layout e preferências',exact:true}).click();await page.getByRole('radio',{name:label,exact:true}).click();await closeSettings(page);await page.waitForFunction(()=>!document.querySelector('.navigation-actions').hidden);}
async function inspect(page){return page.evaluate(()=>{
 const r=document.querySelector('#tabs').getBoundingClientRect(),s=getComputedStyle(document.querySelector('#tabs'));
 return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,scroll:document.querySelector('#tabs').scrollHeight,overflow:s.overflow,buttons:[...document.querySelectorAll('#tabs button')].map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}})};
});}
async function layout(page,name){await page.waitForFunction(()=>!document.querySelector('#app')?.inert&&!document.querySelector('#app [data-page-loading]'));await page.waitForTimeout(180);const errors=await page.evaluate(()=>{
 const errors=[],visible=n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden',rect=n=>n.getBoundingClientRect();
 if(document.documentElement.scrollWidth>innerWidth)errors.push('page overflow');
 for(const group of document.querySelectorAll('#app .ui-toolbar'))if(visible(group)&&parseFloat(getComputedStyle(group).gap)<12)errors.push('toolbar gap below 12px: '+group.className);
 const cards=[...document.querySelectorAll('#app .card,#app .info-block')].filter(visible);
 for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){const a=cards[i],b=cards[j];if(a.contains(b)||b.contains(a))continue;const r=rect(a),s=rect(b);if(Math.min(r.right,s.right)-Math.max(r.left,s.left)>1&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>1)errors.push('cards overlap: '+a.className+' / '+b.className)}
 return errors;
 });assert.deepEqual(errors,[],name);
}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [320,390,768,1280])for(const theme of ['light','dark']){
  const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});try{
   await c.addInitScript(theme=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','UI QA');localStorage.setItem('plan12appearance',JSON.stringify(theme));},theme);
   const page=await c.newPage(),errors=[],removed=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/(?:api\/(?:investments|market-economy|market-rates)|assets\/economy-reference)/.test(r.url()))removed.push(r.url())});
   await page.goto(base);await ready(page);assert.equal(await page.locator('#tabs button').count(),4);assert.equal(await page.locator('#tabs button[aria-label="Investimentos"]').count(),0);
   await page.evaluate(()=>window.planTaxes.addExpense({description:'Lançamento preservado',value:'125,75',date:window.planTaxes.getState().today,category:'Investimentos'}));
   const financial=await page.evaluate(()=>JSON.stringify(window.planTaxes.getState().expenses));
   await layout(page,'summary');
   await mode(page,'Padrão');const regular=await inspect(page);await mode(page,'Mini');const mini=await inspect(page);
   assert.equal(mini.h,50);assert(mini.w<=208,JSON.stringify(mini));if(width<=1024)assert(mini.w<regular.w*.8,'Mini must be visibly narrower');for(const r of mini.buttons)assert(r.w>=44&&r.h>=44&&r.x>=mini.x&&r.x+r.w<=mini.x+mini.w+1);
   await mode(page,'Fixada');let dock=await inspect(page);assert(Math.abs(dock.x)<1&&Math.abs(dock.w-width)<1&&Math.abs(dock.bottom-900)<1,JSON.stringify(dock));assert.equal(dock.overflow,'hidden');
   await page.evaluate(()=>document.documentElement.style.setProperty('--dock-safe-bottom','20px'));dock=await inspect(page);assert.equal(dock.h,74,'Fixed dock includes safe area');for(const r of dock.buttons)assert(r.bottom<=880&&r.y>=dock.y&&r.w>=44&&r.h>=44);await page.evaluate(()=>document.documentElement.style.removeProperty('--dock-safe-bottom'));
   for(const screen of screens){await page.evaluate(value=>dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind:'data-area-view',value}})),screen);await layout(page,screen);await page.waitForFunction(()=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);scrollTo({top:max,behavior:'instant'});return Math.abs(scrollY-max)<1});await page.waitForTimeout(80);await page.waitForFunction(()=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);scrollTo({top:max,behavior:'instant'});return Math.abs(scrollY-max)<1});const reach=await page.evaluate(()=>{const main=document.querySelector('.workspace-main'),r=main.getBoundingClientRect();return{contentBottom:r.bottom-parseFloat(getComputedStyle(main).paddingBottom),dockTop:document.querySelector('#tabs').getBoundingClientRect().top}});assert(reach.contentBottom<=reach.dockTop+1,screen+JSON.stringify(reach));await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));if(width===390&&theme==='dark'&&['planning:purchases','analysis:taxes','commitments:debts'].includes(screen))await page.screenshot({path:'/tmp/ui-spacing-'+screen.replace(':','-')+'.png',fullPage:true});}
   await page.evaluate(()=>window.planMobile.navigate('v'));assert.notEqual(await page.evaluate(()=>window.planMobile.getState().tab),'v');
   await page.evaluate(()=>dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind:'data-area-view',value:'commitments:debts'}})));await page.getByRole('button',{name:'Adicionar dívida',exact:true}).click();await page.locator('#scrim:not([hidden])').waitFor();assert.equal(await page.locator('.navigation-actions').isVisible(),false);await page.locator('#sd').fill('Dívida UI');await page.locator('#sv').fill('120');await page.locator('[data-a=ssave]').click();await page.waitForFunction(()=>document.querySelector('#scrim').hidden);await page.waitForFunction(()=>!document.querySelector('.navigation-actions').hidden);assert((await page.locator('.debt-blocks').innerText()).includes('Dívida UI'));
   await page.locator('#calendarButton').click();await page.waitForSelector('#accountOverlay[open] .calendar-card');assert.equal(await page.locator('.navigation-actions').isVisible(),false);await page.keyboard.press('Escape');await page.locator('#notificationButton').click();await page.locator('#notificationPanel[open]').waitFor();assert.equal(await page.locator('.navigation-actions').isVisible(),false);await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>JSON.stringify(window.planTaxes.getState().expenses)),financial);assert.deepEqual(errors,[]);assert.deepEqual(removed,[]);await mode(page,'Mini');await page.reload();await ready(page);assert.equal(await page.locator('.navigation-actions').getAttribute('data-dock-style'),'mini');assert((await inspect(page)).w<=208);console.log('PASS navigation/spacing',width,theme,'four destinations, eight subpages, 44px targets, mini, fixed safe area/content reach, editors/overlays, reload, no market requests, preserved data');
  }finally{await c.close()}
 }
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
