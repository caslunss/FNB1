'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('src/services/auth.js','utf8').replace(/^import[^;]+;/gm,'').replace('export const auth = ','').replace('createClient(', 'supabase.createClient(');
const config=JSON.parse(fs.readFileSync('public/assets/auth-config.json','utf8'));
async function fixture({mode='local',id='user-a',invalid=false,fail=false,transition,exitTransition,logoutError=false,hash=''}={}){
 const local={plan12workspace_v3:'guest-original'},session={'plan12-access':mode,'plan12-guest-name':'Visitante','plan12guest:plan12workspace_v3':'guest-session'},navigation=[];let eventHandler,received,restored=false;
 const storage=o=>({getItem:k=>o[k]??null,setItem:(k,v)=>o[k]=v,removeItem:k=>delete o[k],get length(){return Object.keys(o).length},key:i=>Object.keys(o)[i]});
 const client={auth:{getUser:async()=>({data:{user:invalid?null:{id,email:'test@example.com'}},error:invalid?Error('invalid'):null}),onAuthStateChange:fn=>eventHandler=fn,signInWithIdToken:async args=>{received=args;return {error:invalid?Error('invalid'):null}},signOut:async()=>{eventHandler?.('SIGNED_OUT',null);return {error:logoutError?Error('offline'):null}}}};
 const c={AbortSignal,exitSurface:()=>({finished:exitTransition||Promise.resolve(),restore(){restored=true}}),document:{getElementById:()=>null},window:{localStorage:storage(local),planLoginTransition:transition},sessionStorage:storage(session),location:{hash,replace:x=>navigation.push(x),assign:x=>navigation.push(x)},fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>config}},supabase:{createClient:()=>client}};
 vm.runInNewContext(code,c);await c.window.planAuth.ready;
 return {api:c.window.planAuth,local,session,navigation,eventHandler,get restored(){return restored},get received(){return received}};
}
(async()=>{
 let f=await fixture();assert.equal(f.api.storage.getItem('plan12workspace_v3'),'guest-session');assert.equal(f.api.hasAccess(),true);f.api.storage.setItem('plan12workspace_v3','temporary');assert.equal(f.local.plan12workspace_v3,'guest-original');
 f=await fixture({mode:'account'});assert.equal(f.api.storage.getItem('plan12workspace_v3'),null);f.api.storage.setItem('plan12workspace_v3','account-a');assert.equal(f.local.plan12workspace_v3,'guest-original');assert.equal(f.local['plan12account:user-a:plan12workspace_v3'],'account-a');
 f.api.storage.setItem('plan12appearance','dark');assert.equal(f.local.plan12appearance,'dark');
 await assert.rejects(fixture({mode:'account',invalid:true}));
 await assert.rejects(fixture({mode:'account',fail:true}));
 assert.equal((await fixture({fail:true})).api.storage.getItem('plan12workspace_v3'),'guest-session');
 f=await fixture();await f.api.signIn('test-token','nonce');assert.equal(f.received.nonce,'nonce');assert.equal(f.received.provider,'google');assert.equal(f.session['plan12-access'],'account');assert.deepEqual(f.navigation,['./index.html']);
 f=await fixture({invalid:true});await assert.rejects(f.api.signIn('bad','nonce'));assert.equal(f.navigation.length,0);
 f=await fixture({mode:'account'});await f.api.signOut();assert.equal(f.session['plan12-access'],undefined);assert.throws(()=>f.api.storage.setItem('x','y'));assert.equal(f.local.plan12workspace_v3,'guest-original');
 f=await fixture({mode:'account'});f.eventHandler('SIGNED_OUT',null);assert.throws(()=>f.api.storage.setItem('x','y'));assert.deepEqual(f.navigation,['./login.html']);
 f=await fixture({mode:'none'});assert.equal(f.api.hasAccess(),false);assert.throws(()=>f.api.useLocal(''));f.api.useLocal('Lucas');assert.equal(f.session['plan12-guest-name'],'Lucas');assert.equal(f.api.hasAccess(),true);await f.api.signOut();assert.equal(f.session['plan12guest:plan12workspace_v3'],undefined);
 let release;f=await fixture({transition:()=>new Promise(resolve=>release=resolve)});await f.api.signIn('test-token','nonce');assert.equal(f.navigation.length,0);release();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.navigation,['./index.html']);
 f=await fixture({transition:()=>Promise.reject(Error('animation failed'))});f.api.useLocal('Teste');await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.navigation,['./index.html']);
 let exitRelease;f=await fixture({mode:'account',exitTransition:new Promise(resolve=>exitRelease=resolve)});const leaving=f.api.signOut();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.navigation.length,0,'SIGNED_OUT aguarda saída visual');exitRelease();await leaving;assert.deepEqual(f.navigation,['./login.html']);
 f=await fixture({mode:'account',logoutError:true});await assert.rejects(f.api.signOut());assert(f.restored);assert.equal(f.navigation.length,0);assert.equal(f.api.hasAccess(),true);
 f=await fixture({hash:'#debt=test'});assert.equal(f.session['plan12-pending-debt'],'#debt=test');
 f=await fixture({hash:'#debt='+ 'a'.repeat(4000)});assert.equal(f.session['plan12-pending-debt'],undefined);
 console.log('PASS 17 cenários: sessão validada, rejeição de login inválido, nonce, isolamento local, preservação dos dados, expiração, logout e acesso local offline.');
})().catch(e=>{console.error(e);process.exitCode=1});
