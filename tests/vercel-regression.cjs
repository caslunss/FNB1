const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const names=['connect-token','shopping','investments','market-economy','market-rates','service-status','taxes'];
 for(const name of names){
  const {default:entry}=await import('../api/'+name+'.js');
  assert.equal(typeof entry.fetch,'function',name);
  const response=await entry.fetch(new Request('https://finance.vercel.app/api/'+name,{method:'DELETE'}));
  assert(response instanceof Response,name);assert.equal(response.status,405,name);assert.equal(typeof (await response.json()).error,'string');
 }
 const {handleTax}=await import('../server/taxes/handler.js');
 for(const [env,origin] of [[{VERCEL_URL:'preview-test.vercel.app'},'https://preview-test.vercel.app'],[{VERCEL_PROJECT_PRODUCTION_URL:'finance.vercel.app'},'https://finance.vercel.app'],[{APP_ORIGIN:'https://finance.example'},'https://finance.example']]){
  const response=await handleTax(new Request('https://finance.vercel.app/api/taxes',{method:'POST',headers:{Origin:origin},body:'{}'}),env);
  assert.equal(response.status,401,'Origem aceita, mas autenticação obrigatória');assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
 }
 const blocked=await handleTax(new Request('https://finance.vercel.app/api/taxes',{method:'POST',headers:{Origin:'https://evil.vercel.app'},body:'{}'}),{VERCEL_URL:'finance.vercel.app'});assert.equal(blocked.status,403);
 const config=JSON.parse(fs.readFileSync('vercel.json'));assert.equal(config.framework,'vite');assert.equal(config.outputDirectory,'dist');assert(!config.rewrites?.some(x=>x.source==='/(.*)'),'Sem rewrite que capture APIs');
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(dir+'/'+x.name):[dir+'/'+x.name]);
 for(const file of walk('src'))if(/\.(jsx?|tsx?)$/.test(file))assert(!fs.readFileSync(file,'utf8').includes('/.netlify/functions/'),file);
 assert(fs.readFileSync('src/services/taxes/client.js','utf8').includes("fetch('/api/taxes'"));
 assert(fs.readFileSync('src/components/ShareDebt.jsx','utf8').includes("window.location.origin+'/'"),'Compartilhamento fica no domínio atual');
 console.log('PASS Vercel: sete entradas Web Request/Response, métodos, autenticação, origens exatas de produção/preview/domínio próprio, isolamento CORS, endpoints locais e compartilhamento no domínio atual.');
})().catch(error=>{console.error(error);process.exitCode=1});
