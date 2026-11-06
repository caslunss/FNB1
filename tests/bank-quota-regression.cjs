const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {handle,BANK_BUDGETS}=await import('../server/functions/connect-token.mjs');
 const {takeQuota}=await import('../server/shared/quota.mjs');
 const request=(action,extra={})=>new Request('https://local.test/api/connect-token',{method:'POST',headers:{Authorization:'Bearer fake.jwt'},body:JSON.stringify({action,itemId:'item',accountId:'account',...extra})});
 const env={PLUGGY_CLIENT_ID:'quota-fixture',PLUGGY_CLIENT_SECRET:'quota-fixture-secret'};
 let calls=[],budgets=[];
 const net=async url=>{url=String(url);calls.push(url);if(url.endsWith('/auth/v1/user'))return Response.json({id:'verified-owner'});if(url.endsWith('/auth'))return Response.json({apiKey:'fake-api-key'});if(url.includes('/items/'))return Response.json({id:'item',clientUserId:'verified-owner'});if(url.includes('/accounts?'))return Response.json({results:[{id:'account',itemId:'item',type:'BANK',name:'Teste'}]});if(url.includes('/transactions?'))return Response.json({results:[]});if(url.endsWith('/connect_token'))return Response.json({accessToken:'fake-connect-token'});throw Error('unexpected simulated request')};
 const denied=async input=>{budgets.push(input);return{status:429,error:'Limite de consultas atingido.',retryAfter:input.seconds}};
 for(const action of ['connect','verify','accounts','transactions']){
  calls=[];const response=await handle(request(action,{userId:'untrusted-owner'}),env,net,denied);
  assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),String(BANK_BUDGETS[action].seconds));assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(calls.length,1,'quota denial makes no Pluggy calls');
  assert.deepEqual(budgets.at(-1),{subject:'verified-owner',operation:'bank-'+action,...BANK_BUDGETS[action]});
 }
 calls=[];let r=await handle(request('connect'),env,net,async()=>({status:503,error:'Proteção indisponível.'}));assert.equal(r.status,503);assert.equal(calls.length,1);
 r=await handle(request('bad-action'),env,net,()=>{throw Error('must not take quota')});assert.equal(r.status,400);
 r=await handle(new Request('https://local.test/api/connect-token',{method:'POST'}),env,()=>{throw Error('must not authenticate')},denied);assert.equal(r.status,401);
 const used=new Map(),shared=async input=>{const key=input.subject+':'+input.operation,n=(used.get(key)||0)+1;used.set(key,n);return n<=input.limit?{status:200}:{status:429,error:'Limite',retryAfter:input.seconds}};
 for(let i=0;i<3;i++){r=await handle(request('connect'),env,net,shared);assert.equal(r.status,200)}
 r=await handle(request('connect'),env,net,shared);assert.equal(r.status,429);
 r=await handle(request('verify'),env,net,shared);assert.equal(r.status,200,'verification has its own budget');
 // Exercise the existing durable RPC adapter only against a fake transport.
 const rpc=[];const quota=async input=>takeQuota(input,{SUPABASE_SECRET_KEY:'fake-server-key'},async(url,options)=>{rpc.push(JSON.parse(options.body));return Response.json(true)});
 r=await handle(request('accounts'),env,net,quota);assert.equal(r.status,200);assert.equal(rpc[0].p_operation,'bank-accounts');assert.equal(rpc[0].p_subject,'verified-owner');
 const entry=fs.readFileSync('server/functions/connect-token.mjs','utf8');assert.match(entry,/export default req=>handle\(req,process\.env,fetch,takeQuota\)/,'the actual HTTP entry always uses the durable quota policy');
 const {spawnSync}=require('node:child_process');
 const child=spawnSync(process.execPath,['--input-type=module','-e',`
  import assert from 'node:assert/strict';let calls=0;
  globalThis.fetch=async url=>{calls++;if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'owner'});throw Error('External transport is forbidden')};
  const {default:entry}=await import('./api/connect-token.js');
  const response=await entry.fetch(new Request('https://local.test/api/connect-token',{method:'POST',headers:{Authorization:'Bearer fake.jwt'},body:'{}'}));
  assert.equal(response.status,503);assert.equal(calls,1);
 `],{env:{PLUGGY_CLIENT_ID:'http-fixture',PLUGGY_CLIENT_SECRET:'http-fixture-only'},encoding:'utf8'});
 assert.equal(child.status,0,child.stderr);
 console.log('PASS bank quota: verified identity, four independent policies, denial before Pluggy, Retry-After, failure closed, invalid input, allowed flow and existing RPC adapter');
})().catch(error=>{console.error(error);process.exitCode=1});
