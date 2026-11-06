const assert=require('node:assert/strict'),vm=require('node:vm');
const {parseSync}=require('rolldown/experimental'),{readExecutableSource}=require('./source-loader.cjs');
(async()=>{
 const {recordText,canonical}=await import('../src/services/finance-sync.ts');
 const source=readExecutableSource('src/services/finance-sync.ts');let declaration;
 function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id?.name==='equal'){declaration=node;return}for(const v of Object.values(node)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v)}}visit(parseSync('sync.js',source).program);assert(declaration);
 let validations=0,canonicalizations=0;
 const context={recordText(value){validations++;return recordText(value)},canonical(value){canonicalizations++;return canonical(value)}};
 vm.createContext(context);vm.runInContext(source.slice(declaration.start,declaration.end),context);
 const envelope={schemaVersion:3,moneyUnit:'centavos',data:{items:[{id:'one',v:1234}],receipts:[],debts:[],splits:[],cart:[],reports:{}}};
 const first=JSON.stringify(envelope),reordered=JSON.stringify({data:envelope.data,moneyUnit:'centavos',schemaVersion:3});
 assert.equal(context.equal(first,first),true);assert.equal(validations,1);assert.equal(canonicalizations,0);
 assert.equal(context.equal(first,reordered),true);assert.equal(canonicalizations,2,'different representations still use semantic comparison');
 assert.equal(context.equal(first,envelope),true);assert.equal(context.equal(first,JSON.stringify({...envelope,data:{...envelope.data,items:[{id:'one',v:1235}]}})),false);
 for(const invalid of ['bad JSON','{}',JSON.stringify({...envelope,data:{...envelope.data,items:null}})])assert.throws(()=>context.equal(invalid,invalid));
 for(const value of ['',null,undefined,0,false])assert.equal(context.equal(value,value),false);
 console.log('PASS snapshot equality: one validation/no sorting for identical strings, semantic comparison preserved, malformed snapshots still rejected');
})().catch(error=>{console.error(error);process.exitCode=1});
