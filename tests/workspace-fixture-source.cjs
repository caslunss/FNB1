// Reconstruct the lexical VM fixture from the live domain modules. This map
// contains ordering/binding metadata only, never a second business implementation.
const fs=require('node:fs');
const {parseSync,minifySync}=require('rolldown/experimental');
const {readExecutableSource}=require('./source-loader.cjs');
const map=require('./workspace-fixture-map.json'),cache=new Map();
const startup=readExecutableSource('src/finance/workspace.tsx');
const startupBody=parseSync('startup.js',startup).program.body.find(node=>node.type==='ExportNamedDeclaration'&&node.declaration?.id?.name==='startWorkspace').declaration.body.body;
function domain(name){
 if(!cache.has(name)){
  const source=readExecutableSource('src/finance/session/'+name+'.tsx');
  cache.set(name,{source,ast:parseSync(name+'.js',source).program});
 }
 return cache.get(name);
}
// Formatting of the production modules is independent of old lexical fixtures.
// Compression and name mangling stay disabled: only code generation changes.
function canonical(code){
 if(!code.trim())return '';
 const result=minifySync('fixture.js',code,{compress:false,mangle:false});
 if(result.errors.length)throw Error(result.errors[0].message);
 let text=result.code;const edits=[];
 function visit(node){
  if(!node||typeof node!=='object')return;
  const value=node.type==='Literal'&&typeof node.value==='string'?node.value:node.type==='TemplateLiteral'&&!node.expressions.length?node.quasis[0].value.cooked:undefined;
  if(value!==undefined){edits.push({start:node.start,end:node.end,text:"'"+JSON.stringify(value).slice(1,-1).replace(/\\"/g,'"').replace(/'/g,"\\'")+"'"});return;}
  for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value)}
 }
 visit(parseSync('fixture.js',text).program);
 for(const edit of edits.sort((a,b)=>b.start-a.start))text=text.slice(0,edit.start)+edit.text+text.slice(edit.end);
 return text;
}
const entries=map.entries.map(entry=>{
 if(entry.kind==='access'){
  if(entry.accessIndex<5){const node=startupBody[entry.accessIndex];return startup.slice(node.start,node.end);}
  const assignment=startupBody.find(node=>node.type==='ExpressionStatement'&&node.expression.type==='AssignmentExpression'&&node.expression.left.property?.name==='localStorage').expression;
  return 'const localStorage='+startup.slice(assignment.right.start,assignment.right.end)+';';
 }
 if(entry.kind==='controller'){
  const code=readExecutableSource('src/finance/controllers/'+entry.domain+'.ts');
  const fn=parseSync('controller.js',code).program.body.find(node=>node.type==='ExportNamedDeclaration'&&node.declaration?.id?.name===entry.name).declaration;
  const first=fn.body.body[0];
  const start=first?.type==='VariableDeclaration'&&first.declarations[0]?.init?.name==='context'?first.end:fn.body.start+1;
  return code.slice(fn.start,fn.body.start).replace(/\(\s*context\s*,/,'(')+'{'+code.slice(start,fn.body.end-1)+'}';
 }
 const {source,ast}=domain(entry.domain);
 if(entry.kind==='function'){
  if(entry.overload)return '';
  const factories=ast.body.filter(x=>x.type==='ExportNamedDeclaration'&&x.declaration?.type==='FunctionDeclaration'&&x.declaration.id.name.startsWith('create'));
  const fn=factories.flatMap(x=>x.declaration.body.body).find(x=>x.type==='FunctionDeclaration'&&x.id.name===entry.name);
  if(!fn)throw Error('Missing migrated fixture command '+entry.domain+'.'+entry.name);
  return source.slice(fn.start,fn.end);
 }
 const start='// @workspace-step '+entry.order+' ',end='// @workspace-end '+entry.order;
 const begin=source.indexOf(start),stop=source.indexOf(end,begin);
 if(begin<0||stop<0)throw Error('Missing migration phase '+entry.order);
 const block=source.slice(source.indexOf('\n',begin)+1,stop).trim();
 if(!entry.variables)return block;
 const values=parseSync('phase.js',block).program.body;
 return entry.variables.kind+' '+entry.variables.declarations.map(({name,initialized})=>{
  if(!initialized)return name;
  const assignment=values.find(x=>x.type==='ExpressionStatement'&&x.expression.type==='AssignmentExpression'&&x.expression.left.property?.name===name)?.expression;
  if(!assignment)throw Error('Missing initialization '+name);
  return name+'='+block.slice(assignment.right.start,assignment.right.end);
 }).join(',')+';';
}).map((text,index)=>map.entries[index].kind==='access'?text:canonical(text.replace(/\bworkspace\s*\.\s*/g,'').replace(/\b(\w+):\s*\1(?=[,}\n])/g,'$1')));
const preamble='export async function startWorkspace({renderView}){\n';
// Preserve the existing fixture boundary without preserving a copy of the old code.
const boundary=map.entries.findIndex(e=>e.variables?.declarations.some(d=>d.name==='START_YEAR'));
entries.splice(boundary,0,'// FINANCE_CORE');
let source=preamble+entries.join('\n')+'\n}';
// VM fixtures substitute a synchronous DOM registration harness. Keep its native
// registration syntax; runtime lifecycle ownership is tested against SessionScope.
const edits=[];
function visit(node){
 if(!node||typeof node!=='object')return;
 if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.object.name==='scope'&&node.callee.property.name==='listen'){
  const target=node.arguments[0],name=source.slice(target.start,target.end);
  edits.push({start:node.callee.start,end:node.arguments[1].start,text:name==='window'?'addEventListener(':name+'.addEventListener('});
 }
 for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value)}
}
visit(parseSync('fixture.ts',source).program);
for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
module.exports=source.replace(/\bscope\.timeout\(/g,'setTimeout(').replace(/\bscope\.cancelTimeout\(/g,'clearTimeout(').replace(/\bscope\.interval\(/g,'setInterval(').replace(/\bscope\.microtask\(/g,'queueMicrotask(').replace(/(function draw\(\)\{[^]*?)if\(transactionDepth\)/,'$1\n if(transactionDepth)');
