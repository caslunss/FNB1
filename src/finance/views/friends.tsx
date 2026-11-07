import type {WorkspaceViewContext} from '../../types/views';
export function friendsView(context:WorkspaceViewContext){
 const {areaNavigation,areaViews,socialView,vDivision}=context;
 return <>{areaNavigation('friends','Seções de amigos')}<div className={'area-content friends-content'+(areaViews.friends==='people'?' friends-people':'')}>
 {areaViews.friends==='split'?vDivision():areaViews.friends==='charges'?<section className="card finance-layout-card"><h2>Cobrar amigo</h2><div data-share-debt=""/></section>:<>{socialView()}<div data-friends-ledger=""/></>}
 </div></>;
}
