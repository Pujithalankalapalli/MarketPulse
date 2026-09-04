import { IMarketDataProvider } from './marketDataProvider.js';
import { StockQuote, MarketIndex, MarketNews, StockHistoryPoint } from '../types.js';

interface StockBase {
  symbol: string;
  name: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  basePrice: number;
  avgVolume: number;
  volatility: number;
}

const STOCK_CATALOG: StockBase[] = [
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE', basePrice: 3880.0, avgVolume: 2200000, volatility: 1.4 },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy & Petrochem', exchange: 'NSE', basePrice: 2950.0, avgVolume: 5600000, volatility: 1.8 },
  { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT', exchange: 'NSE', basePrice: 1620.0, avgVolume: 4800000, volatility: 1.6 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Banking', exchange: 'NSE', basePrice: 1680.0, avgVolume: 12000000, volatility: 1.3 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Banking', exchange: 'NSE', basePrice: 1210.0, avgVolume: 9500000, volatility: 1.5 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', sector: 'Automotive', exchange: 'NSE', basePrice: 990.0, avgVolume: 8200000, volatility: 2.3 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', sector: 'Financial Services', exchange: 'NSE', basePrice: 7150.0, avgVolume: 1100000, volatility: 2.1 },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', exchange: 'NSE', basePrice: 485.0, avgVolume: 14000000, volatility: 0.9 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE', basePrice: 810.0, avgVolume: 11500000, volatility: 1.7 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom', exchange: 'NSE', basePrice: 1540.0, avgVolume: 4100000, volatility: 1.5 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', exchange: 'NSE', basePrice: 2420.0, avgVolume: 1300000, volatility: 1.1 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', exchange: 'NSE', basePrice: 3580.0, avgVolume: 1900000, volatility: 1.6 },
  { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'IT', exchange: 'NSE', basePrice: 530.0, avgVolume: 3500000, volatility: 1.8 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT', exchange: 'NSE', basePrice: 1720.0, avgVolume: 2400000, volatility: 1.5 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', exchange: 'NSE', basePrice: 1780.0, avgVolume: 3200000, volatility: 1.4 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ltd', sector: 'Pharma', exchange: 'NSE', basePrice: 1820.0, avgVolume: 1800000, volatility: 1.2 },
  { symbol: 'TITAN', name: 'Titan Company Limited', sector: 'Consumer Goods', exchange: 'NSE', basePrice: 3620.0, avgVolume: 1100000, volatility: 1.7 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Automotive', exchange: 'NSE', basePrice: 12400.0, avgVolume: 550000, volatility: 1.5 },
];

const BASE_NEWS: MarketNews[] = [
  {
    id: 'n_tcs_1',
    symbol: 'TCS',
    company: 'Tata Consultancy Services',
    headline: 'TCS wins $1.2B mega digital transformation deal with European banking consortium',
    summary: 'The 7-year deal involves modernizing cloud infrastructure and core transactional applications across 14 EU hubs.',
    category: 'Corporate Action',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    importance: 'high',
    source: 'Financial Times India',
  },
  {
    id: 'n_rel_1',
    symbol: 'RELIANCE',
    company: 'Reliance Industries Ltd.',
    headline: 'Crude refining margins contract 14% amid unexpected regional inventory buildup',
    summary: 'Global crack spreads hit 8-month low impacting domestic downstream refiners; petrochem realizations under pressure.',
    category: 'Market',
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    importance: 'high',
    source: 'Commodity Pulse',
  },
  {
    id: 'n_hdfc_1',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Limited',
    headline: 'RBI clears revised credit deposit ratio roadmap; liquidity normalization underway',
    summary: 'Central bank commentary reassures analysts on deposit mobilization targets for upcoming fiscal quarters.',
    category: 'Regulation',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    importance: 'medium',
    source: 'Mint Markets',
  },
  {
    id: 'n_infy_1',
    symbol: 'INFY',
    company: 'Infosys Limited',
    headline: 'Infosys expands Enterprise GenAI Topaz partnership with Fortune 50 health insurer',
    summary: 'Deployment of automated underwriting agents and HIPAA-compliant reasoning frameworks across claims processing.',
    category: 'Earnings',
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    importance: 'medium',
    source: 'TechCircle',
  },
  {
    id: 'n_tm_1',
    symbol: 'TATAMOTORS',
    company: 'Tata Motors Limited',
    headline: 'JLR global wholesale volumes climb 8.2% YoY driven by Range Rover plug-in demand',
    summary: 'Order book remains healthy at 135,000 units despite chip normalization across European supply lines.',
    category: 'Earnings',
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    importance: 'medium',
    source: 'AutoEconomic Review',
  },
];

export class MockMarketDataProvider implements IMarketDataProvider {
  readonly name = 'MockMarketDataProvider (NSE/BSE Realistic Demo Engine)';
  private simulations: Record<string, { pctChange: number; volumeMult?: number; newsHeadline?: string; newsImportance?: 'low' | 'medium' | 'high' }> = {};
  private injectedNews: MarketNews[] = [];
  private lastUpdate: Date = new Date();

  simulateChanges(changes: Record<string, { pctChange: number; volumeMult?: number; newsHeadline?: string; newsImportance?: 'low' | 'medium' | 'high' }>): void {
    this.simulations = { ...this.simulations, ...changes };
    this.lastUpdate = new Date();

    // If change includes a news headline, inject it into news feed
    Object.entries(changes).forEach(([symbol, item]) => {
      if (item.newsHeadline) {
        const stock = STOCK_CATALOG.find(s => s.symbol === symbol);
        const newsItem: MarketNews = {
          id: `sim_news_${Date.now()}_${symbol}`,
          symbol,
          company: stock ? stock.name : symbol,
          headline: item.newsHeadline,
          summary: `Breaking event logged for ${symbol} triggering active alert parameters and volume surge.`,
          category: 'Corporate Action',
          timestamp: new Date().toISOString(),
          importance: item.newsImportance || 'high',
          source: 'MarketPulse Live Wire',
        };
        this.injectedNews.unshift(newsItem);
      }
    });
  }

  resetSimulation(): void {
    this.simulations = {};
    this.injectedNews = [];
    this.lastUpdate = new Date();
  }

  getActiveSimulations(): Record<string, any> {
    return { ...this.simulations };
  }

  async getQuotes(symbols: string[]): Promise<StockQuote[]> {
    const uppercaseSymbols = symbols.map(s => s.toUpperCase());
    const matched = STOCK_CATALOG.filter(s => uppercaseSymbols.includes(s.symbol));
    const now = new Date();

    return matched.map(stock => {
      const sim = this.simulations[stock.symbol];
      let pctChange = 0;
      let volumeMultiplier = 1.0;

      if (sim) {
        pctChange = sim.pctChange;
        volumeMultiplier = sim.volumeMult ?? (Math.abs(pctChange) > 2 ? 1.8 : 1.1);
      } else {
        // Natural subtle organic daily fluctuation between -0.8% and +0.9%
        const hash = stock.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const naturalShift = ((hash % 17) - 8) / 10;
        pctChange = naturalShift;
        volumeMultiplier = 0.95 + ((hash % 10) / 25);
      }

      const currentPrice = Number((stock.basePrice * (1 + pctChange / 100)).toFixed(2));
      const previousClose = stock.basePrice;
      const priceDiff = Number((currentPrice - previousClose).toFixed(2));
      const currentVolume = Math.round(stock.avgVolume * volumeMultiplier);

      const high = Number(Math.max(currentPrice, previousClose * 1.012).toFixed(2));
      const low = Number(Math.min(currentPrice, previousClose * 0.988).toFixed(2));
      const open = Number((previousClose * (1 + (pctChange * 0.3) / 100)).toFixed(2));

      return {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        exchange: stock.exchange,
        price: currentPrice,
        change: priceDiff,
        changePercent: Number(pctChange.toFixed(2)),
        previousClose,
        open,
        high,
        low,
        volume: currentVolume,
        avgVolume: stock.avgVolume,
        volatilityPct: stock.volatility,
        lastUpdated: this.lastUpdate.toISOString(),
        dataSource: 'NSE Direct Feed (Demo Mode)',
        freshness: 'Fresh',
      };
    });
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    const quotes = await this.getQuotes([symbol]);
    return quotes.length > 0 ? quotes[0] : null;
  }

  async getHistory(symbol: string, range: '1D' | '1W' | '1M' | '1Y' = '1D'): Promise<StockHistoryPoint[]> {
    const quote = await this.getQuote(symbol);
    const currentPrice = quote ? quote.price : 1000;
    const points: StockHistoryPoint[] = [];

    let count = 30;
    let timeStepMinutes = 15;

    if (range === '1D') {
      count = 26; // 9:15 AM to 3:30 PM (6.25 hrs, 15m intervals)
      timeStepMinutes = 15;
    } else if (range === '1W') {
      count = 35; // 5 days x 7 bars
      timeStepMinutes = 60;
    } else if (range === '1M') {
      count = 30; // 30 days
      timeStepMinutes = 1440;
    } else if (range === '1Y') {
      count = 52; // 52 weeks
      timeStepMinutes = 10080;
    }

    const now = Date.now();
    let runner = quote ? quote.previousClose : currentPrice * 0.98;
    const stepTargetChange = (currentPrice - runner) / count;

    for (let i = 0; i < count; i++) {
      const stepTime = new Date(now - (count - 1 - i) * timeStepMinutes * 60 * 1000).toISOString();
      const progress = i / (count - 1);
      
      // Random walk leading to currentPrice
      const noise = (Math.sin(i * 1.5) * (runner * 0.005)) + ((Math.random() - 0.48) * (runner * 0.004));
      runner += stepTargetChange + noise;

      if (i === count - 1) {
        runner = currentPrice;
      }

      const open = Number(runner.toFixed(2));
      const high = Number((runner * (1 + Math.random() * 0.003)).toFixed(2));
      const low = Number((runner * (1 - Math.random() * 0.003)).toFixed(2));
      const close = Number(runner.toFixed(2));
      const volume = Math.round((quote?.avgVolume || 1000000) / count * (0.8 + Math.random() * 0.5));

      points.push({
        timestamp: stepTime,
        price: close,
        open,
        high,
        low,
        close,
        volume,
      });
    }

    return points;
  }

  async getIndices(): Promise<MarketIndex[]> {
    // Derive index moves partly from simulated stocks (e.g. IT if TCS/INFY moved, BANK if HDFC moved)
    let niftyItShift = 0.4;
    let bankNiftyShift = 0.6;
    let niftyShift = 0.5;

    if (this.simulations['TCS'] || this.simulations['INFY']) {
      const itAvg = ((this.simulations['TCS']?.pctChange || 0) + (this.simulations['INFY']?.pctChange || 0)) / 2;
      niftyItShift = Number((itAvg * 0.85).toFixed(2));
    }
    if (this.simulations['HDFCBANK'] || this.simulations['ICICIBANK']) {
      const bankAvg = ((this.simulations['HDFCBANK']?.pctChange || 0) + (this.simulations['ICICIBANK']?.pctChange || 0)) / 2;
      bankNiftyShift = Number((bankAvg * 0.8).toFixed(2));
    }
    if (this.simulations['RELIANCE']) {
      niftyShift = Number(((niftyItShift * 0.3) + (bankNiftyShift * 0.35) + (this.simulations['RELIANCE'].pctChange * 0.35)).toFixed(2));
    } else {
      niftyShift = Number(((niftyItShift * 0.35) + (bankNiftyShift * 0.4)).toFixed(2));
    }

    const niftyVal = 24850.25 * (1 + niftyShift / 100);
    const sensexVal = 81340.50 * (1 + (niftyShift * 0.98) / 100);
    const itVal = 42120.10 * (1 + niftyItShift / 100);
    const bankVal = 51480.90 * (1 + bankNiftyShift / 100);

    const now = new Date().toISOString();

    return [
      {
        symbol: 'NIFTY 50',
        name: 'NIFTY 50',
        value: Number(niftyVal.toFixed(2)),
        change: Number((niftyVal - 24850.25).toFixed(2)),
        changePercent: niftyShift,
        direction: niftyShift > 0.05 ? 'up' : niftyShift < -0.05 ? 'down' : 'flat',
        lastUpdated: now,
      },
      {
        symbol: 'SENSEX',
        name: 'BSE SENSEX',
        value: Number(sensexVal.toFixed(2)),
        change: Number((sensexVal - 81340.50).toFixed(2)),
        changePercent: Number((niftyShift * 0.98).toFixed(2)),
        direction: niftyShift > 0.05 ? 'up' : niftyShift < -0.05 ? 'down' : 'flat',
        lastUpdated: now,
      },
      {
        symbol: 'NIFTY IT',
        name: 'NIFTY IT Sector',
        value: Number(itVal.toFixed(2)),
        change: Number((itVal - 42120.10).toFixed(2)),
        changePercent: niftyItShift,
        direction: niftyItShift > 0.05 ? 'up' : niftyItShift < -0.05 ? 'down' : 'flat',
        lastUpdated: now,
      },
      {
        symbol: 'NIFTY BANK',
        name: 'NIFTY Bank Sector',
        value: Number(bankVal.toFixed(2)),
        change: Number((bankVal - 51480.90).toFixed(2)),
        changePercent: bankNiftyShift,
        direction: bankNiftyShift > 0.05 ? 'up' : bankNiftyShift < -0.05 ? 'down' : 'flat',
        lastUpdated: now,
      },
    ];
  }

  async getNews(symbols?: string[]): Promise<MarketNews[]> {
    const combined = [...this.injectedNews, ...BASE_NEWS];
    if (!symbols || symbols.length === 0) {
      return combined;
    }
    const uppercase = symbols.map(s => s.toUpperCase());
    return combined.filter(n => uppercase.includes(n.symbol) || n.symbol === 'ALL');
  }

  async search(query: string): Promise<{ symbol: string; name: string; sector: string; price: number }[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return STOCK_CATALOG
      .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q))
      .map(s => {
        const sim = this.simulations[s.symbol];
        const price = sim ? Number((s.basePrice * (1 + sim.pctChange / 100)).toFixed(2)) : s.basePrice;
        return {
          symbol: s.symbol,
          name: s.name,
          sector: s.sector,
          price,
        };
      });
  }
}
