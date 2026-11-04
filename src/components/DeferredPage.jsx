import LoadingSkeleton from './LoadingSkeleton.jsx';
import React, {Component, Suspense, lazy, memo} from 'react';
import {FinanceGlassButton as Button, FinanceGlassCard as Card} from './LiquidControls.jsx';

const loaders = {
  productGoals: () => import('./ProductGoals.jsx'),
  investments: () => import('./InvestmentArea.jsx'),
  taxes: () => import('./Taxes.jsx'),
  bank: () => import('./TaxBankImport.jsx'),
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
export default memo(function DeferredPage({page, ...props}) {
  const Page = pages[page];
  return <PageLoadBoundary key={page}><Suspense fallback={<Card className="card deferred-page-status" data-page-loading aria-busy="true"><LoadingSkeleton/></Card>}><Page {...props}/></Suspense></PageLoadBoundary>;
});
