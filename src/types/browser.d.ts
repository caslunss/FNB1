import type { FinanceServices } from './finance-runtime';
import type { SupabaseClient, User } from '@supabase/supabase-js';
export interface AuthConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
  googleClientId: string;
}
export interface AuthService {
  readonly client: SupabaseClient | undefined;
  readonly config: AuthConfig | undefined;
  readonly user: User | null;
  ready: Promise<AuthService>;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  key(key: string): string;
  hasAccess(): boolean;
  guestName(): string;
  useLocal(name: string): void;
  signIn(credential: string, nonce: string): Promise<void>;
  signOut(): Promise<void>;
  forgetDeletedAccount(): Promise<void>;
}
export interface CloudState {
  mode: string;
  lastSynced?: string | null;
  revision?: number;
  reason?: string;
  remoteRevision?: number;
}
export interface CloudHooks {
  canApply(): boolean;
  onRemote(text: string): void;
}
export interface CloudService {
  prepare(): Promise<CloudState>;
  stop(): Promise<unknown> | undefined;
  capture(text: string): void;
  connect(hooks: CloudHooks): void;
  flush(): Promise<CloudState> | undefined;
  readonly state: CloudState;
}
export interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        nonce: string;
        auto_select: boolean;
        use_fedcm_for_button: boolean;
        callback(response: { credential: string }): void;
      }): void;
      renderButton(
        host: HTMLElement,
        options: {
          type: string;
          theme: string;
          size: string;
          shape: string;
          text: string;
          locale: string;
          width: number;
        },
      ): void;
    };
  };
}
export interface OcrWorker {
  recognize(file: File): Promise<{ data: { text: string } }>;
  terminate(): Promise<void>;
}
export interface OcrService {
  createWorker(language: string): Promise<OcrWorker>;
}
declare global {
  var planAuth: AuthService;
  var planCloud: CloudService;
  var planFinanceChanged: (() => void) | undefined;
  var google: GoogleIdentity;
  var Tesseract: OcrService;
  interface WindowEventMap {
    'plan-theme-request': CustomEvent<string>;
    'plan-segment-request': CustomEvent<{ kind: string; value: string }>;
  }
  interface Window {
    planAuth: AuthService;
    planCloud: CloudService;
    google?: GoogleIdentity;
    Tesseract?: OcrService;
    planFinanceChanged?: () => void;
    planLoginTransition?: () => Promise<void>;
    planRouteMotion?: { run(commit: () => void): void };
    planClearTaxData?: () => Promise<unknown>;
    planTaxes: FinanceServices['taxes'];
    planCredit: FinanceServices['credit'];
    planProductGoals: FinanceServices['productGoals'];
    planGoal: FinanceServices['goal'];
    planMobile: FinanceServices['mobile'];
    planNotifications: FinanceServices['notifications'];
  }
}
