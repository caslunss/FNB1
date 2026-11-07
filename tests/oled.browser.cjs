const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5209';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
 await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 await context.addInitScript(()=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','OLED QA')});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);
 async function open(){await page.evaluate(()=>window.planMobile.open('settings'));await page.getByRole('button',{name:'Layout e preferências',exact:true}).click();await page.getByRole('switch',{name:'Modo escuro',exact:true}).waitFor()}
 await open();const dark=page.getByRole('switch',{name:'Modo escuro',exact:true});if(await dark.getAttribute('aria-checked')==='true')await dark.click();assert.equal(await page.getByRole('switch',{name:'Modo OLED',exact:true}).count(),0);
 await dark.click();const oled=page.getByRole('switch',{name:'Modo OLED',exact:true});await oled.waitFor();await oled.click();await page.waitForFunction(()=>document.documentElement.dataset.oled==='true');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(0, 0, 0)');assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--card').trim()),'#202022');
 await dark.click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');assert.equal(await oled.count(),0);assert.equal(await page.evaluate(()=>document.documentElement.dataset.oled),'false');
 await dark.click();await page.waitForFunction(()=>document.documentElement.dataset.oled==='true');assert.equal(await oled.getAttribute('aria-checked'),'true');
 await page.reload();await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);await page.waitForFunction(()=>document.documentElement.dataset.oled==='true');await open();assert.equal(await oled.getAttribute('aria-checked'),'true');
 await oled.click();await page.waitForFunction(()=>document.documentElement.dataset.oled==='false');assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(23, 23, 25)');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS OLED UI',width,'suboption, true black, gray cards, theme switches, reload persistence, disable and no overflow');
 }}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
