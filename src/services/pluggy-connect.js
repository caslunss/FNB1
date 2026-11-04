let active=false;
async function request(payload){const client=window.planAuth?.client;if(!client||!window.planAuth.user)throw Error('Entre com Google para conectar seu banco.');const {data,error}=await client.auth.getSession();if(error||!data.session?.access_token)throw Error('Entre novamente para conectar seu banco.');const response=await fetch('/api/connect-token',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});let result;try{result=await response.json();}catch{throw Error('Publique o projeto completo com as funções de servidor para ativar esta integração.');}if(!response.ok)throw Error(result.error||'Não foi possível conectar.');return result;}
export async function connectBank(report){
 if(active)return;
 active=true;let root,host,finished=false,verifying=false;
 let disposed=false;
 const cleanup=()=>{if(disposed)return;disposed=true;finished=true;active=false;queueMicrotask(()=>{root?.unmount();host?.remove();});};
 try{
  report('Abrindo conexão segura…');
  const {accessToken,includeSandbox}=await request({action:'connect'});
  const [{PluggyConnect},{createRoot},{createElement}]=await Promise.all([import('react-pluggy-connect'),import('react-dom/client'),import('react')]);
  host=document.createElement('div');host.className='pluggy-connect-host';document.body.append(host);root=createRoot(host);
  root.render(createElement(PluggyConnect,{
   connectToken:accessToken,includeSandbox:includeSandbox===true,
   onClose:()=>{if(!finished&&!verifying){report('');cleanup();}},
   onError:()=>{if(finished||verifying)return;finished=true;report('A conexão não foi concluída. Tente novamente.');cleanup();},
   onSuccess:async (event)=>{const item=event?.item;
    if(verifying||finished)return;verifying=true;
    try{if(!item?.id)throw Error('O serviço não retornou uma conexão válida.');report('Verificando conexão…');const result=await request({action:'verify',itemId:item.id});window.planAuth.storage.setItem('plan12pluggy_connection',JSON.stringify(result));report('Banco conectado: '+result.bank+'. Importe as movimentações pela aba Impostos.');}
    catch(error){report(error.message);}
    finally{finished=true;verifying=false;cleanup();}
   }
  }));
 }catch(error){report(error.message);cleanup();}
}
