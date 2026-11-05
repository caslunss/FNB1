const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5173';
const modes=[['pinned','Fixada'],['default','Padrão'],['mini','Mini']];
const routes=[['data-summary-mode','overview'],['data-summary-mode','entries'],['data-area-view','commitments:debts'],['data-area-view','commitments:cards'],['data-area-view','commitments:friends'],['data-area-view','planning:purchases'],['data-area-view','planning:goals'],['navigate','v'],['data-area-view','analysis:taxes'],['data-area-view','analysis:reports'],['data-area-view','analysis:carbon']];
async function settings(page){await page.evaluate(()=>window.planMobile.open('settings'));await page.getByRole('button',{name:'Layout e preferências',exact:true}).click();await page.getByRole('radiogroup',{name:'Estilo da dock'}).waitFor()}
async function close(page){if(await page.locator('#accountOverlay[open] .settings-navigation:not([data-settings-screen=home])').count()){await page.keyboard.press('Escape');await page.waitForSelector('.settings-main-menu')}await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));await page.waitForFunction(()=>!document.querySelector('.navigation-actions')?.hidden)}
async function geometry(page,width){
 const data=await page.evaluate(()=>{
  const bar=document.querySelector('#tabs'),box=bar.getBoundingClientRect();
  const ancestors=[];for(let node=bar.parentElement;node;node=node.parentElement){const s=getComputedStyle(node);if(s.transform!=='none'||s.filter!=='none'||s.backdropFilter!=='none')ancestors.push(node.className)}
  const buttons=[...bar.querySelectorAll('button')].map(node=>{const r=node.getBoundingClientRect();return{width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom}});
  const main=document.querySelector('.workspace-main');
  return{left:box.left,right:box.right,bottom:box.bottom,top:box.top,height:box.height,viewport:document.documentElement.clientWidth,buttons,padding:parseFloat(getComputedStyle(main).paddingBottom),overflow:document.documentElement.scrollWidth>innerWidth,ancestors};
 });
 assert(data.viewport<=width);assert(Math.abs(data.left)<1,JSON.stringify(data));assert(Math.abs(data.right-data.viewport)<1,JSON.stringify(data));assert(Math.abs(data.bottom-900)<1,JSON.stringify(data));
 assert(data.padding>=data.height+16);assert.equal(data.overflow,false);
 for(const button of data.buttons){assert(button.width>=44&&button.height>=44);assert(button.left>=data.left&&button.right<=data.right);assert(button.top>=data.top&&button.bottom<=data.bottom)}
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [375,768,1280])for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width,height:900},locale:'pt-BR',reducedMotion:'reduce'});
   await context.addInitScript(theme=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Teste');localStorage.setItem('plan12appearance',JSON.stringify(theme))},theme);
   await context.route('**/api/market-economy',route=>route.fulfill({json:JSON.parse(fs.readFileSync('public/assets/economy-reference.json','utf8'))}));
   await context.route('**/api/investments?*',route=>route.fulfill({json:{data:{results:[]}}}));
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base);await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);
   await settings(page);
   assert.deepEqual(await page.getByRole('radiogroup',{name:'Estilo da dock'}).getByRole('radio').evaluateAll(inputs=>inputs.map(node=>node.labels[0].textContent.trim())),['Fixada','Padrão','Mini']);
   for(const [mode,label]of modes){
    await page.getByRole('radio',{name:label,exact:true}).click();
    assert.equal(await page.getByRole('radio',{name:label,exact:true}).getAttribute('aria-checked'),'true');
    assert.equal(await page.locator('.navigation-actions').getAttribute('data-dock-style'),mode);
    await close(page);if(mode==='pinned')await geometry(page,width);
    if(width<=1024&&mode==='mini'){assert.equal(await page.locator('.navigation-actions').getAttribute('data-compact'),'true');assert.equal(await page.locator('#tabs').evaluate(node=>node.offsetHeight),50)}
    await page.locator('#calendarButton').click();await page.waitForSelector('#accountOverlay[open] .calendar-card');await close(page);
    await page.reload();await page.waitForFunction(mode=>document.documentElement.dataset.dockStyle===mode,mode);
    assert.equal(await page.locator('.navigation-actions').getAttribute('data-dock-style'),mode);
    await settings(page);
   }
   const originalDock=await page.locator('#tabs').elementHandle();assert(originalDock);
   for(const mode of ['pinned','mini','default','mini','pinned','default']){
    await page.getByRole('radio',{name:modes.find(item=>item[0]===mode)[1],exact:true}).click();
    assert.equal(await page.locator('.navigation-actions').getAttribute('data-dock-style'),mode);
    assert.equal(await originalDock.evaluate(node=>node===document.getElementById('tabs')),true,'mode switch preserves the same dock node');
    assert.equal(await page.locator('[data-dock-container]').count(),1);
   }
   await page.getByRole('radio',{name:'Padrão',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('radio',{name:'Mini',exact:true}).getAttribute('aria-checked'),'true');
   await page.keyboard.press('Home');assert.equal(await page.getByRole('radio',{name:'Fixada',exact:true}).getAttribute('aria-checked'),'true');
   assert((await page.getByRole('radio',{name:'Fixada',exact:true}).evaluate(node=>getComputedStyle(node.closest('label')).boxShadow))!=='none');
   await page.keyboard.press('End');await page.keyboard.press('Space');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');assert.equal(await page.getByRole('radio',{name:'Padrão',exact:true}).getAttribute('aria-checked'),'true');
   await page.getByRole('radio',{name:'Fixada',exact:true}).click();await close(page);
   for(const [kind,value]of routes){
    await page.evaluate(({kind,value})=>kind==='navigate'?window.planMobile.navigate(value):dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind,value}})),{kind,value});
    await page.waitForFunction(()=>!document.querySelector('#app')?.inert);await page.waitForTimeout(500);await geometry(page,width);
    await page.waitForFunction(()=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);scrollTo({top:max,behavior:'instant'});return Math.abs(scrollY-max)<1});await page.waitForTimeout(100);
    await page.waitForFunction(()=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);scrollTo({top:max,behavior:'instant'});return Math.abs(scrollY-max)<1});await geometry(page,width);
    const reach=await page.evaluate(()=>{const main=document.querySelector('.workspace-main').getBoundingClientRect(),dock=document.querySelector('#tabs').getBoundingClientRect(),padding=parseFloat(getComputedStyle(document.querySelector('.workspace-main')).paddingBottom);return{bottom:main.bottom,padding,dockTop:dock.top,scroll:scrollY,max:document.documentElement.scrollHeight-innerHeight}});
    assert(reach.bottom-reach.padding<=reach.dockTop+1,'last content reachable: '+value+' '+JSON.stringify(reach));await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   }
   await page.locator('#notificationButton').click();await page.waitForSelector('#notificationPanel[open]');assert.equal(await page.locator('.navigation-actions').isVisible(),false);await close(page);
   await page.evaluate(()=>{const trigger=document.createElement('button');trigger.dataset.a='sheet';trigger.dataset.k='i';document.body.append(trigger);trigger.click();trigger.remove()});
   await page.waitForSelector('#scrim:not([hidden])');await page.waitForFunction(()=>document.querySelector('.navigation-actions').hidden);assert.equal(await page.locator('.navigation-actions').isVisible(),false);
   await page.locator('#sd').focus();await page.evaluate(()=>document.body.classList.add('mobile-keyboard-open'));assert.equal(await page.locator('.navigation-actions').isVisible(),false);
   await page.evaluate(()=>{document.body.classList.remove('mobile-keyboard-open');document.querySelector('[data-a=sclose]').click()});
   await page.waitForSelector('#scrim[hidden]',{state:'attached'});await page.waitForFunction(()=>!document.querySelector('.navigation-actions').hidden);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS dock settings:',width,theme,'three modes/reloads, all switches, keyboard, calendar, eleven pinned pages, overlays and simulated keyboard');
  }
  for(const value of ['Default','Mini']){
   const context=await browser.newContext({viewport:{width:375,height:900}});
   await context.addInitScript(value=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Teste');sessionStorage.setItem('plan12guest:plan12layout_v1',JSON.stringify({version:1,dockSize:value}))},value);
   const page=await context.newPage();await page.goto(base);await page.waitForFunction(()=>document.documentElement.dataset.layoutReady);assert.equal(await page.locator('.navigation-actions').getAttribute('data-dock-style'),value==='Mini'?'mini':'default');
   assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('plan12guest:plan12layout_v1')).dockSize),value);await context.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
