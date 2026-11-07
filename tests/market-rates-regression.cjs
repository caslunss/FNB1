// Regression contract for the intentionally retired feature; no live providers.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const removed=['server/functions/market-rates.mjs', 'api/market-rates.js'];
for(const file of removed)assert.equal(fs.existsSync(file),false,'Retired module restored: '+file);
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else if(/\.(?:ts|tsx|js|mjs)$/.test(p))assert(!fs.readFileSync(p,'utf8').includes('/api/market-rates'),'Live caller of removed endpoint: '+p)}}
scan('src');scan('server');
console.log('PASS retired feature: modules absent and no live endpoint callers');
