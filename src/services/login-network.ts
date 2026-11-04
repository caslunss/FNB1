export function waitWithTimeout<T>(promise:PromiseLike<T>,ms=10000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 return Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('O serviço de acesso demorou a responder. Tente novamente.')),ms)})]).finally(()=>clearTimeout(timer));
}
export function loadGoogleScript(ms=10000){
 if(window.google?.accounts?.id)return Promise.resolve();
 return new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');let timer:ReturnType<typeof setTimeout>|undefined;
  const finish=(error?:Error)=>{clearTimeout(timer);script.onload=null;script.onerror=null;if(error){script.remove();reject(error)}else resolve()};
  script.src='https://accounts.google.com/gsi/client?hl=pt-BR';script.async=true;
  script.onload=()=>finish();script.onerror=()=>finish(Error('Não foi possível carregar o Google.'));
  timer=setTimeout(()=>finish(Error('O Google demorou a responder. Tente novamente.')),ms);
  document.head.append(script);
 });
}
