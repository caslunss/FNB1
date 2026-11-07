import {RiCameraLine} from '@remixicon/react';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {publishFriendAppearance} from '../services/friend-profiles';
import {auth} from '../services/auth';
import {finance} from '../services/finance-runtime';
import {moneyText} from '../services/taxes/domain';
import {readProfileAppearance,saveProfileAppearance,prepareProfilePhoto} from '../services/profile-appearance';
import {errorDetails} from '../services/errors';
import {normalizeCreditCard} from '../services/credit';
import PageTransition from './motion/PageTransition';
import {FinanceGlassButton as Button,FinanceGlassCard as Card,FinanceGlassSwitch as Switch,GlassTextField as Field} from './LiquidControls';

export default function FirstLoginSetup(){
 const dialog=useRef<HTMLDialogElement>(null),fileInput=useRef<HTMLInputElement>(null),photoSequence=useRef(0),state=finance.setup.getState(),appearance=readProfileAppearance(auth.storage);
 const [step,setStep]=useState(0),[name,setName]=useState(appearance.name||state.name||String(auth.user?.user_metadata?.full_name||auth.user?.user_metadata?.name||'').slice(0,60)),[username,setUsername]=useState(state.username),[photo,setPhoto]=useState(appearance.photo||''),[salary,setSalary]=useState(''),[salaryDate,setSalaryDate]=useState(state.today),[addCard,setAddCard]=useState(false),[cardName,setCardName]=useState(''),[limit,setLimit]=useState(''),[closing,setClosing]=useState(''),[due,setDue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[usernameSaved,setUsernameSaved]=useState(false);
 useEffect(()=>{const node=dialog.current;const open=()=>{if(auth.user&&!finance.setup.getState().complete&&!node?.open&&!document.querySelector('dialog[open]'))node?.showModal()};const observer=new MutationObserver(open);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});open();return()=>{observer.disconnect();photoSequence.current++;node?.close()}},[]);
 function close(){dialog.current?.close()}
 async function next(event:FormEvent){event.preventDefault();if(busy)return;setError('');setBusy(true);try{
  if(step===0){await finance.setup.saveUsername(username);await publishFriendAppearance(name,photo);saveProfileAppearance(auth.storage,name,photo);dispatchEvent(new Event('plan-profile-appearance-change'));setUsernameSaved(true);setStep(1)}
  else if(step===1){if(salary.trim()&&moneyText(salary)<1)throw Error('Informe um salário maior que zero.');setStep(2)}
  else{
   const card=addCard?normalizeCreditCard({id:'setup-preview',name:cardName,limitCents:moneyText(limit),openingUsedCents:0,closingDay:Number(closing),dueDay:Number(due),active:true}):undefined;
   finance.setup.finish({name,salaryCents:salary.trim()?moneyText(salary):undefined,salaryDate,...(card?{card}:{})});close();
  }
 }catch(e){setError(errorDetails(e).message)}finally{setBusy(false)}}
 function later(){if(busy)return;try{finance.setup.finish({name:name.trim()||'Sua conta'});close()}catch(e){setError(errorDetails(e).message)}}
 async function choosePhoto(file:File|undefined){
  if(!file)return;const token=++photoSequence.current;setBusy(true);setError('');
  try{const prepared=await prepareProfilePhoto(file);if(token===photoSequence.current)setPhoto(prepared)}catch(e){if(token===photoSequence.current)setError(errorDetails(e).message)}finally{if(token===photoSequence.current)setBusy(false)}
 }
 return <dialog ref={dialog} className="account-overlay initial-setup" aria-labelledby="initialSetupTitle" aria-describedby="initialSetupStep" onCancel={event=>{event.preventDefault();later()}}>
  <header className="account-overlay-header account-progressive-header initial-setup-header">
   <div><h2 id="initialSetupTitle">Seu primeiro acesso</h2><p id="initialSetupStep" className="foot">{step+1} de 3 · {['Perfil','Salário','Cartões'][step]}</p></div>
   <Button type="button" className="account-overlay-close" aria-label="Fechar cadastro inicial" disabled={busy} onClick={later}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></Button>
  </header>
  <div className="account-panel-body initial-setup-body"><Card className="card finance-layout-card initial-setup-card"><PageTransition routeKey={String(step)} initial={false}><form onSubmit={next} className="initial-setup-form" aria-busy={busy}>
   {step===0?<>
    <h3>Como podemos te chamar?</h3>
    <div className="profile-editor-photo"><div className="profile-card-photo">{photo?<img src={photo} alt="Prévia da foto"/>:<span className="profile-card-initial" aria-hidden="true">{name.trim().slice(0,1).toUpperCase()||'?'}</span>}</div><Button type="button" className="ib" aria-label="Escolher foto do perfil" disabled={busy} onClick={()=>fileInput.current?.click()}><RiCameraLine aria-hidden="true"/></Button></div>
    <input ref={fileInput} className="sr-only" aria-label="Arquivo da foto do perfil" tabIndex={-1} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';void choosePhoto(file)}}/>
    <div className="product-goal-fields"><label>Nome de exibição<Field><input value={name} onChange={e=>setName(e.target.value)} required maxLength={60} autoComplete="name"/></Field></label><label>Nome de usuário<Field><input value={username} onChange={e=>setUsername(e.target.value)} required pattern="@?[a-zA-Z0-9_]{3,40}" maxLength={41} autoCapitalize="none" disabled={usernameSaved}/></Field></label></div>
    <p className="foot">Seu @usuário permite receber pedidos de amizade. Uma alteração por mês.</p><p className="foot">Nome e foto disponíveis para amigos aceitos · foto até 2 MB.</p>
   </>:step===1?<>
    <h3>Seu salário fixo</h3>{state.hasSalary?<p className="foot">Você já possui salário cadastrado. Ele será preservado.</p>:<>
     <div className="product-goal-fields"><label>Salário mensal (R$) · opcional<Field><input inputMode="decimal" value={salary} onChange={e=>setSalary(e.target.value)}/></Field></label><label>Próximo recebimento<Field><input type="date" value={salaryDate} min={state.today} onChange={e=>setSalaryDate(e.target.value)} required={!!salary.trim()}/></Field></label></div>
     <p className="foot">Ao concluir, cria 12 recebimentos mensais a partir dessa data. Deixe em branco se não tiver salário fixo.</p>
    </>}
   </>:<>
    <h3>Seus cartões</h3>{state.hasCards&&<p className="foot">Seus cartões cadastrados serão preservados.</p>}
    <div className="layout-progress-setting"><span>Cadastrar um cartão agora</span><Switch checked={addCard} disabled={busy} onChange={setAddCard} aria-label="Cadastrar um cartão agora"/></div>
    {addCard&&<div className="product-goal-fields"><label>Nome do cartão<Field><input value={cardName} onChange={e=>setCardName(e.target.value)} required maxLength={60}/></Field></label><label>Limite total (R$)<Field><input value={limit} onChange={e=>setLimit(e.target.value)} inputMode="decimal" required/></Field></label><label>Dia de fechamento<Field><input type="number" min={1} max={31} value={closing} onChange={e=>setClosing(e.target.value)} required/></Field></label><label>Dia de vencimento<Field><input type="number" min={1} max={31} value={due} onChange={e=>setDue(e.target.value)} required/></Field></label></div>}
    <p className="foot">Não informe número, senha ou código de segurança do cartão.</p>
   </>}
   {error&&<p role="alert" className="bad">{error}</p>}
   <footer className="initial-setup-actions"><div className="initial-setup-navigation">{step>0?<Button type="button" disabled={busy} onClick={()=>setStep(step-1)}>Voltar</Button>:<span aria-hidden="true"/>}<Button type="submit" disabled={busy}>{step===2?'Concluir':'Continuar'}</Button></div><Button type="button" disabled={busy} onClick={later}>Preencher depois</Button></footer>
  </form></PageTransition></Card></div>
 </dialog>;
}
