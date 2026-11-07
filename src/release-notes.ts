export interface ReleaseNote {version:string;date:string;changes:readonly string[]}
// Newest first. Every version change must include a dated, user-facing summary.
export const RELEASE_NOTES:readonly ReleaseNote[]=[
 {version:'0.1.0-alpha.5',date:'2026-11-07',changes:[
  'Previsão de saldo no Resumo, ao lado de Visão geral e Lançamentos.',
  'Alertas de saldo e revisão de cobranças recorrentes.',
  'Interface mais simples, fonte SF Pro e cards organizados para celular e desktop.',
  'Removidos Dicas para você e o botão de reorganizar blocos.',
  'Impostos informa a causa da indisponibilidade da consulta automática.',
  'Cards sem espaços externos entre si, com alinhamento e grade consistentes.',
  'Paleta Azul essencial com superfícies e sobreposições mais legíveis.',
  'Novidades de cada versão disponíveis nas Configurações.',
 ]},
 {version:'0.1.0-alpha.1',date:'2026-11-05',changes:[
  'Primeira versão alpha com organização financeira, planejamento e análises.',
  'Configurações agrupadas, preferências de aparência e identificação da versão.',
 ]},
];
