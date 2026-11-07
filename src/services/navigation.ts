import {retiredAreaView} from './retired-feature-compatibility.ts';
// Navigation changes presentation only; legacy route keys keep notifications/links working.
export const MAIN_AREAS = Object.freeze([
  {key:'r',label:'Resumo'},
  {key:'d',label:'Compromissos'},
  {key:'o',label:'Planejamento'},
  {key:'f',label:'Análises'},
  {key:'a',label:'Amigos'},
]);
export const AREA_VIEWS:Readonly<Record<string,string[][]>> = Object.freeze({
  summary:[['overview','Visão geral'],['entries','Lançamentos'],['forecast','Previsão']],
  commitments:[['debts','Dívidas'],['cards','Cartões'],['recurrences','Recorrências']],
  planning:[['purchases','Compras'],['goals','Metas']],
  friends:[['people','Amigos'],['split','Dividir conta'],['charges','Cobrar']],
  analysis:[['taxes','Impostos'],['reports','Relatórios']],
});
export function availableViews(area:string,sections:Record<string,boolean>={}) {
  return (AREA_VIEWS[area]||[]).filter(([key])=>!(key==='cards'&&sections.credit===false));
}
export function resolveAreaView(value:unknown,sections:Record<string,boolean>={}) {
  const [area,view,...extra]=retiredAreaView(String(value)==='planning:forecast'?'summary:forecast':String(value)==='commitments:friends'?'friends:split':String(value)).split(':');
  if(extra.length||!availableViews(area,sections).some(([key])=>key===view))return null;
  return {area,view,tab:area==='summary'&&view==='entries'?'i':({summary:'r',friends:'a',commitments:'d',planning:'o',analysis:'f'} as Record<string,string>)[area]};
}
