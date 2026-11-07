import {APP_VERSION} from '../../version';
import {RELEASE_NOTES} from '../../release-notes';
import {FinanceGlassCard} from '../LiquidControls';
const dateLabel=(date:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(date+'T12:00:00'));
export default function ReleaseNotesTab(){
 return <div className="grid min-w-0 gap-4">{RELEASE_NOTES.map(release=><FinanceGlassCard key={release.version} className="card finance-layout-card" padding="var(--content-card-padding)">
  <header className="row"><h3>Versão {release.version}</h3>{release.version===APP_VERSION&&<span className="tag">Atual</span>}</header>
  <p className="foot"><time dateTime={release.date}>{dateLabel(release.date)}</time></p>
  <ul>{release.changes.map(change=><li key={change}>{change}</li>)}</ul>
 </FinanceGlassCard>)}</div>;
}
