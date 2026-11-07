// Regression contract for the intentionally retired feature; no live providers.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const removed=['src/services/economy.ts', 'server/functions/market-economy.mjs', 'api/market-economy.js'];
for(const file of removed)assert.equal(fs.existsSync(file),false,'Retired module restored: '+file);
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else if(/\.(?:ts|tsx|js|mjs)$/.test(p))assert(!fs.readFileSync(p,'utf8').includes('/api/market-economy'),'Live caller of removed endpoint: '+p)}}
scan('src');scan('server');
console.log('PASS retired feature: modules absent and no live endpoint callers');
