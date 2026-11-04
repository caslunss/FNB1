// Pixel comparison of the PNG pairs produced by visual-audit.browser.cjs.
// Later directories override an earlier capture of the same state.
const fs = require('node:fs'), path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const directories = (process.env.VISUAL_AUDIT_DIRS || '/tmp/fnb-visual-audit').split(',');
const output = process.env.VISUAL_PIXEL_REPORT || '/tmp/fnb-visual-pixels.json';
const channelTolerance = 8, ratioTolerance = .001;
(async () => {
  const cases = new Map();
  for (const directory of directories) {
    const report = JSON.parse(fs.readFileSync(path.join(directory, 'report.json'), 'utf8'));
    if (!report.reference || report.errors.length) throw Error('Incomplete reference run: ' + directory);
    for (const item of report.cases) cases.set(item.key, {item, directory});
  }
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  const results = [];
  try {
    const page = await browser.newPage();
    for (const [key, {item, directory}] of cases) {
      const files = ['before', 'after'].map(suffix => 'data:image/png;base64,' + fs.readFileSync(path.join(directory, key + '-' + suffix + '.png')).toString('base64'));
      const pixels = await page.evaluate(async ({files, channelTolerance}) => {
        const images = await Promise.all(files.map(async src => {
          const image = new Image(); image.src = src; await image.decode();
          const canvas = new OffscreenCanvas(image.width, image.height), context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
          return {width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data};
        }));
        const [before, after] = images;
        if (before.width !== after.width || before.height !== after.height) return {dimensionsMatch: false, before: [before.width, before.height], after: [after.width, after.height]};
        let changed = 0, totalDelta = 0;
        for (let i = 0; i < before.data.length; i += 4) {
          let maximum = 0;
          for (let channel = 0; channel < 3; channel++) {
            const delta = Math.abs(before.data[i + channel] - after.data[i + channel]);
            totalDelta += delta; maximum = Math.max(maximum, delta);
          }
          if (maximum > channelTolerance) changed++;
        }
        const total = before.width * before.height;
        return {dimensionsMatch: true, width: before.width, height: before.height, changedPixels: changed, totalPixels: total, changedRatio: changed / total, meanChannelDelta: totalDelta / (total * 3)};
      }, {files, channelTolerance});
      const passed = item.same === true && pixels.dimensionsMatch && pixels.changedRatio <= ratioTolerance;
      results.push({key, directory, computedStylesMatch: item.same, passed, ...pixels});
      if (!passed) console.log('INSPECT', key, JSON.stringify(pixels));
    }
  } finally { await browser.close(); }
  const summary = {channelTolerance, ratioTolerance, cases: results.length, passed: results.filter(item => item.passed).length, exactPixels: results.filter(item => item.changedPixels === 0 && item.dimensionsMatch).length, results};
  fs.writeFileSync(output, JSON.stringify(summary, null, 2) + '\n');
  console.log('Pixel comparison:', summary.passed + '/' + summary.cases, 'within tolerance;', summary.exactPixels, 'identical at channel tolerance. Report:', output);
  if (summary.passed !== summary.cases) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
