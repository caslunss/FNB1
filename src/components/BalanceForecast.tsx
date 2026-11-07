import ForecastRisk from './ForecastRisk';
import {useState} from 'react';
import {auth} from '../services/auth';
import {useForecast} from '../services/use-forecast';
import {FORECAST_EVENT,saveForecastSettings} from '../services/forecast-settings';
import {moneyText} from '../services/taxes/domain';
import {FinanceGlassCard as Card,FinanceGlassButton as Button,GlassTextField as Field,FinanceOptionBar} from './LiquidControls';
const money=(value:number)=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const inputMoney=(value:number|null)=>value===null?'':(value/100).toFixed(2).replace('.',',');
export default function BalanceForecast(){
 const {source,settings,result}=useForecast(),[balance,setBalance]=useState(()=>inputMoney(settings.openingBalanceCents)),[margin,setMargin]=useState(()=>inputMoney(settings.marginCents)),[error,setError]=useState('');
 function save(next= settings){try{saveForecastSettings(auth.storage,next);dispatchEvent(new Event(FORECAST_EVENT));setError('')}catch{setError('Não foi possível salvar. Revise os valores e o espaço disponível.')}}
 return <div className="product-goals product-goals-host" data-forecast-screen=""><Card className="card finance-layout-card" padding="var(--content-card-padding)"><h2>Previsão de saldo</h2><p className="foot">Estimativa com base nos seus lançamentos e compromissos. Pode mudar.</p><p className="foot">Informe o saldo disponível de hoje. O resultado mensal do orçamento não é um saldo bancário confirmado.</p>
 <form onSubmit={event=>{event.preventDefault();try{save({...settings,openingBalanceCents:balance.trim().startsWith('-')?-moneyText(balance.trim().slice(1)):moneyText(balance),marginCents:moneyText(margin),asOfDay:source.today})}catch{setError('Informe saldo e margem em reais, com até duas casas decimais.')}}}>
 <div className="product-goal-fields"><label>Saldo disponível hoje (R$)<Field><input name="openingBalance" inputMode="decimal" value={balance} required onChange={event=>setBalance(event.target.value)}/></Field></label><label>Margem de segurança (R$)<Field><input name="safetyMargin" inputMode="decimal" value={margin} required onChange={event=>setMargin(event.target.value)}/></Field></label></div><div className="plan-actions ui-toolbar"><Button type="submit">Atualizar previsão</Button></div>{error&&<p role="alert">{error}</p>}</form>
 <FinanceOptionBar as="div" aria-label="Horizonte da previsão">{([30,60,90] as const).map(horizon=><Button key={horizon} control="option" aria-pressed={settings.horizon===horizon} onClick={()=>save({...settings,horizon})}>{horizon} dias</Button>)}</FinanceOptionBar>
 <FinanceOptionBar as="div" aria-label="Modo da previsão">{[[false,'Somente compromissos conhecidos'],[true,'Com gastos variáveis estimados']].map(([estimate,label])=><Button key={String(estimate)} control="option" aria-pressed={settings.estimateVariable===estimate} onClick={()=>save({...settings,estimateVariable:estimate===true})}>{label}</Button>)}</FinanceOptionBar>
 <ForecastRisk/>{result.issues.map(issue=><p className="foot" key={issue}>{issue}</p>)}
 {!result.ready?<p role="status">Informe o saldo disponível para começar. Nenhuma renda ou cobrança será inventada.</p>:<><p>Menor saldo estimado: <strong>{money(result.lowestCents??0)}</strong> em {result.lowestDate?.split('-').reverse().join('/')}.</p>{settings.estimateVariable&&<p className="foot">Gastos variáveis estimados à vista: {money(result.estimatedDailyCents)} por dia, pela mediana dos últimos 90 dias. Não são cobranças confirmadas.</p>}<div className="plan-table-wrap" role="region" aria-label="Saldos diários estimados" tabIndex={0}><table className="plan-table"><thead><tr><th>Data</th><th>Entradas</th><th>Saídas</th><th>Estimativa variável</th><th>Saldo estimado</th></tr></thead><tbody>{result.days.map(day=><tr key={day.date}><td>{day.date.split('-').reverse().join('/')}</td><td>{money(day.incomeCents)}</td><td>{money(day.expenseCents)}</td><td>{money(day.estimatedCents)}</td><td>{money(day.balanceCents)}</td></tr>)}</tbody></table></div></>}
 </Card></div>;
}
