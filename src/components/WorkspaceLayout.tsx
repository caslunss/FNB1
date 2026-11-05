import NotificationCenter from './NotificationCenter.tsx';
import BottomNavigation from './BottomNavigation.tsx';
import MobileExperience from './MobileExperience.tsx';
import MonthPicker from './MonthPicker.tsx';
import ToolbarSearch from './ToolbarSearch.tsx';
import { FinanceOptionBar, GlassActionHost, FinanceGlassButton as GlassButton } from './LiquidControls.tsx';



export function WorkspaceLayout(){return <>
  <a className="skip" href="#lt">Pular para o conteúdo</a>
  <div className="workspace-frame">
    <div className="edge" aria-hidden="true"/>
    <main className="wrap workspace-main"><div id="pg">
      <div className="page-intro"><p id="pageDescription"/><span className="tag">Seu planejamento financeiro</span></div>
      <header className="navbar">
        <div className="desktop-tools"><div id="newEntry" hidden/></div>
        <span className="it" id="it"/><span className="month-caption" id="currentMonth"/>
        <span id="monthStatus" className="month-status"/>
      </header>
      <div className="cloud-status" data-cloud-panel hidden><span className="cloud-status-dot" aria-hidden="true"/><span data-cloud-message role="status" aria-live="polite"/><GlassButton className="btn g te-glass-button" data-cloud-retry type="button">Atualizar</GlassButton><GlassButton className="btn g te-glass-button" data-cloud-settings type="button" data-cloud-conflict hidden>Revisar</GlassButton></div>
      <div id="summaryToolbar" className="summary-toolbar"><div id="summaryModes"/><div id="settingsTop" className="settings-top"/><MonthPicker/></div>
      <div id="appNotice" className="app-notice" role="status" hidden/>
      <p id="closedMonthNotice" className="closed-month-notice" role="status" hidden>Mês encerrado · somente leitura.</p><div id="app"/>
    </div></main>
    <div className="nav-shell" id="navShell"><h1 className="t-lg" id="lt" tabIndex={-1}/><div className="top-account-actions"><FinanceOptionBar as="div" className="account-bubbles account-toolbar" role="toolbar" aria-label="Conta, calendário e notificações"><GlassActionHost className="app-symbol" type="button" aria-label="Abrir perfil" aria-haspopup="dialog" aria-controls="accountOverlay" aria-expanded="false"/><GlassActionHost id="calendarButton" className="ib calendar-button" type="button" aria-label="Calendário" aria-haspopup="dialog" aria-controls="accountOverlay" aria-expanded="false"/><GlassActionHost id="notificationButton" className="ib notification-button" type="button" aria-label="Notificações" aria-controls="notificationPanel"/></FinanceOptionBar><ToolbarSearch/><MobileExperience/></div><div className="rail-scene" aria-hidden="true"/><BottomNavigation/></div>
  </div>
  <dialog id="accountOverlay" className="account-overlay" aria-labelledby="accountOverlayTitle"><div id="accountOverlayContent"/></dialog>
  <div className="scrim" id="scrim" hidden/>
  <NotificationCenter/>
</>;}
