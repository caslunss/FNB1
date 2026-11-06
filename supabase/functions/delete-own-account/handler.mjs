import {readLimitedBody,BodySizeError} from '../../../server/shared/request-body.mjs';
export function createDeleteAccountHandler(createAdmin){
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Content-Type':'application/json'};
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  return async request=>{
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return reply(405,{error:'Método não permitido.'});
    const authorization=request.headers.get('Authorization')||'';
    if(!/^Bearer [\w.-]+$/.test(authorization))return reply(401,{error:'Entre novamente.'});
    try{
      if(Number(request.headers.get('content-length')||0)>256)return reply(413,{error:'Pedido inválido.'});
      const raw=await readLimitedBody(request,256*4+4);if(raw.length>256)return reply(413,{error:'Pedido inválido.'});
      const body=JSON.parse(raw);
      // Identity is always derived from the verified session, never from input.
      if(body.confirmation!=='EXCLUIR'||Object.keys(body).some(k=>k!=='confirmation'))return reply(400,{error:'Confirme a exclusão.'});
      const admin=createAdmin(),jwt=authorization.slice(7);
      const {data,error}=await admin.auth.getUser(jwt);
      if(error||!data?.user?.id)return reply(401,{error:'Entre novamente.'});
      const revoked=await admin.auth.admin.signOut(jwt,'global');
      if(revoked.error)return reply(503,{error:'Não foi possível encerrar suas sessões.'});
      // Cascading foreign keys remove the owning records atomically with the user.
      const removed=await admin.auth.admin.deleteUser(data.user.id);
      if(removed.error)return reply(503,{error:'Não foi possível excluir. Entre novamente para tentar.'});
      return reply(200,{deleted:true});
    }catch(error){if(error instanceof BodySizeError)return reply(413,{error:'Pedido inválido.'});return reply(400,{error:'Pedido inválido ou serviço indisponível.'});}
  };
}
