import React from 'react';
import { MarketIndex } from '../types/index.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  indices: MarketIndex[];
  marketStatus?: string;
}

export const MarketTicker: React.FC<Props> = ({ indices, marketStatus }) => {
  return (
    <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 min-w-max">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
            {marketStatus || 'Market Open'}
          </span>
        </div>

        <div className="flex items-center gap-6 divide-x divide-slate-100">
          {indices.map(index => {
            const isPos = index.changePercent >= 0;
            return (
              <div key={index.symbol} className="flex items-center gap-2 pl-4 first:pl-0">
                <span className="text-xs font-semibold text-slate-600">{index.name}</span>
                <span className="text-xs font-bold font-mono text-slate-900">
                  {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                    isPos ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                  }`}
                >
                  {isPos ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-600" />
                  )}
                  {isPos ? '+' : ''}
                  {index.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-600 pl-4 border-l border-slate-200 font-mono">
          NSE/BSE Real-time Feed
        </div>
      </div>
    </div>
  );
};
