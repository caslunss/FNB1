const assert=require('node:assert/strict');
(async()=>{
 const {handle,BANK_BUDGETS}=await import('../server/functions/connect-token.mjs');
 const {takeQuota}=await import('../server/shared/quota.mjs');
 const env={PLUGGY_CLIENT_ID:'fixture-client',PLUGGY_CLIENT_SECRET:'fixture-only',SUPABASE_SECRET_KEY:'fixture-server-only'};
 for(const action of Object.keys(BANK_BUDGETS))for(const failure of ['http','network','invalid','denied']){
  let authCalls=0,rpcCalls=0;
  const net=async(url,options)=>{
   const path=new URL(url).pathname;
   if(path==='/auth/v1/user'){authCalls++;return Response.json({id:'verified-owner'})}
   assert.equal(path,'/rest/v1/rpc/app_api_take_budget','No Pluggy request is allowed after quota failure');rpcCalls++;
   const input=JSON.parse(options.body);assert.equal(input.p_subject,'verified-owner');assert.equal(input.p_operation,'bank-'+action);
   assert.equal(input.p_limit,BANK_BUDGETS[action].limit);assert.equal(input.p_seconds,BANK_BUDGETS[action].seconds);
   if(failure==='network')throw Error('simulated quota outage');
   if(failure==='http')return Response.json({error:'simulated unavailable RPC'},{status:503});
   return Response.json(failure==='denied'?false:{unexpected:true});
  };
  const request=new Request('https://local.test/api/connect-token',{method:'POST',headers:{Authorization:'Bearer fake.jwt'},body:JSON.stringify({action,itemId:'item',accountId:'account',userId:'untrusted'})});
  const result=await handle(request,env,net,takeQuota);
  assert.equal(result.status,failure==='denied'?429:503,action+': failure closed');
  assert.equal(authCalls,1);assert.equal(rpcCalls,1);
  assert.equal(result.headers.get('Cache-Control'),'no-store');
  if(failure==='denied')assert.equal(result.headers.get('Retry-After'),String(BANK_BUDGETS[action].seconds));
  const body=await result.json();assert.equal(typeof body.error,'string');assert.equal(Object.hasOwn(body,'accessToken'),false);
 }
 console.log('PASS bank quota RPC: four operations, outage/HTTP/invalid response -> 503, deny -> 429, verified subject and no provider calls');
})().catch(error=>{console.error(error);process.exitCode=1});
