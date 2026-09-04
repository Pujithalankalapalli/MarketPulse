import React, { useState } from 'react';
import { Watchlist, StockQuote, MeaningfulChange } from '../types/index.js';
import { AttentionBadge } from './AttentionBadge.js';
import { DataFreshnessBadge } from './DataFreshnessBadge.js';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Clock,
  Layers,
  Edit2,
  Check
} from 'lucide-react';

interface Props {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onSelectWatchlist: (id: string) => void;
  onCreateWatchlist: (name: string) => void;
  onRenameWatchlist: (id: string, name: string) => void;
  onDeleteWatchlist: (id: string) => void;
  quotes: StockQuote[];
  changesMap: Record<string, MeaningfulChange>;
  onSelectStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onMoveStock: (symbol: string, direction: 'up' | 'down') => void;
  onOpenSearch: () => void;
}

export const WatchlistTable: React.FC<Props> = ({
  watchlists,
  activeWatchlistId,
  onSelectWatchlist,
  onCreateWatchlist,
  onRenameWatchlist,
  onDeleteWatchlist,
  quotes,
  changesMap,
  onSelectStock,
  onRemoveStock,
  onMoveStock,
  onOpenSearch,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const currentWl = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWlName.trim()) {
      onCreateWatchlist(newWlName.trim());
      setNewWlName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onRenameWatchlist(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Watchlist Tabs Bar */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3">
            {watchlists.map(wl => {
              const isActive = wl.id === activeWatchlistId;
              const isEditing = editingId === wl.id;

              return (
                <div key={wl.id} className="flex items-center group relative">
                  {isEditing ? (
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-emerald-500 shadow-xs">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="text-xs font-semibold text-slate-900 focus:outline-none w-28"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(wl.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleRename(wl.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectWatchlist(wl.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <span>{wl.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'
                        }`}
                      >
                        {wl.symbols.length}
                      </span>
                    </button>
                  )}

                  {isActive && !isEditing && (
                    <div className="hidden group-hover:flex items-center gap-1 ml-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                      <button
                        onClick={() => {
                          setEditingId(wl.id);
                          setEditName(wl.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Rename watchlist"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {watchlists.length > 1 && (
                        <button
                          onClick={() => onDeleteWatchlist(wl.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete watchlist"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isCreating ? (
              <form onSubmit={handleCreate} className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-500">
                <input
                  type="text"
                  placeholder="Watchlist name..."
                  value={newWlName}
                  onChange={e => setNewWlName(e.target.value)}
                  className="text-xs font-semibold text-slate-900 focus:outline-none w-28"
                  autoFocus
                />
                <button type="submit" className="p-1 text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New List</span>
              </button>
            )}
          </div>

          <div className="pb-3">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table of Stocks */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Sector</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Today's %</th>
              <th className="py-3 px-4 text-right">Since Last Check</th>
              <th className="py-3 px-4 text-center">Volume Activity</th>
              <th className="py-3 px-4 text-center">Attention Level</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <p className="font-semibold text-slate-700 text-sm">This watchlist is empty</p>
                  <p className="text-xs text-slate-400 mt-1">Use the "Add Stock" button above to start tracking symbols.</p>
                </td>
              </tr>
            ) : (
              quotes.map((quote, idx) => {
                const change = changesMap[quote.symbol];
                const pctSinceSnapshot = change ? change.pctChangeSinceSnapshot : quote.changePercent;
                const isPositive = pctSinceSnapshot >= 0;
                const volMult = quote.avgVolume > 0 ? (quote.volume / quote.avgVolume).toFixed(1) : '1.0';

                return (
                  <tr
                    key={quote.symbol}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectStock(quote.symbol)}
                  >
                    {/* Reorder controls */}
                    <td 
                      className="py-3.5 px-4 text-slate-300 group-hover:text-slate-400"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => onMoveStock(quote.symbol, 'up')}
                          className="hover:text-slate-800 disabled:opacity-20 transition-opacity"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === quotes.length - 1}
                          onClick={() => onMoveStock(quote.symbol, 'down')}
                          className="hover:text-slate-800 disabled:opacity-20 transition-opacity"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Company Symbol & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-700 text-xs shrink-0">
                          {quote.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block">
                            {quote.symbol}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[140px] sm:max-w-none">
                            {quote.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                        {quote.sector}
                      </span>
                    </td>

                    {/* Current Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Today's % Change */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          quote.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                      </span>
                    </td>

                    {/* Crucial metric: Change Since Last Check */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                          isPositive
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{pctSinceSnapshot.toFixed(2)}%
                      </span>
                    </td>

                    {/* Volume Multiplier */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          Number(volMult) >= 1.5
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {volMult}× avg
                      </span>
                    </td>

                    {/* Attention Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <AttentionBadge severity={change?.severity || 'NORMAL'} size="sm" />
                    </td>

                    {/* Action */}
                    <td 
                      className="py-3.5 px-4 text-right"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onRemoveStock(quote.symbol)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title={`Remove ${quote.symbol} from watchlist`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
