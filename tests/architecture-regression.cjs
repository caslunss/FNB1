const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
for(const file of fs.readdirSync('src/components').filter(x=>/\.[jt]sx$/.test(x))){const text=fs.readFileSync(path.join('src/components',file),'utf8');assert(!/window\.plan[A-Z]/.test(text),file+' must import the module API');}
for(const area of ['summary','commitments','planning','analysis','investments','account'])assert(fs.existsSync('src/finance/views/'+area+'.js'));
const calculations=fs.readFileSync('src/finance/calculations.js','utf8');assert(!/\b(?:document|localStorage|sessionStorage|window)\./.test(calculations),'calculations cannot access DOM/storage');
const styles=fs.readdirSync('src/styles').filter(x=>x.endsWith('.css')).map(x=>fs.readFileSync('src/styles/'+x,'utf8')).join('\n');assert((styles.match(/!important/g)||[]).length<=618,'No new priority overrides without reviewing the design contract');
assert(fs.readFileSync('src/styles/root.css','utf8').includes('design-tokens.css'));
console.log('PASS architecture: module-only component APIs, domain views, pure calculations and global style budget');
