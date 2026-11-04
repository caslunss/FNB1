import {isSafeInteger,isInteger} from './type-guards.ts';
export interface CdbInput {principalCents:number;cdiAnnual:number;percentCdi:number;start:string;end:string;businessDays?:number|null;feesCents?:number}
export const CDB_REFERENCE=Object.freeze({annual:13.65,date:'28/10/2026',source:'BCB · SGS 4389'});
// Pessoa física residente, CDB pós-fixado ao CDI, um único aporte e resgate final.
// RFB 2026 / Decreto 6.306, art. 32 e anexo. Consultados em 30/10/2026.
export const IOF_TABLE=[0,96,93,90,86,83,80,76,73,70,66,63,60,56,53,50,46,43,40,36,33,30,26,23,20,16,13,10,6,3,0];
export function calendarDays(start:string,end:string){
  const parse=(value:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Revise as datas.');const [y,m,d]=value.split('-').map(Number),n=Date.UTC(y,m-1,d);if(new Date(n).toISOString().slice(0,10)!==value)throw Error('Data inválida.');return n;};
  const days=(parse(end)-parse(start))/86400000;if(!isInteger(days)||days<1||days>10958)throw Error('Escolha um prazo de 1 dia a 30 anos.');return days;
}
export const incomeTaxRate=(days:number)=>days<=180?.225:days<=360?.20:days<=720?.175:.15;
export function simulateCdb({principalCents,cdiAnnual,percentCdi,start,end,businessDays,feesCents=0}:CdbInput){
  const days=calendarDays(start,end),useful=businessDays==null?Math.round(days*252/365):businessDays;
  if(!isSafeInteger(principalCents)||principalCents<1||principalCents>1e11||!Number.isFinite(cdiAnnual)||cdiAnnual<0||cdiAnnual>100||!Number.isFinite(percentCdi)||percentCdi<0||percentCdi>500||!isInteger(useful)||useful<0||useful>days||!isSafeInteger(feesCents)||feesCents<0||feesCents>principalCents)throw Error('Revise aporte, taxas, custos e dias úteis.');
  const daily=Math.expm1(Math.log1p(cdiAnnual/100)/252)*(percentCdi/100),factor=Math.exp(Math.log1p(daily)*useful),grossCents=Math.round(principalCents*(factor-1));
  if(!isSafeInteger(grossCents)||grossCents>1e14)throw Error('Resultado fora do limite da simulação.');
  const iofRate=days<30?IOF_TABLE[days]/100:0,irRate=incomeTaxRate(days),iofCents=Math.round(grossCents*iofRate),irCents=Math.round((grossCents-iofCents)*irRate),netGainCents=grossCents-iofCents-irCents-feesCents;
  return {days,businessDays:useful,principalCents,grossCents,iofRate,iofCents,irRate,irCents,feesCents,netGainCents,netCents:principalCents+netGainCents,effectiveAnnual:Math.expm1(Math.log1p(daily)*252)*100};
}
