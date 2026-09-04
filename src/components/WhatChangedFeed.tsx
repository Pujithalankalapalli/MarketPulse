import React, { useState } from 'react';
import { MeaningfulChange, AttentionSeverity } from '../types/index.js';
import { ChangeCard } from './ChangeCard.js';
import { 
  Filter, 
  Sparkles, 
  ArrowUpDown, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Camera,
  RefreshCw
} from 'lucide-react';

interface Props {
  changes: MeaningfulChange[];
  snapshotTimestamp: string;
  snapshotNote?: string;
  onSelectStock: (symbol: string) => void;
  onSaveSnapshot: () => void;
  onSimulateMovements: () => void;
}

export const WhatChangedFeed: React.FC<Props> = ({
  changes,
  snapshotTimestamp,
  snapshotNote,
  onSelectStock,
  onSaveSnapshot,
  onSimulateMovements,
}) => {
  const [filter, setFilter] = useState<'ALL' | AttentionSeverity>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'move'>('score');

  const filtered = changes.filter(c => {
    if (filter === 'ALL') return true;
    return c.severity === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') {
      return b.changeScore - a.changeScore;
    }
    return Math.abs(b.pctChangeSinceSnapshot) - Math.abs(a.pctChangeSinceSnapshot);
  });

  const formattedSnapshotTime = (() => {
    try {
      const d = new Date(snapshotTimestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return snapshotTimestamp;
    }
  })();

  const highAttentionCount = changes.filter(c => c.severity === 'HIGH ATTENTION').length;
  const importantCount = changes.filter(c => c.severity === 'IMPORTANT').length;

  return (
    <section className="space-y-6">
      {/* Header & Baseline Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              What Changed Since Your Last Visit
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Comparing current quotes against snapshot from {formattedSnapshotTime}</span>
            {snapshotNote && <span className="text-slate-400">({snapshotNote})</span>}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onSaveSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all"
            title="Update snapshot baseline to current prices"
          >
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>Update Snapshot Baseline</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Severity Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Changes ({changes.length})
          </button>

          <button
            onClick={() => setFilter('HIGH ATTENTION')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              filter === 'HIGH ATTENTION'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filter === 'HIGH ATTENTION' ? 'bg-white' : 'bg-rose-500'}`} />
            <span>High Attention ({highAttentionCount})</span>
          </button>

          <button
            onClick={() => setFilter('IMPORTANT')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              filter === 'IMPORTANT'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filter === 'IMPORTANT' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>Important ({importantCount})</span>
          </button>

          <button
            onClick={() => setFilter('WATCH')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'WATCH'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            Watch ({changes.filter(c => c.severity === 'WATCH').length})
          </button>

          <button
            onClick={() => setFilter('NORMAL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'NORMAL'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal ({changes.filter(c => c.severity === 'NORMAL').length})
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="score">Attention Score (Highest First)</option>
            <option value="move">Magnitude of Price Move %</option>
          </select>
        </div>
      </div>

      {/* Changes Card Grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sorted.map(change => (
            <ChangeCard
              key={change.symbol}
              change={change}
              onSelectStock={onSelectStock}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No stocks currently in this category
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
            All evaluated stocks in this filter are currently quiet or have lower priority. Try simulating market changes to see the engine in action!
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setFilter('ALL')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Show All Changes
            </button>
            <button
              onClick={onSimulateMovements}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Simulate Market Changes
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
