import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { Search, Plus, Check, X, Building2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (symbol: string) => void;
  existingSymbols: string[];
}

export const SearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddStock,
  existingSymbols,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ symbol: string; name: string; sector: string; price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.searchStocks(query);
        setResults(res);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search company name, symbol or sector (e.g. TCS, Tata, Energy)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-3 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              Searching market database...
            </div>
          ) : results.length > 0 ? (
            results.map(stock => {
              const alreadyAdded = existingSymbols.includes(stock.symbol);

              return (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 font-mono font-bold text-xs flex items-center justify-center text-slate-800">
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{stock.symbol}</span>
                        <span className="text-[11px] text-slate-500">• {stock.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{stock.sector}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>

                    {alreadyAdded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>Added</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onAddStock(stock.symbol)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-600 px-3 py-1 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Track</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : query ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching stocks found for "{query}".
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Type any stock symbol (e.g. RELIANCE, TCS, INFY) to add it to your watchlist.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press ESC to close</span>
          <span>NSE / BSE Real-time Symbols</span>
        </div>
      </div>
    </div>
  );
};
