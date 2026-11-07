import {useForecast} from '../services/use-forecast';
const money=(value:number)=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export default function ForecastRisk({compact=false}:{compact?:boolean}){
 const {result}=useForecast();if(!result.ready||result.risk==='ok')return null;
 return <div role={result.risk==='risco'?'alert':'status'} className="app-notice" data-forecast-risk={result.risk}><strong>{result.risk==='risco'?'⚠ Risco de saldo negativo':'ⓘ Saldo em atenção'}</strong><p>{result.firstNegativeDate?`Saldo negativo previsto em ${result.firstNegativeDate.split('-').reverse().join('/')}.`:'Abaixo da margem de segurança ou com pendências.'} Estimativa sujeita a mudanças.</p>{!compact&&<p>Menor saldo estimado: {money(result.lowestCents??0)}.</p>}</div>;
}
