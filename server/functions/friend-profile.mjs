import config from '../../public/assets/auth-config.json' with {type:'json'};
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
function safePhoto(value){
 if(typeof value!=='string')return undefined;
 if(value.length<=350000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))return value;
 try{const url=new URL(value);if(value.length<=2048&&url.protocol==='https:'&&!url.username&&!url.password&&(url.hostname==='googleusercontent.com'||url.hostname.endsWith('.googleusercontent.com')))return url.href}catch{}
}
export async function handle(req,env=process.env,net=fetch){
 const reply=(status,data,extra={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
 if(req.method!=='GET')return reply(405,{error:'Método não permitido.'});
 const url=new URL(req.url),origin=req.headers.get('origin');if(origin&&origin!==url.origin)return reply(403,{error:'Origem não permitida.'});
 const username=(url.searchParams.get('username')||'').toLowerCase();if(!/^[a-z0-9_]{3,40}$/.test(username))return reply(400,{error:'Nome de usuário inválido.'});
 const authorization=req.headers.get('authorization')||'';if(!/^Bearer [\w.-]+$/.test(authorization))return reply(401,{error:'Entre com sua conta para buscar amigos.'});
 const base=env.SUPABASE_URL||config.supabaseUrl,publicKey=config.supabasePublishableKey,key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 const deadline=AbortSignal.timeout(10000),userHeaders={apikey:publicKey,Authorization:authorization};
 try{
  const current=await net(base+'/auth/v1/user',{headers:userHeaders,signal:deadline});if(!current.ok)return reply(401,{error:'Sua sessão expirou. Entre novamente.'});const user=await current.json();if(!uuid(user.id)||user.is_anonymous)return reply(401,{error:'Entre com uma conta para buscar amigos.'});
  const match=await net(base+'/rest/v1/app_usernames?'+new URLSearchParams({username:'eq.'+username,select:'user_id,username',limit:'1'}),{headers:userHeaders,signal:deadline});if(!match.ok)return reply(502,{error:'Não foi possível buscar o usuário.'});const target=(await match.json())[0];if(!target||!uuid(target.user_id))return reply(404,{error:'Usuário não encontrado.'});if(target.user_id===user.id)return reply(400,{error:'Escolha a conta de um amigo.'});
  // Relationship proof uses the caller's JWT and RLS before any privileged Auth request.
  const relation=await net(base+'/rest/v1/app_friends?'+new URLSearchParams({status:'eq.accepted',or:`(and(sender.eq.${user.id},recipient.eq.${target.user_id}),and(sender.eq.${target.user_id},recipient.eq.${user.id}))`,select:'id',limit:'1'}),{headers:userHeaders,signal:deadline});if(!relation.ok)return reply(502,{error:'Não foi possível verificar a amizade.'});if(!(await relation.json()).length)return reply(403,{error:'Adicione esse @usuário e aguarde o aceite antes de importar nome e foto.'});
  if(!key)return reply(503,{error:'A busca de nome e foto ainda não está configurada no servidor.'});
  const projection=await net(base+'/rest/v1/app_finance_workspaces?'+new URLSearchParams({user_id:'eq.'+target.user_id,select:'name:record->data->profile->>name,photo:record->data->profile->>friendPhoto',limit:'1'}),{headers:{apikey:key,Authorization:'Bearer '+key},signal:deadline});if(!projection.ok)return reply(502,{error:'Não foi possível carregar o perfil do amigo.'});const shared=(await projection.json())[0]||{};
  const result=await net(base+'/auth/v1/admin/users/'+target.user_id,{headers:{apikey:key,Authorization:'Bearer '+key},signal:deadline});if(!result.ok)return reply(502,{error:'Não foi possível carregar nome e foto do amigo.'});const account=await result.json();if(account.id!==target.user_id)return reply(502,{error:'Perfil do amigo inválido.'});const meta=account.user_metadata||{},name=String(shared.name||meta.full_name||meta.name||'@'+username).trim().slice(0,80),photo=safePhoto(shared.photo)||safePhoto(meta.avatar_url)||safePhoto(meta.picture);
  return reply(200,{id:target.user_id,username,name,...(photo?{photo}:{})});
 }catch{return reply(503,{error:'Não foi possível carregar o perfil agora. Tente novamente.'})}
}
export default req=>handle(req);
