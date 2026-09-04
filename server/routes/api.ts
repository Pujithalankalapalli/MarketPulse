import { Router, Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { providerManager } from '../providers/dataProviderManager.js';
import { changeEngine } from '../engine/changeEngine.js';
import { generateExecutiveSummary } from '../gemini.js';
import { MarketSnapshot, SnapshotItem } from '../types.js';

export const apiRouter = Router();

// ==========================================
// 1. WATCHLISTS
// ==========================================
apiRouter.get('/watchlists', async (req: Request, res: Response) => {
  try {
    const watchlists = await repository.getWatchlists();
    res.json({ success: true, data: watchlists });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/watchlists', async (req: Request, res: Response) => {
  try {
    const { name, symbols } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Watchlist name is required' });
    }
    const created = await repository.createWatchlist(name, symbols || []);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/watchlists/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await repository.updateWatchlist(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Watchlist not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/watchlists/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await repository.deleteWatchlist(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Watchlist not found' });
    }
    res.json({ success: true, message: 'Watchlist deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stocks within Watchlist
apiRouter.get('/watchlists/:id/stocks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const watchlist = await repository.getWatchlist(id);
    if (!watchlist) {
      return res.status(404).json({ success: false, error: 'Watchlist not found' });
    }

    const quotes = await providerManager.getQuotes(watchlist.symbols);
    res.json({ success: true, data: quotes, symbols: watchlist.symbols });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/watchlists/:id/stocks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { symbol } = req.body;
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid stock symbol is required' });
    }
    const cleanSym = symbol.toUpperCase().trim();
    const updated = await repository.addStockToWatchlist(id, cleanSym);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Watchlist not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/watchlists/:id/stocks/:symbol', async (req: Request, res: Response) => {
  try {
    const { id, symbol } = req.params;
    const updated = await repository.removeStockFromWatchlist(id, symbol);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Watchlist not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/watchlists/:id/reorder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
      return res.status(400).json({ success: false, error: 'Symbols array required' });
    }
    const updated = await repository.reorderWatchlistStocks(id, symbols);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. MARKET OVERVIEW & QUOTES
// ==========================================
apiRouter.get('/market/overview', async (req: Request, res: Response) => {
  try {
    const indices = await providerManager.getIndices();
    const mode = providerManager.getMode();
    res.json({
      success: true,
      data: {
        indices,
        mode,
        marketStatus: 'Market Open (NSE/BSE Regular Trading)',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/stocks/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const quote = await providerManager.getQuote(symbol.toUpperCase());
    if (!quote) {
      return res.status(404).json({ success: false, error: `Symbol ${symbol} not found` });
    }
    res.json({ success: true, data: quote });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/stocks/:symbol/history', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const range = (req.query.range as any) || '1D';
    const history = await providerManager.getHistory(symbol.toUpperCase(), range);
    res.json({ success: true, data: history, symbol: symbol.toUpperCase(), range });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. MEANINGFUL CHANGE ENGINE & SNAPSHOTS
// ==========================================
apiRouter.get('/changes', async (req: Request, res: Response) => {
  try {
    const watchlistId = req.query.watchlistId as string;
    let watchlist;
    if (watchlistId) {
      watchlist = await repository.getWatchlist(watchlistId);
    } else {
      const all = await repository.getWatchlists();
      watchlist = all.find(w => w.isDefault) || all[0];
    }

    if (!watchlist) {
      return res.json({ success: true, data: [], summary: 'No watchlist available' });
    }

    const settings = await repository.getSettings();
    const quotes = await providerManager.getQuotes(watchlist.symbols);
    const indices = await providerManager.getIndices();
    const news = await providerManager.getNews(watchlist.symbols);

    // Retrieve previous snapshot
    let snapshot = await repository.getLatestSnapshot(watchlist.id);
    let previousSnapshotItems: Record<string, SnapshotItem> = {};
    let snapshotTimestamp = new Date(Date.now() - 3600000).toISOString();

    if (!snapshot) {
      // Auto-bootstrap an initial baseline snapshot so comparison is immediately ready
      const initialItems: Record<string, SnapshotItem> = {};
      quotes.forEach(q => {
        initialItems[q.symbol] = {
          symbol: q.symbol,
          price: q.previousClose,
          changePercent: 0,
          volume: q.avgVolume,
          avgVolume: q.avgVolume,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        };
      });

      const newSnapshot: MarketSnapshot = {
        id: `snap_${Date.now()}`,
        watchlistId: watchlist.id,
        userId: 'default_user',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        note: 'Baseline morning snapshot',
        items: initialItems,
        marketIndices: indices.reduce((acc, idx) => ({ ...acc, [idx.symbol]: idx.value }), {}),
      };
      snapshot = await repository.saveSnapshot(newSnapshot);
    }

    previousSnapshotItems = snapshot.items;
    snapshotTimestamp = snapshot.timestamp;

    // Run Meaningful Change Engine
    const changes = changeEngine.evaluate({
      quotes,
      previousSnapshotItems,
      indices,
      news,
      settings,
      snapshotTimestamp,
    });

    // Sort changes: HIGH ATTENTION first, then IMPORTANT, then WATCH, then NORMAL
    const severityOrder = {
      'HIGH ATTENTION': 4,
      'IMPORTANT': 3,
      'WATCH': 2,
      'NORMAL': 1,
    };
    changes.sort((a, b) => {
      const diff = severityOrder[b.severity] - severityOrder[a.severity];
      if (diff !== 0) return diff;
      return b.changeScore - a.changeScore;
    });

    const highAttentionCount = changes.filter(c => c.severity === 'HIGH ATTENTION').length;
    const importantCount = changes.filter(c => c.severity === 'IMPORTANT').length;
    const watchCount = changes.filter(c => c.severity === 'WATCH').length;
    const meaningfulCount = highAttentionCount + importantCount;

    res.json({
      success: true,
      data: changes,
      metadata: {
        watchlistId: watchlist.id,
        watchlistName: watchlist.name,
        totalTracked: watchlist.symbols.length,
        meaningfulCount,
        highAttentionCount,
        importantCount,
        watchCount,
        snapshotTimestamp,
        snapshotNote: snapshot.note || 'Last saved snapshot',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/changes/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const cleanSym = symbol.toUpperCase();
    const quote = await providerManager.getQuote(cleanSym);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Stock not found' });
    }

    const settings = await repository.getSettings();
    const indices = await providerManager.getIndices();
    const news = await providerManager.getNews([cleanSym]);

    // Check recent snapshot
    const watchlists = await repository.getWatchlists();
    const parentWl = watchlists.find(w => w.symbols.includes(cleanSym)) || watchlists[0];
    const snapshot = parentWl ? await repository.getLatestSnapshot(parentWl.id) : null;

    const previousSnapshotItems = snapshot ? snapshot.items : {
      [cleanSym]: {
        symbol: cleanSym,
        price: quote.previousClose,
        changePercent: 0,
        volume: quote.avgVolume,
        avgVolume: quote.avgVolume,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    };

    const changes = changeEngine.evaluate({
      quotes: [quote],
      previousSnapshotItems,
      indices,
      news,
      settings,
      snapshotTimestamp: snapshot ? snapshot.timestamp : new Date(Date.now() - 3600000).toISOString(),
    });

    res.json({ success: true, data: changes[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Snapshot Save & History
apiRouter.post('/snapshots', async (req: Request, res: Response) => {
  try {
    const { watchlistId, note } = req.body;
    let targetWlId = watchlistId;
    if (!targetWlId) {
      const all = await repository.getWatchlists();
      targetWlId = (all.find(w => w.isDefault) || all[0])?.id;
    }
    const wl = await repository.getWatchlist(targetWlId);
    if (!wl) {
      return res.status(404).json({ success: false, error: 'Watchlist not found' });
    }

    const quotes = await providerManager.getQuotes(wl.symbols);
    const indices = await providerManager.getIndices();

    const snapshotItems: Record<string, SnapshotItem> = {};
    quotes.forEach(q => {
      snapshotItems[q.symbol] = {
        symbol: q.symbol,
        price: q.price,
        changePercent: q.changePercent,
        volume: q.volume,
        avgVolume: q.avgVolume,
        timestamp: new Date().toISOString(),
      };
    });

    const snapshot: MarketSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      watchlistId: wl.id,
      userId: 'default_user',
      timestamp: new Date().toISOString(),
      note: note || `Manual checkpoint (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      items: snapshotItems,
      marketIndices: indices.reduce((acc, idx) => ({ ...acc, [idx.symbol]: idx.value }), {}),
    };

    const saved = await repository.saveSnapshot(snapshot);
    res.status(201).json({ success: true, data: saved, message: 'Snapshot saved successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/snapshots/latest', async (req: Request, res: Response) => {
  try {
    const watchlistId = req.query.watchlistId as string;
    let targetId = watchlistId;
    if (!targetId) {
      const all = await repository.getWatchlists();
      targetId = (all.find(w => w.isDefault) || all[0])?.id;
    }
    const snapshot = await repository.getLatestSnapshot(targetId);
    res.json({ success: true, data: snapshot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/snapshots/history', async (req: Request, res: Response) => {
  try {
    const watchlistId = req.query.watchlistId as string;
    let targetId = watchlistId;
    if (!targetId) {
      const all = await repository.getWatchlists();
      targetId = (all.find(w => w.isDefault) || all[0])?.id;
    }
    const snapshots = await repository.getAllSnapshots(targetId);
    res.json({ success: true, data: snapshots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. NEWS & SETTINGS
// ==========================================
apiRouter.get('/news', async (req: Request, res: Response) => {
  try {
    const symbols = req.query.symbols ? (req.query.symbols as string).split(',') : undefined;
    const news = await providerManager.getNews(symbols);
    res.json({ success: true, data: news });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await repository.getSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const updated = await repository.updateSettings(updates);
    if (updates.dataMode) {
      providerManager.setMode(updates.dataMode);
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const results = await providerManager.search(q);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. DEMO MODE & SIMULATION ENGINE
// ==========================================
apiRouter.post('/demo/simulate', async (req: Request, res: Response) => {
  try {
    const { scenario, customChanges } = req.body;

    if (customChanges) {
      providerManager.simulateChanges(customChanges);
      return res.json({ success: true, message: 'Custom market movements simulated' });
    }

    // Standard preset scenarios for presentation & testing
    if (scenario === 'tech_rally_reliance_dip' || !scenario) {
      providerManager.simulateChanges({
        TCS: {
          pctChange: 2.4,
          volumeMult: 1.9,
          newsHeadline: 'TCS bags $1.2B European transformation deal; brokerages hike target price',
          newsImportance: 'high',
        },
        RELIANCE: {
          pctChange: -3.2,
          volumeMult: 1.85,
          newsHeadline: 'Crude refining crack spreads tumble 14% amid regional surplus buildup',
          newsImportance: 'high',
        },
        INFY: {
          pctChange: 0.8,
          volumeMult: 1.1,
        },
        HDFCBANK: {
          pctChange: 1.8,
          volumeMult: 1.6,
          newsHeadline: 'HDFC Bank credit growth accelerates with RBI liquidity normalization',
          newsImportance: 'medium',
        },
        ICICIBANK: {
          pctChange: 1.2,
          volumeMult: 1.3,
        },
        TATAMOTORS: {
          pctChange: -1.9,
          volumeMult: 1.4,
        },
      });
    } else if (scenario === 'banking_surge') {
      providerManager.simulateChanges({
        HDFCBANK: { pctChange: 3.1, volumeMult: 2.2, newsHeadline: 'FII inflows surge across top tier private banks', newsImportance: 'high' },
        ICICIBANK: { pctChange: 2.8, volumeMult: 1.9 },
        SBIN: { pctChange: 3.4, volumeMult: 2.0 },
        TCS: { pctChange: -0.5, volumeMult: 0.9 },
        RELIANCE: { pctChange: 0.4, volumeMult: 1.0 },
      });
    } else if (scenario === 'market_wide_volatility') {
      providerManager.simulateChanges({
        TCS: { pctChange: -3.5, volumeMult: 2.1, newsHeadline: 'Tech sector guidance trimmed amid macroeconomic softness', newsImportance: 'high' },
        RELIANCE: { pctChange: 2.9, volumeMult: 1.9 },
        TATAMOTORS: { pctChange: 4.2, volumeMult: 2.4, newsHeadline: 'Tata Motors announces strategic EV battery joint venture', newsImportance: 'high' },
        HDFCBANK: { pctChange: -2.4, volumeMult: 1.7 },
      });
    }

    res.json({
      success: true,
      message: 'Simulated market changes applied. Check "What Changed" to see intelligent scoring.',
      activeSimulations: providerManager.getActiveSimulations(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/demo/reset', async (req: Request, res: Response) => {
  try {
    providerManager.resetSimulation();
    res.json({ success: true, message: 'Market values reset to baseline.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. AI EXECUTIVE BRIEFING
// ==========================================
apiRouter.get('/summary/ai', async (req: Request, res: Response) => {
  try {
    const watchlistId = req.query.watchlistId as string;
    let watchlist;
    if (watchlistId) {
      watchlist = await repository.getWatchlist(watchlistId);
    } else {
      const all = await repository.getWatchlists();
      watchlist = all.find(w => w.isDefault) || all[0];
    }

    if (!watchlist) {
      return res.json({ success: true, data: { summary: 'No watchlist available' } });
    }

    const settings = await repository.getSettings();
    const quotes = await providerManager.getQuotes(watchlist.symbols);
    const indices = await providerManager.getIndices();
    const news = await providerManager.getNews(watchlist.symbols);
    const snapshot = await repository.getLatestSnapshot(watchlist.id);

    const previousSnapshotItems = snapshot ? snapshot.items : {};
    const changes = changeEngine.evaluate({
      quotes,
      previousSnapshotItems,
      indices,
      news,
      settings,
      snapshotTimestamp: snapshot ? snapshot.timestamp : new Date(Date.now() - 3600000).toISOString(),
    });

    const highPriorityCount = changes.filter(c => c.severity === 'HIGH ATTENTION').length;
    const importantCount = changes.filter(c => c.severity === 'IMPORTANT').length;

    const summaryResult = await generateExecutiveSummary({
      watchlistName: watchlist.name,
      changes,
      indices,
      highPriorityCount,
      importantCount,
    });

    res.json({ success: true, data: summaryResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
