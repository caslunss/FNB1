import {getLayout,subscribeLayout} from '../services/layout-preferences.js';
import React, {useId, useState, useSyncExternalStore} from 'react';
import {FinanceGlassButton as Button,FinanceGlassCard as Card} from './LiquidControls.jsx';

/** Content for the shared native dialog: focus trapping and Escape stay in one place. */
export default function ProfileCard({name, photo, verified = false, tester = false, supporter = false, children}) {
  const title = useId(), [failedPhoto, setFailedPhoto] = useState('');
  const layout=useSyncExternalStore(subscribeLayout,getLayout);
  const image = photo && failedPhoto !== photo;
  return <Card className="card finance-layout-card profile-hover-card" aria-labelledby={title}>
    <div className="profile-card-photo" aria-hidden="true">
      {image ? <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setFailedPhoto(photo)}/> : <span className="profile-card-initial">{name?.trim().slice(0,1).toUpperCase() || 'V'}</span>}
    </div>
    <div className="profile-card-content">
      <header className="profile-card-identity">
        <h2 id={title}>{name || 'Visitante'}{verified && <svg className="profile-verified" viewBox="0 0 24 24" role="img" aria-label="E-mail verificado"><circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/></svg>}</h2>
        {(tester || supporter) && <div className="profile-card-badges">{tester && <span>Testador</span>}{supporter && <span>Apoiador</span>}</div>}
      </header>
      <section className="profile-card-notes" aria-label="Notas de gastos e economias">{children}</section>
      <footer className="profile-card-actions">
        {layout.sections.calendar!==false&&<Button type="button" onClick={()=>window.planMobile?.open('calendar',document.querySelector('.app-symbol'))}>Calendário</Button>}
        <Button type="button" onClick={() => window.planMobile?.open('settings')}>Configurações</Button>
        <Button type="button" id="accountSignOut">Sair</Button>
      </footer>
    </div>
  </Card>;
}
