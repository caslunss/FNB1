const assert=require('node:assert/strict');
(async()=>{
 const {finance,getFinanceSnapshot,subscribeFinance,publishFinance}=await import('../src/services/finance-runtime.ts');
 let reads=0,cents=100;finance.taxes={getState:()=>{reads++;return {month:'2026-11',today:'2026-11-04',closedMonths:[],expenses:[{id:'test',description:'Test',cents,date:'2026-11-04',category:'Gastos Essenciais'}]}}};
 const first=getFinanceSnapshot('taxes');assert.equal(getFinanceSnapshot('taxes'),first);assert.equal(reads,1);
 let events=0;const unsubscribe=subscribeFinance(()=>events++);publishFinance();assert.equal(getFinanceSnapshot('taxes'),first,'unchanged data keeps its identity');cents=200;publishFinance();assert.equal(getFinanceSnapshot('taxes').expenses[0].cents,200);assert.notEqual(getFinanceSnapshot('taxes'),first);assert.equal(events,2);unsubscribe();publishFinance();assert.equal(events,2);
 const {installLegacyFinanceAdapter}=await import('../src/services/legacy-finance-adapter.ts');const legacy={};installLegacyFinanceAdapter(legacy);assert.equal(legacy.planTaxes,finance.taxes);legacy.planFinanceChanged();legacy.planFinanceChanged();await new Promise(resolve=>queueMicrotask(resolve));
 const {requestFinancePublish,captureFinanceRegistration}=await import('../src/services/finance-runtime.ts');
 let batched=0;const stop=subscribeFinance(()=>batched++),restore=captureFinanceRegistration();
 requestFinancePublish();requestFinancePublish();await Promise.resolve();assert.equal(batched,1);
 requestFinancePublish();restore();await Promise.resolve();assert.equal(batched,1,'a retired session cannot publish into the next one');stop();
 const isolated={},remove=installLegacyFinanceAdapter(isolated);assert.equal(isolated.planTaxes,finance.taxes);remove();assert.equal(Object.hasOwn(isolated,'planTaxes'),false);
 console.log('PASS finance runtime: stable snapshots, revision invalidation, unsubscribe and compatibility identity');
})().catch(e=>{console.error(e);process.exitCode=1});
