import React from 'react';
import { FreshnessStatus } from '../types/index.js';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  status: FreshnessStatus;
  lastUpdated?: string;
  discrepancyWarning?: string;
}

export const DataFreshnessBadge: React.FC<Props> = ({ status, lastUpdated, discrepancyWarning }) => {
  const getFormat = () => {
    switch (status) {
      case 'Fresh':
        return {
          dot: 'bg-emerald-500',
          text: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          label: 'Fresh',
        };
      case 'Recently Updated':
        return {
          dot: 'bg-blue-500',
          text: 'text-blue-700 bg-blue-50 border-blue-200',
          label: 'Updated',
        };
      case 'Stale':
        return {
          dot: 'bg-amber-500 animate-pulse',
          text: 'text-amber-800 bg-amber-50 border-amber-200',
          label: 'Delayed Data',
        };
      case 'Unavailable':
      default:
        return {
          dot: 'bg-slate-400',
          text: 'text-slate-600 bg-slate-50 border-slate-200',
          label: 'Offline Fallback',
        };
    }
  };

  const { dot, text, label } = getFormat();

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <Clock className="w-3 h-3 opacity-60" />
        <span>{label}</span>
        {formattedTime && <span className="opacity-75 font-mono">({formattedTime})</span>}
      </span>

      {discrepancyWarning && (
        <span
          title={discrepancyWarning}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Cross-feed variance resolved</span>
        </span>
      )}
    </div>
  );
};
