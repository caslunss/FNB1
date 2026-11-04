// Reproducible pages + overlay comparison. The reference server is optional;
// no production service or real account is used by these browser fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5173';
const reference=process.env.VISUAL_REFERENCE_URL;
const output=process.env.VISUAL_AUDIT_DIR||'/tmp/fnb-visual-audit';
const widths=(process.env.VISUAL_WIDTHS||'320,390,768,1440').split(',').map(Number);
const themes=(process.env.VISUAL_THEMES||'light,dark').split(',');
const routes=[['summary','data-summary-mode','overview'],['entries','data-summary-mode','entries'],['debts','data-area-view','commitments:debts'],['cards','data-area-view','commitments:cards'],['friends','data-area-view','commitments:friends'],['purchases','data-area-view','planning:purchases'],['goals','data-area-view','planning:goals'],['investments','navigate','v'],['taxes','data-area-view','analysis:taxes'],['reports','data-area-view','analysis:reports'],['carbon','data-area-view','analysis:carbon']];
const market={checkedAt:'2026-11-04T15:00:00.000Z',data:{results:[{symbol:'PETR4',data:{longName:'Petrobras',regularMarketPrice:37.5,regularMarketChangePercent:1.2,regularMarketTime:'2026-11-04T15:00:00.000Z',historicalDataPrice:[{date:1793487600,close:36},{date:1793574000,close:37.5}],cashDividends:[{label:'Dividendo',paymentDate:'2026-10-20',rate:.85}]}}],fiis:[{symbol:'MXRF11',name:'Fundo de referência',price:10,navPerShare:10.2,priceToNav:.98,dividendYield12m:.1}],currency:[{fromCurrency:'USD',toCurrency:'BRL',bidPrice:5.2,askPrice:5.21,updatedAtDate:'04/11/2026'}],inflation:[{date:'10/2026',value:4.5}],'prime-rate':[{date:'11/2026',value:13.65}]}};
async function initialize(browser,url,width,theme){
 const context=await browser.newContext({viewport:{width,height:900},locale:'pt-BR',timezoneId:'America/Sao_Paulo',reducedMotion:'reduce'});
 await context.addInitScript(({theme})=>{
  const NativeDate=Date,now=NativeDate.parse('2026-11-04T15:00:00Z');
  class FixtureDate extends NativeDate{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
  window.Date=FixtureDate;let nextId=0;Object.defineProperty(crypto,'randomUUID',{value:()=>`00000000-0000-4000-8000-${String(++nextId).padStart(12,'0')}`});sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Pessoa de teste');localStorage.setItem('plan12appearance',JSON.stringify(theme));
 },{theme});
 await context.route('**/api/market-economy',route=>route.fulfill({json:JSON.parse(fs.readFileSync('public/assets/economy-reference.json','utf8'))}));
 await context.route('**/api/investments?*',route=>route.fulfill({json:market}));
 await context.route('**/auth/v1/settings',route=>route.fulfill({json:{external:{google:true}}}));
 await context.route('https://accounts.google.com/gsi/client?*',route=>route.fulfill({contentType:'text/javascript',body:`window.google={accounts:{id:{initialize(){},renderButton(host){const frame=document.createElement('iframe');frame.title='Entrar com Google';frame.style.cssText='width:100%;height:44px;display:block;background:white';frame.srcdoc='<body style="margin:0"><button style="width:100%;height:44px;border:0;border-radius:999px;background:white;color:#202124;font:14px Arial">Entrar com Google</button></body>';host.append(frame)}}}};`}));
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(url);await page.waitForFunction(()=>window.planCredit);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.evaluate(()=>{
  const date=window.planTaxes.getState().today;window.planTaxes.addExpense({description:'Mercado da semana',value:'123,45',date,category:'Gastos Essenciais'});window.planTaxes.addExpense({description:'Transporte',value:'25',date,category:'Gastos Variáveis'});window.planCredit.saveCard({name:'Cartão principal',limitCents:500000,openingUsedCents:0,closingDay:10,dueDay:20});window.planProductGoals.save({name:'Notebook',priceCents:250000,reservedCents:50000,monthlyReserveCents:25000,goalMode:'save',date,category:'Gastos Variáveis',installments:1});
 });
 await sheet(page,'i');await page.locator('#sd').fill('Renda mensal');await page.locator('#sv').fill('6500');await page.locator('[data-a=ssave]').click();await page.waitForFunction(()=>document.querySelector('#scrim').hidden);await page.evaluate(()=>document.fonts.ready);return {context,page,errors};
}
async function reset(page){
 await page.evaluate(()=>{window.planNotifications.close();const scrim=document.querySelector('#scrim');if(!scrim.hidden){const button=document.createElement('button');button.dataset.a='sclose';document.body.append(button);button.click();button.remove()}for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();document.querySelector('[data-finish-arrange]')?.click();scrollTo(0,0)});await page.waitForTimeout(40);
}
async function route(page,name){const [,kind,value]=routes.find(row=>row[0]===name);await page.evaluate(({kind,value})=>kind==='navigate'?window.planMobile.navigate(value):dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind,value}})),{kind,value});await page.waitForTimeout(300);await page.evaluate(()=>scrollTo(0,0));}
async function sheet(page,kind,expanded=false){await page.evaluate(kind=>{const button=document.createElement('button');button.dataset.a='sheet';button.dataset.k=kind;document.body.append(button);button.click();button.remove()},kind);await page.waitForSelector('#scrim:not([hidden])');if(expanded)await page.getByRole('button',{name:'Mais opções',exact:true}).click();}
async function account(page,panel){await page.evaluate(panel=>window.planMobile.open(panel),panel);await page.waitForSelector('#accountOverlay[open]');}
const scenarios=routes.map(([name])=>({name:'page-'+name,fullPage:true,run:page=>route(page,name)}));
for(const label of ['Histórico','Dividendos','Balanços','FIIs','Câmbio','IPCA','Selic'])scenarios.push({name:'investments-'+label,fullPage:true,run:async page=>{await route(page,'investments');await page.locator('.investment-tabs').getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.investments-market [aria-busy=true]'));await page.waitForTimeout(180)}});
for(const [kind,name]of [['i','income'],['g','expense'],['d','debt'],['l','limit']])for(const expanded of [false,true])scenarios.push({name:'sheet-'+name+(expanded?'-expanded':''),run:async page=>{await route(page,'summary');await sheet(page,kind,expanded)}});
scenarios.push(
 {name:'sheet-select',run:async page=>{await route(page,'summary');await sheet(page,'g');await page.locator('.sheet [role=combobox]').first().click()}},
 {name:'date-picker',run:async page=>{await route(page,'summary');await sheet(page,'i',true);await page.locator('.sheet .date-picker-open').click();await page.waitForSelector('.date-picker-dialog[open]');assert.equal(await page.locator('.date-picker-dialog[open] [aria-pressed=true]').count(),1)}},
 {name:'profile',run:page=>account(page,'profile')},
 {name:'profile-subscriptions',run:async page=>{await account(page,'profile');await page.locator('.profile-extras > summary').click()}},
 {name:'calendar',run:async page=>{await account(page,'calendar');assert.equal(await page.locator('#accountOverlay .cal-day[aria-pressed=true]').count(),1);const dates=await page.locator('#accountOverlay .cal-day').evaluateAll(nodes=>nodes.map(node=>node.dataset.date));assert.equal(new Set(dates).size,dates.length)}},
 {name:'summary-month',run:async page=>{await route(page,'summary');await page.locator('#summaryToolbar .month-picker-trigger').click()}},
 {name:'notifications-all',run:async page=>{await page.locator('#notificationButton').click();await page.waitForSelector('#notificationPanel[open]')}},
 {name:'notifications-transactions',run:async page=>{await page.locator('#notificationButton').click();await page.getByRole('button',{name:'Transações',exact:true}).click()}},
 {name:'notifications-alerts',run:async page=>{await page.locator('#notificationButton').click();await page.getByRole('button',{name:'Alertas',exact:true}).click()}},
 {name:'search',run:async page=>{await page.getByRole('button',{name:'Pesquisar',exact:true}).click()}},
 {name:'search-filters',run:async page=>{await page.getByRole('button',{name:'Pesquisar',exact:true}).click();await page.getByRole('button',{name:'Filtros',exact:true}).click()}},
 {name:'receipt',run:async page=>{await page.evaluate(()=>{const button=document.createElement('button');button.dataset.readReceipt='';document.body.append(button);button.click();button.remove()});await page.waitForSelector('#receiptDialog[open]')}},
 {name:'credit-editor',fullPage:true,run:async page=>{await route(page,'cards');await page.getByRole('button',{name:'Adicionar cartão',exact:true}).click()}},
 {name:'credit-month',run:async page=>{await route(page,'cards');await page.locator('#app .month-picker-trigger').click()}},
 {name:'goal-editor',fullPage:true,run:async page=>{await route(page,'goals');await page.getByRole('button',{name:'Nova meta de produto',exact:true}).click()}},
 {name:'purchase-editor',fullPage:true,run:async page=>{await route(page,'purchases');await page.locator('#app').getByRole('button',{name:'Compra planejada',exact:true}).click()}},
 {name:'tax-editor',run:async page=>{await route(page,'taxes');await page.getByRole('button',{name:'Adicionar análise tributária',exact:true}).click()}},
 {name:'tax-bank',fullPage:true,run:async page=>{await route(page,'taxes');await page.getByRole('button',{name:'Importar banco',exact:true}).click();await page.waitForSelector('.tax-bank')}}
);
for(const [tab,label]of [['account','Conta'],['notifications','Notificações'],['layout','Layout'],['connections','Conexões']])scenarios.push({name:'settings-'+tab,run:async page=>{await account(page,'settings');await page.getByRole('tab',{name:label,exact:true}).click()}});
scenarios.push({name:'login',run:async(page,url)=>{await page.goto(url+'/login.html');await page.waitForSelector('#googleButton iframe')}},{name:'login-guest',run:async(page,url)=>{await page.goto(url+'/login.html');await page.waitForSelector('#googleButton iframe');await page.locator('#guestToggle').click()}});
function sameSnapshot(before,after){
 if(before.text!==after.text||before.geometry.length!==after.geometry.length)return false;
 return before.geometry.every((old,index)=>{const next=after.geometry[index];return ['x','y','width','height'].every(key=>Math.abs(old[key]-next[key])<=.25)&&old.tag===next.tag&&old.text===next.text&&JSON.stringify(old.style)===JSON.stringify(next.style)});
}
async function capture(instance,url,scenario,key){
 const {page}=instance;if(!scenario.name.startsWith('login'))await reset(page);
 await scenario.run(page,url);
 await page.waitForTimeout(60);
 if(scenario.name.startsWith('investments-')||scenario.name==='page-investments')await page.waitForSelector('.economy-card .economy-chart');
 if(scenario.name.startsWith('tax-')||scenario.name==='page-taxes')await page.waitForSelector('.tax-page .tax-charts');
 await page.waitForFunction(()=>!document.querySelector('[data-page-loading]'),{},{timeout:15000});
 await page.waitForFunction(()=>!document.querySelector('.economy-card')||document.querySelector('.economy-card [role=status]')?.textContent?.startsWith('Atualizado'),{},{timeout:15000});
 await page.waitForFunction(()=>!document.querySelector('.investments-market')||document.querySelector('.investments-market .smooth-state')?.getAttribute('data-motion-state')==='ready',{},{timeout:15000});
 await page.waitForFunction(()=>!document.querySelector('.tax-page .smooth-state[data-motion-state=loading]')&&!document.querySelector('.tax-editor[open]')?.innerText.includes('Calculando prévia…'),{},{timeout:15000});
 if(scenario.fullPage)await page.evaluate(()=>scrollTo(0,0));
 await page.mouse.move(0,0);await page.waitForFunction(()=>!document.querySelector('[data-motion-entering]')&&[...document.querySelectorAll('.smooth-state')].every(node=>node.children.length>0)&&[...document.querySelectorAll('#app,.smooth-state>div')].filter(node=>node.getClientRects().length&&!node.closest('[hidden]')).every(node=>!node.inert&&Number(getComputedStyle(node).opacity)>.999),{},{timeout:10000});await page.waitForTimeout(220);
 let stable=0,last='';for(let attempt=0;attempt<40&&stable<2;attempt++){const next=await page.evaluate(()=>({html:document.querySelector('dialog[open],#scrim:not([hidden])')?.innerHTML||document.querySelector('#app')?.innerHTML||document.body.innerHTML,busy:!!document.querySelector('[data-page-loading],.loading-skeleton')||[...document.querySelectorAll('.smooth-state')].some(node=>!node.children.length||[...node.children].some(child=>child.inert||Number(getComputedStyle(child).opacity)<.999))}));const signature=JSON.stringify(next);stable=!next.busy&&signature===last?stable+1:0;last=signature;if(stable<2)await page.waitForTimeout(300)}assert(stable>=2,'Visual content did not settle: '+key);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Page overflow: '+key);
 const snapshot=await page.evaluate((all)=>{
  const active=document.querySelector('dialog[open],#scrim:not([hidden])'),root=active||document.querySelector('#app')||document.body;
  return {text:root.innerText,geometry:[...root.querySelectorAll(all?'*':'section,button,input,select,textarea,summary,h2,h3,[role=switch]')].filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden').map(node=>{const box=node.getBoundingClientRect(),style=getComputedStyle(node);return {tag:node.tagName,text:node.innerText||node.getAttribute('aria-label')||'',x:Math.round(box.x*100)/100,y:Math.round(box.y*100)/100,width:Math.round(box.width*100)/100,height:Math.round(box.height*100)/100,style:Object.fromEntries(['display','padding','margin','gap','border-radius','font-size','font-family','font-weight','color','background-color','box-shadow','backdrop-filter',...(all?['opacity','transform','border-width','border-color']:[])].map(property=>[property,style.getPropertyValue(property).replace(/#lg-refract-\d+/g,'#lg-refract')]))}})};
 },process.env.VISUAL_CAPTURE_ALL==='1');
 await page.screenshot({path:path.join(output,key+'.png'),fullPage:!!scenario.fullPage,animations:'disabled'});
 return snapshot;
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const report={cases:[],reference:reference||null,widths,themes,errors:[]};
 try{for(const width of widths)for(const theme of themes){const current=await initialize(browser,base,width,theme),previous=reference?await initialize(browser,reference,width,theme):null;try{for(const scenario of scenarios){if(process.env.VISUAL_CASES&&!process.env.VISUAL_CASES.split(',').includes(scenario.name))continue;const key=width+'-'+theme+'-'+scenario.name;try{const before=previous?await capture(previous,reference,scenario,key+'-before'):null;const after=await capture(current,base,scenario,key+'-after');const same=before?sameSnapshot(before,after):null;report.cases.push({key,same,before,after});fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(same===false?'DIFF':'PASS',key)}catch(error){report.errors.push({key,error:error.message});console.error('FAIL',key,error.message);throw error}}assert.deepEqual(current.errors,[]);if(previous)assert.deepEqual(previous.errors,[])}finally{await current.context.close();await previous?.context.close()}}}finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close()}
 if(report.errors.length||report.cases.some(row=>row.same===false))throw Error('Visual audit: inspect the recorded differences');console.log('PASS visual audit:',report.cases.length,'states;',report.cases.filter(row=>row.same===false).length,'comparisons to inspect. Artifacts:',output);
})().catch(error=>{console.error(error);process.exitCode=1});
