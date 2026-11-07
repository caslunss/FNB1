const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {MAIN_AREAS}=await import('../src/services/navigation.ts');
 assert.deepEqual(MAIN_AREAS.map(x=>x.key),['r','d','o','f','a']);
 for(const file of ['api/investments.js','api/market-economy.js','api/market-rates.js','server/functions/investments.mjs','server/functions/market-economy.mjs','server/functions/market-rates.mjs','src/components/InvestmentArea.tsx','src/components/Investments.tsx','src/components/EconomyCard.tsx','src/finance/views/investments.tsx','src/types/investments.ts','public/assets/economy-reference.json'])assert.equal(fs.existsSync(file),false,file);
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(dir+'/'+x.name):[dir+'/'+x.name]);
 for(const file of walk('src').filter(x=>/\.[tj]sx?$/.test(x))){const s=fs.readFileSync(file,'utf8');assert(!/\/api\/(?:investments|market-economy|market-rates)|data-investments-hub|InvestmentArea|CreditInvestments|vCredit/.test(s),file)}
 assert(fs.readFileSync('src/finance/session/primitives.tsx','utf8').includes("'Investimentos'"),'Historical category is retained');
 assert(fs.existsSync('src/components/CreditCards.tsx'),'Credit cards remain active');
 const {handle}=await import('../server/functions/service-status.mjs');let calls=0;
 const response=await handle(new Request('https://app.test/api/service-status',{headers:{authorization:'Bearer test.jwt.signature'}}),{},async()=>{calls++;return Response.json({id:'test-user'})});
 assert.equal(response.status,200);const body=await response.json();assert.equal('investments' in body.configuration,false);assert.equal(body.capabilities.bankConnection,true);assert.equal(calls,1);
 console.log('PASS retirement: five routes, removed market endpoints/assets/components, preserved category/cards and remaining service status');
})().catch(e=>{console.error(e);process.exitCode=1});
