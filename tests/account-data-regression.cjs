const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto;
(async()=>{
 const {createDeleteAccountHandler}=await import('../supabase/functions/delete-own-account/handler.mjs');
 let calls=[],invalid=false,revokeFail=false,deleteFail=false;
 const handler=createDeleteAccountHandler(()=>({auth:{getUser:async jwt=>{calls.push(['verify',jwt]);return invalid?{error:Error('invalid')}:{data:{user:{id:'verified-user'}}}},admin:{signOut:async(jwt,scope)=>{calls.push(['revoke',scope]);return {error:revokeFail?Error('unavailable'):null}},deleteUser:async id=>{calls.push(['delete',id]);return {error:deleteFail?Error('failed'):null}}}}}));
 const req=(body,token='test.jwt',method='POST')=>new Request('https://example.test',{method,headers:token?{Authorization:'Bearer '+token}:{},...(method==='POST'?{body:JSON.stringify(body)}:{})});
 assert.equal((await handler(req({},'', 'POST'))).status,401);assert.equal(calls.length,0);
 assert.equal((await handler(req({confirmation:'EXCLUIR',user_id:'another-user'}))).status,400);assert.equal(calls.length,0);
 invalid=true;assert.equal((await handler(req({confirmation:'EXCLUIR'}))).status,401);assert(!calls.some(x=>x[0]==='delete'));invalid=false;calls=[];
 revokeFail=true;assert.equal((await handler(req({confirmation:'EXCLUIR'}))).status,503);assert(!calls.some(x=>x[0]==='delete'));revokeFail=false;calls=[];
 assert.equal((await handler(req({confirmation:'EXCLUIR'}))).status,200);assert.deepEqual(calls,[['verify','test.jwt'],['revoke','global'],['delete','verified-user']]);
 deleteFail=true;assert.equal((await handler(req({confirmation:'EXCLUIR'}))).status,503);
 const src=fs.readFileSync('src/finance/workspace.js','utf8'),core=src.split('// FINANCE_CORE\n')[1].split('const CI=')[0];
 let fail=false;const storage={};const c=vm.createContext({crypto,Date,URL,Blob,console,document:{querySelector:()=>null},window:{planAuth:{user:null}},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>{if(fail)throw Error('quota');storage[k]=v},removeItem:k=>delete storage[k]},draw(){},setTimeout(){},addEventListener(){}});
 vm.runInContext(core+"\nlet editPlanId='',purchaseReview=null,csvPreview=null,behaviorAdvice=null,behaviorError=null;function renderNotifications(){};S.items=[{id:'a',d:'Teste',v:12,c:'Lazer',p:'Pix',date:'2026-10-22'}];PROFILE.name='Preservar perfil';",c);
 fail=true;await assert.rejects(vm.runInContext('resetFinancialData()',c));assert.equal(vm.runInContext('S.items.length',c),1);
 fail=false;assert.equal(await vm.runInContext('resetFinancialData()',c),'Dados financeiros zerados.');const saved=JSON.parse(storage.plan12workspace_v3);assert.equal(saved.data.items.length,0);assert.equal(saved.data.cart.length,0);assert.deepEqual(saved.data.reports,{});assert.equal(saved.data.profile.name,'Preservar perfil');assert.deepEqual(saved.recovery,[]);
 console.log('PASS conta: confirmação, identidade verificada, revogação antes de excluir, falhas sem sucesso falso e reset financeiro com rollback.');
})().catch(e=>{console.error(e);process.exitCode=1});
