import assert from 'node:assert/strict';
import {handle as protectedHandle,publicURL,cleanProduct} from '../server/functions/shopping.mjs';
assert.equal(publicURL('http://localhost/a'),'');assert.equal(publicURL('https://127.0.0.1/a'),'');assert.equal(cleanProduct({name:'X',image:'javascript:1'}).image,'');
// Provider contract tests isolate the separately tested durable quota.
const handle=(req,env,net)=>protectedHandle(req,env,net,async()=>({status:200}));
const req=(action='search',payload={query:'notebook'})=>new Request('https://app.test/api/shopping',{method:'POST',headers:{Authorization:'Bearer test.token'},body:JSON.stringify({action,...payload})});
let id=0;
const mock=(result,status=200)=>async(url)=>{
 if(url.includes('/auth/'))return Response.json({id:'serp-user-'+(++id)});
 const u=new URL(url);assert.equal(u.origin,'https://serpapi.com');assert.equal(u.searchParams.get('engine'),'google_shopping');assert.equal(u.searchParams.get('gl'),'br');assert.equal(u.searchParams.get('q'),'notebook');assert.equal(u.searchParams.get('api_key'),'PRIVATE_SERP');return Response.json(result,{status});
};
assert.equal((await handle(new Request('https://app.test'),{})).status,405);
assert.equal((await handle(new Request('https://app.test',{method:'POST',body:'{}'}),{})).status,401);
assert.equal((await handle(req(),{},mock({}))).status,503);
let r=await handle(req(),{SERPAPI_API_KEY:'PRIVATE_SERP'},mock({shopping_results:[{title:'Notebook',price:'R$ 3.499,99',extracted_price:3499.99,source:'Loja A',product_link:'https://store.example/notebook',thumbnail:'https://store.example/photo'},{title:'Dólar',price:'$10',extracted_price:10,link:'javascript:alert(1)'},{title:'Sem preço'},{title:''}]}));
assert.equal(r.status,200);const text=await r.text();assert(!text.includes('PRIVATE_SERP'));const data=JSON.parse(text);assert.equal(data.products.length,3);assert.equal(data.products[0].priceCents,349999);assert.equal(data.products[0].store,'Loja A');assert.equal(data.products[1].priceCents,null);assert.equal(data.products[1].url,'');
for(const status of [401,403,429,500]){r=await handle(req(),{SERPAPI_API_KEY:'PRIVATE_SERP'},mock({error:'PRIVATE_SERP'},status));assert.equal(r.status,status===429?429:502);assert(!(await r.text()).includes('PRIVATE_SERP'));}
r=await handle(req(),{SERPAPI_API_KEY:'PRIVATE_SERP'},mock({shopping_results:[]}));assert.equal((await r.json()).products.length,0);
assert.equal((await handle(req(),{SERPAPI_API_KEY:'PRIVATE_SERP'},mock({error:'secret'}))).status,502);
assert.equal((await handle(req(),{},async()=>Response.json({id:'anon',is_anonymous:true}))).status,401);
let geminiCalls=0;const gemini=async(url,opts)=>{if(url.includes('/auth/'))return Response.json({id:'gemini-user-'+(++id)});assert(url.includes('generativelanguage.googleapis.com'));assert.equal(opts.headers['x-goog-api-key'],'PRIVATE_GEMINI');geminiCalls++;return Response.json({candidates:[{content:{parts:[{text:'Dica de teste'}]}}]});};
r=await handle(req('behavior',{summary:{month:'2026-11',asOf:'2026-11-03',count:1,totalCents:100,categories:[],weekdays:[],months:[]}}),{GEMINI_API_KEY:'PRIVATE_GEMINI'},gemini);assert.equal(r.status,200);assert.equal(geminiCalls,1);
r=await handle(req('product',{url:'https://store.example/p'}),{},mock({}));assert.equal(r.status,503);
console.log('PASS pesquisa: SerpApi sem Gemini, BRL/centavos, URLs, lojas, resultados vazios, cota, erro sanitizado, login e análise Gemini preservada.');
