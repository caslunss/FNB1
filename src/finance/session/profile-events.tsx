import type {WorkspaceRuntime} from './contracts';

export function initializeProfileEvents(workspace:Pick<WorkspaceRuntime,'scope'|'draw'>){
  workspace.scope.listen(window,'plan-profile-appearance-change',()=>workspace.draw());
}
