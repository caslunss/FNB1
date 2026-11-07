import {retiredAreaView} from './retired-feature-compatibility.ts';
// Navigation changes presentation only; legacy route keys keep notifications/links working.
export const MAIN_AREAS = Object.freeze([
  {key:'r',label:'Resumo'},
  {key:'d',label:'Compromissos'},
  {key:'o',label:'Planejamento'},
  {key:'f',label:'Análises'},
]);
export const AREA_VIEWS:Readonly<Record<string,string[][]>> = Object.freeze({
  commitments:[['debts','Dívidas'],['cards','Cartões'],['friends','Dividir conta'],['recurrences','Recorrências']],
  planning:[['purchases','Compras'],['goals','Metas'],['forecast','Previsão']],
  analysis:[['taxes','Impostos'],['reports','Relatórios']],
});
export function availableViews(area:string,sections:Record<string,boolean>={}) {
  return (AREA_VIEWS[area]||[]).filter(([key])=>!(key==='cards'&&sections.credit===false));
}
export function resolveAreaView(value:unknown,sections:Record<string,boolean>={}) {
  const [area,view,...extra]=retiredAreaView(String(value)).split(':');
  if(extra.length||!availableViews(area,sections).some(([key])=>key===view))return null;
  return {area,view,tab:({commitments:'d',planning:'o',analysis:'f'} as Record<string,string>)[area]};
}
