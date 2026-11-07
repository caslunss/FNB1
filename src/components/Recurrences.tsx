import {useEffect,useMemo,useState} from 'react';
import {auth} from '../services/auth';
import {useFinanceSnapshot} from '../services/use-finance';
import {readRecurrenceDecisions,recordRecurrenceDecision,reviewRecurrences,RECURRENCE_EVENT,RECURRENCE_KEY,type RecurrenceReview,type RecurrenceStatus} from '../services/recurrence-decisions';
import type {RecurrenceCandidate,RecurrenceInterval} from '../services/recurrence-detection';
import {moneyText} from '../services/taxes/domain';
import {FinanceGlassCard as Card,FinanceGlassButton as Button,GlassTextField as Field,FinanceOptionBar} from './LiquidControls';

const labels:Record<RecurrenceInterval,string>={weekly:'Semanal',biweekly:'Quinzenal',monthly:'Mensal',yearly:'Anual'};
const money=(value:number)=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function ReviewCard({row,today,onDecision}:{row:RecurrenceReview;today:string;onDecision:(candidate:RecurrenceCandidate,status:RecurrenceStatus,end?:string)=>boolean}) {
  const {candidate,decision}=row,[editing,setEditing]=useState(false),[amount,setAmount]=useState(((decision?.candidate.cents??candidate.cents)/100).toFixed(2).replace('.',',')),[interval,setInterval]=useState<RecurrenceInterval>(decision?.candidate.interval||candidate.interval),[anchor,setAnchor]=useState(decision?.candidate.anchorDate||candidate.anchorDate),[end,setEnd]=useState(decision?.endDate||''),[error,setError]=useState('');
  return <Card className="card finance-layout-card" data-recurrence-id={candidate.id} padding="var(--content-card-padding)">
    <div className="row"><h3>{candidate.name}</h3><span className="tag">{decision?.status==='confirmed'?'Confirmada':decision?.status==='ignored'?'Ignorada':decision?.status==='cancelled'?'Cancelada localmente':'Sugestão'}</span></div>
    <p><strong>{money(candidate.cents)}</strong> · {labels[candidate.interval]} · Confiança {candidate.confidence.toLocaleLowerCase('pt-BR')}</p>
    <p className="foot">{candidate.count} cobranças semelhantes · {decision?'revisada localmente.':'aguarda revisão.'}</p>
    {candidate.variable&&<p className="foot">Valor variável. Revise a estimativa.</p>}
    {candidate.priceIncreased&&<p className="foot">Reajuste possível: {money(candidate.previousCents)} → {money(candidate.cents)}.</p>}
    {candidate.duplicate&&<p className="foot">Possível duplicidade no mesmo dia. Revise os registros.</p>}
    {candidate.similar&&<p className="foot">Serviços semelhantes. Confira os planos.</p>}
    {candidate.materialized&&<p className="foot">Parcelas já programadas. Confirmar não duplica nem estende a série.</p>}
    {candidate.stopped&&<p className="foot">Série encerrada, sem novas projeções.</p>}
    <div className="plan-actions ui-toolbar">
      <Button type="button" aria-expanded={editing} onClick={()=>setEditing(value=>!value)}>{decision?.status==='confirmed'?'Revisar':'Confirmar'}</Button>
      <Button type="button" onClick={()=>onDecision(candidate,'ignored')}>Ignorar</Button>
      <Button type="button" aria-label="Marcar como cancelada" onClick={()=>{if(window.confirm('Marcar como cancelada interrompe somente a projeção local. Não cancela o serviço no fornecedor nem apaga lançamentos. Continuar?'))onDecision(candidate,'cancelled')}}>Cancelar projeção</Button>
    </div>
    <p className="foot">Ignorar mantém os lançamentos. Cancelar não encerra o serviço no fornecedor.</p>
    {editing&&<form onSubmit={event=>{event.preventDefault();try{const cents=moneyText(amount);if(cents<=0)throw Error();if(onDecision({...candidate,cents,interval,anchorDate:anchor},'confirmed',end||undefined))setEditing(false)}catch{setError('Revise o valor e as datas da previsão.')}}}>
      <p className="foot">Projeção a partir de hoje, sem criar lançamentos.</p>
      <div className="product-goal-fields"><label>Valor estimado (R$)<Field><input name="recurrenceAmount" inputMode="decimal" required value={amount} onChange={event=>setAmount(event.target.value)}/></Field></label>
      <label>Referência do ciclo<Field><input name="recurrenceAnchor" type="date" required max={today} value={anchor} onChange={event=>setAnchor(event.target.value)}/></Field></label>
      <label>Fim da projeção (opcional)<Field><input name="recurrenceEnd" type="date" min={today} value={end} onChange={event=>setEnd(event.target.value)}/></Field></label></div>
      <FinanceOptionBar as="div" aria-label="Periodicidade">{(Object.keys(labels) as RecurrenceInterval[]).map(value=><Button type="button" key={value} control="option" aria-pressed={interval===value} onClick={()=>setInterval(value)}>{labels[value]}</Button>)}</FinanceOptionBar>
      <div className="plan-actions ui-toolbar"><Button type="submit">Incluir na previsão</Button><Button type="button" onClick={()=>setEditing(false)}>Voltar</Button></div>{error&&<p role="alert">{error}</p>}
    </form>}
  </Card>;
}
export default function Recurrences() {
  const source=useFinanceSnapshot('forecast'),[revision,update]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{const sync=()=>update(value=>value+1),storage=(event:StorageEvent)=>{if(event.key===null||event.key===auth.key(RECURRENCE_KEY))sync()};addEventListener(RECURRENCE_EVENT,sync);addEventListener('storage',storage);return()=>{removeEventListener(RECURRENCE_EVENT,sync);removeEventListener('storage',storage)}},[]);
  const decisions=useMemo(()=>readRecurrenceDecisions(auth.storage),[source,revision]);
  const rows=useMemo(()=>reviewRecurrences(source.transactions,source.today,decisions),[source,decisions]);
  const archived=(row:RecurrenceReview)=>row.decision?.status==='ignored'||row.decision?.status==='cancelled';
  const forgotten=(row:RecurrenceReview)=>!row.decision&&(row.candidate.count>=6||row.candidate.priceIncreased||row.candidate.duplicate||row.candidate.similar);
  function decide(candidate:RecurrenceCandidate,status:RecurrenceStatus,end?:string) {
    try{recordRecurrenceDecision(auth.storage,candidate,status,source.today,end);dispatchEvent(new Event(RECURRENCE_EVENT));setError('');setNotice(status==='confirmed'?'Recorrência confirmada para a previsão local.':status==='ignored'?'Sugestão ignorada. Seus lançamentos foram preservados.':'Projeção cancelada localmente. Confira o contrato com o fornecedor.');return true}catch{setError('Não foi possível salvar a decisão. Revise os valores, datas e espaço disponível.');return false}
  }
  return <div className="product-goals" data-recurrences-screen=""><Card className="card finance-layout-card" padding="var(--content-card-padding)"><h2>Recorrências</h2><p className="foot">Sugestões a partir de 3 cobranças. Revise antes de incluir na previsão; os lançamentos são preservados.</p><p className="foot">Revisão local de cobranças, sem acesso ao uso dos serviços.</p>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}</Card>
    {([['Detectadas',rows.filter(row=>!archived(row)&&!forgotten(row))],['Para revisar',rows.filter(row=>!archived(row)&&forgotten(row))],['Ignoradas/Canceladas',rows.filter(archived)]] as const).map(([title,items])=><section key={title} aria-label={title}><h2>{title}</h2>{items.length?items.map(row=><ReviewCard key={row.decision?.id||row.candidate.id} row={row} today={source.today} onDecision={decide}/>):<p className="foot">Nenhuma recorrência.</p>}</section>)}
  </div>;
}
