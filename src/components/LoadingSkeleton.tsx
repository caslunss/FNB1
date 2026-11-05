
export default function LoadingSkeleton({label = 'Carregando conteúdo…'}) {
  return <div className="loading-skeleton" role="status" aria-busy="true" aria-label={label}>
    <span className="loading-skeleton-line" aria-hidden="true"/>
    <span className="loading-skeleton-value" aria-hidden="true"/>
    <span className="loading-skeleton-chart" aria-hidden="true"/>
    <span className="loading-skeleton-line" aria-hidden="true"/>
  </div>;
}
