export interface ReleaseNote {version:string;date:string;changes:readonly string[]}
// Newest first. Every version change must include a dated, user-facing summary.
export const RELEASE_NOTES:readonly ReleaseNote[]=[
 {version:'0.1.0-alpha.6',date:'2026-11-07',changes:[
  'Amigos com foto, divisão de contas e valores a receber.',
  'Cadastro inicial de perfil, salário e cartões.',
  'Cards alinhados e cobranças com links mais curtos.',
 ]},
 {version:'0.1.0-alpha.5',date:'2026-11-07',changes:[
  'Previsão de saldo no Resumo.',
  'Interface minimalista, fonte SF Pro e cards por aba.',
  'Modo escuro neutro e opção OLED.',
 ]},
 {version:'0.1.0-alpha.1',date:'2026-11-05',changes:[
  'Organização financeira, planejamento e análises.',
  'Configurações e preferências de aparência.',
 ]},
];
