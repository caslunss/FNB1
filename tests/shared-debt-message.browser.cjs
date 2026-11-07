const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5211',origin='https://share.test';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [375,1280]){
 const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
 await context.route('**/*',route=>route.abort());
 // HTTPS browser origin mirrors the production-only sharing contract; all bytes stay local.
 await context.route(origin+'/**',async route=>{const url=new URL(route.request().url());const response=await route.fetch({url:base+url.pathname+url.search});await route.fulfill({response})});
 await context.addInitScript(()=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Ana Silva')});
 const page=await context.newPage();await page.goto(origin);await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);
 await page.evaluate(()=>dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind:'data-area-view',value:'friends:charges'}})));
 const form=page.locator('form').filter({has:page.getByRole('textbox',{name:'Quem está cobrando',exact:true})});
 assert.equal(await form.getByRole('textbox',{name:'Quem está cobrando',exact:true}).inputValue(),'Ana Silva');
 await form.getByRole('textbox',{name:'Descrição',exact:true}).fill('Almoço de João');await form.getByRole('spinbutton',{name:'Valor para o amigo (R$)',exact:true}).fill('100.01');
 await form.getByRole('button',{name:'Mais opções',exact:true}).click();await form.getByRole('textbox',{name:'Detalhes da cobrança (opcional)',exact:true}).fill('Sua parte do almoço.');
 await form.getByRole('button',{name:'Enviar',exact:true}).click();const message=await page.getByRole('textbox',{name:'Mensagem para compartilhar',exact:true}).inputValue();
 assert(message.includes('Ana Silva'));assert(message.includes('100,01'));assert(message.includes('Sua parte do almoço.'));
 const link=message.match(/https:\/\/share\.test\/#d=[A-Za-z0-9_-]+/)[0];assert(link.length<200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const recipient=await context.newPage();await recipient.goto(link);await recipient.getByRole('heading',{name:'Dívida compartilhada',exact:true}).waitFor();await recipient.getByText('Quem cobra: Ana Silva',{exact:true}).waitFor();await recipient.getByRole('button',{name:'Revisar dívida',exact:true}).click();assert.equal(await recipient.locator('#sd').inputValue(),'Almoço de João');assert.equal(await recipient.locator('#sv').inputValue(),'100,01');
 await context.close();console.log('PASS debt sharing UI',width,'named sender, detailed message, compact same-origin URL and recipient review preserving amount');
 }}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
