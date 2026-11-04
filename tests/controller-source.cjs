// Expand injected selectors/presentation only for lexical VM fixtures. Browser
// regressions exercise the real ESM graph, registry and React rendering.
const fs=require('node:fs'),path=require('node:path');
const {readExecutableSource}=require('./source-loader.cjs');
const {parseSync}=require('rolldown/experimental');
let source=readExecutableSource('src/finance/workspace.tsx');
for(const file of fs.readdirSync('src/finance/views')){
 const text=readExecutableSource(path.join('src/finance/views',file));
 for(const node of parseSync(file.replace(/tsx$/,'js'),text).program.body){
  const declaration=node.type==='ExportNamedDeclaration'?node.declaration:null;
  if(declaration?.type!=='FunctionDeclaration')continue;
  const name=declaration.id.name,body=declaration.body,first=body.body[0];
  if(first?.type!=='VariableDeclaration')throw Error('Missing injected view context: '+name);
  const implementation=text.slice(first.end,body.end-1);
  source=source.replace(`function ${name}(){return render${name}(viewContext);}`,`function ${name}(){${implementation}\n}`);
 }
}
const calculations=readExecutableSource('src/finance/calculations.ts');
for(const match of calculations.matchAll(/export function core_(\w+)\(context\s*,\.\.\.args\s*\)\{\n const \{[^\n]*\}=context;\n([\s\S]*?)\n return \1\(\.\.\.args\);\n\}\n\/\/ end-core:\1/g)){
 const pattern=new RegExp('function '+match[1]+'\\([^]*?\\)\\{return core_'+match[1]+'\\(engineContext,[^)]*\\);\\}');
 source=source.replace(pattern,match[2]);
}
source=source.replace('// FINANCE_CORE\n','// FINANCE_CORE\nconst DISMISSED_NOTIFICATIONS_KEY="plan12notificationDismissed_v1";\n');
const aliases={taxes:'planTaxes',credit:'planCredit',productGoals:'planProductGoals',goal:'planGoal',mobile:'planMobile',notifications:'planNotifications',isMonthClosed:'planIsMonthClosed',resetFinancialData:'planResetFinancialData',searchRecords:'planSearchRecords',openSearchResult:'planOpenSearchResult',debtSources:'planDebtSources',actionItems:'planActionItems'};
for(const [key,value]of Object.entries(aliases))source=source.replaceAll('finance.'+key,'window.'+value);
module.exports=source;
