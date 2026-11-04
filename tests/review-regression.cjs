const {createContext:fixtureContext,renderFixture}=require('./source-loader.cjs');
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=require('./project-source.cjs');
const between=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const line=prefix=>html.split('\n').find(x=>x.startsWith(prefix));
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
(async()=>{
 await test('parcelas calculadas diretamente mantêm centavos, início e pagamentos',()=>{
  const c=fixtureContext({toCents:v=>Math.round(v*100),debtPaidCount:d=>d.paid||0});
  vm.runInContext(line('const dm='),c);
  for(const cents of [1,2,100,10001,99999999])for(const p of [1,2,3,12,240])for(const paid of [0,1,p]){
   c.d={v:cents/100,p,s:2,paid};for(let m=0;m<p+4;m++){
    const j=m-2,expected=j<paid||j<0||j>=p?0:Math.floor(cents/p)+(j<cents%p?1:0);
    assert.equal(Math.round(vm.runInContext(`dm(d,${m})`,c)*100),expected);
   }
  }
 });
 await test('gráfico diário mantém o SVG sem filtrar todos os registros a cada dia',()=>{
  let reads=0;const rows=Array.from({length:10000},(_,i)=>({get date(){reads++;return '2026-'+(i%2?'10':'11')+'-'+String(i%31+1).padStart(2,'0')},v:(i%999+1)/100}));
  const ctx={itemsInMonth:i=>rows.filter(x=>x.date.startsWith(['2026-10','2026-11'][i])),receiptsInMonth:i=>[],S:{m:1,items:rows,receipts:rows},chartMetric:'g',M:['Out/26','Nov/26'],monthKeyForIndex:i=>['2026-10','2026-11'][i],pad:n=>String(n).padStart(2,'0'),toCents:v=>Math.round(v*100),sum:r=>r.reduce((n,x)=>n+Math.round(x.v*100),0)/100};
  const source=between('function dailyBars(){','function contextActivity(){');
  const old=source.replace(/const totals=new Map\s*\(\);[\s\S]*?const current=/,"const series=idx=>{const k=monthKeyForIndex(idx);return Array.from({length:days},(_,i)=>sum(source.filter(x=>x.date===`${k}-${pad(i+1)}`)));};\n const current=");
  const c=fixtureContext(ctx);vm.runInContext(old,c);const before=vm.runInContext('dailyBars()',c),oldReads=reads;reads=0;
  vm.runInContext(source,c);assert.equal(renderFixture(vm.runInContext('dailyBars()',c)),renderFixture(before));assert.ok(reads<=rows.length*4);assert.ok(oldReads>reads*10);
  console.log(`  Leituras de data: ${oldReads} → ${reads} (10 mil registros).`);
 });
 await test('revisões de CSV, compra, formulário e análise impedem recarga automática',()=>{
  const c=fixtureContext({SH:null,csvPreview:null,purchaseReview:null,behaviorLoading:false,document:{querySelector:()=>null,activeElement:{matches:()=>false}}});
  vm.runInContext(line('function hasPendingInteraction()'),c);assert.equal(vm.runInContext('hasPendingInteraction()',c),false);
  for(const name of ['SH','csvPreview','purchaseReview','behaviorLoading']){c[name]={};assert.equal(vm.runInContext('hasPendingInteraction()',c),true);c[name]=null;}
  c.document.querySelector=()=>({});assert.equal(vm.runInContext('hasPendingInteraction()',c),true);
 });
 await test('falha da análise após trocar de tela libera o novo botão e mantém mensagem',async()=>{
  let handler,reject,draws=0;const request=new Promise((_,r)=>reject=r),button={disabled:false,isConnected:true};
  const c=fixtureContext({document:{addEventListener:(event,fn)=>handler=fn},S:{tab:'r'},summaryMode:'behavior',behaviorLoading:false,behaviorError:null,behaviorAdvice:null,behaviorAggregate:()=>({month:'2026-10'}),shoppingRequest:()=>request,draw:()=>draws++});
  vm.runInContext(html.split('\n').find(row=>row.startsWith("document.addEventListener('click',async e=>{const tab=")&&row.includes('[data-summary-mode]')),c);
  const pending=handler({target:{closest:s=>s==='[data-behavior-analyze]'?button:null}});assert.equal(c.behaviorLoading,true);
  button.isConnected=false;reject(Error('Teste de conexão'));await pending;
  assert.equal(c.behaviorLoading,false);assert.equal(draws,1);assert.equal(c.behaviorError.message,'Teste de conexão');
 });
 await test('produto sem preço limpa valor anterior e atualiza simulação',async()=>{
  let handler,updates=0;const fields=Object.fromEntries(['url','name','priceCents','image','specs'].map(k=>['[name='+k+']',{value:k==='url'?'https://example.com/item':k==='priceCents'?'999,90':''}]));
  const status={textContent:''},preview={innerHTML:''},form={isConnected:true,querySelector:s=>s==='[data-product-status]'?status:s==='[data-product-preview]'?preview:fields[s]},button={disabled:false,closest:()=>form};
  const c=fixtureContext({renderView:(node,text)=>node.innerHTML=text,document:{addEventListener:(event,fn)=>handler=fn},safeProductUrl:x=>x,shoppingRequest:async()=>({products:[{name:'Outro produto',priceCents:null,image:'',specs:[]}]}),shoppingMoney:v=>String(v/100),productPreview:()=>'',updatePlanProjection:()=>updates++});
  vm.runInContext(html.split('\n').find(row=>row.startsWith("document.addEventListener('click',async e=>{const button=")&&row.includes('[data-import-product]')),c);
  await handler({target:{closest:()=>button}});assert.equal(fields['[name=priceCents]'].value,'');assert.equal(updates,1);assert.equal(button.disabled,false);assert.match(status.textContent,/Preço não confirmado/);
 });
 console.log(`${passed} cenários adicionais passaram.`);
})().catch(e=>{console.error(e);process.exitCode=1});
