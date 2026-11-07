const assert=require('node:assert/strict');
(async()=>{
 const {encodeSharedDebt,decodeSharedDebt,sharedDebtMessage}=await import('../src/services/shared-debt.ts');
 const debt={version:1,id:'sd-8e59451b-5273-4e59-a0d8-aa043ec12dec',name:'Almoço de João 🍽️',cents:10001,collector:'Ana Silva'};
 const base='https://finance.example/',url=encodeSharedDebt(debt,base),legacy=base+'#debt='+Buffer.from(JSON.stringify(debt)).toString('base64url');
 assert(url.length<legacy.length*.75,'Compact link should remove at least 25% of the legacy URL');
 assert.deepEqual(decodeSharedDebt(new URL(url).hash),debt);assert.deepEqual(decodeSharedDebt(new URL(legacy).hash),debt);
 const without={version:1,id:debt.id,name:debt.name,cents:debt.cents};assert.deepEqual(decodeSharedDebt(new URL(encodeSharedDebt(without,base)).hash),without);
 for(const cents of [1,99,100,100000000])assert.equal(decodeSharedDebt(new URL(encodeSharedDebt({...debt,cents},base)).hash).cents,cents);
 const message=sharedDebtMessage(debt,url,{remainingCents:20002,details:'Sua parte do almoço, sem a bebida.'});
 assert(message.includes('Ana Silva'));assert(message.includes(debt.name));assert(message.includes('100,01'));assert(message.includes('200,02'));assert(message.includes('sem a bebida'));assert(message.includes('não realiza pagamentos'));assert(message.includes(url));
 assert.throws(()=>sharedDebtMessage(debt,url,{remainingCents:10000}));assert.throws(()=>sharedDebtMessage(without,url));
 for(const collector of ['',42,'a\nb','a'.repeat(121)])assert.throws(()=>encodeSharedDebt({...debt,collector},base));
 for(const payload of [[],['bad','1','Nome'],['A'.repeat(22),'!','Nome'],['A'.repeat(22),'1',42],['A'.repeat(22),'0','Nome']])assert.throws(()=>decodeSharedDebt('#d='+Buffer.from(JSON.stringify(payload)).toString('base64url')));
 console.log('PASS compact debt sharing: UTF-8, legacy compatibility, identical duplicate ID, cent limits, invalid payloads and named/partial-charge detail');
 console.log('Link size:',legacy.length,'→',url.length,'characters');
})().catch(error=>{console.error(error);process.exitCode=1});
