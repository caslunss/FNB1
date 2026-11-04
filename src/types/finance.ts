/** Runtime validation remains mandatory at API/storage boundaries. */
export type Cents = number;
export interface FinancialExpense {
 id: string;
 description: string;
 cents: Cents;
 date: string;
 category: string;
}
export interface NotificationRow {
 id: string;
 text: string;
 tab: string;
 kind: 'expenses' | 'shares' | 'friends' | 'reports';
 date?: string;
 title?: string;
 subtitle?: string;
 amount?: string;
 recipient?: string;
 status?: string;
 error?: boolean;
 unread?: boolean;
}
export interface NotificationSnapshot {
 isOpen: boolean;
 rows: NotificationRow[];
}
export interface TaxPreviewOptions {
 reviewed?: boolean;
 configured?: boolean;
 revision?: number;
 signal?: AbortSignal;
}
