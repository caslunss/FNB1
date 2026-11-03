import {normalizeInput,fingerprint,validDay,taxToday} from '../../src/services/taxes/domain.js';
import {calculate,TaxError} from './ibpt.js';
const allowed=['https://tefinance.netlify.app','https://plan-desktop-lucas.silverelk9.chatgpt.site','http://terminal.local:4173'];
export async function handleTax(req,env,net=fetch){
 const origins=[...allowed];
 for(const value of [env.APP_ORIGIN,...[env.VERCEL_PROJECT_PRODUCTION_URL,env.VERCEL_URL].filter(Boolean).map(x=>'https://'+x)]){try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/')origins.push(url.origin)}catch{}}
 const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin',...(origins.includes(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
 const reply=(status,body,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});
 if(origin&&!origins.includes(origin))return reply(403,{error:'Origem não permitida.'});if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply(405,{error:'Método não permitido.'});
 try{
  const auth=req.headers.get('authorization')||'';if(!/^Bearer [\w.-]+$/.test(auth))throw new TaxError('Entre para sincronizar os impostos.',401);
  if(!env.SUPABASE_URL||!env.SUPABASE_PUBLIC_KEY||!env.SUPABASE_SERVER_KEY)throw new TaxError('Servidor tributário ainda não configurado.',503);
  const ur=await net(env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:env.SUPABASE_PUBLIC_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});if(!ur.ok)throw new TaxError('Sua sessão expirou. Entre novamente.',401);const user=await ur.json();if(!user.id||user.is_anonymous)throw new TaxError('Entre com uma conta para sincronizar.',401);
  const text=await req.text();if(new TextEncoder().encode(text).length>60000)throw new TaxError('Documento muito grande.',413);let data;try{data=JSON.parse(text)}catch{throw new TaxError('Solicitação inválida.')}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new TaxError('Solicitação inválida.');
  async function db(table,query='',options={},admin=true){const key=admin?env.SUPABASE_SERVER_KEY:env.SUPABASE_PUBLIC_KEY;const response=await net(env.SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:''),{...options,headers:{apikey:key,...(!admin?{Authorization:auth}:key.split('.').length===3?{Authorization:'Bearer '+key}:{}),'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new TaxError(response.status===409?'Os dados mudaram. Atualize antes de salvar.':'Não foi possível salvar a análise.',response.status===409?409:502);return response.status===204?null:response.json();}
  const owner='user_id=eq.'+encodeURIComponent(user.id);
  if(data.action==='status')return reply(200,{ibpt:!!(env.IBPT_TOKEN&&env.IBPT_CNPJ),storage:true});
  if(data.action==='list'){const rows=await db('app_tax_records',owner+'&select=item_id,record,revision&limit=10000',{},false);return reply(200,{records:rows.map(x=>({...x.record,revision:Number(x.revision)}))});}
  if(data.action==='clear'){await db('app_tax_records',owner,{method:'DELETE'});return reply(200,{ok:true});}
  if(data.action==='import-metadata'){
   if(!Array.isArray(data.items)||data.items.length>100)throw new TaxError('Importe até 100 compras por vez.');
   const workspace=(await db('app_finance_workspaces',owner+'&select=record',{},false))[0]?.record,existing=await db('app_tax_records',owner+'&select=item_id'),known=new Set(existing.map(x=>x.item_id)),today=taxToday(new Date(),env.TAX_TIME_ZONE||'America/Sao_Paulo'),batch=[];
   for(const meta of data.items){if(!/^of-[a-f0-9]{32}$/.test(meta.id||''))throw new TaxError('Movimentação inválida.');if(known.has(meta.id))continue;const item=workspace?.data?.items?.find(x=>String(x.id)===meta.id);if(!item||!Number.isSafeInteger(item.v)||item.v<1||!validDay(item.date)||item.date>today||item.date.slice(0,7)!==today.slice(0,7)||workspace.data.reports?.[item.date.slice(0,7)])throw new TaxError('Sincronize as compras do mês aberto antes de analisar.',409);if(item.c==='Investimentos')continue;
    const expense={id:String(item.id),description:item.d,cents:item.v,date:item.date,category:item.c},input=normalizeInput({uf:meta.uf||'',merchantCnpj:meta.merchantCnpj||'',cnae:meta.cnae||'',items:[]},expense.cents),record={itemId:expense.id,fingerprint:fingerprint(expense),input,source:'open_finance',date:expense.date,description:expense.description,updatedAt:new Date().toISOString(),calculation:{method:'ibpt_item',status:'pending',confidence:'item',baseCents:expense.cents,coveredCents:0,totalCents:null,pending:[{reason:'Adicione o documento ou classifique os itens para estimar.'}]}};
    batch.push({user_id:user.id,item_id:expense.id,record,revision:1});known.add(meta.id);
   }
   if(batch.length)await db('app_tax_records','',{method:'POST',body:JSON.stringify(batch)});return reply(200,{saved:batch.length});
  }
  if(!['save','delete'].includes(data.action)||!/^[-\w]{1,100}$/.test(String(data.itemId||'')))throw new TaxError('Ação inválida.');
  const selector=owner+'&item_id=eq.'+encodeURIComponent(data.itemId),existing=(await db('app_tax_records',selector+'&select=record,revision'))[0];
  if((existing?Number(existing.revision):0)!==data.expectedRevision)throw new TaxError('A análise mudou em outro dispositivo. Atualize.',409);
  if(data.action==='delete'){if(existing){if(existing.record.date?.slice(0,7)!==taxToday(new Date(),env.TAX_TIME_ZONE||'America/Sao_Paulo').slice(0,7))throw new TaxError('Período somente para visualização.',409);const deleted=await db('app_tax_records',selector+'&revision=eq.'+existing.revision,{method:'DELETE',headers:{Prefer:'return=representation'}});if(!deleted?.length)throw new TaxError('A análise mudou. Atualize.',409);}return reply(200,{ok:true});}
  // Read the canonical, owner-scoped financial snapshot. Never trust a price from the browser.
  const workspace=(await db('app_finance_workspaces',owner+'&select=record',{},false))[0]?.record;
  const item=workspace?.data?.items?.find(x=>String(x.id)===String(data.itemId));if(!item||!validDay(item.date)||!Number.isSafeInteger(item.v)||item.v<1)throw new TaxError('Sincronize o gasto antes de analisar.',409);
  if(item.c==='Investimentos')throw new TaxError('Este painel analisa consumo, não tributação de investimentos.');
  const today=taxToday(new Date(),env.TAX_TIME_ZONE||'America/Sao_Paulo');if(item.date>today||item.date.slice(0,7)<today.slice(0,7)||workspace.data.reports?.[item.date.slice(0,7)])throw new TaxError('Mês encerrado ou compra futura: somente visualização.',409);
  const expense={id:String(item.id),description:item.d,date:item.date,cents:item.v,category:item.c};
  const input=normalizeInput(data.input,expense.cents);if(input.documentTotalCents===null&&input.items.some(x=>x.code)){const budget=await db('rpc/app_tax_take_budget','',{method:'POST',body:JSON.stringify({p_user_id:user.id})});if(!budget)throw new TaxError('Limite de análises por hora atingido.',429,'3600');}
  const cache={async get(key,day){const rows=await db('app_tax_rate_cache','cache_key=eq.'+encodeURIComponent(key)+'&valid_from=lte.'+day+'&valid_until=gte.'+day+'&checked_at=gte.'+encodeURIComponent(new Date(Date.now()-24*3600000).toISOString())+'&order=checked_at.desc&limit=1');return rows[0]?.payload},async set(key,r){await db('app_tax_rate_cache','on_conflict=cache_key,version',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({cache_key:key,valid_from:r.validFrom,valid_until:r.validUntil,version:r.version,payload:r,checked_at:new Date().toISOString()})})}};
  const profile=async(cnae,uf,day)=>{const rows=await db('app_tax_activity_profiles',`cnae=eq.${cnae}&uf=eq.${uf}&enabled=eq.true&valid_from=lte.${day}&valid_until=gte.${day}&limit=2`);return rows.length===1?rows[0]:null};
  const calculation=await calculate(input,expense,{env,net,cache,profile});

  const record={itemId:expense.id,fingerprint:fingerprint(expense),input,calculation,source:expense.id.startsWith('of-')?'open_finance':'manual',date:expense.date,description:expense.description,updatedAt:new Date().toISOString()};
  const revision=existing?Number(existing.revision)+1:1;
  if(existing){const result=await db('app_tax_records',selector+'&revision=eq.'+existing.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({record,revision,updated_at:record.updatedAt})});if(!result.length)throw new TaxError('A análise mudou. Atualize.',409);}else await db('app_tax_records','',{method:'POST',body:JSON.stringify({user_id:user.id,item_id:expense.id,record,revision})});
  return reply(200,{record:{...record,revision}});
 }catch(e){const known=e instanceof TaxError;return reply(known?e.status:400,{error:known?e.message:e.message?.includes('Valor')||e.message?.includes('itens')||e.message?.includes('tribut')?e.message:'Confira as informações da compra e tente novamente.'},known&&e.retryAfter?{'Retry-After':e.retryAfter}:{});}
}
