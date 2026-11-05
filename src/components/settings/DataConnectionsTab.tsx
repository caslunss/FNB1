import {useEffect,type ReactNode} from 'react';
export default function DataConnectionsTab({sync,data,connections}:{sync:ReactNode;data:ReactNode;connections:ReactNode}){
 useEffect(()=>{window.dispatchEvent(new Event('plan-navigation-change'));},[]);
 return <div className="settings-sections grid min-w-0 gap-4">{sync}{data}{connections}</div>;
}
