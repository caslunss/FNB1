const assert=require('node:assert/strict');
(async()=>{
 const {decimalCents}=await import('../src/services/money.js');
 for(const [input,want] of [[1.005,101],[1.015,102],[-1.005,-101],['3499.99',349999],['1e-2',1],['1e3',100000]])assert.equal(decimalCents(input),want);
 for(const value of [null,true,'',NaN,Infinity,'1e999','9007199254740993'])assert.throws(()=>decimalCents(value));
 const {normalizeBankTransactions}=await import('../server/taxes/bank.js');
 const base={id:'one',date:'2026-11-04',currencyCode:'BRL',status:'POSTED',type:'DEBIT',amount:-1.005};
 const rows=[base,{...base,id:'two',providerId:'same'},{...base,id:'three',providerId:'same'},null,{...base,id:''},{...base,date:'2026-11-99'},{...base,type:'UNKNOWN'},{...base,amount:''}];
 const result=await normalizeBankTransactions(rows,{id:'account',type:'BANK'},'owner','2026-11');assert.equal(result.rows.length,3);assert.equal(result.excludedCount,5);assert.equal(result.rows[0].cents,101);assert.equal(result.rows[1].id,result.rows[2].id);
 const {subscriptionSummary}=await import('../src/services/subscriptions.js');
 const summary=subscriptionSummary([{id:'a',subscription:true,d:'Serviço próprio',v:10,date:'2026-11-01'},{id:'b',subscription:true,d:'Serviço próprio',v:20,date:'2026-11-30'},{id:'c',subscription:true,d:'Antigo',v:40,date:'2026-10-01'}],'2026-11');assert.equal(summary.totalCents,3000);assert.equal(summary.groups.length,2);assert.equal(summary.groups[0].count,2);assert.equal(summary.groups[1].count,0);
 const {localMonth}=await import('../src/services/dates.js');assert.equal(localMonth({getFullYear:()=>2026,getMonth:()=>9,getDate:()=>31}),'2026-10');
 const {searchProducts}=await import('../server/functions/shopping-search.mjs');const search=await searchProducts('teste',{SERPAPI_API_KEY:'secret'},async()=>Response.json({shopping_results:[null,{title:'Preço malformado',extracted_price:1e30,price:'R$ 1'},{title:'Bom',extracted_price:1.005,price:'R$ 1,005'}]}));assert.equal(search.status,200);assert.equal(search.body.products.length,2);assert.equal(search.body.products[0].priceCents,null);assert.equal(search.body.products[1].priceCents,101);
 const {handle}=await import('../server/functions/shopping.mjs');for(const body of ['{','null','[]']){const response=await handle(new Request('https://app.test',{method:'POST',headers:{Authorization:'Bearer test.jwt'},body}),{},async()=>Response.json({id:'user-'+body}));assert.equal(response.status,400)}
 console.log('PASS auditoria: centavos decimais, importação inválida/IDs, assinaturas reais/futuras, calendário local, SerpApi parcial e payloads inválidos.');
})().catch(e=>{console.error(e);process.exitCode=1});
