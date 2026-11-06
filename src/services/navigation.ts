// Navigation changes presentation only; legacy route keys keep notifications/links working.
export const MAIN_AREAS = Object.freeze([
  {key:'r',label:'Resumo'},
  {key:'d',label:'Compromissos'},
  {key:'o',label:'Planejamento'},
  {key:'f',label:'Análises'},
]);
export const AREA_VIEWS:Readonly<Record<string,string[][]>> = Object.freeze({
  commitments:[['debts','Dívidas'],['cards','Cartões'],['friends','Dividir conta']],
  planning:[['purchases','Compras'],['goals','Metas']],
  analysis:[['taxes','Impostos'],['reports','Relatórios'],['carbon','Carbono']],
});
export function availableViews(area:string,sections:Record<string,boolean>={}) {
  return (AREA_VIEWS[area]||[]).filter(([key])=>!(key==='cards'&&sections.credit===false||key==='carbon'&&sections.carbon===false));
}
export function resolveAreaView(value:unknown,sections:Record<string,boolean>={}) {
  const [area,view,...extra]=String(value).split(':');
  if(extra.length||!availableViews(area,sections).some(([key])=>key===view))return null;
  return {area,view,tab:({commitments:'d',planning:'o',analysis:'f'} as Record<string,string>)[area]};
}
