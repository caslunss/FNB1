// Financial VM fixtures supply lexical stubs. Expand presentation modules only for those fixtures;
// browser regressions exercise real ESM imports and dependency injection.
const fs=require('node:fs'),path=require('node:path');
let source=fs.readFileSync('src/finance/workspace.js','utf8');
for(const file of fs.readdirSync('src/finance/views')){
 const text=fs.readFileSync(path.join('src/finance/views',file),'utf8');
 for(const match of text.matchAll(/export function (\w+)\(context\)\{\n const \{[^\n]*\}=context;\n([\s\S]*?)\n\}\n\/\/ end-view:\1/g))source=source.replace(`function ${match[1]}(){return render${match[1]}(viewContext);}`,`function ${match[1]}(){${match[2]}\n}`);
}
const calculations=fs.readFileSync('src/finance/calculations.js','utf8');
for(const match of calculations.matchAll(/export function core_(\w+)\(context,\.\.\.args\)\{\n const \{[^\n]*\}=context;\n([\s\S]*?)\n return \1\(\.\.\.args\);\n\}\n\/\/ end-core:\1/g)){
 const pattern=new RegExp('function '+match[1]+'\\([^]*?\\)\\{return core_'+match[1]+'\\(engineContext,\\.\\.\\.arguments\\);\\}');
 source=source.replace(pattern,match[2]);
}
const aliases={taxes:'planTaxes',credit:'planCredit',productGoals:'planProductGoals',goal:'planGoal',mobile:'planMobile',notifications:'planNotifications',isMonthClosed:'planIsMonthClosed',resetFinancialData:'planResetFinancialData',searchRecords:'planSearchRecords',openSearchResult:'planOpenSearchResult',debtSources:'planDebtSources',actionItems:'planActionItems'};
for(const [key,value]of Object.entries(aliases))source=source.replaceAll('finance.'+key,'window.'+value);
module.exports=source;
