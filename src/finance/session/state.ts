import type { WorkspaceRuntime } from './contracts';
import { SessionScope } from './scope';
import { releaseWorkspacePresentation } from './teardown';

// Field contracts live in one interface; initialization belongs to each domain.
export interface WorkspaceSession extends WorkspaceRuntime {}
export class WorkspaceSession {
  readonly scope = new SessionScope();
  renderView: WorkspaceRuntime['renderView'];

  constructor(
    renderer: WorkspaceRuntime['renderView'],
    disposeViews: (targets: Iterable<HTMLElement>) => void,
  ) {
    const targets = new Set<HTMLElement>();
    this.renderView = (target, content) => {
      if (this.scope.disposed) return;
      if (target) targets.add(target);
      renderer(target, content);
    };
    this.scope.own(() => disposeViews(targets));
    this.scope.own(releaseWorkspacePresentation);
  }

  dispose() {
    this.scope.dispose();
  }
}
