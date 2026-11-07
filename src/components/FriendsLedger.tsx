import {useEffect,useRef,useState,type FormEvent} from 'react';
import {useFinanceSnapshot} from '../services/use-finance';
import {finance} from '../services/finance-runtime';
import {friendBalance} from '../services/friends-ledger';
import {auth} from '../services/auth';
import {lookupFriendProfile,type FriendProfile} from '../services/friend-profiles';
import {prepareProfilePhoto} from '../services/profile-appearance';
import {moneyText} from '../services/taxes/domain';
import {errorDetails} from '../services/errors';
import {FinanceGlassCard as Card,FinanceGlassButton as Button,GlassTextField as Field} from './LiquidControls';
const money=(cents:number)=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function Avatar({name,photo}:{name:string;photo?:string}){
 const [failed,setFailed]=useState('');
 return <span className="friend-avatar" aria-hidden="true">{photo&&failed!==photo?<img src={photo} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(photo)}/>:<span>{name.trim().slice(0,1).toUpperCase()||'?'}</span>}</span>;
}
export default function FriendsLedger(){
 const state=useFinanceSnapshot('friends');
 const [editing,setEditing]=useState(''),[name,setName]=useState(''),[photo,setPhoto]=useState(''),[username,setUsername]=useState(''),[linked,setLinked]=useState<FriendProfile>(),[initial,setInitial]=useState('');
 const [person,setPerson]=useState(''),[description,setDescription]=useState(''),[amount,setAmount]=useState(''),[source,setSource]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [profiles,setProfiles]=useState<Record<string,FriendProfile>>({});
 const pending=state.people.filter(friend=>!friend.local&&friend.username&&!state.ledger.localFriends.some(contact=>contact.accountId===friend.accountId)).map(friend=>friend.username).join(',');
 useEffect(()=>{if(!auth.user||!pending)return;const controller=new AbortController(),userId=auth.user.id;void(async()=>{for(const username of pending.split(',')){if(controller.signal.aborted)break;try{const profile=await lookupFriendProfile(username,controller.signal);if(!controller.signal.aborted&&auth.user?.id===userId)setProfiles(previous=>({...previous,[profile.id]:profile}))}catch{/* Initials remain available when the remote profile cannot be loaded. */}}})();return()=>controller.abort()},[pending]);
 const people=state.people.map(friend=>{const profile=friend.accountId?profiles[friend.accountId]:undefined;return profile&&!state.ledger.localFriends.some(contact=>contact.id===friend.id)?{...friend,name:profile.name,photo:profile.photo}:friend});
 const request=useRef<AbortController|null>(null),sequence=useRef(0),fileInput=useRef<HTMLInputElement>(null);
 useEffect(()=>()=>{request.current?.abort();sequence.current++},[]);
 function reset(){setEditing('');setName('');setPhoto('');setUsername('');setLinked(undefined);setInitial('')}
 async function importProfile(){
  request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError('');
  try{const profile=await lookupFriendProfile(username,controller.signal);if(controller.signal.aborted)return;setLinked(profile);setUsername(profile.username);setName(profile.name);setPhoto(profile.photo||'');setNotice('Nome e foto importados. Salve o cadastro para concluir.')}
  catch(e){if(!controller.signal.aborted)setError(errorDetails(e).message)}finally{if(!controller.signal.aborted)setBusy(false)}
 }
 async function choosePhoto(file:File|undefined){
  if(!file)return;const token=++sequence.current;setBusy(true);setError('');
  try{const prepared=await prepareProfilePhoto(file);if(token===sequence.current)setPhoto(prepared)}catch(e){if(token===sequence.current)setError(errorDetails(e).message)}finally{if(token===sequence.current)setBusy(false)}
 }
 function add(event:FormEvent){
  event.preventDefault();if(busy)return;
  try{
   const current=finance.friends.getState(),cents=initial.trim()?moneyText(initial):0;
   if(initial.trim()&&cents<1)throw Error('Informe um valor maior que zero.');
   if(username.trim()&&(!linked||linked.username!==username.trim().replace(/^@/,'').toLowerCase()))throw Error('Busque o @usuário para confirmar o vínculo ou deixe esse campo em branco.');
   const previous=linked?current.ledger.localFriends.find(friend=>friend.accountId===linked.id):undefined;
   if(previous&&previous.id!==editing)throw Error('Esse @usuário já possui cadastro. Use Editar cadastro.');
   const id=editing&&!linked&&!editing.startsWith('local-')?'local-'+crypto.randomUUID():editing||linked?.id||'local-'+crypto.randomUUID();
   const record={id,name,...(photo?{photo}:{}),...(linked?{accountId:linked.id,username:linked.username}:{})};
   const receivables=current.ledger.receivables.map(row=>row.friendId===editing||linked&&row.friendId===linked.id?{...row,friendId:id}:row);
   finance.friends.saveLedger({...current.ledger,localFriends:[...current.ledger.localFriends.filter(friend=>friend.id!==id&&friend.id!==editing),record],receivables:[...receivables,...(cents?[{id:crypto.randomUUID(),friendId:id,description:'Valor a receber',cents,paid:false}]:[])]});
   reset();setError('');setNotice('Cadastro de amigo salvo.');
  }catch(e){setError(errorDetails(e).message)}
 }
 function assign(event:FormEvent){
  event.preventDefault();try{
   const current=finance.friends.getState(),cents=moneyText(amount),debt=current.debts.find(row=>row.id===source);
   if(source&&(!debt||cents>debt.cents))throw Error('Revise o saldo da dívida selecionada.');
   if(source&&current.ledger.receivables.some(row=>row.friendId===person&&row.sourceDebtId===source&&!row.paid))throw Error('Esta dívida já está atribuída a esse amigo.');
   finance.friends.saveLedger({...current.ledger,receivables:[...current.ledger.receivables,{id:crypto.randomUUID(),friendId:person,description,cents,paid:false,...(source?{sourceDebtId:source}:{})}]});
   setAmount('');setDescription('');setSource('');setError('');setNotice('Valor atribuído ao amigo.');
  }catch(e){setError(errorDetails(e).message)}
 }
 const total=friendBalance(state.ledger);
 return <div className="friends-ledger">
  <Card className="card finance-layout-card friend-registration"><h2>Cadastro de amigo</h2>
   <form onSubmit={add} className="friend-form" aria-busy={busy}>
    <div className="friend-photo-editor"><Avatar name={name} photo={photo}/><Button type="button" disabled={busy} onClick={()=>fileInput.current?.click()}>Escolher foto</Button><input ref={fileInput} className="sr-only" aria-label="Arquivo da foto do amigo" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';void choosePhoto(file)}}/>{photo&&<Button type="button" disabled={busy} onClick={()=>setPhoto('')}>Remover foto</Button>}</div>
    <label>Nome<Field><input value={name} onChange={e=>setName(e.target.value)} required maxLength={80} disabled={busy}/></Field></label>
    <div className="friend-username"><label>@usuário · opcional<Field><input value={username} onChange={e=>{setUsername(e.target.value);setLinked(undefined)}} maxLength={41} autoCapitalize="none" disabled={busy}/></Field></label><Button type="button" disabled={busy||!username.trim()} onClick={()=>void importProfile()}>Usar perfil</Button></div>
    <p className="foot">Vincule um @usuário aceito para importar o perfil. Sem vínculo, o cadastro é só seu. Foto até 2 MB.</p>
    <label>Quanto te deve (R$) · opcional<Field><input value={initial} onChange={e=>setInitial(e.target.value)} inputMode="decimal" disabled={busy}/></Field></label>
    <div className="ui-toolbar"><Button type="submit" disabled={busy}>{editing?'Salvar cadastro':'Cadastrar amigo'}</Button>{editing&&<Button type="button" disabled={busy} onClick={reset}>Cancelar edição</Button>}</div>
   </form>
   {error&&<p role="alert" className="bad">{error}</p>}{notice&&<p role="status" className="foot">{notice}</p>}
  </Card>
  <Card className="card finance-layout-card friends-balances"><div className="friend-total"><h2>Valores a receber</h2><strong className="overview-total">{money(total)}</strong></div>
   {!people.length&&<p className="foot">Cadastre um amigo para acompanhar os valores.</p>}
   {people.map(friend=>{
    const balance=friendBalance(state.ledger,friend.id),percent=total?Math.round(balance/total*100):0;
    return <section key={friend.id} className="friend-balance">
     <div className="friend-summary"><Avatar name={friend.name} photo={friend.photo}/><div className="friend-summary-info"><div className="friend-summary-title"><h3>{friend.name}</h3><strong>{money(balance)}</strong></div>{friend.username&&<small>@{friend.username}</small>}<progress className="friend-progress" max={total||1} value={balance} aria-label={'Participação de '+friend.name+' no total a receber'}/><small>{percent}% do total a receber</small></div>
      <Button type="button" disabled={busy} onClick={()=>{setEditing(friend.id);setName(friend.name);setPhoto(friend.photo||'');setUsername(friend.username||'');setLinked(friend.accountId&&friend.username?{id:friend.accountId,username:friend.username,name:friend.name,photo:friend.photo}:undefined);setInitial('');setError('');document.querySelector('.friend-registration')?.scrollIntoView({behavior:'smooth',block:'start'})}}>Editar cadastro</Button>
     </div>
     {state.ledger.receivables.filter(row=>row.friendId===friend.id).map(row=><div className="report-line friend-receivable" key={row.id}><span>{row.description}<small>{row.paid?'Pago':'Em aberto'}</small></span><strong>{money(row.cents)}</strong>{!row.paid&&<Button type="button" onClick={()=>{if(!confirm('Marcar como pago apenas atualiza este controle. Nenhum recebimento será criado. Continuar?'))return;try{const current=finance.friends.getState();finance.friends.saveLedger({...current.ledger,receivables:current.ledger.receivables.map(item=>item.id===row.id?{...item,paid:true}:item)});setError('')}catch(e){setError(errorDetails(e).message)}}}>Marcar como pago</Button>}</div>)}
    </section>;
   })}
   <details className="friend-assignment"><summary>Atribuir valor</summary><form onSubmit={assign} className="friend-form"><div className="product-goal-fields">
    <label>Amigo<Field><select value={person} onChange={e=>setPerson(e.target.value)} required><option value="">Selecione</option>{people.map(friend=><option key={friend.id} value={friend.id}>{friend.name}</option>)}</select></Field></label>
    <label>Dívida cadastrada · opcional<Field><select value={source} onChange={e=>{setSource(e.target.value);const debt=state.debts.find(row=>row.id===e.target.value);if(debt){setDescription(debt.name);setAmount((debt.cents/100).toFixed(2).replace('.',','))}}}><option value="">Novo valor a receber</option>{state.debts.filter(row=>row.cents>0).map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></Field></label>
    <label>Descrição<Field><input value={description} onChange={e=>setDescription(e.target.value)} required maxLength={240}/></Field></label><label>Valor a receber (R$)<Field><input value={amount} onChange={e=>setAmount(e.target.value)} required inputMode="decimal"/></Field></label>
   </div><p className="foot">Controle privado. Não altera a dívida original nem cria entradas ou gastos.</p><Button type="submit" disabled={!people.length}>Atribuir dívida</Button></form></details>
  </Card>
 </div>;
}
