const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5173';
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'pessoa@example.test',email_confirmed_at:'2026-01-01T12:00:00Z',created_at:'2026-01-01T12:00:00Z',app_metadata:{provider:'google',providers:['google']},user_metadata:{full_name:'Pessoa de teste'},is_anonymous:false};
const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:4102444800,iat:1767225600,role:'authenticated'},'test-signature'].map(value=>typeof value==='string'?value:Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
async function contextFor(browser,width,theme,account){
 const context=await browser.newContext({viewport:{width,height:900},locale:'pt-BR',timezoneId:'America/Sao_Paulo',reducedMotion:'reduce'});
 let username='usuario_atual',updates=0;
 let record={schemaVersion:3,moneyUnit:'centavos',data:{items:[],receipts:[],debts:[],splits:[],cart:[],reports:{}}},revision=1;
 await context.addInitScript(({theme,account,user,token})=>{
  localStorage.setItem('plan12appearance',JSON.stringify(theme));
  if(account){sessionStorage.setItem('plan12-access','account');sessionStorage.setItem('plan12-auth-session',JSON.stringify({access_token:token,refresh_token:'synthetic-refresh',expires_at:4102444800,expires_in:31536000,token_type:'bearer',user}))}
  else{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Visitante de teste')}
 },{theme,account,user,token});
 await context.route('**/auth/v1/user',route=>route.fulfill({json:user}));
 await context.route('**/rest/v1/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(path.endsWith('/app_usernames')){
   if(req.method()==='PATCH'){const payload=req.postDataJSON();assert.deepEqual(Object.keys(payload),['username']);updates++;if(payload.username==='indisponivel')return route.fulfill({status:409,json:{code:'23505',message:'synthetic duplicate'}});username=payload.username;return route.fulfill({json:{username}})}
   return route.fulfill({json:req.method()==='GET'?[{user_id:user.id,username}]:[]});
  }
  if(path.endsWith('/app_finance_workspaces')){
   if(req.method()!=='GET'){const data=req.postDataJSON();if(data?.record)record=data.record;revision++}
   const row={user_id:user.id,record,revision,updated_at:'2026-11-05T12:00:00Z'};
   return route.fulfill({json:req.method()==='GET'?[row]:row});
  }
  return route.fulfill({json:[]});
 });
 await context.route('**/api/market-economy',route=>route.fulfill({json:JSON.parse(fs.readFileSync('public/assets/economy-reference.json','utf8'))}));
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);
 return{context,page,errors,updates:()=>updates};
}
async function opened(page){await page.evaluate(()=>window.planMobile.open('settings'));await page.waitForSelector('.settings-navigation[data-settings-screen=home]');await page.getByRole('button',{name:'Layout e preferências',exact:true}).waitFor()}
async function enter(page,name,screen){await page.locator('.settings-main-menu').getByRole('button',{name,exact:true}).click();await page.waitForSelector(`.settings-navigation[data-settings-screen=${screen}]`);const selector={account:'.settings-account',layout:'#layoutEditor',notifications:'.notification-preferences',connections:'.settings-sections',security:'[data-settings-security]'}[screen];await page.waitForFunction(selector=>{const node=document.querySelector(selector);return node&&!node.closest('[inert],[aria-hidden=true]')},selector)}
async function back(page){await page.getByRole('button',{name:'Voltar para configurações',exact:true}).click();await page.waitForSelector('.settings-main-menu');await page.waitForTimeout(200)}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  if(process.env.SETTINGS_MOTION_ONLY!=='1'){
  for(const width of [375,768,1280])for(const theme of ['light','dark'])for(const account of [false,true]){
   const {context,page,errors}=await contextFor(browser,width,theme,account);await opened(page);
   if(process.env.SETTINGS_SCREENSHOT_DIR){fs.mkdirSync(process.env.SETTINGS_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:`${process.env.SETTINGS_SCREENSHOT_DIR}/${width}-${theme}-${account?'account':'visitor'}-menu.png`})}
   assert.equal(await page.locator('#accountOverlay .settings-main-menu .settings-menu-row').count(),account?5:4);
   const menu=await page.locator('.settings-main-menu').boundingBox();for(const group of await page.locator('.settings-main-menu>section').all()){const box=await group.boundingBox();assert(Math.abs(box.width-menu.width)<1,'each settings group occupies the whole list width');assert(Math.abs(box.x-menu.x)<1)}
   assert.equal(await page.getByRole('button',{name:'Conta',exact:true}).count(),account?1:0);
   await page.getByRole('button',{name:'Fechar configurações',exact:true}).focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),account?'settingsTab-account':'settingsTab-layout');await page.keyboard.press('Enter');await page.getByRole('button',{name:'Voltar para configurações',exact:true}).waitFor();await back(page);
   assert.equal(await page.locator('#accountOverlay button[aria-label*=Pesquisar],#accountOverlay button[aria-label*=Buscar]').count(),0);
   const layout=await page.locator('#accountOverlay').boundingBox();assert(layout);if(width===375){assert.equal(layout.x,0);assert.equal(layout.y,0);assert.equal(layout.width,375);assert.equal(layout.height,900)}else{assert(layout.x>=12);assert(layout.width<=760);assert(Math.abs(layout.x+layout.width/2-width/2)<1)}
   for(const row of await page.locator('.settings-menu-row').all()){const box=await row.boundingBox();assert(box.height>=44);assert.equal(await row.locator('svg').count(),2)}
   if(account){await enter(page,'Conta','account');assert.deepEqual(await page.locator('.identity-fields dt').allTextContents(),['Nome','E-mail','Método de login']);assert.deepEqual(await page.locator('.identity-fields dd').allTextContents(),['Pessoa de teste','pessoa@example.test','Google']);assert.equal(await page.locator('#usernameForm').count(),0);if(process.env.SETTINGS_SCREENSHOT_DIR&&width===375&&theme==='dark')await page.screenshot({path:process.env.SETTINGS_SCREENSHOT_DIR+'/375-dark-account-fields.png'});await back(page)}
   await enter(page,'Layout e preferências','layout');await page.getByRole('radiogroup',{name:'Estilo da dock'}).waitFor();await page.getByRole('radio',{name:'Mini',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.dockStyle==='mini');assert.equal(await page.getByRole('slider',{name:'Opacidade do vidro'}).count(),0);await back(page);
   await enter(page,'Notificações','notifications');const toggle=page.getByRole('switch',{name:'Gastos',exact:true});await toggle.click();assert.equal(await toggle.getAttribute('aria-checked'),'false');await back(page);
   await enter(page,'Dados e conexões','connections');assert.equal(await page.getByRole('button',{name:'Conectar banco',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Zerar dados financeiros',exact:true}).count(),1);assert.equal(await page.locator('.identity-fields').count(),0);if(account){await page.waitForFunction(()=>!!document.querySelector('.cloud-settings [data-cloud-message]')?.textContent);assert.equal(await page.getByRole('button',{name:'Excluir conta',exact:true}).count(),1)}
   await page.getByRole('button',{name:'Zerar dados financeiros',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.locator('.settings-navigation').getAttribute('data-settings-screen'),'connections');assert.equal(await page.locator('#accountOverlay').evaluate(node=>node.open),true);await page.getByRole('button',{name:'Zerar dados financeiros',exact:true}).click();await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await page.locator('.settings-navigation').getAttribute('data-settings-screen'),'connections');await back(page);
   await enter(page,'Registro e segurança','security');assert.equal(await page.locator('[data-settings-security]').innerText(),'');assert.equal(await page.locator('[data-settings-security]').evaluate(node=>node.children.length),0);await page.keyboard.press('Escape');await page.waitForSelector('.settings-main-menu');
   assert.equal(await page.locator('#accountOverlay').evaluate(node=>node.scrollWidth>node.clientWidth),false);
   await page.getByRole('button',{name:'Fechar configurações',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#accountOverlay').open);
   await page.evaluate(()=>window.planMobile.open('integrations'));await page.waitForSelector('.settings-navigation[data-settings-screen=connections]');await page.getByRole('button',{name:'Conectar banco',exact:true}).waitFor();await page.keyboard.press('Escape');await page.waitForSelector('.settings-main-menu');await page.keyboard.press('Escape');
   await page.evaluate(()=>window.planNotifications.settings());await page.waitForSelector('.settings-navigation[data-settings-screen=notifications]');await page.getByRole('switch',{name:'Gastos',exact:true}).waitFor();assert.equal(await page.getByRole('switch',{name:'Gastos',exact:true}).getAttribute('aria-checked'),'false');
   assert.deepEqual(errors,[]);await context.close();console.log('PASS settings:',width,theme,account?'account':'visitor','groups, fields, preferences, notifications, sync/data, empty security, focus/back/deep links');
  }
  const {context,page,errors,updates}=await contextFor(browser,375,'dark',true);await opened(page);await enter(page,'Conta','account');await page.getByRole('button',{name:'Alterar nome de usuário',exact:true}).click();await page.locator('#profileUsername').fill('indisponivel');await page.locator('#usernameForm button').click();await page.waitForFunction(()=>document.querySelector('#usernameStatus').textContent.includes('já está em uso'));assert.equal(updates(),1);await page.locator('#profileUsername').fill('novo_usuario');await page.locator('#usernameForm button').click();await page.waitForFunction(()=>document.querySelector('#usernameStatus').textContent.includes('Usuário salvo'));assert.equal(updates(),2);await page.getByRole('button',{name:'Fechar edição',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Alterar nome de usuário',exact:true}).isDisabled(),true);
  await page.reload();await page.waitForFunction(()=>window.planMobile);await opened(page);await enter(page,'Conta','account');assert.equal(await page.getByRole('button',{name:'Alterar nome de usuário',exact:true}).isDisabled(),true);assert.equal(updates(),2);assert.deepEqual(errors,[]);await context.close();console.log('PASS settings account: duplicate can retry, success persists monthly UI block after reload, no repeated backend write');
  }
  const normal=await contextFor(browser,390,'light',false);await normal.page.emulateMedia({reducedMotion:'no-preference'});await opened(normal.page);await enter(normal.page,'Layout e preferências','layout');await back(normal.page);await enter(normal.page,'Registro e segurança','security');await back(normal.page);
  await normal.page.waitForFunction(()=>{const node=document.querySelector('.settings-main-menu')?.closest('.settings-navigation-content');if(!node||node.closest('[inert]')||document.querySelectorAll('.settings-navigation-content').length!==1)return false;const style=getComputedStyle(node),matrix=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform);return style.opacity==='1'&&Math.abs(matrix.m41)<.01&&Math.abs(matrix.m11-1)<.0001});
  const normalLayout=await normal.page.locator('#accountOverlay').evaluate(node=>{const box=node.getBoundingClientRect();return{open:node.open,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,overflows:[...node.querySelectorAll('*')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{tag:el.tagName,cls:String(el.className).slice(0,100),x:r.x,right:r.right,width:r.width,overflow:s.overflow,transform:s.transform}}).filter(el=>el.right>box.right+1||el.x<box.x-1).slice(0,15)}});assert(normalLayout.open&&normalLayout.scrollWidth<=normalLayout.clientWidth,JSON.stringify(normalLayout));assert.equal(await normal.page.locator('.settings-navigation-content').count(),1);assert.deepEqual(normal.errors,[]);await normal.context.close();console.log('PASS settings motion: normal motion, rapid back between screens, final transform/opacity, single interactive page and no overflow');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
