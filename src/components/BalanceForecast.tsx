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
 return <div className="product-goals product-goals-host" data-forecast-screen=""><Card className="card finance-layout-card" padding="var(--content-card-padding)"><h2>Previsão de saldo</h2><p className="foot">Estimativa dos seus lançamentos e compromissos. Pode mudar.</p>
 <form onSubmit={event=>{event.preventDefault();try{save({...settings,openingBalanceCents:balance.trim().startsWith('-')?-moneyText(balance.trim().slice(1)):moneyText(balance),marginCents:moneyText(margin),asOfDay:source.today})}catch{setError('Informe saldo e margem em reais, com até duas casas decimais.')}}}>
 <div className="product-goal-fields"><label>Saldo hoje (R$)<Field><input name="openingBalance" aria-label="Saldo disponível hoje (R$)" aria-describedby="forecastBalanceHint" inputMode="decimal" value={balance} required onChange={event=>setBalance(event.target.value)}/></Field></label><label>Margem de segurança (R$)<Field><input name="safetyMargin" inputMode="decimal" value={margin} required onChange={event=>setMargin(event.target.value)}/></Field></label></div><p className="foot" id="forecastBalanceHint">Use o saldo disponível, não o resultado do orçamento.</p><div className="plan-actions ui-toolbar"><Button type="submit" aria-label="Atualizar previsão">Atualizar</Button></div>{error&&<p role="alert">{error}</p>}</form>
 <div className="forecast-controls">
 <div className="forecast-control-group"><span id="forecastHorizonLabel" className="foot">Período</span><FinanceOptionBar as="div" role="group" aria-labelledby="forecastHorizonLabel">{([30,60,90] as const).map(horizon=><Button type="button" key={horizon} control="option" aria-pressed={settings.horizon===horizon} onClick={()=>save({...settings,horizon})}>{horizon} dias</Button>)}</FinanceOptionBar></div>
 <div className="forecast-control-group"><span id="forecastModeLabel" className="foot">Cálculo</span><FinanceOptionBar as="div" role="group" aria-labelledby="forecastModeLabel">{([[false,'Compromissos','Somente compromissos conhecidos'],[true,'+ Variáveis','Com gastos variáveis estimados']] as const).map(([estimate,label,accessibleLabel])=><Button type="button" key={String(estimate)} control="option" aria-label={accessibleLabel} aria-pressed={settings.estimateVariable===estimate} onClick={()=>save({...settings,estimateVariable:estimate})}>{label}</Button>)}</FinanceOptionBar></div>
 </div>
 <ForecastRisk compact/>{result.issues.map(issue=><p className="foot" key={issue}>{issue}</p>)}
 {!result.ready?<p role="status">Informe o saldo para começar.</p>:<><p>Menor saldo estimado: <strong>{money(result.lowestCents??0)}</strong> em {result.lowestDate?.split('-').reverse().join('/')}.</p>{settings.estimateVariable&&<p className="foot">Variáveis: {money(result.estimatedDailyCents)}/dia · mediana de 90 dias. Não são cobranças confirmadas.</p>}<div className="plan-table-wrap" role="region" aria-label="Saldos diários estimados" tabIndex={0}><table className="plan-table"><thead><tr><th>Data</th><th>Entradas</th><th>Saídas</th><th>Variáveis</th><th>Saldo estimado</th></tr></thead><tbody>{result.days.map(day=><tr key={day.date}><td>{day.date.split('-').reverse().join('/')}</td><td>{money(day.incomeCents)}</td><td>{money(day.expenseCents)}</td><td>{money(day.estimatedCents)}</td><td>{money(day.balanceCents)}</td></tr>)}</tbody></table></div></>}
 </Card></div>;
}
