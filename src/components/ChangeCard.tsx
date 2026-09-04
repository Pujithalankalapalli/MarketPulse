import React from 'react';
import { MeaningfulChange } from '../types/index.js';
import { AttentionBadge } from './AttentionBadge.js';
import { DataFreshnessBadge } from './DataFreshnessBadge.js';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Building2, 
  Newspaper, 
  Zap, 
  ChevronRight,
  Clock,
  Flame,
  ArrowRight
} from 'lucide-react';

interface Props {
  change: MeaningfulChange;
  onSelectStock: (symbol: string) => void;
}

export const ChangeCard: React.FC<Props> = ({ change, onSelectStock }) => {
  const isPositive = change.pctChangeSinceSnapshot >= 0;
  const isHighSeverity = change.severity === 'HIGH ATTENTION' || change.severity === 'IMPORTANT';

  // Format relative time
  const timeAgo = (() => {
    try {
      const diffMin = Math.round((Date.now() - new Date(change.timestamp).getTime()) / 60000);
      if (diffMin <= 1) return 'just now';
      if (diffMin < 60) return `${diffMin} minutes ago`;
      const diffHours = Math.round(diffMin / 60);
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } catch {
      return 'recently';
    }
  })();

  return (
    <div
      onClick={() => onSelectStock(change.symbol)}
      className={`group cursor-pointer rounded-2xl border transition-all duration-200 bg-white p-5 sm:p-6 relative overflow-hidden ${
        change.severity === 'HIGH ATTENTION'
          ? 'border-rose-200 hover:border-rose-300 shadow-xs hover:shadow-md'
          : change.severity === 'IMPORTANT'
            ? 'border-amber-200 hover:border-amber-300 shadow-xs hover:shadow-md'
            : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
      }`}
    >
      {/* Top Row: Symbol, Name, Severity Badge */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              {change.symbol}
            </h3>
            <span className="text-xs text-slate-600 font-medium hidden sm:inline">
              • {change.name}
            </span>
          </div>
          <span className="text-xs text-slate-600 sm:hidden block mt-0.5">
            {change.name}
          </span>
          <span className="inline-block mt-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {change.sector}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <AttentionBadge severity={change.severity} size="md" />
          <div className="text-[11px] font-mono text-slate-600">
            Score: <span className="font-bold text-slate-900">{change.changeScore}</span>/100
          </div>
        </div>
      </div>

      {/* Price Comparison Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3.5 px-4 rounded-xl bg-slate-50/80 border border-slate-100 mb-4">
        <div>
          <span className="text-[11px] font-medium text-slate-600 block">Current Price</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold font-mono text-slate-900">
              ₹{change.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`inline-flex items-center text-xs font-mono font-bold ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositive ? '+' : ''}{change.pctChangeSinceSnapshot.toFixed(1)}%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-600 block">At Last Check</span>
          <div className="mt-0.5 text-base font-semibold font-mono text-slate-600">
            ₹{change.previousPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="hidden sm:block">
          <span className="text-[11px] font-medium text-slate-600 block">Net Difference</span>
          <div className="mt-0.5 text-base font-semibold font-mono text-slate-800">
            {change.priceDiff >= 0 ? '+' : ''}₹{change.priceDiff.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Catalyst Badges / Triggered Factors */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span>Price move: {isPositive ? '+' : ''}{change.pctChangeSinceSnapshot.toFixed(1)}%</span>
        </span>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
            change.volumeMultiplier >= 1.5
              ? 'bg-amber-100/70 text-amber-900 border border-amber-200'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Volume {change.volumeMultiplier}× normal</span>
        </span>

        {change.factors.some(f => f.type === 'news' && f.triggered) && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100/70 text-blue-900 border border-blue-200">
            <Newspaper className="w-3.5 h-3.5 text-blue-600" />
            <span>Company filing alert</span>
          </span>
        )}

        {change.factors.some(f => f.type === 'sector' && f.triggered) && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Sector decoupling</span>
          </span>
        )}
      </div>

      {/* Why This Matters - Flagship differentiator */}
      <div
        className={`p-4 rounded-xl border mb-4 ${
          change.severity === 'HIGH ATTENTION'
            ? 'bg-rose-50/50 border-rose-100 text-slate-800'
            : change.severity === 'IMPORTANT'
              ? 'bg-amber-50/50 border-amber-100 text-slate-800'
              : 'bg-slate-50 border-slate-100 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Zap
            className={`w-4 h-4 ${
              change.severity === 'HIGH ATTENTION'
                ? 'text-rose-600'
                : change.severity === 'IMPORTANT'
                  ? 'text-amber-600'
                  : 'text-slate-500'
            }`}
          />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Why this matters
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          {change.explanation}
        </p>
      </div>

      {/* Card Footer: Timestamp & Inspection CTA */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-600" />
          <span>Updated {timeAgo}</span>
        </div>

        <div className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all">
          <span>Drill down</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
        </div>
      </div>
    </div>
  );
};
