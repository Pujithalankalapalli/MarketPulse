import React, { useState } from 'react';
import { MarketNews } from '../types/index.js';
import { Newspaper, ExternalLink, Filter, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  news: MarketNews[];
  onSelectStock: (symbol: string) => void;
}

export const NewsFeed: React.FC<Props> = ({ news, onSelectStock }) => {
  const [filter, setFilter] = useState<'ALL' | 'high' | 'medium'>('ALL');

  const filtered = news.filter(n => {
    if (filter === 'ALL') return true;
    return n.importance === filter;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Corporate Filings & Market News
          </h2>
          <p className="text-xs text-slate-500">
            Real-time regulatory disclosures and market developments affecting your tracked stocks.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All News
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'high' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            High Impact
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'medium' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medium
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {filtered.map(item => (
          <div key={item.id} className="py-4 first:pt-0 last:pb-0 group">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectStock(item.symbol)}
                  className="text-xs font-mono font-bold text-slate-900 hover:text-emerald-600 bg-slate-100 px-2 py-0.5 rounded transition-colors"
                >
                  {item.symbol}
                </button>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    item.importance === 'high'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : item.importance === 'medium'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.importance} Impact
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{item.category}</span>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.source}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {item.headline}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {item.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
