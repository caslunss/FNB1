import type { WorkspaceViewContext } from '../../types/views';
export function analysisView(context: WorkspaceViewContext) {
  const { areaNavigation, areaViews, reportsView } = context;
  return (
    <>
      {areaNavigation('analysis', 'Seções de análises')}
      <div className="area-content analysis-content">
        {areaViews.analysis === 'reports' ? (
          reportsView()
        ) : (
          <div data-taxes-hub=""></div>
        )}
      </div>
    </>
  );
}
// end-view:analysisView
