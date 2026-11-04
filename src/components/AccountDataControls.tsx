import {errorDetails} from '../services/errors.ts';
import {cloud} from '../services/finance-sync.ts';
import {auth as sessionAuth} from '../services/auth.ts';
import {finance} from '../services/finance-runtime.ts';
import React,{useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FinanceGlassButton as GlassButton,GlassTextField} from './LiquidControls.tsx';

export default function AccountDataControls(){
  const dialog=useRef<HTMLDialogElement>(null!),trigger=useRef<HTMLButtonElement>(null!);
  const [action,setAction]=useState('reset'),[text,setText]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
  const deleting=action==='delete',word=deleting?'EXCLUIR':'ZERAR';
  function open(next:string,event:React.MouseEvent<HTMLButtonElement>){trigger.current=event.currentTarget;setAction(next);setText('');setError('');dialog.current.showModal();}
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(text!==word||busy)return;setBusy(true);setError('');try{
    if(deleting){const auth=sessionAuth;if(!auth.user)throw Error('Entre na sua conta para excluir.');const {data,error}=await auth.client!.functions.invoke('delete-own-account',{body:{confirmation:'EXCLUIR'}});if(error||!data?.deleted)throw Error('Não foi possível excluir a conta. Entre novamente e tente outra vez.');await cloud?.stop();await auth.forgetDeletedAccount();}
    else {const result=await finance.resetFinancialData();setStatus(result);dialog.current.close();}
  }catch(error){setError(errorDetails(error).message||'Não foi possível concluir. Tente novamente.');}finally{setBusy(false);}}
  return <section className="account-data-controls"><h3>Gerenciar dados</h3><div className="settings-actions"><GlassButton type="button" destructive onClick={e=>open('reset',e)}>Zerar dados financeiros</GlassButton>{sessionAuth.user&&<GlassButton type="button" destructive onClick={e=>open('delete',e)}>Excluir conta</GlassButton>}</div><p className="foot" role="status">{status}</p>{createPortal(<dialog ref={dialog} className="account-confirm-dialog" aria-labelledby="accountConfirmTitle" aria-describedby="accountConfirmDescription" onCancel={e=>{if(busy)e.preventDefault()}} onClose={()=>trigger.current?.isConnected&&trigger.current.focus()}><form onSubmit={submit}><h2 id="accountConfirmTitle">{deleting?'Excluir sua conta?':'Zerar seus dados financeiros?'}</h2><p id="accountConfirmDescription">{deleting?'Remove sua conta do aplicativo, seus dados na nuvem, seu usuário, amizades e propostas de divisão. Sua conta Google permanece intacta.':'Remove lançamentos, dívidas, metas, limites, compras planejadas e relatórios. Mantém seu perfil, amigos, propostas compartilhadas e paleta.'}</p><p className="foot">A ação não pode ser desfeita. Backups já baixados e cópias offline em outros aparelhos não são apagados. Exporte um backup antes, se precisar.</p><label className="lg-input te-labeled-field"><span className="lg-input__label">Digite {word} para confirmar</span><GlassTextField><input value={text} onChange={e=>setText(e.target.value)} autoComplete="off" spellCheck={false} disabled={busy} required aria-label={`Digite ${word} para confirmar`}/></GlassTextField></label><p role="alert" className="bad">{error}</p><div className="settings-actions"><GlassButton type="button" disabled={busy} onClick={()=>dialog.current.close()}>Cancelar</GlassButton><GlassButton type="submit" destructive disabled={busy||text!==word}>{busy?'Aguarde…':deleting?'Excluir conta':'Zerar dados'}</GlassButton></div></form></dialog>,document.body)}</section>;
}
