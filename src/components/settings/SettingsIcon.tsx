type Icon='account'|'layout'|'notifications'|'connections'|'security'|'back'|'next';
const paths:Record<Icon,string>={
 account:'M20 21v-2a7 7 0 0 0-14 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
 layout:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
 notifications:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
 connections:'M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M8 12h13m-4-4 4 4-4 4M8 3v6H3',
 security:'M6 10V7a6 6 0 0 1 12 0v3M5 10h14v11H5z',
 back:'m15 18-6-6 6-6',next:'m9 6 6 6-6 6',
};
export default function SettingsIcon({name}:{name:Icon}){return <svg className="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>}
