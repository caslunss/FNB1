import {taxToday} from '../../src/services/taxes/domain.ts';
import {normalizeBankTransactions} from '../../server/taxes/bank.js';
import config from '../../public/assets/auth-config.json' with {type:'json'};
import {takeQuota} from '../shared/quota.mjs';
import {readLimitedBody,BodySizeError} from '../shared/request-body.mjs';
export const BANK_BUDGETS=Object.freeze({
 connect:Object.freeze({limit:3,seconds:300}),
 verify:Object.freeze({limit:30,seconds:60}),
 accounts:Object.freeze({limit:20,seconds:60}),
 transactions:Object.freeze({limit:60,seconds:60}),
});
let cached,pending;
// Domain handler accepts its policy as a dependency; the HTTP export always binds it.
export async function handle(req,env=process.env,net=fetch,quota){
 const reply=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(req.method!=='POST')return reply(405,{error:'Método não permitido.'});
 try{
  const authorization=req.headers.get('authorization')||'';
  if(!/^Bearer [\w.-]+$/.test(authorization))return reply(401,{error:'Entre com Google para conectar seu banco.'});
  const auth=await net(config.supabaseUrl+'/auth/v1/user',{headers:{apikey:config.supabasePublishableKey,Authorization:authorization},signal:AbortSignal.timeout(10000)});
  if(!auth.ok)return reply(401,{error:'Sua sessão expirou. Entre novamente.'});
  const user=await auth.json();if(!user.id||user.is_anonymous)return reply(401,{error:'Entre com Google para conectar seu banco.'});
  // Keep the legacy UTF-16 character limit; bound transport before decoding.
  const raw=await readLimitedBody(req,2048*4+4);if(raw.length>2048)return reply(413,{error:'Solicitação muito grande.'});
  let input;try{input=raw?JSON.parse(raw):{};}catch{return reply(400,{error:'Solicitação inválida.'});}
  if(!input||typeof input!=='object'||Array.isArray(input))return reply(400,{error:'Solicitação inválida.'});
  const clientId=env.PLUGGY_CLIENT_ID||env.CLIENT_ID,clientSecret=env.PLUGGY_CLIENT_SECRET||env.CLIENT_SECRET;
  if(!clientId||!clientSecret)return reply(503,{error:'Conexão bancária ainda não ativada. Tente novamente mais tarde.'});
  const action=input.action||'connect';
  if(typeof action!=='string'||!Object.hasOwn(BANK_BUDGETS,action))return reply(400,{error:'Ação inválida.'});
  if(action!=='connect'&&!/^[\w-]{1,100}$/.test(input.itemId||''))return reply(400,{error:'Conexão inválida.'});
  if(quota){
   const budget=await quota({subject:user.id,operation:'bank-'+action,...BANK_BUDGETS[action]},env,net);
   if(budget.status!==200)return Response.json({error:budget.error},{status:budget.status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(budget.retryAfter?{'Retry-After':String(budget.retryAfter)}:{})}});
  }
  async function api(path,body,key){const r=await net('https://api.pluggy.ai'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(key?{'X-API-KEY':key}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('pluggy');return r.json();}
  if(!cached||cached.clientId!==clientId||cached.secret!==clientSecret||cached.until<Date.now()){
   pending??=api('/auth',{clientId,clientSecret}).then(data=>{if(!data.apiKey)throw Error('pluggy');return cached={clientId,secret:clientSecret,key:data.apiKey,until:Date.now()+105*60000};}).finally(()=>{pending=null});await pending;
  }
  if(['accounts','transactions'].includes(input.action)){
   if(!/^[\w-]{1,100}$/.test(input.itemId||''))return reply(400,{error:'Conexão inválida.'});
   const item=await api('/items/'+encodeURIComponent(input.itemId),null,cached.key);if(item.clientUserId!==user.id)return reply(403,{error:'Esta conexão não pertence à sua conta.'});
   const result=await api('/accounts?itemId='+encodeURIComponent(input.itemId),null,cached.key),accounts=result.results||[];
   if(input.action==='accounts')return reply(200,{accounts:accounts.filter(a=>a.itemId===input.itemId&&['BANK','CREDIT'].includes(a.type)).map(a=>({id:a.id,name:String(a.name||'Conta').slice(0,100),type:a.type}))});
   const account=accounts.find(a=>a.id===input.accountId&&a.itemId===input.itemId);if(!account)return reply(403,{error:'Conta não pertence à conexão.'});
   const today=taxToday(),month=today.slice(0,7),after=String(input.after||'');if(after.length>2048)return reply(400,{error:'Página inválida.'});
   const params=new URLSearchParams({accountId:account.id,dateFrom:month+'-01',dateTo:today,...(after?{after}:{})});
   const tx=await api('/v2/transactions?'+params,null,cached.key),normalized=await normalizeBankTransactions(tx.results||[],account,user.id,month);let next=null;if(tx.next){const nextParams=new URLSearchParams(String(tx.next).replace(/^\?/,''));next=nextParams.get('after');}
   return reply(200,{...normalized,after:next,month});
  }
  if(input.action==='verify'){
   if(!/^[\w-]{1,100}$/.test(input.itemId||''))return reply(400,{error:'Conexão inválida.'});
   const item=await api('/items/'+encodeURIComponent(input.itemId),null,cached.key);
   if(item.clientUserId!==user.id)return reply(403,{error:'Esta conexão não pertence à sua conta.'});
   return reply(200,{itemId:item.id,status:item.status,bank:String(item.connector?.name||'Banco').slice(0,100)});
  }
  if(input.action&&input.action!=='connect')return reply(400,{error:'Ação inválida.'});
  const data=await api('/connect_token',{options:{clientUserId:user.id,avoidDuplicates:true}},cached.key);
  if(typeof data.accessToken!=='string')throw Error('pluggy');
  return reply(200,{accessToken:data.accessToken,includeSandbox:env.PLUGGY_SANDBOX==='true'});
 }catch(error){if(error instanceof BodySizeError)return reply(413,{error:'Solicitação muito grande.'});return reply(502,{error:'Não foi possível acessar o serviço bancário. Tente novamente.'});}
}
export default req=>handle(req,process.env,fetch,takeQuota);
