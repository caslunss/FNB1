import LoadingSkeleton from './LoadingSkeleton.tsx';
import React, {Component, Suspense, lazy, memo} from 'react';
import {FinanceGlassButton as Button, FinanceGlassCard as Card} from './LiquidControls.tsx';

const loaders = {
  productGoals: () => import('./ProductGoals.tsx'),
  taxes: () => import('./Taxes.tsx'),
  bank: () => import('./TaxBankImport.tsx'),
};
const pages = Object.fromEntries(Object.entries(loaders).map(([name, load]) => [name, lazy(load)]));

class PageLoadBoundary extends Component<React.PropsWithChildren> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (this.state.failed) return <Card className="card deferred-page-status"><p role="alert">Não foi possível abrir esta página. Seus dados foram mantidos.</p><Button type="button" onClick={() => location.reload()}>Recarregar</Button></Card>;
    return this.props.children;
  }
}

// Financial forms and the synchronous controller stay outside Suspense.
export default memo(function DeferredPage({page, ...props}:{page:keyof typeof loaders;onImported?:(rows:import('../types/finance-runtime').BankImportRow[])=>Promise<void>}) {
  const Page = pages[page];
  return <PageLoadBoundary key={page}><Suspense fallback={<Card className="card deferred-page-status" data-page-loading aria-busy="true"><LoadingSkeleton/></Card>}><Page {...props}/></Suspense></PageLoadBoundary>;
});
