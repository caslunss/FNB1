const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {DEFAULT_LAYOUT,layoutTokens}=await import('../src/services/layout-preferences.ts');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});
  await context.addInitScript(theme=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Teste');localStorage.setItem('plan12appearance',JSON.stringify(theme));sessionStorage.setItem('plan12guest:plan12layout_v1',JSON.stringify({version:1,palette:'aged-white',intensity:9,light:{opacity:95,blur:28},dark:{opacity:40,blur:0,dim:0}}))},theme);
  const page=await context.newPage();await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.planMobile&&document.documentElement.dataset.layoutReady);
  assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,document.documentElement.style.getPropertyValue(key)])),Object.keys(layoutTokens(DEFAULT_LAYOUT,theme))),layoutTokens(DEFAULT_LAYOUT,theme));
  await page.evaluate(()=>window.planMobile.open('settings'));await page.getByRole('button',{name:'Layout e preferências',exact:true}).click();
  for(const name of ['Opacidade do vidro','Desfoque','Refração','Suavidade no escuro'])assert.equal(await page.getByRole('slider',{name,exact:true}).count(),0);
  await page.getByRole('button',{name:'Restaurar padrão do layout',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>{const saved=JSON.parse(sessionStorage.getItem('plan12guest:plan12layout_v1'));return{intensity:saved.intensity,opacity:saved.light.opacity,blur:saved.dark.blur,dim:saved.dark.dim}}),{intensity:9,opacity:95,blur:0,dim:0});
  await context.close();
 }console.log('PASS fixed glass UI: light/dark default tokens, four removed controls, custom saved values retained on reset');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
