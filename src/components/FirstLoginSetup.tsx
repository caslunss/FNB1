import {useEffect,useRef,useState,type FormEvent} from 'react';
import {auth} from '../services/auth';
import {finance} from '../services/finance-runtime';
import {moneyText} from '../services/taxes/domain';
import {readProfileAppearance,saveProfileAppearance,prepareProfilePhoto} from '../services/profile-appearance';
import {errorDetails} from '../services/errors';
import {normalizeCreditCard} from '../services/credit';
import PageTransition from './motion/PageTransition';
import {FinanceGlassButton as Button,GlassTextField as Field} from './LiquidControls';

export default function FirstLoginSetup(){
 const dialog=useRef<HTMLDialogElement>(null),state=finance.setup.getState(),appearance=readProfileAppearance(auth.storage);
 const [step,setStep]=useState(0),[name,setName]=useState(appearance.name||state.name||String(auth.user?.user_metadata?.full_name||auth.user?.user_metadata?.name||'').slice(0,60)),[username,setUsername]=useState(state.username),[photo,setPhoto]=useState(appearance.photo||''),[salary,setSalary]=useState(''),[salaryDate,setSalaryDate]=useState(state.today),[addCard,setAddCard]=useState(false),[cardName,setCardName]=useState(''),[limit,setLimit]=useState(''),[closing,setClosing]=useState(''),[due,setDue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[usernameSaved,setUsernameSaved]=useState(false);
 useEffect(()=>{const node=dialog.current;const open=()=>{if(auth.user&&!finance.setup.getState().complete&&!node?.open&&!document.querySelector('dialog[open]'))node?.showModal()};const observer=new MutationObserver(open);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});open();return()=>{observer.disconnect();node?.close()}},[]);
 function close(){dialog.current?.close()}
 async function next(event:FormEvent){event.preventDefault();if(busy)return;setError('');setBusy(true);try{
  if(step===0){await finance.setup.saveUsername(username);saveProfileAppearance(auth.storage,name,photo);dispatchEvent(new Event('plan-profile-appearance-change'));setUsernameSaved(true);setStep(1)}
  else if(step===1){if(salary.trim()&&moneyText(salary)<1)throw Error('Informe um salário maior que zero.');setStep(2)}
  else{
   const card=addCard?normalizeCreditCard({id:'setup-preview',name:cardName,limitCents:moneyText(limit),openingUsedCents:0,closingDay:Number(closing),dueDay:Number(due),active:true}):undefined;
   finance.setup.finish({name,salaryCents:salary.trim()?moneyText(salary):undefined,salaryDate,...(card?{card}:{})});close();
  }
 }catch(e){setError(errorDetails(e).message)}finally{setBusy(false)}}
 function later(){if(busy)return;try{finance.setup.finish({name:name.trim()||'Sua conta'});close()}catch(e){setError(errorDetails(e).message)}}
 return <dialog ref={dialog} className="account-overlay initial-setup" aria-labelledby="initialSetupTitle" onCancel={event=>{event.preventDefault();later()}}>
  <header className="account-progressive-header"><h2 id="initialSetupTitle">Seu primeiro acesso</h2><p className="foot">{step+1} de 3 · {['Perfil','Salário','Cartões'][step]}</p></header>
  <div className="account-panel-body"><PageTransition routeKey={String(step)} initial={false}><form onSubmit={next} className="initial-setup-form" aria-busy={busy}>
   {step===0?<><h3>Como podemos te chamar?</h3><div className="product-goal-fields"><label>Nome de exibição<Field><input value={name} onChange={e=>setName(e.target.value)} required maxLength={60} autoComplete="name"/></Field></label><label>Nome de usuário<Field><input value={username} onChange={e=>setUsername(e.target.value)} required pattern="@?[a-zA-Z0-9_]{3,40}" maxLength={41} autoCapitalize="none" disabled={usernameSaved}/></Field></label></div><p className="foot">Seu @usuário permite receber pedidos de amizade. Uma alteração por mês.</p>{photo&&<img className="initial-setup-photo" src={photo} alt="Prévia da foto"/>}<label>Foto de perfil · opcional<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);try{setPhoto(await prepareProfilePhoto(file));setError('')}catch(err){setError(errorDetails(err).message)}finally{setBusy(false)}}}/></label><p className="foot">Foto salva neste dispositivo · até 2 MB.</p></>:step===1?<><h3>Seu salário fixo</h3>{state.hasSalary?<p>Você já possui salário cadastrado. Ele será preservado.</p>:<><label>Salário mensal (R$) · opcional<Field><input inputMode="decimal" value={salary} onChange={e=>setSalary(e.target.value)}/></Field></label><label>Próximo recebimento<Field><input type="date" value={salaryDate} min={state.today} onChange={e=>setSalaryDate(e.target.value)} required={!!salary.trim()}/></Field></label><p className="foot">Ao concluir, cria 12 recebimentos mensais a partir dessa data. Deixe em branco se não tiver salário fixo.</p></>}</>:<><h3>Seus cartões</h3>{state.hasCards&&<p className="foot">Seus cartões cadastrados serão preservados.</p>}<label className="row"><input type="checkbox" checked={addCard} onChange={e=>setAddCard(e.target.checked)}/>Cadastrar um cartão agora</label>{addCard&&<div className="product-goal-fields"><label>Nome do cartão<Field><input value={cardName} onChange={e=>setCardName(e.target.value)} required maxLength={60}/></Field></label><label>Limite total (R$)<Field><input value={limit} onChange={e=>setLimit(e.target.value)} inputMode="decimal" required/></Field></label><label>Dia de fechamento<Field><input type="number" min={1} max={31} value={closing} onChange={e=>setClosing(e.target.value)} required/></Field></label><label>Dia de vencimento<Field><input type="number" min={1} max={31} value={due} onChange={e=>setDue(e.target.value)} required/></Field></label></div>}<p className="foot">Não informe número, senha ou código de segurança do cartão.</p></>}
   {error&&<p role="alert" className="bad">{error}</p>}
   <div className="ui-toolbar">{step>0&&<Button type="button" disabled={busy} onClick={()=>setStep(step-1)}>Voltar</Button>}<Button type="submit" disabled={busy}>{step===2?'Concluir':'Continuar'}</Button><Button type="button" disabled={busy} onClick={later}>Preencher depois</Button></div>
  </form></PageTransition></div>
 </dialog>;
}
