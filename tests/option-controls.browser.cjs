const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const widths = (process.env.UI_WIDTHS || '320,390,768,1024,1440,1920').split(',').map(Number);
const themes = (process.env.UI_THEMES || 'light,dark').split(',');
const routes = [
  ['overview','data-summary-mode','overview'], ['entries','data-summary-mode','entries'],
  ['debts','data-area-view','commitments:debts'], ['cards','data-area-view','commitments:cards'],
  ['friends','data-area-view','commitments:friends'], ['purchases','data-area-view','planning:purchases'],
  ['goals','data-area-view','planning:goals'], ['investments','navigate','v'],
  ['taxes','data-area-view','analysis:taxes'], ['reports','data-area-view','analysis:reports'],
  ['carbon','data-area-view','analysis:carbon'],
];
async function audit(page, key) {
  const result = await page.evaluate(() => {
    const visible = node => node.getClientRects().length && !node.closest('[hidden], [inert]') && getComputedStyle(node).visibility !== 'hidden';
    const failures = [], bars = [...document.querySelectorAll('.ui-option-bar')].filter(visible);
    const close = (a,b) => Math.abs(a-b) < 1;
    for (const bar of bars) {
      const style = getComputedStyle(bar), box = bar.getBoundingClientRect();
      if (style.gap !== '8px') failures.push(['bar gap', bar.className, style.gap]);
      if (parseFloat(style.borderRadius) < 999) failures.push(['bar radius', bar.className, style.borderRadius]);
      if (box.height>56) failures.push(['option bar became a tall capsule',bar.className,box.height]);
      if (style.borderTopWidth !== '1px') failures.push(['bar border', bar.className, style.borderTopWidth]);
      if (!style.backdropFilter.includes('blur(')) failures.push(['bar material', bar.className, style.backdropFilter]);
      if (!style.backgroundColor.startsWith('rgba(')) failures.push(['opaque bar',bar.className,style.backgroundColor]);
      for (const button of [...bar.querySelectorAll('button')].filter(visible)) {
        const r = button.getBoundingClientRect(), s = getComputedStyle(button);
        const scrollable=bar.scrollWidth>bar.clientWidth+1&&style.overflowX==='auto';
        if ((!scrollable&&(r.left < box.left-1 || r.right > box.right+1)) || r.top < box.top-1 || r.bottom > box.bottom+1)
          failures.push(['control outside bar', button.textContent, [r.x,r.y,r.width,r.height], [box.x,box.y,box.width,box.height]]);
        const selected = button.matches('[aria-selected=true],[aria-pressed=true],[aria-current=page]');
        if (selected && (r.left<box.left-1||r.right>box.right+1)) failures.push(['selected option is clipped',button.textContent]);
        if (selected && (s.backgroundColor !== 'rgb(255, 255, 255)' || s.color !== 'rgb(29, 29, 31)'))
          failures.push(['selected state', button.textContent, s.backgroundColor, s.color]);
        if (!selected && button.classList.contains('ui-option') && s.backgroundColor !== 'rgba(0, 0, 0, 0)')
          failures.push(['inactive state', button.textContent, s.backgroundColor]);
      }
    }
    const buttons = [...document.querySelectorAll('.ui-button')].filter(visible);
    for (const button of buttons) {
      const s = getComputedStyle(button), r = button.getBoundingClientRect();
      const icon = button.matches('.ui-icon,.ib:not(.month-picker-labeled),.date-picker-open,.account-overlay-close,.profile-card-close');
      if (r.height < 43.5 || r.width < 43.5) failures.push(['touch target', button.getAttribute('aria-label')||button.textContent, r.width,r.height]);
      if (!icon && (s.fontSize !== '14px' || s.fontWeight !== '500' || s.padding !== '8px 16px'))
        failures.push(['button scale', button.textContent, s.fontSize,s.fontWeight,s.padding]);
      if (icon && (!close(r.width,44) || !close(r.height,44))) failures.push(['icon geometry',button.getAttribute('aria-label'),r.width,r.height]);
    }
    const dialog = document.querySelector('dialog[open]');
    if (dialog && dialog.scrollWidth > dialog.clientWidth+1) failures.push(['dialog overflow']);
    if (document.documentElement.scrollWidth > innerWidth) failures.push(['page overflow']);
    return {failures,bars:bars.length,buttons:buttons.length,settingsScreen:document.querySelector('#accountOverlay[open] .settings-navigation')?.dataset.settingsScreen||null};
  });
  assert.deepEqual(result.failures, [], key + ': ' + JSON.stringify(result.failures));
  if (result.settingsScreen) {
    const titles={home:'Configurações',layout:'Layout e preferências',notifications:'Notificações',connections:'Dados e conexões'};
    assert(Object.hasOwn(titles,result.settingsScreen),key+': known Settings screen');
    assert.equal(await page.locator('#accountOverlay[open] .settings-navigation').count(),1,key+': one Settings screen');
    assert.equal(await page.locator('#accountOverlayTitle').innerText(),titles[result.settingsScreen]);
    assert(result.buttons>0,key+': Settings controls must be visible');
    if(result.settingsScreen==='home')assert.equal(await page.locator('.settings-main-menu .settings-menu-row').count(),4,'Visitor has four grouped options');
  } else assert(result.bars > 0, key + ': no visible option bars');
  return {key,bars:result.bars,buttons:result.buttons};
}
async function navigate(page, kind, value) {
  await page.evaluate(({kind,value})=>kind==='navigate'?window.planMobile.navigate(value):dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind,value}})),{kind,value});
  if (value==='v') await page.waitForSelector('.investment-tabs');
  if (value==='analysis:taxes') await page.waitForSelector('.tax-page');
  await page.waitForTimeout(450);
  await page.waitForFunction(()=>!document.querySelector('#app')?.inert&&[...document.querySelectorAll('#app .ui-option-bar')].some(node=>node.getClientRects().length));
  await page.mouse.move(0,0);
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const results=[],errors=[];
  try {
    const context=await browser.newContext({viewport:{width:390,height:900},locale:'pt-BR',reducedMotion:'reduce'});
    await context.addInitScript(()=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','Auditoria UI')});
    await context.route('**/api/market-economy',route=>route.fulfill({json:JSON.parse(fs.readFileSync('public/assets/economy-reference.json','utf8'))}));
    await context.route('**/api/investments?*',route=>route.fulfill({json:{data:{results:[]}}}));
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);await page.waitForFunction(()=>window.planCredit);
    await page.evaluate(()=>{const date=window.planTaxes.getState().today;window.planTaxes.addExpense({description:'Teste do padrão visual',value:'23,45',date,category:'Gastos Variáveis'});window.planCredit.saveCard({name:'Cartão de teste',limitCents:100000,openingUsedCents:0,closingDay:10,dueDay:20})});
    for (const width of widths) for (const theme of themes) {
      await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      for (const [name,kind,value] of routes) {
        await navigate(page,kind,value);results.push(await audit(page,`${width}/${theme}/${name}`));
      }
      await page.evaluate(()=>window.planMobile.open('settings'));await page.waitForSelector('#accountOverlay[open]');
      await page.waitForSelector('.settings-main-menu');
      assert.equal(await page.getByRole('button',{name:'Conta',exact:true}).count(),0,'Account is hidden for the visitor fixture');
      results.push(await audit(page,`${width}/${theme}/settings-menu`));
      for (const [name,screen,content] of [['Notificações','notifications','.notification-preferences'],['Layout e preferências','layout','#layoutEditor'],['Dados e conexões','connections','.settings-sections']]) {
        await page.locator('.settings-main-menu').getByRole('button',{name,exact:true}).click();await page.waitForSelector(`.settings-navigation[data-settings-screen=${screen}] ${content}`);await page.waitForTimeout(200);
        results.push(await audit(page,`${width}/${theme}/settings-${name}`));
        await page.getByRole('button',{name:'Voltar para configurações',exact:true}).click();await page.waitForSelector('.settings-main-menu');
      }
      await page.getByRole('button',{name:'Fechar configurações',exact:true}).focus();await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsTab-layout');await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsTab-notifications');await page.keyboard.press('Enter');
      await page.waitForSelector('.settings-navigation[data-settings-screen=notifications] .notification-preferences');
      await page.evaluate(()=>document.querySelector('#accountOverlay').close());
      await page.locator('#notificationButton').click();await page.waitForSelector('#notificationPanel[open]');
      for (const name of ['Todas','Transações','Alertas']) {
        await page.getByRole('button',{name,exact:true}).click();await page.mouse.move(0,0);
        results.push(await audit(page,`${width}/${theme}/notifications-${name}`));
      }
      const clear=page.getByRole('button',{name:'Limpar',exact:true});await page.keyboard.press('Tab');await clear.focus();
      assert(await clear.evaluate(node=>node.matches(':focus-visible')&&getComputedStyle(node).boxShadow!=='none'),'Keyboard focus ring');
      await page.getByRole('button',{name:'Fechar notificações'}).click();
      await page.evaluate(()=>window.planMobile.open('calendar'));await page.waitForSelector('#accountOverlay[open]');
      results.push(await audit(page,`${width}/${theme}/calendar`));
      await page.evaluate(()=>document.querySelector('#accountOverlay').close());
      console.log('PASS',width,theme,'pages, settings keyboard navigation, notifications and calendar');
    }
    await page.setViewportSize({width:320,height:900});
    await page.evaluate(()=>window.planMobile.open('settings'));await page.getByRole('button',{name:'Dados e conexões',exact:true}).click();
    await page.evaluate(()=>document.querySelector('#accountOverlay').close());await page.waitForTimeout(80);
    await page.evaluate(()=>window.planMobile.open('settings'));await page.waitForTimeout(200);
    assert.equal(await page.locator('.settings-navigation').getAttribute('data-settings-screen'),'home');
    await audit(page,'reopened settings returns to the grouped menu');
    await page.evaluate(()=>document.querySelector('#accountOverlay').close());
    await navigate(page,'navigate','v');
    const investmentBar=page.locator('.investment-tabs');
    const offset=await investmentBar.evaluate(node=>{node.scrollLeft=node.scrollWidth;return node.scrollLeft});
    assert(offset>0,'Long option lists scroll inside the bar');
    await page.getByRole('textbox',{name:'Ativos',exact:true}).fill('PETR4');await page.waitForTimeout(100);
    assert.equal(await investmentBar.evaluate(node=>node.scrollLeft),offset,'Unrelated input renders must not reset manual option scrolling');
    await page.setViewportSize({width:390,height:900});await navigate(page,'data-summary-mode','overview');
    const segments=page.getByRole('tablist',{name:'Dados do gráfico'});
    await segments.getByRole('tab',{name:'Entradas',exact:true}).focus();await page.keyboard.press('End');
    await page.getByRole('tablist',{name:'Dados do gráfico'}).getByRole('tab',{name:'Metas',exact:true}).waitFor();
    assert.equal(await page.getByRole('tablist',{name:'Dados do gráfico'}).getByRole('tab',{name:'Metas',exact:true}).getAttribute('aria-selected'),'true');
    await page.emulateMedia({reducedMotion:'no-preference'});await page.mouse.move(0,0);await page.locator('h1').click();
    const original=await page.locator('#tabs').boundingBox();await page.evaluate(()=>scrollTo(0,Math.min(600,document.documentElement.scrollHeight-innerHeight)));
    await page.waitForSelector('.navigation-actions[data-compact=true]');const compact=await page.locator('#tabs').boundingBox();
    assert(compact.width<original.width,'Scroll compacts navigation');
    await page.waitForSelector('.navigation-actions[data-compact=false]');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.deepEqual(errors,[]);
    if(process.env.UI_AUDIT_REPORT)fs.writeFileSync(process.env.UI_AUDIT_REPORT,JSON.stringify(results,null,2));
    console.log('PASS shared controls:',results.length,'states; pointer/keyboard, touch targets, selected/inactive material, focus, scroll compaction and idle expansion');
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
