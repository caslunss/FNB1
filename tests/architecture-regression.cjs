const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
for(const file of fs.readdirSync('src/components').filter(x=>/\.[jt]sx$/.test(x))){const text=fs.readFileSync(path.join('src/components',file),'utf8');assert(!/window\.plan[A-Z]/.test(text),file+' must import the module API');}
for(const area of ['summary','commitments','planning','analysis','friends','account'])assert(fs.existsSync('src/finance/views/'+area+'.tsx'));
const calculations=fs.readFileSync('src/finance/calculations.ts','utf8');assert(!/\b(?:document|localStorage|sessionStorage|window)\./.test(calculations),'calculations cannot access DOM/storage');
const styles=fs.readdirSync('src/styles').filter(x=>x.endsWith('.css')).map(x=>fs.readFileSync('src/styles/'+x,'utf8')).join('\n');assert((styles.match(/!important/g)||[]).length<=618,'No new priority overrides without reviewing the design contract');
assert(fs.readFileSync('src/styles/root.css','utf8').includes('design-tokens.css'));
const sources=[];function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else sources.push(file)}}walk('src');
assert.equal(sources.filter(file=>/\.(?:js|jsx)$/.test(file)).length,0,'Frontend must remain TypeScript/TSX');
for(const file of sources.filter(file=>/\.(?:ts|tsx)$/.test(file))){const code=fs.readFileSync(file,'utf8');assert(!/@ts-(?:ignore|nocheck)|:\s*any\b|\bas\s+any\b/.test(code),file+' must not bypass type checking');assert(!/parseFromString\([^;]*['\"]text\/html['\"]/.test(code),file+' must render JSX without HTML parsing')}
const config=JSON.parse(fs.readFileSync('tsconfig.json','utf8'));assert.equal(config.compilerOptions.strict,true);assert.equal(config.compilerOptions.allowJs,false);
assert.equal(config.compilerOptions.noUnusedLocals,true,'unused imports/context bindings must stay out of the migrated graph');
const entry=fs.readFileSync('src/finance/workspace.tsx','utf8');
assert(!/function (?:draw|persist|atomic|openSheet|saveSheet|saveShopping)\b|\b(?:let|const) (?:S|CARDS|DEBTS|CART)\b/.test(entry),'workspace entry must only assemble and own a session');
for(const file of sources.filter(file=>file.startsWith('src/finance/session/')&&file.endsWith('.tsx'))){
 const code=fs.readFileSync(file,'utf8');assert(!/globalThis\.planFinanceChanged/.test(code),'domains must publish through their module contract');assert(!/\b(?:document|window)\.addEventListener\(/.test(code),'domain listeners must be owned by SessionScope');
}
console.log('PASS architecture: module-only component APIs, domain views, pure calculations and global style budget');

assert(!fs.existsSync('src/finance/views/investments.tsx'),'Retired investments page must remain absent');
