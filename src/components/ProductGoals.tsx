import type {ProductGoal,ProductGoalsState} from '../types/finance-runtime';
import {errorDetails} from '../services/errors.ts';
import {useFinanceSnapshot} from '../services/use-finance.ts';
import {finance} from '../services/finance-runtime.ts';
import React,{useState} from 'react';
import {FinanceGlassButton as Button,FinanceGlassCard as Card,GlassTextField as Field} from './LiquidControls.tsx';
import {moneyText} from '../services/taxes/domain.ts';
import {productGoalReport} from '../services/product-goals.ts';
const money=(value:number|null)=>(value!/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const decimal=(value:number)=>(value/100).toFixed(2).replace('.',',');
const monthLabel=(value:string)=>value.slice(5)+'/'+value.slice(0,4);
function GoalForm({goal,state,onSave,onCancel}:{goal:Partial<ProductGoal>;state:ProductGoalsState;onSave:(goal:Partial<ProductGoal>)=>void;onCancel:()=>void}){
 const [draft,setDraft]=useState({name:goal.name||'',price:decimal(goal.priceCents||0),reserved:decimal(goal.reservedCents||0),monthly:decimal(goal.monthlyReserveCents||0),goalMode:goal.goalMode||'save',date:goal.date&&goal.date>=state.today?goal.date:state.today,installments:String(goal.installments||1),creditCardId:goal.creditCardId||'',category:goal.category||state.categories[1]||state.categories[0]});
 const [error,setError]=useState('');
 const change=(key:string,value:string)=>setDraft(old=>({...old,[key]:value}));
 function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();try{onSave({id:goal.id,name:draft.name,priceCents:moneyText(draft.price),reservedCents:moneyText(draft.reserved),monthlyReserveCents:moneyText(draft.monthly),goalMode:draft.goalMode,date:draft.date,installments:draft.goalMode==='credit'?Number(draft.installments):1,creditCardId:draft.creditCardId,category:draft.category})}catch(e){setError(errorDetails(e).message)}}
 return <Card className="card finance-layout-card product-goal-editor"><h2>{goal.id?'Editar meta de produto':'Nova meta de produto'}</h2><form onSubmit={submit}><div className="product-goal-fields">
  <label>Produto<Field><input value={draft.name} onChange={e=>change('name',e.target.value)} maxLength={120} required/></Field></label>
  <label>Valor total com frete (R$)<Field><input inputMode="decimal" value={draft.price} onChange={e=>change('price',e.target.value)} required/></Field></label>
  <label>Como pretende comprar<Field><select value={draft.goalMode} onChange={e=>change('goalMode',e.target.value)}><option value="save">Juntar antes de comprar</option><option value="cash">Comprar à vista</option><option value="credit">Comprar no crédito</option></select></Field></label>
  <label>Categoria<Field><select value={draft.category} onChange={e=>change('category',e.target.value)}>{state.categories.map(c=><option key={c}>{c}</option>)}</select></Field></label>
  <label>Já reservado (R$)<Field><input inputMode="decimal" value={draft.reserved} onChange={e=>change('reserved',e.target.value)} required/></Field></label>
  {draft.goalMode==='save'&&<label>Reserva mensal do orçamento (R$)<Field><input inputMode="decimal" value={draft.monthly} onChange={e=>change('monthly',e.target.value)} required/></Field></label>}
  <label>{draft.goalMode==='save'?'Início da reserva':'Data da compra / 1ª parcela'}<Field><input type="date" min={state.today} max="2046-09-30" value={draft.date} onChange={e=>change('date',e.target.value)} required/></Field></label>
  {draft.goalMode==='credit'&&<><label>Parcelas sem juros<Field><input type="number" min={1} max={24} value={draft.installments} onChange={e=>change('installments',e.target.value)} required/></Field></label><label>Cartão<Field><select value={draft.creditCardId} onChange={e=>change('creditCardId',e.target.value)} required><option value="">Selecione</option>{state.cards.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></label>{!state.cards.some(c=>c.active)&&<p className="foot">Cadastre um cartão em Compromissos → Cartões para simular o crédito.</p>}</>}
 </div><p className="foot">Simulação: salvar a meta não transfere dinheiro, não cria gastos e não altera a meta financeira do Resumo. Informe o total final da compra, incluindo frete e eventuais custos.</p>{error&&<p role="alert" className="bad">{error}</p>}<div className="plan-actions ui-toolbar"><Button type="submit">Salvar meta</Button><Button type="button" onClick={onCancel}>Cancelar</Button></div></form></Card>;
}
function GoalReport({goal}:{goal:ProductGoal}){
 let report;try{report=productGoalReport(goal,finance.productGoals.context(goal))}catch{return <p role="alert">Não foi possível calcular esta simulação. Revise a meta.</p>}
 return <section className="product-goal-report" aria-label={`Impacto de ${goal.name}`}>
  <h3>Impacto no orçamento</h3><p className={report.status==='attention'?'bad':'foot'}>{report.status==='attention'?'Atenção: falta orçamento ou limite em parte da simulação.':report.status==='incomplete'?'Dados incompletos: faltam entradas ou um cartão ativo para avaliar com segurança.':'Dentro do orçamento cadastrado nos meses exibidos.'}</p>
  <p className="foot">Reservado: {money(goal.reservedCents)} · Falta juntar: {money(report.remainingCents)}{goal.goalMode==='save'?` · Reserva mensal: ${money(goal.monthlyReserveCents)} · Prazo matemático: ${report.monthsToGoal===0?'valor já reservado':report.monthsToGoal+' mês(es)'}`:''}</p>
  {report.credit&&<p className={report.credit.shortfallCents?'bad':'foot'}>Crédito: a compra exige {money(report.credit.requiredCents)} de limite total, mesmo parcelada. {report.credit.known?`Disponível agora: ${money(report.credit.availableCents)}.${report.credit.shortfallCents?' Faltam '+money(report.credit.shortfallCents)+'.':''}`:'Cartão indisponível ou arquivado.'}</p>}
  <div className="plan-table-wrap"><table className="plan-table"><thead><tr><th>Mês</th><th>Disponível antes</th><th>{goal.goalMode==='save'?'Reserva':'Compra / parcela'}</th><th>Outras reservas</th><th>Após o plano</th></tr></thead><tbody>{report.rows.map(row=><tr key={row.key}><td data-label="Mês">{monthLabel(row.key)}{!row.complete&&<small>Sem entradas cadastradas</small>}</td><td data-label="Disponível antes">{money(row.availableCents)}</td><td data-label={goal.goalMode==='save'?'Reserva':'Compra / parcela'}>{money(row.allocationCents)}</td><td data-label="Outras reservas">{money(row.otherReservesCents)}</td><td data-label="Após o plano" className={row.afterCents<0?'bad':''}>{money(row.afterCents)}</td></tr>)}</tbody></table></div>
  <p className="foot">Considera entradas, gastos, limites por categoria e dívidas cadastrados. Reservas de outras metas para juntar dinheiro também entram. Uma compra pode usar a folga já prevista no limite da categoria, sem descontá-lo duas vezes. Não inclui saldo bancário, rendimentos, renda não cadastrada nem outras compras ainda não confirmadas.</p>
  <p className="foot">A reserva informada acompanha o progresso; não é somada à renda. O prazo pressupõe reservar esse valor todos os meses, e não confirma que os meses sem renda informada comportam a meta. {goal.goalMode==='save'?'A tabela exibe até 12 meses.':'O limite do cartão é a posição atual, sem presumir liberações futuras.'}</p>
 </section>;
}
export default function ProductGoals(){
 const state=useFinanceSnapshot('productGoals'),[editing,setEditing]=useState<Partial<ProductGoal>|null>(null),[error,setError]=useState('');

 function save(input:Partial<ProductGoal>){finance.productGoals.save(input);setEditing(null);setError('')}
 function remove(goal:ProductGoal){if(!confirm('Remover esta meta? Os lançamentos financeiros serão mantidos.'))return;try{finance.productGoals.remove(goal.id);setError('')}catch(e){setError(errorDetails(e).message)}}
 return <div className="product-goals"><Card className="card finance-layout-card"><h2>Metas de produtos</h2><Button type="button" onClick={()=>{setEditing(editing?null:{});setError('')}}>{editing?'Fechar':'Nova meta'}</Button></Card>
 {editing&&<GoalForm key={editing.id||'new'} goal={editing} state={state} onSave={save} onCancel={()=>setEditing(null)}/>}{error&&<p role="alert" className="bad">{error}</p>}
 {!state.goals.length&&<p className="foot">Nenhuma meta de produto.</p>}
 {state.goals.map(goal=><Card key={goal.id} className="card finance-layout-card"><div className="row"><h2>{goal.name}</h2><strong>{money(goal.priceCents+goal.shippingCents)}</strong></div>{goal.status==='purchased'?<p className="foot">Compra registrada em Lançamentos.</p>:<><GoalReport goal={goal}/><div className="plan-actions ui-toolbar"><Button type="button" onClick={()=>setEditing({...goal})}>Editar meta</Button><Button type="button" onClick={()=>{try{finance.productGoals.prepare(goal.id)}catch(e){setError(errorDetails(e).message)}}}>Preparar compra hoje</Button><Button type="button" onClick={()=>remove(goal)}>Remover meta</Button></div><p className="foot">Revise a compra de hoje. Só “já comprei” registra o gasto.</p></>}</Card>)}
 </div>;
}
