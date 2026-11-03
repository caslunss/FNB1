import config from '../../public/assets/auth-config.json' with {type:'json'};
// Presence checks only: never returns key values or calls paid providers.
export async function handle(req,env=process.env,net=fetch){
 const reply=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(req.method!=='GET')return reply(405,{error:'Método não permitido.'});
 const authorization=req.headers.get('authorization')||'';
 if(!/^Bearer [\w.-]+$/.test(authorization))return reply(401,{error:'Entre com Google para verificar os serviços.'});
 try{
  const response=await net(config.supabaseUrl+'/auth/v1/user',{headers:{apikey:config.supabasePublishableKey,Authorization:authorization},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return reply(401,{error:'Entre novamente.'});
  const user=await response.json();if(!user.id||user.is_anonymous)return reply(401,{error:'Entre com Google.'});
  return reply(200,{authentication:'verified',configuration:{productSearch:!!env.SERPAPI_API_KEY,ai:!!env.GEMINI_API_KEY,investments:!!env.BRAPI_TOKEN,bankConnection:!!((env.PLUGGY_CLIENT_ID||env.CLIENT_ID)&&(env.PLUGGY_CLIENT_SECRET||env.CLIENT_SECRET)),sandbox:env.PLUGGY_SANDBOX==='true'},capabilities:{bankConnection:true,bankTransactionImport:true,affiliateCatalog:false},note:'Configuração presente não comprova chave válida, cota ou faturamento.'});
 }catch{return reply(503,{error:'Não foi possível verificar a sessão. Tente novamente.'});}
}
export default req=>handle(req);
