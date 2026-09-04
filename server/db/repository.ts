import fs from 'fs';
import path from 'path';
import { Watchlist, MarketSnapshot, UserSettings } from '../types.js';

export interface IRepository {
  getWatchlists(): Promise<Watchlist[]>;
  getWatchlist(id: string): Promise<Watchlist | null>;
  createWatchlist(name: string, symbols?: string[]): Promise<Watchlist>;
  updateWatchlist(id: string, updates: Partial<Watchlist>): Promise<Watchlist | null>;
  deleteWatchlist(id: string): Promise<boolean>;
  addStockToWatchlist(watchlistId: string, symbol: string): Promise<Watchlist | null>;
  removeStockFromWatchlist(watchlistId: string, symbol: string): Promise<Watchlist | null>;
  reorderWatchlistStocks(watchlistId: string, symbols: string[]): Promise<Watchlist | null>;

  getLatestSnapshot(watchlistId: string): Promise<MarketSnapshot | null>;
  getAllSnapshots(watchlistId: string): Promise<MarketSnapshot[]>;
  saveSnapshot(snapshot: MarketSnapshot): Promise<MarketSnapshot>;

  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
}

interface DatabaseSchema {
  watchlists: Watchlist[];
  snapshots: MarketSnapshot[];
  settings: UserSettings;
}

const DEFAULT_SETTINGS: UserSettings = {
  priceThreshold: 2.0,
  volumeThreshold: 1.5,
  newsSensitivity: 'medium',
  attentionPreference: 'balanced',
  dataMode: 'demo',
  autoSnapshotOnVisit: true,
};

const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl_nifty_core',
    name: 'Core Holdings (NIFTY)',
    isDefault: true,
    symbols: ['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wl_tech_growth',
    name: 'Tech & Digital',
    isDefault: false,
    symbols: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wl_banking_finance',
    name: 'Banking & Financials',
    isDefault: false,
    symbols: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'BAJFINANCE'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export class FileDatabaseRepository implements IRepository {
  private dataDir: string;
  private filePath: string;
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, 'marketpulse_db.json');
    this.data = {
      watchlists: DEFAULT_WATCHLISTS,
      snapshots: [],
      settings: DEFAULT_SETTINGS,
    };
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('Repository file load warning, using in-memory fallback:', err);
      this.isLoaded = true;
    }
  }

  private persist(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  async getWatchlists(): Promise<Watchlist[]> {
    return [...this.data.watchlists];
  }

  async getWatchlist(id: string): Promise<Watchlist | null> {
    const wl = this.data.watchlists.find(w => w.id === id);
    return wl ? { ...wl } : null;
  }

  async createWatchlist(name: string, symbols: string[] = []): Promise<Watchlist> {
    const id = `wl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newWl: Watchlist = {
      id,
      name: name.trim(),
      isDefault: this.data.watchlists.length === 0,
      symbols: Array.from(new Set(symbols.map(s => s.toUpperCase().trim()))),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.watchlists.push(newWl);
    this.persist();
    return { ...newWl };
  }

  async updateWatchlist(id: string, updates: Partial<Watchlist>): Promise<Watchlist | null> {
    const idx = this.data.watchlists.findIndex(w => w.id === id);
    if (idx === -1) return null;

    if (updates.isDefault) {
      this.data.watchlists.forEach(w => {
        w.isDefault = false;
      });
    }

    const updated: Watchlist = {
      ...this.data.watchlists[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.watchlists[idx] = updated;
    this.persist();
    return { ...updated };
  }

  async deleteWatchlist(id: string): Promise<boolean> {
    const lenBefore = this.data.watchlists.length;
    this.data.watchlists = this.data.watchlists.filter(w => w.id !== id);
    if (this.data.watchlists.length > 0 && !this.data.watchlists.some(w => w.isDefault)) {
      this.data.watchlists[0].isDefault = true;
    }
    this.persist();
    return this.data.watchlists.length < lenBefore;
  }

  async addStockToWatchlist(watchlistId: string, symbol: string): Promise<Watchlist | null> {
    const wl = this.data.watchlists.find(w => w.id === watchlistId);
    if (!wl) return null;
    const cleanSym = symbol.toUpperCase().trim();
    if (!wl.symbols.includes(cleanSym)) {
      wl.symbols.push(cleanSym);
      wl.updatedAt = new Date().toISOString();
      this.persist();
    }
    return { ...wl };
  }

  async removeStockFromWatchlist(watchlistId: string, symbol: string): Promise<Watchlist | null> {
    const wl = this.data.watchlists.find(w => w.id === watchlistId);
    if (!wl) return null;
    const cleanSym = symbol.toUpperCase().trim();
    wl.symbols = wl.symbols.filter(s => s !== cleanSym);
    wl.updatedAt = new Date().toISOString();
    this.persist();
    return { ...wl };
  }

  async reorderWatchlistStocks(watchlistId: string, symbols: string[]): Promise<Watchlist | null> {
    const wl = this.data.watchlists.find(w => w.id === watchlistId);
    if (!wl) return null;
    wl.symbols = symbols.map(s => s.toUpperCase().trim());
    wl.updatedAt = new Date().toISOString();
    this.persist();
    return { ...wl };
  }

  async getLatestSnapshot(watchlistId: string): Promise<MarketSnapshot | null> {
    const filtered = this.data.snapshots
      .filter(s => s.watchlistId === watchlistId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return filtered.length > 0 ? { ...filtered[0] } : null;
  }

  async getAllSnapshots(watchlistId: string): Promise<MarketSnapshot[]> {
    return this.data.snapshots
      .filter(s => s.watchlistId === watchlistId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async saveSnapshot(snapshot: MarketSnapshot): Promise<MarketSnapshot> {
    // Keep max 50 snapshots per watchlist to prevent unbounded growth
    this.data.snapshots.push(snapshot);
    if (this.data.snapshots.length > 200) {
      this.data.snapshots = this.data.snapshots.slice(-100);
    }
    this.persist();
    return { ...snapshot };
  }

  async getSettings(): Promise<UserSettings> {
    return { ...this.data.settings };
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
    };
    this.persist();
    return { ...this.data.settings };
  }
}

export const repository = new FileDatabaseRepository();
