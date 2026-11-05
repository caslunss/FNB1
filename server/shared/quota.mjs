import {recordFailure} from './telemetry.mjs';
import config from '../../public/assets/auth-config.json' with {type:'json'};
export async function takeQuota({subject,operation,limit,seconds},env,net=fetch){
 const key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)return {status:503,error:'Proteção de consultas não configurada no servidor.'};
 try{
  const response=await net((env.SUPABASE_URL||config.supabaseUrl)+'/rest/v1/rpc/app_api_take_budget',{
   method:'POST',headers:{apikey:key,'Content-Type':'application/json',...(key.split('.').length===3?{Authorization:'Bearer '+key}:{})},
   body:JSON.stringify({p_subject:subject,p_operation:operation,p_limit:limit,p_seconds:seconds}),signal:AbortSignal.timeout(5000)});
  if(!response.ok){const requestId=recordFailure('quota',response.status);return {status:503,requestId,error:'Não foi possível verificar o limite de consultas.'};}
  const allowed=await response.json();
  return allowed===true?{status:200}:allowed===false?{status:429,error:'Limite de consultas atingido. Aguarde para tentar novamente.',retryAfter:seconds}:{status:503,error:'Resposta de limite inválida.'};
 }catch{return {status:503,error:'Verificação de limite temporariamente indisponível.'}}
}
