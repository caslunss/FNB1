import fs from 'node:fs';
const required=['dist/index.html','dist/login.html','vercel.json','server/functions/connect-token.mjs','server/functions/shopping.mjs','server/functions/service-status.mjs','api/connect-token.js','api/taxes.js','public/assets/auth-config.json'];
let failed=false;for(const file of required){const ok=fs.existsSync(file);console.log(`${ok?'OK':'FALTA'} ${file}`);if(!ok)failed=true;}
const config=JSON.parse(fs.readFileSync('public/assets/auth-config.json','utf8'));
if(!config.supabaseUrl?.startsWith('https://')||!config.supabasePublishableKey){console.error('Configuração pública de autenticação incompleta.');failed=true;}
for(const dir of ['src','public','dist','api','server']){const walk=folder=>{for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const path=folder+'/'+entry.name;if(entry.isDirectory())walk(path);else if(/\.(?:js|jsx|ts|tsx|json|html|mjs)$/.test(path)){const text=fs.readFileSync(path,'utf8');if(/sb_secret_[\w-]+|GOCSPX-[\w-]+|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(text)){console.error('REVISAR: possível segredo em '+path);failed=true;}}}};walk(dir);}
console.log('Chaves privadas: configure somente nas variáveis de ambiente da Vercel.');
process.exitCode=failed?1:0;
