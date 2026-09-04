export type AttentionSeverity = 'NORMAL' | 'WATCH' | 'IMPORTANT' | 'HIGH ATTENTION';

export type NewsSensitivity = 'low' | 'medium' | 'high';
export type AttentionPreference = 'conservative' | 'balanced' | 'sensitive';
export type DataMode = 'demo' | 'live';
export type FreshnessStatus = 'Fresh' | 'Recently Updated' | 'Stale' | 'Unavailable';

export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  volatilityPct: number;
  lastUpdated: string;
  dataSource: string;
  freshness: FreshnessStatus;
  discrepancyWarning?: string;
  alternativePrice?: {
    source: string;
    price: number;
    differencePct: number;
  };
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
  lastUpdated: string;
}

export type NewsCategory = 'Earnings' | 'Corporate Action' | 'Management' | 'Regulation' | 'Market' | 'General';

export interface MarketNews {
  id: string;
  symbol: string;
  company: string;
  headline: string;
  summary: string;
  category: NewsCategory;
  timestamp: string;
  importance: 'low' | 'medium' | 'high';
  source: string;
}

export interface SnapshotItem {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  sectorValue?: number;
  marketValue?: number;
  timestamp: string;
}

export interface MarketSnapshot {
  id: string;
  watchlistId: string;
  userId: string;
  timestamp: string;
  note?: string;
  items: Record<string, SnapshotItem>;
  marketIndices: Record<string, number>;
}

export interface UserSettings {
  priceThreshold: number; // e.g. 2.0 (%)
  volumeThreshold: number; // e.g. 1.5 (x avg)
  newsSensitivity: NewsSensitivity;
  attentionPreference: AttentionPreference;
  dataMode: DataMode;
  autoSnapshotOnVisit: boolean;
}

export interface ChangeFactor {
  type: 'price' | 'volume' | 'volatility' | 'sector' | 'market' | 'news';
  label: string;
  score: number;
  weight: number;
  triggered: boolean;
  metric: string;
  description: string;
}

export interface MeaningfulChange {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  previousPrice: number;
  priceDiff: number;
  pctChangeSinceSnapshot: number;
  dailyPctChange: number;
  currentVolume: number;
  avgVolume: number;
  volumeMultiplier: number;
  changeScore: number; // 0 to 100
  severity: AttentionSeverity;
  factors: ChangeFactor[];
  explanation: string;
  timestamp: string;
  snapshotTimestamp: string;
  freshness: FreshnessStatus;
  discrepancyWarning?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  isDefault: boolean;
  symbols: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StockHistoryPoint {
  timestamp: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
