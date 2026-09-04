import React, { useState, useEffect } from 'react';
import { StockQuote, MeaningfulChange, StockHistoryPoint, MarketNews } from '../types/index.js';
import { api } from '../services/api.js';
import { AttentionBadge } from './AttentionBadge.js';
import { DataFreshnessBadge } from './DataFreshnessBadge.js';
import { InteractiveChart } from './InteractiveChart.js';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Building2,
  ExternalLink,
  Newspaper
} from 'lucide-react';

interface Props {
  symbol: string;
  onClose: () => void;
  onStockUpdated?: () => void;
}

export const StockDetailModal: React.FC<Props> = ({ symbol, onClose, onStockUpdated }) => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [change, setChange] = useState<MeaningfulChange | null>(null);
  const [history, setHistory] = useState<StockHistoryPoint[]>([]);
  const [news, setNews] = useState<MarketNews[]>([]);
  const [range, setRange] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [q, c, n] = await Promise.all([
          api.getStockQuote(symbol),
          api.getStockChange(symbol),
          api.getNews([symbol]),
        ]);
        if (isMounted) {
          setQuote(q);
          setChange(c);
          setNews(n);
        }
      } catch (err) {
        console.error('Failed to load stock details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [symbol]);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setChartLoading(true);
      try {
        const h = await api.getStockHistory(symbol, range);
        if (isMounted) setHistory(h);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        if (isMounted) setChartLoading(false);
      }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, [symbol, range]);

  if (!symbol) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-slate-50 rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg font-mono">
              {symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  {quote?.name || symbol}
                </h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {symbol}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {quote?.exchange || 'NSE'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-500 font-medium">{quote?.sector}</span>
                {quote && (
                  <DataFreshnessBadge
                    status={quote.freshness}
                    lastUpdated={quote.lastUpdated}
                    discrepancyWarning={quote.discrepancyWarning}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {change && <AttentionBadge severity={change.severity} size="lg" />}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading || !quote ? (
            <div className="py-20 text-center text-slate-500 text-sm font-mono">
              Retrieving institutional quotes and factor breakdown...
            </div>
          ) : (
            <>
              {/* Snapshot Comparison Banner */}
              {change && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Change Since Last Snapshot Checkpoint</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold font-mono text-slate-900">
                          ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span
                          className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
                            change.pctChangeSinceSnapshot >= 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {change.pctChangeSinceSnapshot >= 0 ? '+' : ''}
                          {change.pctChangeSinceSnapshot.toFixed(2)}%
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          (Was ₹{change.previousPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Attention Score</span>
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          {change.changeScore}<span className="text-sm text-slate-400">/100</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Why this matters explanation highlight */}
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>Why this stock matters right now</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {change.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Price & Volume Chart */}
              <InteractiveChart
                data={history}
                symbol={symbol}
                currentPrice={quote.price}
                previousClose={quote.previousClose}
                currentVolume={quote.volume}
                avgVolume={quote.avgVolume}
                range={range}
                onRangeChange={setRange}
                isLoading={chartLoading}
              />

              {/* Meaningful Change Factor Breakdown (Engine Heuristics) */}
              {change && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                        Meaningful Change Factor Breakdown
                      </h3>
                      <p className="text-xs text-slate-500">
                        Multi-factor heuristic scoring analyzing divergence from your personalized thresholds.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      Weight: 100 max
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {change.factors.map(factor => (
                      <div
                        key={factor.type}
                        className={`p-4 rounded-xl border transition-all ${
                          factor.triggered
                            ? 'bg-amber-50/40 border-amber-200/80'
                            : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-800">{factor.label}</span>
                          <span className="font-mono text-slate-600">
                            <span className="font-bold text-slate-900">{factor.score}</span> / {factor.weight} pts
                          </span>
                        </div>

                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 my-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              factor.triggered ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${(factor.score / factor.weight) * 100}%` }}
                          />
                        </div>

                        <p className="text-[11px] font-mono text-slate-600 font-medium">
                          {factor.metric}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          {factor.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Regulatory Filings & News */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-4 h-4 text-slate-600" />
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    Recent Company News & Disclosures
                  </h3>
                </div>

                {news.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {news.map(item => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              item.importance === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : item.importance === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.importance} impact
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">{item.source}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">{item.headline}</h4>
                        <p className="text-xs text-slate-600 mt-1">{item.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No high-impact corporate filings reported today.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
