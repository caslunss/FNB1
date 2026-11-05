export type SettingsScreen='home'|'account'|'layout'|'notifications'|'connections'|'security';

export function settingsScreen(value:unknown,isVisitor:boolean):SettingsScreen{
 if(value==='account')return isVisitor?'home':'account';
 return value==='layout'||value==='notifications'||value==='connections'||value==='security'?value:'home';
}

export const SETTINGS_TITLES:Record<SettingsScreen,string>={home:'Configurações',account:'Conta',layout:'Layout e preferências',notifications:'Notificações',connections:'Dados e conexões',security:'Registro e segurança'};
