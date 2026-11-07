const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5200';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [320,375,768,1280])for(const theme of ['light','dark'])for(const reducedMotion of ['reduce','no-preference']){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion});
   await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await context.addInitScript(theme=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Previsão QA');localStorage.setItem('plan12appearance',JSON.stringify(theme))},theme);
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/tests/forecast-qa.html');
   await page.getByRole('heading',{name:'Previsão de saldo',exact:true}).waitFor();
   assert((await page.getByRole('status').innerText()).includes('Informe'));
   const period=page.getByRole('tablist',{name:'Período da previsão'}),mode=page.getByRole('tablist',{name:'Modo da previsão'});
   assert.equal(await period.getByRole('tab',{selected:true}).innerText(),'30 dias');
   await page.getByRole('textbox',{name:'Saldo disponível hoje (R$)',exact:true}).fill('1000');
   await page.getByRole('button',{name:'Atualizar previsão',exact:true}).click();
   await page.getByRole('heading',{name:'Menor saldo estimado'}).waitFor();
   assert.equal(await page.locator('.forecast-daily').getAttribute('open'),null);
   await page.getByText('Saldos diários',{exact:true}).click();
   assert.equal(await page.locator('.plan-table tbody tr').count(),31);
   assert.equal(await page.locator('[data-forecast-risk]').count(),0);
   await page.evaluate(()=>window.forecastFixture({today:'2026-11-06',transactions:[{id:'rent',description:'Aluguel',cents:150000,date:'2026-11-07',kind:'expense'}],cards:[]}));
   await page.locator('[data-forecast-risk=risco]').waitFor();
   assert.equal(await page.locator('[data-forecast-risk]').getAttribute('role'),'alert');
   await period.getByRole('tab',{name:'60 dias',exact:true}).click();
   await page.waitForFunction(()=>document.querySelectorAll('.plan-table tbody tr').length===61);
   assert.equal(await period.getByRole('tab',{name:'60 dias'}).getAttribute('aria-selected'),'true');
   await period.getByRole('tab',{name:'60 dias'}).focus();await page.keyboard.press('End');
   await page.waitForFunction(()=>document.querySelectorAll('.plan-table tbody tr').length===91);
   await page.getByText('Saldos diários',{exact:true}).click();
   await mode.getByRole('tab',{name:'+ Variáveis',exact:true}).click();
   await page.getByText(/Não são cobranças confirmadas/).waitFor();
   await page.getByText('Saldos diários',{exact:true}).click();
   const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,bars:[...document.querySelectorAll('.forecast-controls .ui-option-bar')].map(e=>({scroll:e.scrollWidth,width:e.clientWidth})),targets:[...document.querySelectorAll('.forecast-controls button')].map(e=>e.getBoundingClientRect().height),tables:[...document.querySelectorAll('.plan-table-wrap')].map(e=>({scroll:e.scrollHeight,height:e.clientHeight})),labels:[...document.querySelectorAll('.forecast-controls .lg-button__label')].map(e=>({scroll:e.scrollWidth,width:e.clientWidth}))}));
   assert.equal(metrics.overflow,false,JSON.stringify(metrics));assert(metrics.bars.every(x=>x.scroll<=x.width+1));assert(metrics.targets.every(x=>x>=44));assert(metrics.labels.every(x=>x.scroll<=x.width+1),'Clipped selector label');assert(metrics.tables.every(x=>x.height<=360&&x.scroll>x.height));
   await page.reload();await period.getByRole('tab',{name:'90 dias',selected:true}).waitFor();await mode.getByRole('tab',{name:'+ Variáveis',selected:true}).waitFor();
   await page.getByRole('textbox',{name:'Saldo disponível hoje (R$)',exact:true}).fill('-1,00');
   await page.getByRole('button',{name:'Atualizar previsão'}).click();await page.locator('[data-forecast-risk=risco]').waitFor();
   assert.deepEqual(errors,[]);
   await context.close();console.log('PASS forecast UI',width,theme,reducedMotion,'selection, keyboard, risk, persistence, bounded daily details and no overflow');
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
