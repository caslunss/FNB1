// Run with Vite active. PLAYWRIGHT_MODULE and CHROMIUM_PATH may select local installations.
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
async function openSheet(page, kind) {
  await page.evaluate(k => {
    const button = document.createElement('button');
    button.dataset.a = 'sheet'; button.dataset.k = k;
    document.body.append(button); button.click(); button.remove();
  }, kind);
  await page.getByRole('button', {name: 'Mais opções', exact: true}).click();
}
async function swipe(page, target) {
  const box = await target.boundingBox(), session = await page.context().newCDPSession(page);
  const x = box.x + 30, y = box.y + box.height / 2;
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
  for (let i = 1; i <= 8; i++) {
    await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y - i * 18}]});
    await page.waitForTimeout(20);
  }
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await session.detach();
}
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 480}, isMobile: true, hasTouch: true, locale: 'pt-BR'});
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      sessionStorage.setItem('plan12-access', 'local');
      sessionStorage.setItem('plan12-guest-name', 'Teste de interface');
      const viewport = new EventTarget(); let height = 0, top = 0;
      Object.defineProperties(viewport, {height: {get: () => height || innerHeight}, offsetTop: {get: () => top}, scale: {value: 1}});
      Object.defineProperty(window, 'visualViewport', {value: viewport});
      window.qaKeyboard = (nextHeight, nextTop = 0) => {height = nextHeight; top = nextTop; viewport.dispatchEvent(new Event('resize'));};
    });
    await page.goto(base);
    await page.waitForFunction(() => !!window.planMobile);
    for (const kind of ['i', 'g', 'd', 'l']) {
      await openSheet(page, kind);
      if (kind === 'i' || kind === 'g') await page.locator('#sr').check();
      const sheet = page.locator('.sheet');
      await page.evaluate(() => window.qaKeyboard(320, 80));
      await page.waitForFunction(() => document.querySelector('#scrim').getBoundingClientRect().height === 320);
      const bounds = await sheet.boundingBox();
      assert(bounds.y >= 80 && bounds.y + bounds.height <= 401, kind + ': keyboard-visible bounds');
      assert(await page.locator('.sh').evaluate(el => el.contains(document.elementFromPoint(el.getBoundingClientRect().x + 20, el.getBoundingClientRect().y + 20))), kind + ': modal above header');
      await sheet.evaluate(el => el.scrollTop = el.scrollHeight);
      assert((await sheet.evaluate(el => el.scrollTop)) > 0, kind + ': expanded content scrolls');
      await page.evaluate(() => window.qaKeyboard(0));
      await page.locator('[data-a=sclose]').click();
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      assert.equal(await page.evaluate(() => document.querySelector('.workspace-frame').inert), false);
      assert.equal(await page.locator('#scrim').evaluate(el => el.style.getPropertyValue('--sheet-viewport-height')), '');
    }
    // Actual touch gesture on the select, not a programmatic scrollTop assignment.
    await openSheet(page, 'i'); await page.locator('#sr').check();
    await page.locator('.sheet').evaluate(el => el.scrollTop = 0);
    const trigger = page.locator('.sheet .finance-select-trigger').first();
    assert.equal(await trigger.evaluate(el => getComputedStyle(el).touchAction), 'pan-y');
    await swipe(page, trigger);
    await page.waitForFunction(() => document.querySelector('.sheet').scrollTop > 0);
    await page.locator('[data-a=sclose]').click();
    await page.mouse.move(150, 300); await page.mouse.wheel(0, 500);
    await page.waitForFunction(() => scrollY > 0);
    assert.equal(await page.evaluate(() => window.planTaxes.getState().expenses.length), 0);
    console.log('PASS four expanded sheets: visual viewport/keyboard, overlay layering, scrolling, touch on select, close/cleanup and unchanged expenses');

    // Use an isolated provider fixture; this does not authenticate or contact Google.
    const login = await browser.newPage({viewport: {width: 390, height: 700}, locale: 'pt-BR'});
    login.on('pageerror', e => errors.push(e.message));
    await login.route('**/auth/v1/settings', route => route.fulfill({json: {external: {google: true}}}));
    await login.route('https://accounts.google.com/gsi/client?*', route => route.fulfill({contentType: 'text/javascript', body: `window.google={accounts:{id:{initialize(){},renderButton(host,options){const iframe=document.createElement('iframe');iframe.title='Entrar com Google';iframe.style.cssText='width:100%;height:44px;background:white;display:block';iframe.srcdoc='<body style="margin:0;background:transparent"><button style="border-radius:999px;width:100%;height:44px;background:white">Entrar com Google</button></body>';host.append(iframe)}}}};`}));
    await login.emulateMedia({reducedMotion: 'reduce'});
    await login.goto(base + '/login.html');
    await login.waitForSelector('#googleButton iframe');
    for (const width of [320, 390, 699, 760, 768, 1440]) {
      await login.setViewportSize({width, height: 700});
      for (const theme of ['light', 'dark']) {
        await login.evaluate(t => document.documentElement.dataset.theme = t, theme);
        const state = await login.evaluate(() => {
          const shell = document.querySelector('.login-shell'), access = document.querySelector('.login-access');
          const shade = document.querySelector('.login-background-shade').getBoundingClientRect();
          const google = document.querySelector('#googleButton'), frame = google.querySelector('iframe');
          return {overflow: document.documentElement.scrollWidth > innerWidth, border: getComputedStyle(shell).borderTopWidth,
            access: access.getBoundingClientRect().toJSON(), panel: getComputedStyle(access).backgroundColor,
            shade: {width: shade.width, height: shade.height}, scheme: getComputedStyle(frame).colorScheme,
            radius: getComputedStyle(google).borderRadius, clip: getComputedStyle(google).overflow};
        });
        assert.equal(state.overflow, false, width + '/' + theme + ': page overflow');
        assert.equal(state.border, '0px', width + '/' + theme + ': old card border');
        assert.equal(state.scheme, 'light'); assert.equal(state.radius, '999px'); assert.equal(state.clip, 'hidden');
        if (width <= 760) {
          assert.equal(state.panel, 'rgba(0, 0, 0, 0)'); assert(Math.abs(state.access.x) < 1); assert(Math.abs(state.access.width - width) < 1);
          assert.equal(state.shade.width, width); assert.equal(state.shade.height, 700);
        } else assert(state.access.x >= width / 2 - 1, 'desktop split preserved');
      }
    }
    await login.setViewportSize({width: 390, height: 700});
    await login.getByRole('button', {name: 'Continuar como visitante'}).click();
    await login.waitForSelector('#guestName');
    assert.equal(await login.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await login.emulateMedia({reducedMotion: 'reduce'});
    await login.screenshot({path: '/tmp/login-dark-mobile-fixed.png', fullPage: true});
    await login.emulateMedia({reducedMotion: 'no-preference', forcedColors: 'active'});
    assert.equal(await login.locator('.google-area').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('PASS login: 12 width/theme combinations, full mobile surface, desktop split, isolated Google iframe fixture, guest form and accessibility modes');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
