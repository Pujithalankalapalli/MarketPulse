import { StockQuote, MarketIndex, MarketNews, StockHistoryPoint } from '../types.js';

export interface IMarketDataProvider {
  readonly name: string;
  getQuotes(symbols: string[]): Promise<StockQuote[]>;
  getQuote(symbol: string): Promise<StockQuote | null>;
  getHistory(symbol: string, range?: '1D' | '1W' | '1M' | '1Y'): Promise<StockHistoryPoint[]>;
  getIndices(): Promise<MarketIndex[]>;
  getNews(symbols?: string[]): Promise<MarketNews[]>;
  search(query: string): Promise<{ symbol: string; name: string; sector: string; price: number }[]>;
  
  // Simulation methods for Hackathon / Demo Mode
  simulateChanges?(changes: Record<string, { pctChange: number; volumeMult?: number; newsHeadline?: string; newsImportance?: 'low' | 'medium' | 'high' }>): void;
  resetSimulation?(): void;
  getActiveSimulations?(): Record<string, any>;
}
