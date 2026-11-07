const assert=require('node:assert/strict');
(async()=>{
 const {handle}=await import('../server/functions/friend-profile.mjs');
 const me='11111111-1111-4111-8111-111111111111',friend='22222222-2222-4222-8222-222222222222';
 const env={SUPABASE_URL:'https://local.test',SUPABASE_SECRET_KEY:'server-test-key'};
 const req=(user='ana',authorization='Bearer test.jwt.token',method='GET',origin)=>new Request('https://app.test/api/friend-profile?username='+user,{method,headers:{...(authorization?{authorization}:{}),...(origin?{origin}:{})}});
 function transport(options={}){const calls=[];const net=async(url,init)=>{calls.push({url,headers:init.headers});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:me,is_anonymous:!!options.anonymous},{status:options.expired?401:200});
  if(url.includes('/app_usernames?'))return Response.json(options.missing?[]:[{user_id:options.self?me:friend,username:'ana'}]);
  if(url.includes('/app_friends?')){assert.equal(init.headers.Authorization,'Bearer test.jwt.token');assert(url.includes('accepted'));assert(url.includes(me)&&url.includes(friend));return Response.json(options.denied?[]:[{id:'friendship'}])}
  if(url.includes('/app_finance_workspaces?')){assert(url.includes('record-%3Edata-%3Eprofile'));assert(!url.includes('select=record&'));return Response.json([{name:'Ana Silva',photo:options.badPhoto?'javascript:alert(1)':'data:image/png;base64,aGVsbG8='}])}
  if(url.includes('/auth/v1/admin/users/'))return Response.json({id:options.wrong?'33333333-3333-4333-8333-333333333333':friend,email:'private@example.test',user_metadata:{plan_display_name:'Ana Silva',plan_profile_photo:options.badPhoto?'javascript:alert(1)':'data:image/png;base64,aGVsbG8=',name:'Old name',avatar_url:'https://evil.test/track.png'},app_metadata:{role:'private'}});
  throw Error('Unexpected transport '+url);
 };return{net,calls}}
 for(const [options,status] of [[{},200],[{denied:true},403],[{anonymous:true},401],[{expired:true},401],[{missing:true},404],[{self:true},400],[{wrong:true},502]]){const mock=transport(options),res=await handle(req(),env,mock.net);assert.equal(res.status,status);assert.equal(res.headers.get('Cache-Control'),'no-store');const data=await res.json();assert(!JSON.stringify(data).includes('private'));if(status===200)assert.deepEqual(data,{id:friend,username:'ana',name:'Ana Silva',photo:'data:image/png;base64,aGVsbG8='});if([403,401,404,400,429].includes(status))assert(!mock.calls.some(x=>x.url.includes('/admin/')),'No privileged request before authorization/quota');}
 for(const [request,status] of [[req('ana','', 'GET'),401],[req('bad%21'),400],[req('ana','Bearer test','DELETE'),405],[req('ana','Bearer test','GET','https://evil.test'),403]]){let calls=0;assert.equal((await handle(request,env,async()=>{calls++;throw Error()})).status,status);assert.equal(calls,0)}
 const mock=transport({badPhoto:true}),safe=await (await handle(req(),env,mock.net)).json();assert.equal(safe.photo,undefined);
 const noKey=transport();assert.equal((await handle(req(),{},noKey.net)).status,503);assert(!noKey.calls.some(x=>x.url.includes('/admin/')));
 const {validateFriendsLedger,emptyFriendsLedger}=await import('../src/services/friends-ledger.ts');
 const row={id:friend,accountId:friend,username:'ana',name:'Ana',photo:'data:image/png;base64,aGVsbG8='};assert.deepEqual(validateFriendsLedger({...emptyFriendsLedger(),localFriends:[row]}).localFriends,[row]);for(const invalid of [{...row,photo:'javascript:bad'},{...row,photo:'https://evil.test/track.jpg'},{...row,accountId:undefined},{...row,username:'invalid!'}])assert.throws(()=>validateFriendsLedger({...emptyFriendsLedger(),localFriends:[invalid]}));
 console.log('PASS friend profiles: authenticated accepted-only lookup, caller JWT/RLS proof before privileged Auth, projection-only identity, no email/financial leakage, photo validation, manual and linked records');
})().catch(error=>{console.error(error);process.exitCode=1});
