import { 
  Watchlist, 
  StockQuote, 
  MarketIndex, 
  MarketNews, 
  MeaningfulChange, 
  UserSettings, 
  StockHistoryPoint 
} from '../types/index.js';

export interface ChangesResponse {
  data: MeaningfulChange[];
  metadata: {
    watchlistId: string;
    watchlistName: string;
    totalTracked: number;
    meaningfulCount: number;
    highAttentionCount: number;
    importantCount: number;
    watchCount: number;
    snapshotTimestamp: string;
    snapshotNote: string;
  };
}

export const api = {
  // Watchlists
  async getWatchlists(): Promise<Watchlist[]> {
    const res = await fetch('/api/watchlists');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch watchlists');
    return json.data;
  },

  async createWatchlist(name: string, symbols: string[] = []): Promise<Watchlist> {
    const res = await fetch('/api/watchlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, symbols }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create watchlist');
    return json.data;
  },

  async updateWatchlist(id: string, updates: Partial<Watchlist>): Promise<Watchlist> {
    const res = await fetch(`/api/watchlists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update watchlist');
    return json.data;
  },

  async deleteWatchlist(id: string): Promise<void> {
    const res = await fetch(`/api/watchlists/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete watchlist');
  },

  async addStockToWatchlist(watchlistId: string, symbol: string): Promise<Watchlist> {
    const res = await fetch(`/api/watchlists/${watchlistId}/stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to add stock');
    return json.data;
  },

  async removeStockFromWatchlist(watchlistId: string, symbol: string): Promise<Watchlist> {
    const res = await fetch(`/api/watchlists/${watchlistId}/stocks/${symbol}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to remove stock');
    return json.data;
  },

  async reorderWatchlist(watchlistId: string, symbols: string[]): Promise<Watchlist> {
    const res = await fetch(`/api/watchlists/${watchlistId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to reorder stocks');
    return json.data;
  },

  // Market & Quotes
  async getMarketOverview(): Promise<{ indices: MarketIndex[]; mode: string; marketStatus: string; lastUpdated: string }> {
    const res = await fetch('/api/market/overview');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load market overview');
    return json.data;
  },

  async getWatchlistQuotes(watchlistId: string): Promise<StockQuote[]> {
    const res = await fetch(`/api/watchlists/${watchlistId}/stocks`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load watchlist quotes');
    return json.data;
  },

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const res = await fetch(`/api/stocks/${symbol}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || `Failed to fetch quote for ${symbol}`);
    return json.data;
  },

  async getStockHistory(symbol: string, range: '1D' | '1W' | '1M' | '1Y' = '1D'): Promise<StockHistoryPoint[]> {
    const res = await fetch(`/api/stocks/${symbol}/history?range=${range}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch history');
    return json.data;
  },

  // Meaningful Changes & Snapshots
  async getChanges(watchlistId?: string): Promise<ChangesResponse> {
    const url = watchlistId ? `/api/changes?watchlistId=${watchlistId}` : '/api/changes';
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch changes');
    return { data: json.data, metadata: json.metadata };
  },

  async getStockChange(symbol: string): Promise<MeaningfulChange> {
    const res = await fetch(`/api/changes/${symbol}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch stock change details');
    return json.data;
  },

  async saveSnapshot(watchlistId?: string, note?: string): Promise<any> {
    const res = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchlistId, note }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to save snapshot');
    return json.data;
  },

  // News & Settings
  async getNews(symbols?: string[]): Promise<MarketNews[]> {
    const url = symbols && symbols.length > 0 ? `/api/news?symbols=${symbols.join(',')}` : '/api/news';
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch news');
    return json.data;
  },

  async getSettings(): Promise<UserSettings> {
    const res = await fetch('/api/settings');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch settings');
    return json.data;
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update settings');
    return json.data;
  },

  async searchStocks(query: string): Promise<{ symbol: string; name: string; sector: string; price: number }[]> {
    if (!query || query.trim().length === 0) return [];
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!json.success) return [];
    return json.data;
  },

  // Demo Simulation
  async simulateChanges(scenario?: string, customChanges?: any): Promise<void> {
    const res = await fetch('/api/demo/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, customChanges }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to run simulation');
  },

  async resetSimulation(): Promise<void> {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to reset simulation');
  },

  // AI Summary
  async getAiSummary(watchlistId?: string): Promise<{ summary: string; provider: 'gemini' | 'deterministic' }> {
    const url = watchlistId ? `/api/summary/ai?watchlistId=${watchlistId}` : '/api/summary/ai';
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) return { summary: 'Market summary unavailable', provider: 'deterministic' };
    return json.data;
  },
};
