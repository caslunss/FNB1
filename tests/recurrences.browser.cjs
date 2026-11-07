const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [375,768,1280])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.addInitScript(theme=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Recorrências QA');localStorage.setItem('plan12appearance',JSON.stringify(theme));if(!sessionStorage.getItem('recurrence-qa-fixture'))sessionStorage.setItem('recurrence-qa-fixture',JSON.stringify(['2026-08-31','2026-09-30','2026-10-31'].map((date,i)=>({id:'netflix'+i,description:'Netflix',date,cents:3990,kind:'expense',payment:'cash'}))))},theme);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
  await page.goto((process.env.QA_BASE_URL||'http://127.0.0.1:5200')+'/tests/recurrences-qa.html');await page.getByRole('heading',{name:'Recorrências',exact:true}).waitFor();
  const detected=page.getByRole('region',{name:'Detectadas',exact:true}),archived=page.getByRole('region',{name:'Ignoradas/Canceladas',exact:true});
  await detected.getByRole('button',{name:'Confirmar',exact:true}).click();await detected.getByRole('button',{name:'Incluir na previsão',exact:true}).click();await page.getByRole('status').filter({hasText:'confirmada'}).waitFor();
  await page.getByRole('textbox',{name:'Saldo disponível hoje (R$)',exact:true}).fill('1000');await page.getByRole('button',{name:'Atualizar previsão',exact:true}).click();
  const nov=page.locator('.plan-table tbody tr').filter({has:page.locator('td').filter({hasText:/^30\/11\/2026$/})});await nov.waitFor();assert((await nov.innerText()).includes('39,90'));
  await page.reload();await detected.getByRole('button',{name:'Revisar previsão',exact:true}).waitFor();assert((await nov.innerText()).includes('39,90'));
  await page.evaluate(()=>{const rows=JSON.parse(sessionStorage.getItem('recurrence-qa-fixture'));for(const row of rows)row.description='Plano renomeado';sessionStorage.setItem('recurrence-qa-fixture',JSON.stringify(rows))});await page.reload();await detected.getByRole('button',{name:'Revisar previsão',exact:true}).waitFor();assert((await detected.innerText()).includes('Plano renomeado'));assert((await nov.innerText()).includes('39,90'));
  await detected.getByRole('button',{name:'Ignorar',exact:true}).click();await archived.getByRole('button',{name:'Confirmar',exact:true}).waitFor();await page.reload();assert((await archived.innerText()).includes('Ignorada'));assert(!(await nov.innerText()).includes('39,90'));
  await archived.getByRole('button',{name:'Marcar como cancelada',exact:true}).focus();await page.keyboard.press('Enter');await page.reload();assert((await archived.innerText()).includes('Cancelada localmente'));
  const rows=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('recurrence-qa-fixture')));assert.equal(rows.length,3);assert(rows.every(row=>row.cents===3990));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await context.close();console.log('PASS recurrences UI',width,theme,'confirm/ignore/cancel, keyboard, reload, rename, forecast, immutable ledger and no overflow');
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
