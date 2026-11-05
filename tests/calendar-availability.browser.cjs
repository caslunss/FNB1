const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const disabled of [true,false]){
  const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});
  await context.addInitScript(disabled=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Teste');if(disabled)sessionStorage.setItem('plan12guest:plan12layout_v1',JSON.stringify({version:1,sections:{calendar:false}}))},disabled);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);
  await page.locator('#calendarButton').click();await page.waitForSelector('#accountOverlay[open] .calendar-card');await page.keyboard.press('Escape');
  await page.evaluate(()=>window.planMobile.open('settings'));await page.getByRole('button',{name:'Layout e preferências',exact:true}).click();
  assert.equal(await page.getByRole('switch',{name:'Mostrar Calendário no topo'}).count(),0);
  if(disabled)assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('plan12guest:plan12layout_v1')).sections.calendar),false,'legacy saved value is preserved');
  await page.keyboard.press('Escape');await page.reload();await page.waitForFunction(()=>window.planMobile);
  await page.locator('#calendarButton').click();await page.waitForSelector('#accountOverlay[open] .calendar-card');
  assert.deepEqual(errors,[]);await context.close();
 }console.log('PASS calendar availability: disabled/missing legacy preference, Settings removal, open and reload without deleting saved data');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
