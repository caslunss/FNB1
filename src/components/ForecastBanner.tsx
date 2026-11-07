import {useForecast} from '../services/use-forecast';
import {FinanceGlassCard as Card,FinanceGlassButton as Button} from './LiquidControls';
import ForecastRisk from './ForecastRisk';
export default function ForecastBanner(){const {result}=useForecast();if(!result.ready||result.risk==='ok')return null;return <Card className="card" padding="var(--ui-space-4)"><ForecastRisk compact/><Button type="button" onClick={()=>dispatchEvent(new CustomEvent('plan-segment-request',{detail:{kind:'data-summary-mode',value:'forecast'}}))}>Ver previsão</Button></Card>}
