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
 const base=env.SUPABASE_URL||config.supabaseUrl,publicKey=config.supabasePublishableKey;
 const deadline=AbortSignal.timeout(10000),userHeaders={apikey:publicKey,Authorization:authorization};
 try{
  const current=await net(base+'/auth/v1/user',{headers:userHeaders,signal:deadline});if(!current.ok)return reply(401,{error:'Sua sessão expirou. Entre novamente.'});const user=await current.json();if(!uuid(user.id)||user.is_anonymous)return reply(401,{error:'Entre com uma conta para buscar amigos.'});
  const match=await net(base+'/rest/v1/app_usernames?'+new URLSearchParams({username:'eq.'+username,select:'user_id,username',limit:'1'}),{headers:userHeaders,signal:deadline});if(!match.ok)return reply(502,{error:'Não foi possível buscar o usuário.'});const target=(await match.json())[0];if(!target||!uuid(target.user_id))return reply(404,{error:'Usuário não encontrado.'});if(target.user_id===user.id)return reply(400,{error:'Escolha a conta de um amigo.'});
  // Relationship proof uses the caller's JWT and RLS before any privileged Auth request.
  const relation=await net(base+'/rest/v1/app_friends?'+new URLSearchParams({status:'eq.accepted',or:`(and(sender.eq.${user.id},recipient.eq.${target.user_id}),and(sender.eq.${target.user_id},recipient.eq.${user.id}))`,select:'id',limit:'1'}),{headers:userHeaders,signal:deadline});if(!relation.ok)return reply(502,{error:'Não foi possível verificar a amizade.'});if(!(await relation.json()).length)return reply(403,{error:'Adicione esse @usuário e aguarde o aceite antes de importar nome e foto.'});
  const result=await net(base+'/rest/v1/rpc/app_friend_profile',{method:'POST',headers:{...userHeaders,'Content-Type':'application/json'},body:JSON.stringify({p_username:username}),signal:deadline});
  if(!result.ok)return reply(result.status===404?503:502,{error:result.status===404?'A importação de perfis ainda não foi ativada no servidor.':'Não foi possível carregar nome e foto do amigo.'});
  const profile=(await result.json())[0];if(!profile||profile.user_id!==target.user_id||profile.username!==username)return reply(403,{error:'Amizade indisponível. Atualize seus amigos.'});
  const name=String(profile.display_name||'@'+username).trim().slice(0,80),photo=safePhoto(profile.photo);
  return reply(200,{id:target.user_id,username,name,...(photo?{photo}:{})});
 }catch{return reply(503,{error:'Não foi possível carregar o perfil agora. Tente novamente.'})}
}
export default req=>handle(req);
