import { IMarketDataProvider } from './marketDataProvider.js';
import { MockMarketDataProvider } from './mockDataProvider.js';
import { LiveMarketDataProvider } from './liveDataProvider.js';
import { StockQuote, MarketIndex, MarketNews, StockHistoryPoint, DataMode } from '../types.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class DataProviderManager {
  private mockProvider: MockMarketDataProvider;
  private liveProvider: LiveMarketDataProvider;
  private activeMode: DataMode = 'demo';

  // In-memory multi-tiered cache
  private quotesCache = new Map<string, CacheEntry<StockQuote>>();
  private indicesCache: CacheEntry<MarketIndex[]> | null = null;
  private newsCache: CacheEntry<MarketNews[]> | null = null;

  constructor() {
    this.mockProvider = new MockMarketDataProvider();
    this.liveProvider = new LiveMarketDataProvider();
  }

  setMode(mode: DataMode) {
    this.activeMode = mode;
    this.invalidateQuotes();
  }

  getMode(): DataMode {
    return this.activeMode;
  }

  private getProvider(): IMarketDataProvider {
    return this.activeMode === 'live' ? this.liveProvider : this.mockProvider;
  }

  invalidateQuotes() {
    this.quotesCache.clear();
    this.indicesCache = null;
    this.newsCache = null;
  }

  async getQuotes(symbols: string[]): Promise<StockQuote[]> {
    const now = Date.now();
    const uncachedSymbols: string[] = [];
    const result: StockQuote[] = [];

    // Check cache (15s TTL for quotes)
    for (const sym of symbols) {
      const entry = this.quotesCache.get(sym.toUpperCase());
      if (entry && (now - entry.timestamp < entry.ttlMs)) {
        result.push(entry.data);
      } else {
        uncachedSymbols.push(sym.toUpperCase());
      }
    }

    if (uncachedSymbols.length > 0) {
      const provider = this.getProvider();
      try {
        const fresh = await provider.getQuotes(uncachedSymbols);
        for (const q of fresh) {
          this.quotesCache.set(q.symbol, {
            data: q,
            timestamp: now,
            ttlMs: 15000,
          });
          result.push(q);
        }
      } catch (err) {
        console.error('Error fetching quotes from provider, attempting cached or fallback data:', err);
        // Resilient fallback: return whatever expired cached entry we have
        for (const sym of uncachedSymbols) {
          const expired = this.quotesCache.get(sym);
          if (expired) {
            result.push({
              ...expired.data,
              freshness: 'Stale',
              discrepancyWarning: 'Provider temporary outage: serving last verified quote.',
            });
          }
        }
      }
    }

    // Preserve the order of requested symbols
    const symMap = new Map(result.map(q => [q.symbol, q]));
    return symbols.map(s => symMap.get(s.toUpperCase())).filter((q): q is StockQuote => Boolean(q));
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    const quotes = await this.getQuotes([symbol]);
    return quotes.length > 0 ? quotes[0] : null;
  }

  async getHistory(symbol: string, range?: '1D' | '1W' | '1M' | '1Y'): Promise<StockHistoryPoint[]> {
    return this.getProvider().getHistory(symbol, range);
  }

  async getIndices(): Promise<MarketIndex[]> {
    const now = Date.now();
    if (this.indicesCache && (now - this.indicesCache.timestamp < this.indicesCache.ttlMs)) {
      return this.indicesCache.data;
    }
    const data = await this.getProvider().getIndices();
    this.indicesCache = { data, timestamp: now, ttlMs: 10000 };
    return data;
  }

  async getNews(symbols?: string[]): Promise<MarketNews[]> {
    const now = Date.now();
    if (!symbols && this.newsCache && (now - this.newsCache.timestamp < this.newsCache.ttlMs)) {
      return this.newsCache.data;
    }
    const data = await this.getProvider().getNews(symbols);
    if (!symbols) {
      this.newsCache = { data, timestamp: now, ttlMs: 30000 };
    }
    return data;
  }

  async search(query: string) {
    return this.getProvider().search(query);
  }

  simulateChanges(changes: Record<string, { pctChange: number; volumeMult?: number; newsHeadline?: string; newsImportance?: 'low' | 'medium' | 'high' }>) {
    this.invalidateQuotes();
    this.mockProvider.simulateChanges(changes);
    this.liveProvider.simulateChanges(changes);
  }

  resetSimulation() {
    this.invalidateQuotes();
    this.mockProvider.resetSimulation();
    this.liveProvider.resetSimulation();
  }

  getActiveSimulations() {
    return this.mockProvider.getActiveSimulations();
  }
}

export const providerManager = new DataProviderManager();
