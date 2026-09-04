import React, { useState, useEffect, useCallback } from 'react';
import { 
  Watchlist, 
  StockQuote, 
  MarketIndex, 
  MarketNews, 
  MeaningfulChange, 
  UserSettings 
} from './types/index.js';
import { api, ChangesResponse } from './services/api.js';

import { Navbar } from './components/Navbar.js';
import { MarketTicker } from './components/MarketTicker.js';
import { HeroSection } from './components/HeroSection.js';
import { WhatChangedFeed } from './components/WhatChangedFeed.js';
import { WatchlistTable } from './components/WatchlistTable.js';
import { StockDetailModal } from './components/StockDetailModal.js';
import { SearchModal } from './components/SearchModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { DemoWalkthroughBar } from './components/DemoWalkthroughBar.js';
import { NewsFeed } from './components/NewsFeed.js';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Activity, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'changes' | 'watchlist' | 'news' | 'settings'>('dashboard');

  // Core Data State
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('');
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [changes, setChanges] = useState<MeaningfulChange[]>([]);
  const [changesMeta, setChangesMeta] = useState<ChangesResponse['metadata']>({
    watchlistId: '',
    watchlistName: 'Core Holdings (NIFTY)',
    totalTracked: 5,
    meaningfulCount: 0,
    highAttentionCount: 0,
    importantCount: 0,
    watchCount: 0,
    snapshotTimestamp: new Date().toISOString(),
    snapshotNote: 'Baseline',
  });
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [news, setNews] = useState<MarketNews[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    priceThreshold: 2.0,
    volumeThreshold: 1.5,
    newsSensitivity: 'medium',
    attentionPreference: 'balanced',
    dataMode: 'demo',
    autoSnapshotOnVisit: true,
  });

  // AI Market Summary
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'deterministic'>('deterministic');
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  // Modals & Inspection
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load: Watchlists, Settings, Market Overview
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wls, st, mo] = await Promise.all([
        api.getWatchlists(),
        api.getSettings(),
        api.getMarketOverview(),
      ]);

      setWatchlists(wls);
      setSettings(st);
      setIndices(mo.indices);

      const defaultWl = wls.find(w => w.isDefault) || wls[0];
      if (defaultWl) {
        setActiveWatchlistId(defaultWl.id);
      }
    } catch (err) {
      console.error('Initial data load failed:', err);
      showToast('Failed to initialize market data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Fetch Quotes, Changes, News whenever activeWatchlist changes
  const refreshWatchlistData = useCallback(async (targetWlId?: string) => {
    const id = targetWlId || activeWatchlistId;
    if (!id) return;

    try {
      const [q, c, n, mo] = await Promise.all([
        api.getWatchlistQuotes(id),
        api.getChanges(id),
        api.getNews(),
        api.getMarketOverview(),
      ]);

      setQuotes(q);
      setChanges(c.data);
      setChangesMeta(c.metadata);
      setNews(n);
      setIndices(mo.indices);
    } catch (err) {
      console.error('Watchlist data refresh failed:', err);
    }
  }, [activeWatchlistId]);

  useEffect(() => {
    if (activeWatchlistId) {
      refreshWatchlistData(activeWatchlistId);
    }
  }, [activeWatchlistId, refreshWatchlistData]);

  // 3. Fetch AI Market Summary when watchlist or meaningful changes update
  const changesSignature = `${activeWatchlistId}_${changesMeta.snapshotTimestamp}_${changes.map(c => `${c.symbol}:${c.severity}:${c.pctChangeSinceSnapshot.toFixed(1)}`).join(',')}`;

  useEffect(() => {
    let isCancelled = false;
    async function fetchSummary() {
      if (!activeWatchlistId) return;
      setIsLoadingSummary(true);
      try {
        const res = await api.getAiSummary(activeWatchlistId);
        if (!isCancelled) {
          setAiSummary(res.summary);
          setAiProvider(res.provider);
        }
      } catch {
        // Handled gracefully via fallback
      } finally {
        if (!isCancelled) setIsLoadingSummary(false);
      }
    }

    fetchSummary();
    return () => { isCancelled = true; };
  }, [activeWatchlistId, changesSignature]);

  // Keyboard shortcut ⌘K for Search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Handlers for Watchlist Operations
  const handleSelectWatchlist = (id: string) => {
    setActiveWatchlistId(id);
  };

  const handleCreateWatchlist = async (name: string) => {
    try {
      const newWl = await api.createWatchlist(name, ['TCS', 'INFY', 'RELIANCE']);
      setWatchlists(prev => [...prev, newWl]);
      setActiveWatchlistId(newWl.id);
      showToast(`Created watchlist "${name}"`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRenameWatchlist = async (id: string, name: string) => {
    try {
      const updated = await api.updateWatchlist(id, { name });
      setWatchlists(prev => prev.map(w => (w.id === id ? updated : w)));
      showToast(`Watchlist renamed to "${name}"`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    try {
      await api.deleteWatchlist(id);
      const remaining = watchlists.filter(w => w.id !== id);
      setWatchlists(remaining);
      if (activeWatchlistId === id && remaining.length > 0) {
        setActiveWatchlistId(remaining[0].id);
      }
      showToast('Watchlist removed');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddStock = async (symbol: string) => {
    if (!activeWatchlistId) return;
    try {
      const updated = await api.addStockToWatchlist(activeWatchlistId, symbol);
      setWatchlists(prev => prev.map(w => (w.id === activeWatchlistId ? updated : w)));
      await refreshWatchlistData(activeWatchlistId);
      showToast(`Added ${symbol} to watchlist`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRemoveStock = async (symbol: string) => {
    if (!activeWatchlistId) return;
    try {
      const updated = await api.removeStockFromWatchlist(activeWatchlistId, symbol);
      setWatchlists(prev => prev.map(w => (w.id === activeWatchlistId ? updated : w)));
      await refreshWatchlistData(activeWatchlistId);
      showToast(`Removed ${symbol} from watchlist`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleMoveStock = async (symbol: string, direction: 'up' | 'down') => {
    const currentWl = watchlists.find(w => w.id === activeWatchlistId);
    if (!currentWl) return;

    const list = [...currentWl.symbols];
    const idx = list.indexOf(symbol);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];

    try {
      const updated = await api.reorderWatchlist(activeWatchlistId, list);
      setWatchlists(prev => prev.map(w => (w.id === activeWatchlistId ? updated : w)));
      await refreshWatchlistData(activeWatchlistId);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handlers for Snapshots & Simulation
  const handleSaveSnapshot = async () => {
    try {
      const note = `Manual checkpoint (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      await api.saveSnapshot(activeWatchlistId, note);
      await refreshWatchlistData(activeWatchlistId);
      showToast('Baseline market snapshot updated successfully!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSimulateChanges = async (scenario?: string) => {
    setIsSimulating(true);
    try {
      await api.simulateChanges(scenario || 'tech_rally_reliance_dip');
      await refreshWatchlistData(activeWatchlistId);
      showToast('Market movements simulated! Inspect "What Changed" to see intelligent scoring.');
      setActiveTab('changes');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetMarket = async () => {
    try {
      await api.resetSimulation();
      await refreshWatchlistData(activeWatchlistId);
      showToast('Market quotes reset to baseline prices.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
    await refreshWatchlistData(activeWatchlistId);
    showToast('Personalization thresholds updated! Scores recalculated.');
  };

  // Quick lookup dictionary for changes
  const changesMap = React.useMemo(() => {
    return changes.reduce((acc, c) => {
      acc[c.symbol] = c;
      return acc;
    }, {} as Record<string, MeaningfulChange>);
  }, [changes]);

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSaveSnapshot={handleSaveSnapshot}
        onSimulateChanges={() => handleSimulateChanges()}
        onResetMarket={handleResetMarket}
        dataMode={settings.dataMode}
        isSimulating={isSimulating}
      />

      {/* Market Indices Ticker Bar */}
      <MarketTicker indices={indices} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Judge Demo Walkthrough Helper */}
        <DemoWalkthroughBar
          onSimulateScenario={sc => handleSimulateChanges(sc)}
          onResetMarket={handleResetMarket}
          onOpenChanges={() => setActiveTab('changes')}
          onSelectStock={sym => setSelectedStock(sym)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <HeroSection
              lastCheckedTime={changesMeta.snapshotTimestamp}
              totalTracked={changesMeta.totalTracked}
              meaningfulChangesCount={changesMeta.meaningfulCount}
              highPriorityCount={changesMeta.highAttentionCount}
              importantCount={changesMeta.importantCount}
              onViewWhatChanged={() => setActiveTab('changes')}
              onSaveSnapshot={handleSaveSnapshot}
              onSimulateMovements={() => handleSimulateChanges()}
              aiSummary={aiSummary}
              aiProvider={aiProvider}
              isLoadingSummary={isLoadingSummary}
            />

            {/* Flagship: What Changed Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Highest Attention Events
                  </h2>
                  <p className="text-xs text-slate-500">
                    Stocks in your watchlist requiring immediate review based on your {settings.priceThreshold}% price & {settings.volumeThreshold}× volume thresholds.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('changes')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>View all {changes.length} events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <WhatChangedFeed
                changes={changes.filter(c => c.severity === 'HIGH ATTENTION' || c.severity === 'IMPORTANT').slice(0, 4)}
                snapshotTimestamp={changesMeta.snapshotTimestamp}
                snapshotNote={changesMeta.snapshotNote}
                onSelectStock={sym => setSelectedStock(sym)}
                onSaveSnapshot={handleSaveSnapshot}
                onSimulateMovements={() => handleSimulateChanges()}
              />
            </div>

            {/* Watchlist Quick Overview */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Active Watchlist Table
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track prices, relative movement since your snapshot, and attention scoring.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('watchlist')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Manage Watchlists</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <WatchlistTable
                watchlists={watchlists}
                activeWatchlistId={activeWatchlistId}
                onSelectWatchlist={handleSelectWatchlist}
                onCreateWatchlist={handleCreateWatchlist}
                onRenameWatchlist={handleRenameWatchlist}
                onDeleteWatchlist={handleDeleteWatchlist}
                quotes={quotes}
                changesMap={changesMap}
                onSelectStock={sym => setSelectedStock(sym)}
                onRemoveStock={handleRemoveStock}
                onMoveStock={handleMoveStock}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: WHAT CHANGED (Full Feed) */}
        {activeTab === 'changes' && (
          <WhatChangedFeed
            changes={changes}
            snapshotTimestamp={changesMeta.snapshotTimestamp}
            snapshotNote={changesMeta.snapshotNote}
            onSelectStock={sym => setSelectedStock(sym)}
            onSaveSnapshot={handleSaveSnapshot}
            onSimulateMovements={() => handleSimulateChanges()}
          />
        )}

        {/* TAB 3: WATCHLIST (Full Manager) */}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Watchlist Portfolio Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize stocks into distinct groups, reorder priority, and monitor real-time deviation from baseline snapshots.
              </p>
            </div>

            <WatchlistTable
              watchlists={watchlists}
              activeWatchlistId={activeWatchlistId}
              onSelectWatchlist={handleSelectWatchlist}
              onCreateWatchlist={handleCreateWatchlist}
              onRenameWatchlist={handleRenameWatchlist}
              onDeleteWatchlist={handleDeleteWatchlist}
              quotes={quotes}
              changesMap={changesMap}
              onSelectStock={sym => setSelectedStock(sym)}
              onRemoveStock={handleRemoveStock}
              onMoveStock={handleMoveStock}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          </div>
        )}

        {/* TAB 4: NEWS */}
        {activeTab === 'news' && (
          <NewsFeed
            news={news}
            onSelectStock={sym => setSelectedStock(sym)}
          />
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Engine Settings & Personalization
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Adjust how the Meaningful Change Engine calculates composite scores and classifies alert severity.
              </p>
              {/* Reuse Settings Modal Form */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Open Configuration Dialog
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">MarketPulse</span>
            <span>•</span>
            <span>Groww Engineering Challenge 2026</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">v1.0.0 (Production)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Dual-Feed Cross Validation</span>
            <span>•</span>
            <span>Configurable Heuristics Engine</span>
            <span>•</span>
            <span>Factual Grounding</span>
          </div>
        </div>
      </footer>

      {/* Stock Detail Drilldown Modal */}
      {selectedStock && (
        <StockDetailModal
          symbol={selectedStock}
          onClose={() => setSelectedStock(null)}
          onStockUpdated={() => refreshWatchlistData(activeWatchlistId)}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddStock={handleAddStock}
        existingSymbols={activeWatchlist?.symbols || []}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
