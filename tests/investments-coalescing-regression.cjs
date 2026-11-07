// Regression contract for the intentionally retired feature; no live providers.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const removed=['src/finance/views/investments.tsx', 'server/functions/investments.mjs', 'api/investments.js'];
for(const file of removed)assert.equal(fs.existsSync(file),false,'Retired module restored: '+file);
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else if(/\.(?:ts|tsx|js|mjs)$/.test(p))assert(!fs.readFileSync(p,'utf8').includes('/api/investments'),'Live caller of removed endpoint: '+p)}}
scan('src');scan('server');
assert(fs.readFileSync('src/services/navigation.ts','utf8').includes("{key:'f',label:'Análises'}"));assert(!fs.readFileSync('src/services/navigation.ts','utf8').includes("label:'Investimentos'"));
assert(fs.readFileSync('src/finance/calculations.ts','utf8').includes('Investimentos'),'Financial investment category must be retained');
console.log('PASS retired feature: modules absent and no live endpoint callers');
