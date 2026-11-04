const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const {encodeSharedDebt,decodeSharedDebt}=await import('../src/services/shared-debt.js');
 const debt={version:1,id:'sd-8e59451b-5273-4e59-a0d8-aa043ec12dec',name:'Refeição João <teste>',cents:10001};
 const url=encodeSharedDebt(debt,'https://tefinance.netlify.app/');assert.deepEqual(decodeSharedDebt(new URL(url).hash),debt);assert.equal(new URL(url).search,'');
 for(const cents of [0,-1,1.1,NaN,100000001])assert.throws(()=>encodeSharedDebt({...debt,cents},'https://tefinance.netlify.app/'));
 assert.throws(()=>encodeSharedDebt(debt,'javascript:alert(1)'));for(const hash of ['#debt=aaa','#debt=<script>','#debt='+ 'a'.repeat(4000)])assert.throws(()=>decodeSharedDebt(hash));
 const {searchFinance}=await import('../src/services/search.js');
 const records=[{id:'1',type:'g',name:'Refeição',category:'Alimentação',date:'2026-10-22',cents:10001},{id:'2',type:'i',name:'Salário',category:'Entradas',date:'2026-11-01',cents:500000},{id:'3',type:'d',name:'Dívida sem data',category:'Dívidas',date:'',cents:10001}];
 assert.equal(searchFinance(records,{query:'refeicao'}).total,1);assert.equal(searchFinance(records,{type:'g',category:'Alimentação',min:10001,max:10001}).total,1);assert.equal(searchFinance(records,{from:'2026-11-01'}).total,1);assert.equal(searchFinance(records,{max:10000}).total,0);assert.equal(searchFinance(Array.from({length:150},()=>records[0])).rows.length,100);
 const src=require('./controller-source.cjs');assert(src.includes('sharedRef:SH.sharedRef'));assert(src.includes('sharedRef:x.sharedRef'));assert(!src.includes("$('#globalSearch')"));
 const core=src.split('// FINANCE_CORE\n')[1].split('function tiles(')[0],context=vm.createContext({crypto:require('node:crypto').webcrypto,Date,URL,Blob,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:()=>null},setTimeout(){}});
 vm.runInContext(core,context);context.sharedId=debt.id;const normalized=vm.runInContext("cleanWorkspace({debts:[{n:'Compartilhada',v:100.01,p:1,s:0,sharedRef:sharedId}]}).debts[0]",context);assert.equal(normalized.sharedRef,debt.id);assert.equal(normalized.v,100.01);
 console.log('PASS pesquisa e links: filtros combinados, centavos, acentos, limite de resultados, UTF-8, valores inválidos e referência de duplicação persistida.');
})().catch(e=>{console.error(e);process.exitCode=1});
