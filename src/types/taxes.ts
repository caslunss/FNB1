import type { FinancialExpense } from './finance';
export interface TaxItem {
  kind: 'produto' | 'servico';
  code: string;
  origin: string;
  ex: number;
  description: string;
  unit: string;
  unitValueCents: number;
  baseCents: number;
  gtin: string;
  draftBase?: string;
  draftUnit?: string;
}
export interface TaxInput {
  uf: string;
  merchantCnpj: string;
  cnae: string;
  documentTotalCents: number | null;
  documentName: string;
  items: TaxItem[];
}
export interface TaxCalculation {
  method: string;
  status: string;
  confidence?: string;
  totalCents: number | null;
  baseCents: number;
  coveredCents: number;
  federalCents?: number | null;
  stateCents?: number | null;
  municipalCents?: number | null;
  note?: string;
  references?: { source: string; version: string; validFrom: string; validUntil: string }[];
  pending?: { reason: string }[];
}
export interface TaxRecord {
  itemId: string;
  fingerprint: string;
  input: TaxInput;
  calculation: TaxCalculation;
  date: string;
  description: string;
  source: string;
  revision: number;
  updatedAt: string;
}
export interface TaxRow extends FinancialExpense {
  record?: TaxRecord;
  calculation: TaxCalculation | null;
  stale: boolean;
}
export interface BankAccount {
  id: string;
  name: string;
  type: string;
}
export interface TaxResponses {
  list: { records: TaxRecord[] };
  save: { record: TaxRecord };
  preview: { record: TaxRecord };
  status: { ibpt: boolean };
  'import-metadata': unknown;
  delete: unknown;
  clear: unknown;
}
export type TaxPreview = Partial<TaxCalculation> & { status: string; totalCents: number | null };
