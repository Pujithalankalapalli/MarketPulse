import React, { useState, useMemo } from 'react';
import { StockHistoryPoint } from '../types/index.js';

interface Props {
  data: StockHistoryPoint[];
  symbol: string;
  currentPrice: number;
  previousClose: number;
  currentVolume: number;
  avgVolume: number;
  range: '1D' | '1W' | '1M' | '1Y';
  onRangeChange: (range: '1D' | '1W' | '1M' | '1Y') => void;
  isLoading?: boolean;
}

export const InteractiveChart: React.FC<Props> = ({
  data,
  symbol,
  currentPrice,
  previousClose,
  currentVolume,
  avgVolume,
  range,
  onRangeChange,
  isLoading,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const isPositive = currentPrice >= previousClose;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e'; // emerald-500 or rose-500
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)';

  // Chart coordinates
  const { minPrice, maxPrice, pathD, areaD, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minPrice: 0, maxPrice: 0, pathD: '', areaD: '', points: [] };
    }

    const prices = data.map(d => d.price);
    const min = Math.min(...prices) * 0.998;
    const max = Math.max(...prices) * 1.002;
    const rangeY = max - min || 1;

    const width = 800;
    const height = 280;
    const paddingBottom = 20;
    const paddingTop = 20;
    const chartHeight = height - paddingTop - paddingBottom;

    const coords = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - paddingBottom - ((d.price - min) / rangeY) * chartHeight;
      return { x, y, data: d };
    });

    // Build SVG Path
    let line = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      // Smooth cubic bezier or straight lines
      const prev = coords[i - 1];
      const curr = coords[i];
      const midX = (prev.x + curr.x) / 2;
      line += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const area = `${line} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    return { minPrice: min, maxPrice: max, pathD: line, areaD: area, points: coords };
  }, [data]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;
  const displayPrice = activePoint ? activePoint.data.price : currentPrice;
  const displayTime = activePoint ? new Date(activePoint.data.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Latest Market Close';

  const volumeMultiple = avgVolume > 0 ? (currentVolume / avgVolume).toFixed(2) : '1.0';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      {/* Header with price, ranges, and live hover inspector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              ₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? '+' : ''}
              {(((displayPrice - previousClose) / previousClose) * 100).toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-mono">{displayTime}</p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
          {(['1D', '1W', '1M', '1Y'] as const).map(r => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                range === r
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div className="relative mt-4 h-64 sm:h-72 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono">
            Loading chart data...
          </div>
        ) : points.length > 0 ? (
          <div className="relative w-full h-full">
            <svg
              viewBox="0 0 800 280"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const xRel = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, xRel / rect.width));
                const idx = Math.round(ratio * (points.length - 1));
                setHoverIndex(idx);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="800" y2="140" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="230" x2="800" y2="230" stroke="#f1f5f9" strokeDasharray="4 4" />

              {/* Area Fill */}
              <path d={areaD} fill={`url(#grad-${symbol})`} />

              {/* Line Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Crosshair on hover */}
              {activePoint && (
                <g>
                  <line
                    x1={activePoint.x}
                    y1={10}
                    x2={activePoint.x}
                    y2={260}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    fill="#ffffff"
                    stroke={strokeColor}
                    strokeWidth="3"
                  />
                </g>
              )}
            </svg>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs">
            No historical ticks recorded yet
          </div>
        )}
      </div>

      {/* Volume Bar Analyzer (Current Volume vs Average) */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-700">Volume Analysis</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Multiplier:</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded ${
                Number(volumeMultiple) >= 1.5
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {volumeMultiple}× 20-Day Avg
            </span>
          </div>
        </div>

        {/* Visual Volume Proportion Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              Number(volumeMultiple) >= 1.5 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, (Number(volumeMultiple) / 2.5) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 font-mono">
          <span>Current: {currentVolume.toLocaleString('en-IN')} shares</span>
          <span>20-Day Baseline: {avgVolume.toLocaleString('en-IN')} shares</span>
        </div>
      </div>
    </div>
  );
};
