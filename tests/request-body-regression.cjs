const assert=require('node:assert/strict');
(async()=>{
 const {readLimitedBody,BodySizeError}=await import('../server/shared/request-body.mjs');
 const encode=text=>new TextEncoder().encode(text);
 function streamed(chunks,{signal,declared}={}){
  let pulls=0,cancelled=false;
  const stream=new ReadableStream({pull(controller){const value=chunks[pulls++];if(value)controller.enqueue(value);else controller.close()},cancel(){cancelled=true}},{highWaterMark:0});
  const headers={Authorization:'Bearer fake.jwt'};if(declared!==undefined)headers['Content-Length']=String(declared);
  return {request:new Request('https://local.test/api',{method:'POST',headers,body:stream,duplex:'half',signal}),stats:()=>({pulls,cancelled})};
 }
 assert.equal(await readLimitedBody(new Request('https://local.test'),0),'');
 const text='\uFEFF{"texto":"ação 🦝 漢字"}',bytes=encode(text);
 const split=streamed([...bytes].map(byte=>Uint8Array.of(byte)));
 assert.equal(await readLimitedBody(split.request,bytes.length),await new Request('https://local.test',{method:'POST',body:text}).text());
 let sample=streamed([new Uint8Array(11),new Uint8Array(1)],{declared:1});
 await assert.rejects(readLimitedBody(sample.request,10),BodySizeError);assert.deepEqual(sample.stats(),{pulls:1,cancelled:true});
 sample=streamed([encode('12345'),encode('67890')]);assert.equal(await readLimitedBody(sample.request,10),'1234567890');
 const abort=new AbortController();let cancelled=false;
 const hanging=new Request('https://local.test',{method:'POST',body:new ReadableStream({pull(){},cancel(){cancelled=true}},{highWaterMark:0}),duplex:'half',signal:abort.signal});
 const pending=readLimitedBody(hanging,100);abort.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(cancelled,true);
 const used=new Request('https://local.test',{method:'POST',body:'x'});await used.text();await assert.rejects(readLimitedBody(used,10),TypeError);

 const {handle:bank}=await import('../server/functions/connect-token.mjs');
 const {handle:shopping}=await import('../server/functions/shopping.mjs');
 const {handleTax}=await import('../server/taxes/handler.js');
 const {createDeleteAccountHandler}=await import('../supabase/functions/delete-own-account/handler.mjs');
 let authCalls=0,adminCalls=0;
 const net=async url=>{assert(String(url).endsWith('/auth/v1/user'),'only fake Auth may be called');authCalls++;return Response.json({id:'verified-owner'})};
 const deletion=createDeleteAccountHandler(()=>{adminCalls++;throw Error('admin must not be constructed for oversized input')});
 const cases=[
  {limit:2048*4+4,run:req=>bank(req,{},net),message:'Solicitação muito grande.'},
  {limit:4096*4+4,run:req=>shopping(req,{},net,()=>{throw Error('quota must not run')}),message:'Consulta muito longa.'},
  {limit:60003,run:req=>handleTax(req,{SUPABASE_URL:'https://local.test',SUPABASE_PUBLIC_KEY:'fake-public',SUPABASE_SERVER_KEY:'fake-server'},net),message:'Documento muito grande.'},
  {limit:256*4+4,run:deletion,message:'Pedido inválido.'},
 ];
 for(const item of cases){sample=streamed([new Uint8Array(item.limit+1),new Uint8Array(1)],{declared:1});const response=await item.run(sample.request);assert.equal(response.status,413);assert.deepEqual(await response.json(),{error:item.message});assert.deepEqual(sample.stats(),{pulls:1,cancelled:true})}
 assert.equal(authCalls,3);assert.equal(adminCalls,0);
 // Preserve UTF-16 limits of existing bank/shopping inputs, not a stricter byte cap.
 let raw=JSON.stringify({padding:'é'.repeat(1950)});sample=streamed([encode(raw)]);assert.equal((await bank(sample.request,{},net)).status,503);
 raw=JSON.stringify({action:'behavior',padding:'é'.repeat(3950)});sample=streamed([encode(raw)]);assert.equal((await shopping(sample.request,{},net,async()=>({status:200}))).status,503);
 const status=JSON.stringify({action:'status',padding:''});raw=JSON.stringify({action:'status',padding:'x'.repeat(60000-status.length)});
 sample=streamed([encode('\uFEFF'+raw)]);assert.equal((await handleTax(sample.request,{SUPABASE_URL:'https://local.test',SUPABASE_PUBLIC_KEY:'fake-public',SUPABASE_SERVER_KEY:'fake-server'},net)).status,200,'the existing 60000 decoded-byte tax limit still accepts a UTF-8 BOM');
 console.log('PASS bounded bodies: four handlers, early cancellation, missing/false length, byte boundaries, split Unicode/BOM, abort, existing statuses/messages and no privileged calls');
})().catch(error=>{console.error(error);process.exitCode=1});
