import type { WorkspaceSnapshot } from './workspace';
import type { CloudState } from './browser';
export interface WorkspaceEnvelope {
  schemaVersion: 3;
  moneyUnit: 'centavos';
  data: WorkspaceSnapshot;
  recovery?: unknown[];
}
export interface SyncRow {
  record: unknown;
  revision: number;
  updated_at?: string;
}
export interface SyncRemote {
  read(): Promise<SyncRow | null>;
  write(record: WorkspaceEnvelope, revision: number): Promise<SyncRow | null>;
}
export interface SyncOptions {
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  remote: SyncRemote;
  hash?: (value: unknown) => Promise<string>;
  onState?: (state: CloudState) => void;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout> | undefined) => void;
}
