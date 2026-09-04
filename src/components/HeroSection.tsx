import React from 'react';
import { 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Camera,
  Zap,
  Info
} from 'lucide-react';

interface Props {
  lastCheckedTime: string;
  totalTracked: number;
  meaningfulChangesCount: number;
  highPriorityCount: number;
  importantCount: number;
  onViewWhatChanged: () => void;
  onSaveSnapshot: () => void;
  onSimulateMovements: () => void;
  aiSummary?: string;
  aiProvider?: 'gemini' | 'deterministic';
  isLoadingSummary?: boolean;
}

export const HeroSection: React.FC<Props> = ({
  lastCheckedTime,
  totalTracked,
  meaningfulChangesCount,
  highPriorityCount,
  importantCount,
  onViewWhatChanged,
  onSaveSnapshot,
  onSimulateMovements,
  aiSummary,
  aiProvider,
  isLoadingSummary,
}) => {
  // Format human readable last checked
  const formattedLastChecked = (() => {
    if (!lastCheckedTime) return '9:42 AM';
    try {
      const d = new Date(lastCheckedTime);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return lastCheckedTime;
    }
  })();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  })();

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 mb-8 relative overflow-hidden">
      {/* Decorative subtle ambient backdrop */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 mb-3">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last checked at {formattedLastChecked}</span>
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              {greeting}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
              Your market changed while you were away.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onViewWhatChanged}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95 group"
            >
              <span>View What Changed</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
            </button>

            <button
              onClick={onSimulateMovements}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-sm font-semibold transition-all active:scale-95"
              title="Trigger simulated market volatility to observe change detection"
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Simulate Changes</span>
            </button>

            <button
              onClick={onSaveSnapshot}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold transition-all active:scale-95"
              title="Store current prices as your baseline snapshot for future visits"
            >
              <Camera className="w-4 h-4 text-slate-500" />
              <span>Save Checkpoint</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Tracked Stocks</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900">{totalTracked}</span>
              <span className="text-xs text-slate-400">stocks</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Meaningful Changes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900">{meaningfulChangesCount}</span>
              <span className="text-xs text-slate-400">above threshold</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100">
            <span className="text-xs font-semibold text-rose-700 block mb-1">High-Priority Events</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-700">{highPriorityCount}</span>
              <span className="text-xs text-rose-500 font-medium">urgent focus</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-xs font-semibold text-amber-800 block mb-1">Important Moves</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-800">{importantCount}</span>
              <span className="text-xs text-amber-600 font-medium">noteworthy</span>
            </div>
          </div>
        </div>

        {/* AI Executive Intelligence Briefing Card */}
        {aiSummary && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-sm relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  AI Executive Intelligence Briefing
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {aiProvider === 'gemini' ? 'Gemini 3.8 Flash • Factual Grounding' : 'Deterministic Fact Engine'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {isLoadingSummary ? 'Analyzing changes against previous baseline snapshot...' : aiSummary}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
