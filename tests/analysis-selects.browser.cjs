const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const widths = [320,390,768,1024,1440];
async function closed(page, label) {
  await page.waitForFunction(()=>!document.querySelector('[role=combobox][aria-expanded=true]'));
  const result = await page.locator('.finance-select-list').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => node.id));
  assert.deepEqual(result, [], label + ': no unopened or stale menus may be visible');
  assert.equal(await page.locator('[role=combobox][aria-expanded=true]').count(), 0, label + ': closed ARIA state');
}
async function openSelect(page, trigger) {
  await trigger.click();
  const id = await trigger.getAttribute('aria-controls'), list = page.locator(`[id="${id}"]`);
  await list.waitFor({state:'visible'});
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('.finance-select-list:visible').count(), 1, 'Only the requested menu opens');
  const bounds = await list.boundingBox();
  const viewport = page.viewportSize();
  assert(bounds.x >= 11 && bounds.x + bounds.width <= viewport.width - 11, 'Menu stays inside viewport');
  assert(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1, 'Menu stays inside viewport vertically');
  const option = list.getByRole('option').first();
  assert(await option.evaluate(node => {const r=node.getBoundingClientRect();return node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}), 'Open menu is above other surfaces');
  return list;
}
async function navigate(page, subpage) {
  await page.evaluate(value=>dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind:'data-area-view',value:'analysis:'+value}})),subpage);
  await page.waitForSelector('.analysis-content');
  if(subpage==='taxes')await page.waitForSelector('.tax-charts');
  await page.waitForTimeout(350);
  await page.mouse.move(0,0);
  const gap=await page.evaluate(()=>document.querySelector('.analysis-content').getBoundingClientRect().top-document.querySelector('.area-toolbar').getBoundingClientRect().bottom);
  assert(Math.abs(gap-(page.viewportSize().width<=699?16:20))<1,subpage+': navigation and content must have a grid gap');
}
async function alignment(page, width) {
  const failures = await page.evaluate(() => {
    const errors=[],box=node=>node.getBoundingClientRect(),near=(a,b)=>Math.abs(a-b)<1;
    const cards=[...document.querySelectorAll('[data-tax-summary]')];
    for(const card of cards){
      const r=box(card),value=box(card.querySelector('strong'));
      if(!near(r.height,box(cards[0]).height))errors.push('Unequal summary card heights');
      for(const peer of cards.filter(node=>near(box(node).top,r.top))){
        if(!near(box(peer.querySelector('strong')).bottom,value.bottom))errors.push('Summary values not aligned');
        if(!near(box(peer.querySelector('.foot')).top,box(card.querySelector('.foot')).top))errors.push('Summary labels not aligned');
      }
      if(parseFloat(getComputedStyle(card).paddingLeft)!==(innerWidth<=699?16:20))errors.push('Library padding overrides responsive summary padding');
    }
    const group=document.querySelector('.tax-toolbar-actions'),g=box(group),buttons=[...group.querySelectorAll('button')];
    for(const button of buttons){const r=box(button);if(r.left<g.left-1||r.right>g.right+1||r.top<g.top-1||r.bottom>g.bottom+1)errors.push('Clipped toolbar action');if(r.height<44||r.width<44)errors.push('Small touch target')}
    const textButtons=buttons.filter(node=>!node.classList.contains('tax-add-analysis'));
    if(!near(box(textButtons[0]).height,box(textButtons[1]).height))errors.push('Unequal text action heights');
    if(!near(box(buttons[0]).top+box(buttons[0]).height/2,box(buttons[1]).top+box(buttons[1]).height/2))errors.push('Add action off center');
    if(innerWidth<=699){const period=box(document.querySelector('.tax-toolbar>.month-selector'));if(!near(period.x+period.width/2,g.x+g.width/2))errors.push('Mobile period off center')}
    const charts=[...document.querySelectorAll('.tax-charts>.card')];
    for(const card of [...charts,document.querySelector('.tax-history')])if(getComputedStyle(card).margin!=='0px')errors.push('Card margin doubles grid gap');
    if(innerWidth<=699){if(!near(box(charts[1]).top-box(charts[0]).bottom,16))errors.push('Mobile chart gap is not 16px')}
    else if(!near(box(charts[0]).top,box(charts[1]).top))errors.push('Charts not aligned');
    const rows=[...document.querySelectorAll('.tax-purchase')];
    if(innerWidth>=700)for(const row of rows){
      if(!near(box(row.querySelector('button')).left,box(rows[0].querySelector('button')).left))errors.push('History actions not aligned');
      if(!near(box(row.children[1]).right,box(rows[0].children[1]).right))errors.push('History amounts not aligned');
    }
    if(document.documentElement.scrollWidth>innerWidth)errors.push('Page overflow');
    return errors;
  });
  assert.deepEqual(failures, [], 'Analysis layout at '+width);
}
async function fixture(context) {
  const page=await context.newPage();await page.goto(base+'/tests/select-qa.html');
  await page.getByRole('combobox',{name:'Controlado',exact:true}).waitFor();
  await closed(page,'Fixture initial state');
  const controlled=page.getByRole('combobox',{name:'Controlado',exact:true});
  await controlled.focus();await page.keyboard.press('End');await page.keyboard.press('Enter');
  assert.equal(await page.locator('[name=controlled]').inputValue(),'c');await closed(page,'Keyboard selection');
  await openSelect(page,controlled);await page.keyboard.press('Escape');await closed(page,'Escape');
  await openSelect(page,controlled);await page.getByRole('button',{name:'Tema',exact:true}).click();await closed(page,'Outside click');
  const required=page.getByRole('combobox',{name:'Obrigatório',exact:true});
  await page.getByRole('button',{name:'Enviar',exact:true}).click();assert.equal(await required.getAttribute('aria-invalid'),'true');
  const list=await openSelect(page,required);await list.getByRole('option',{name:'Confirmado',exact:true}).click();
  await page.getByRole('button',{name:'Enviar',exact:true}).click();
  const submitted=JSON.parse(await page.locator('output').innerText());assert.equal(submitted.controlled,'c');assert.equal(submitted.required,'ok');assert.equal(submitted.legacy,'Pix');
  await page.evaluate(()=>document.querySelector('#legacySelect').value='Débito');
  assert((await page.getByRole('combobox',{name:'Pagamento legado',exact:true}).innerText()).includes('Débito'));
  await openSelect(page,required);await page.getByRole('button',{name:'Restaurar',exact:true}).click();await closed(page,'Reset');
  assert.equal(await page.locator('[name=required]').inputValue(),'');
  assert.equal(await page.getByRole('combobox',{name:'Desativado',exact:true}).isDisabled(),true);
  await openSelect(page,controlled);await page.setViewportSize({width:390,height:850});await closed(page,'Resize');
  await page.close();
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const errors=[];
  try{for(const fallback of [false,true]){
    const context=await browser.newContext({viewport:{width:390,height:900},locale:'pt-BR',reducedMotion:'reduce',hasTouch:true});
    await context.addInitScript(fallback=>{if(window.top!==window||!/^https?:$/.test(location.protocol))return;sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Teste Análise');if(fallback)delete HTMLElement.prototype.showPopover},fallback);
    context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
    await context.route('**/api/market-economy',route=>route.fulfill({json:JSON.parse(fs.readFileSync('public/assets/economy-reference.json','utf8'))}));
    if(!process.env.QA_SKIP_FIXTURE)await fixture(context);
    const page=await context.newPage();await page.goto(base);await page.waitForFunction(()=>window.planTaxes);
    await page.evaluate(()=>{const date=window.planTaxes.getState().today;window.planTaxes.addExpense({description:'Compra de teste de layout',value:'123,45',date,category:'Gastos Essenciais'});window.planTaxes.addExpense({description:'Compra com valor curto',value:'9,90',date,category:'Gastos Variáveis'})});
    const original=await page.evaluate(()=>JSON.stringify(window.planTaxes.getState().expenses));
    for(const width of widths)for(const theme of ['light','dark']){
      await page.setViewportSize({width,height:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      await navigate(page,'taxes');await closed(page,'Tax initial');await alignment(page,width);
      await page.getByRole('button',{name:'Importar banco',exact:true}).click();await page.waitForSelector('.tax-bank');await closed(page,'Bank expanded');
      const trigger=page.locator('.tax-bank [role=combobox]').first(),list=await openSelect(page,trigger);
      await list.getByRole('option',{name:'SP',exact:true}).tap();await closed(page,'Bank choice by touch');
      assert((await trigger.innerText()).includes('SP'));
      await page.getByRole('button',{name:'Adicionar análise tributária',exact:true}).click();await page.waitForSelector('.tax-editor[open]');await closed(page,'Tax dialog initial');
      const modalTrigger=page.locator('.tax-editor [role=combobox]').first();await openSelect(page,modalTrigger);await page.keyboard.press('Escape');await closed(page,'Dialog menu Escape');
      assert.equal(await page.locator('.tax-editor[open]').count(),1,'Escape closes menu without closing editor');
      await page.getByRole('button',{name:'Fechar análise tributária',exact:true}).click();await closed(page,'Dialog closed');
      await page.getByRole('button',{name:'Importar banco',exact:true}).click();
      for(const tab of ['reports']){
        await navigate(page,tab);await closed(page,tab+' initial');
        const control=page.locator('.analysis-content [role=combobox]').first();await openSelect(page,control);await page.keyboard.press('Escape');await closed(page,tab+' closed');
        const margins=await page.locator('.analysis-content>.card').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).margin));assert(margins.every(margin=>margin==='0px'),tab+': no legacy card margins');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,tab+': no page overflow');
      }
      assert.equal(await page.evaluate(()=>JSON.stringify(window.planTaxes.getState().expenses)),original,'UI interactions must not change expenses');
      console.log('PASS',fallback?'portal fallback':'native popover',width,theme,'analysis, bank, editor, reports');
    }
    await context.close();
  }assert.deepEqual(errors,[]);console.log('PASS analysis alignment and select lifecycle: native/fallback, 5 widths, 2 themes, keyboard/touch/forms');}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
