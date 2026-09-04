import React from 'react';
import { 
  Activity, 
  Search, 
  Settings as SettingsIcon, 
  SlidersHorizontal, 
  Sparkles, 
  Camera, 
  RotateCcw,
  Zap,
  BookmarkCheck
} from 'lucide-react';

interface Props {
  activeTab: 'dashboard' | 'changes' | 'watchlist' | 'news' | 'settings';
  onTabChange: (tab: 'dashboard' | 'changes' | 'watchlist' | 'news' | 'settings') => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onSaveSnapshot: () => void;
  onSimulateChanges: () => void;
  onResetMarket: () => void;
  dataMode: 'demo' | 'live';
  isSimulating?: boolean;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenSettings,
  onSaveSnapshot,
  onSimulateChanges,
  onResetMarket,
  dataMode,
  isSimulating,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onTabChange('dashboard')} 
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:shadow-md transition-shadow">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    MarketPulse
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Groww 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium hidden sm:block">
                  Know what changed. Know what matters.
                </p>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-4 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onTabChange('changes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'changes'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>What Changed</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </button>
              <button
                onClick={() => onTabChange('watchlist')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'watchlist'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Watchlist
              </button>
              <button
                onClick={() => onTabChange('news')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'news'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Market News
              </button>
            </nav>
          </div>

          {/* Right Controls: Search, Quick Simulate, Snapshot, Settings */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs transition-colors"
              title="Search stocks (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Search stocks...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Simulate Changes Demo Trigger */}
            <button
              onClick={onSimulateChanges}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 transition-all shadow-2xs hover:shadow-xs active:scale-95"
              title="Simulate realistic market shifts between snapshots"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Simulate Market Changes</span>
              <span className="sm:hidden">Simulate</span>
            </button>

            {/* Snapshot Checkpoint Trigger */}
            <button
              onClick={onSaveSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs active:scale-95"
              title="Save a new market snapshot checkpoint right now"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Save Snapshot</span>
            </button>

            {/* Reset Demo Simulation */}
            <button
              onClick={onResetMarket}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset market values to baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title="Configurable engine thresholds and sensitivity"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* User Profile Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100">
              MP
            </div>
          </div>
        </div>

        {/* Mobile Tab bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('changes')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1 ${activeTab === 'changes' ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}
          >
            What Changed
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>
          <button
            onClick={() => onTabChange('watchlist')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'watchlist' ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}
          >
            Watchlist
          </button>
          <button
            onClick={() => onTabChange('news')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'news' ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}
          >
            News
          </button>
        </div>
      </div>
    </header>
  );
};
