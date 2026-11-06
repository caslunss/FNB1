const assert=require('node:assert/strict');
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}};
(async()=>{
 const {handle}=await import('../server/functions/investments.mjs');
 const env={BRAPI_TOKEN:'synthetic-test-token'};
 const request=symbol=>new Request('http://localhost/api/investments?symbols='+symbol);
 let quotaCalls=0,networkCalls=0;
 const entered=deferred(),release=deferred();
 const quota=async policy=>{quotaCalls++;assert.deepEqual(policy,{subject:'public-market',operation:'investments',limit:60,seconds:60});entered.resolve();await release.promise;return{status:200}};
 const net=async()=>{networkCalls++;return Response.json({results:[{symbol:'TEST01',price:12.34}]})};
 const first=handle(request('TEST01'),env,net,quota);await entered.promise;
 const second=handle(request('TEST01'),env,net,quota),third=handle(request('TEST01'),env,net,quota);
 release.resolve();
 const responses=await Promise.all([first,second,third]);
 assert.equal(quotaCalls,1);assert.equal(networkCalls,1);
 const payloads=await Promise.all(responses.map(response=>{assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');return response.json()}));
 assert.deepEqual(payloads[0],payloads[1]);assert.deepEqual(payloads[0],payloads[2]);
 assert.equal((await handle(request('TEST01'),env,net,quota)).status,200);assert.equal(quotaCalls,1);assert.equal(networkCalls,1);
 console.log('PASS investments: concurrent identical requests share quota/network and have independent readable response bodies; cache skips quota');

 const errorEntered=deferred(),errorRelease=deferred();let attempts=0;
 const allowed=async()=>({status:200});
 const unstable=async()=>{attempts++;errorEntered.resolve();await errorRelease.promise;throw Error('synthetic upstream failure')};
 const failed=handle(request('TEST02'),env,unstable,allowed);await errorEntered.promise;
 const joined=handle(request('TEST02'),env,unstable,allowed);errorRelease.resolve();
 const failures=await Promise.all([failed,joined]);assert.equal(attempts,1);
 for(const response of failures){assert.equal(response.status,502);assert.match((await response.json()).error,/Não foi possível/)}
 const recovered=await handle(request('TEST02'),env,async()=>{attempts++;return Response.json({results:[]})},allowed);
 assert.equal(recovered.status,200);assert.equal(attempts,2);
 console.log('PASS investments: failed shared requests are removed and a subsequent request can recover');

 let distinctCalls=0;
 const distinctNet=async()=>{distinctCalls++;return Response.json({results:[]})};
 await Promise.all(['TEST03','TEST04'].map(symbol=>handle(request(symbol),env,distinctNet,allowed)));
 assert.equal(distinctCalls,2);
 let denialCalls=0;
 const denied=async()=>{denialCalls++;return{status:429,error:'Limite sintético',retryAfter:15}};
 const noNetwork=async()=>{throw Error('network must not run')};
 const denials=await Promise.all([handle(request('TEST05'),env,noNetwork,denied),handle(request('TEST05'),env,noNetwork,denied)]);
 assert.equal(denialCalls,1);
 for(const response of denials){assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'15');assert.deepEqual(await response.json(),{error:'Limite sintético'})}
 await handle(request('TEST05'),env,noNetwork,denied);assert.equal(denialCalls,2,'denials are not cached');
 const exploding=async()=>{throw Error('synthetic quota rejection')};
 await assert.rejects(handle(request('TEST06'),env,noNetwork,exploding),/synthetic quota rejection/);
 assert.equal((await handle(request('TEST06'),env,distinctNet,allowed)).status,200);
 console.log('PASS investments: distinct queries remain independent; quota denial status/headers preserved and rejected work can retry');
})().catch(error=>{console.error(error);process.exitCode=1});
