import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
// Remove declarations superseded by the SAME selector in the SAME conditional/layer context.
// Never compare selectors of different specificity or declarations in different files.
let removed=0,important=0;
for(const file of fs.readdirSync('src/styles').filter(name=>name.endsWith('.css'))){
 const location=path.join('src/styles',file),root=postcss.parse(fs.readFileSync(location,'utf8')),seen=new Map();
 root.walkRules(rule=>{
  let parent=rule.parent,context='';
  while(parent&&parent.type!=='root'){if(/keyframes/.test(parent.name||''))return;context=parent.name+':'+parent.params+'|'+context;parent=parent.parent;}
  const key=context+'|'+rule.selector;if(!seen.has(key))seen.set(key,new Map());const properties=seen.get(key);
  for(const declaration of [...rule.nodes].filter(n=>n.type==='decl')){
   const previous=properties.get(declaration.prop);
   if(previous&&(!previous.important||declaration.important)){if(previous.important)important++;previous.remove();removed++;}
   if(!previous?.important||declaration.important)properties.set(declaration.prop,declaration);
  }
 });
 root.walkRules(rule=>{if(!rule.nodes.length)rule.remove()});
 if(process.argv.includes('--write'))fs.writeFileSync(location,root.toString());
}
console.log(JSON.stringify({supersededDeclarations:removed,importantDeclarations:important,written:process.argv.includes('--write')}));

if(process.argv.includes('--check')&&removed)process.exitCode=1;
