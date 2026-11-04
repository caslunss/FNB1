export interface HistoricalPrice {
  date: number;
  close: number | null;
}
export interface QuoteData {
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number | null;
  regularMarketChangePercent?: number | null;
  regularMarketTime?: string | number;
  historicalDataPrice?: HistoricalPrice[];
  cashDividends?: { label?: string; paymentDate?: string; rate?: number | null }[];
}
export interface QuoteResult {
  symbol?: string;
  requestedSymbol?: string;
  error?: string;
  data: QuoteData | null;
}
export interface FundResult {
  symbol: string;
  name?: string;
  price?: number | null;
  navPerShare?: number | null;
  priceToNav?: number | null;
  dividendYield12m?: number | null;
}
export interface CurrencyResult {
  fromCurrency: string;
  toCurrency: string;
  bidPrice?: number | string | null;
  askPrice?: number | string | null;
  updatedAtDate?: string;
}
export interface MacroResult {
  value?: number | string | null;
  date?: string;
}
export interface InvestmentResponse {
  checkedAt: string;
  data: {
    results?: QuoteResult[];
    fiis?: FundResult[];
    currency?: CurrencyResult[];
    inflation?: MacroResult[];
    'prime-rate'?: MacroResult[];
    primeRate?: MacroResult[];
  };
}
