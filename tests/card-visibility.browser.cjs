const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5207';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [375,1280]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await context.addInitScript(()=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Visibilidade QA')});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);
  const chart=page.getByRole('tablist',{name:'Dados do gráfico'});
  for(const [label,expenses,goal,habits]of [['Entradas',false,false,false],['Gastos',true,false,false],['Metas',false,true,false],['Hábitos',false,false,true],['Gastos',true,false,false]]){
   await chart.getByRole('tab',{name:label,exact:true}).click();await chart.getByRole('tab',{name:label,exact:true,selected:true}).waitFor();
   for(const heading of ['Distribuição','Maiores gastos','Categorias','Dívidas do mês'])assert.equal(await page.locator('#app').getByRole('heading',{name:heading,exact:true}).count(),expenses?1:0,label+': '+heading);
   assert.equal(await page.locator('#app .goal-summary').count(),goal?1:0,label+': goal editor');
   for(const heading of ['Hábitos de gastos','Por categoria','Dias da semana','Últimos meses'])assert.equal(await page.locator('#app').getByRole('heading',{name:heading,exact:true}).count(),habits?1:0,label+': '+heading);
  }
  const routes=[['summary:entries','.unified-ledger'],['summary:forecast','[data-forecast-screen]'],['commitments:debts','.debt-stats'],['commitments:cards','.credit-cards'],['commitments:friends','heading:Divisão de gastos'],['commitments:recurrences','[data-recurrences-screen]'],['planning:purchases','.planning-editor-card'],['planning:goals','.product-goals'],['analysis:taxes','.tax-page'],['analysis:reports','.export-reports']];
  let previous=null;
  for(const [route,selector]of routes){
   await page.evaluate(value=>dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind:'data-area-view',value}})),route);
   const current=selector.startsWith('heading:')?page.locator('#app').getByRole('heading',{name:selector.slice(8),exact:true}):page.locator('#app '+selector).first();await current.waitFor();
   if(previous){const old=previous.startsWith('heading:')?page.locator('#app').getByRole('heading',{name:previous.slice(8),exact:true}):page.locator('#app '+previous);assert.equal(await old.count(),0,'Old view retained after '+route)}
   assert.equal(await page.locator('#app .summary-behavior').count(),0,route);assert.equal(await page.locator('#app .lower-insights').count(),0,route);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route);previous=selector;
  }
  assert.deepEqual(errors,[]);await context.close();console.log('PASS card isolation',width,'all summary metrics and ten routes, presence/absence, repeated switches and no overflow');
 }
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
