// Expand injected selectors/presentation only for lexical VM fixtures. Browser
// regressions exercise the real ESM graph, registry and React rendering.
const fs=require('node:fs'),path=require('node:path');
const {readExecutableSource}=require('./source-loader.cjs');
const {parseSync}=require('rolldown/experimental');
let source=require('./workspace-fixture-source.cjs');
for(const file of fs.readdirSync('src/finance/views')){
 const text=readExecutableSource(path.join('src/finance/views',file));
 for(const node of parseSync(file.replace(/tsx$/,'js'),text).program.body){
  const declaration=node.type==='ExportNamedDeclaration'?node.declaration:null;
  if(declaration?.type!=='FunctionDeclaration')continue;
  const name=declaration.id.name,body=declaration.body,first=body.body[0];
  if(first?.type!=='VariableDeclaration')throw Error('Missing injected view context: '+name);
  const implementation=text.slice(first.end,body.end-1);
  source=source.replace(new RegExp(`function ${name}\\(\\)\\{return render${name}\\(viewContext\\);?\\}`),`function ${name}(){${implementation}\n}`);
 }
}
// Legacy VM fixtures expand the current imported commands without copying business logic.
// Browser regressions exercise the actual ESM graph and context wiring.
for(const file of fs.readdirSync('src/finance/controllers')){
 const code=readExecutableSource(path.join('src/finance/controllers',file));
 for(const node of parseSync(file.replace(/ts$/,'js'),code).program.body){
  const fn=node.type==='ExportNamedDeclaration'?node.declaration:null;
  if(fn?.type!=='FunctionDeclaration')continue;
  let body=code.slice(fn.body.start+1,fn.body.end-1);
  const first=fn.body.body[0];
  if(first?.type==='VariableDeclaration'&&first.declarations[0]?.init?.name==='context')
    body=code.slice(first.end,fn.body.end-1);
  let signature=code.slice(fn.start,fn.body.start).replace(/\(\s*context\s*,/,'(').replaceAll('context.todayISO()','todayISO()');
  const text=(signature+'{'+body+'}').replaceAll('parseCsvDate(context,','parseCsvDate(').replaceAll('context.GOAL','GOAL');
  const name=fn.id.name;
  // Expand only an actual delegate, never a following function with a return.
  // Parsers protect real CSV helpers from an overly broad textual match.
  const candidates=[];
  function visit(node){
   if(!node||typeof node!=='object')return;
   if(node.type==='FunctionDeclaration'&&node.id?.name===name){
    const first=node.body.body[0],call=first?.type==='ReturnStatement'?first.argument:null;
    if(call?.type==='CallExpression'&&/^(?:importedCsv|migrated)/.test(call.callee.name||''))candidates.push(node);
   }
   for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value)}
  }
  visit(parseSync('fixture.js',source).program);
  for(const node of candidates.sort((a,b)=>b.start-a.start))source=source.slice(0,node.start)+text+source.slice(node.end);
 }
}
const calculations=readExecutableSource('src/finance/calculations.ts');
for(const match of calculations.matchAll(/export function core_(\w+)\(context\s*,\.\.\.args\s*\)\{\n const \{[^\n]*\}=context;\n([\s\S]*?)\n return \1\(\.\.\.args\);\n\}\n\/\/ end-core:\1/g)){
 const pattern=new RegExp('function '+match[1]+'\\([^]*?\\)\\{return core_'+match[1]+'\\(engineContext,[^)]*\\);?\\}');
 source=source.replace(pattern,match[2]);
}
source=source.replace('// FINANCE_CORE\n','// FINANCE_CORE\nconst DISMISSED_NOTIFICATIONS_KEY="plan12notificationDismissed_v1";\n');
const aliases={taxes:'planTaxes',credit:'planCredit',productGoals:'planProductGoals',goal:'planGoal',mobile:'planMobile',notifications:'planNotifications',isMonthClosed:'planIsMonthClosed',resetFinancialData:'planResetFinancialData',searchRecords:'planSearchRecords',openSearchResult:'planOpenSearchResult',debtSources:'planDebtSources',actionItems:'planActionItems'};
for(const [key,value]of Object.entries(aliases))source=source.replaceAll('finance.'+key,'window.'+value);
module.exports=source;
