import React, {Component, Suspense, lazy} from 'react';
import {FinanceGlassButton as Button, FinanceGlassCard as Card} from './LiquidControls.jsx';

const loaders = {
  investments: () => import('./InvestmentArea.jsx'),
  taxes: () => import('./Taxes.jsx'),
};
const pages = Object.fromEntries(Object.entries(loaders).map(([name, load]) => [name, lazy(load)]));

class PageLoadBoundary extends Component {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (this.state.failed) return <Card className="card deferred-page-status"><p role="alert">Não foi possível abrir esta página. Seus dados foram mantidos.</p><Button type="button" onClick={() => location.reload()}>Recarregar</Button></Card>;
    return this.props.children;
  }
}

// Financial forms and the synchronous controller stay outside Suspense.
export default function DeferredPage({page}) {
  const Page = pages[page];
  return <PageLoadBoundary key={page}><Suspense fallback={<Card className="card deferred-page-status" data-page-loading aria-busy="true"><p role="status">Carregando…</p></Card>}><Page/></Suspense></PageLoadBoundary>;
}
