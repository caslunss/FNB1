import {useState,type FormEvent} from 'react';
import ForecastRisk from './ForecastRisk';
import SmoothState from './SmoothState';
import {auth} from '../services/auth';
import {useForecast} from '../services/use-forecast';
import {FORECAST_EVENT,saveForecastSettings,type ForecastSettings} from '../services/forecast-settings';
import {moneyText} from '../services/taxes/domain';
import {FinanceGlassCard as Card,FinanceGlassButton as Button,GlassTextField as Field,FinanceSegmentedControl} from './LiquidControls';

const horizons=[30,60,90] as const;
const money=(value:number)=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const inputMoney=(value:number|null)=>value===null?'':(value/100).toFixed(2).replace('.',',');
const dateLabel=(value:string)=>value.split('-').reverse().join('/');

export default function BalanceForecast(){
 const {source,settings,result}=useForecast();
 const [balance,setBalance]=useState(()=>inputMoney(settings.openingBalanceCents));
 const [margin,setMargin]=useState(()=>inputMoney(settings.marginCents));
 const [error,setError]=useState('');
 function save(next:ForecastSettings){
  try{saveForecastSettings(auth.storage,next);dispatchEvent(new Event(FORECAST_EVENT));setError('')}
  catch{setError('Não foi possível salvar. Revise os valores e tente novamente.')}
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  try{
   const text=balance.trim();
   save({...settings,openingBalanceCents:text.startsWith('-')?-moneyText(text.slice(1)):moneyText(text),marginCents:moneyText(margin),asOfDay:source.today});
  }catch{setError('Informe saldo e margem em reais, com até duas casas decimais.')}
 }
 return <div className="forecast-page" data-forecast-screen="">
  <Card className="card finance-layout-card forecast-settings" padding="var(--content-card-padding)">
   <header><h2>Previsão de saldo</h2><p className="foot">Seus compromissos, dia a dia. Valores estimados.</p></header>
   <form className="forecast-form" onSubmit={submit}>
    <div className="product-goal-fields">
     <label>Saldo hoje (R$)<Field><input name="openingBalance" aria-label="Saldo disponível hoje (R$)" aria-describedby="forecastBalanceHint" inputMode="decimal" value={balance} required onChange={event=>setBalance(event.target.value)}/></Field></label>
     <label>Margem de segurança (R$)<Field><input name="safetyMargin" inputMode="decimal" value={margin} required onChange={event=>setMargin(event.target.value)}/></Field></label>
    </div>
    <p className="foot" id="forecastBalanceHint">Use o saldo disponível, não o resultado do orçamento.</p>
    <div className="ui-toolbar"><Button type="submit" aria-label="Atualizar previsão">Atualizar</Button></div>
    {error&&<p className="bad" role="alert">{error}</p>}
   </form>
   <div className="forecast-controls">
    <div className="forecast-control-group"><span className="foot">Período</span><FinanceSegmentedControl aria-label="Período da previsão" options={horizons.map(days=>`${days} dias`)} value={horizons.indexOf(settings.horizon)} onChange={index=>{const horizon=horizons[index];if(horizon)save({...settings,horizon})}}/></div>
    <div className="forecast-control-group"><span className="foot">Cálculo</span><FinanceSegmentedControl aria-label="Modo da previsão" options={['Compromissos','+ Variáveis']} value={settings.estimateVariable?1:0} onChange={index=>save({...settings,estimateVariable:index===1})}/></div>
   </div>
  </Card>
  <SmoothState state={result.ready?`ready:${settings.horizon}:${settings.estimateVariable}`:'empty'} className="forecast-result">
   <Card className="card finance-layout-card forecast-projection" padding="var(--content-card-padding)">
    {!result.ready?<p role="status">Informe o saldo para começar.</p>:<>
     <header><h3>Menor saldo estimado</h3><strong className="overview-total">{money(result.lowestCents??0)}</strong>{result.lowestDate&&<p className="foot">{dateLabel(result.lowestDate)} · próximos {settings.horizon} dias</p>}</header>
     <ForecastRisk compact/>
     {settings.estimateVariable&&<p className="foot">Variáveis: {money(result.estimatedDailyCents)}/dia · mediana de 90 dias. Não são cobranças confirmadas.</p>}
     <details className="plan-detail forecast-daily"><summary>Saldos diários</summary>
      <div className="plan-table-wrap" role="region" aria-label="Saldos diários estimados" tabIndex={0}>
       <table className="plan-table"><thead><tr><th scope="col">Data</th><th scope="col">Entradas</th><th scope="col">Saídas</th><th scope="col">Variáveis</th><th scope="col">Saldo estimado</th></tr></thead><tbody>{result.days.map(day=><tr key={day.date}><th scope="row">{dateLabel(day.date)}</th><td>{money(day.incomeCents)}</td><td>{money(day.expenseCents)}</td><td>{money(day.estimatedCents)}</td><td className={day.balanceCents<0?'bad':undefined}>{money(day.balanceCents)}</td></tr>)}</tbody></table>
      </div>
     </details>
    </>}
    {result.issues.length>0&&<ul className="forecast-issues foot" aria-label="Pendências da previsão">{result.issues.map(issue=><li key={issue}>{issue}</li>)}</ul>}
   </Card>
  </SmoothState>
 </div>;
}
