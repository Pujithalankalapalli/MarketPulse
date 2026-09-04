import React from 'react';
import { AttentionSeverity } from '../types/index.js';
import { AlertCircle, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';

interface Props {
  severity: AttentionSeverity;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AttentionBadge: React.FC<Props> = ({ severity, size = 'md', showIcon = true }) => {
  const getStyles = () => {
    switch (severity) {
      case 'HIGH ATTENTION':
        return {
          container: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
          dot: 'bg-rose-500',
          icon: AlertCircle,
          label: 'HIGH ATTENTION',
        };
      case 'IMPORTANT':
        return {
          container: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'IMPORTANT',
        };
      case 'WATCH':
        return {
          container: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
          dot: 'bg-blue-500',
          icon: Eye,
          label: 'WATCH',
        };
      case 'NORMAL':
      default:
        return {
          container: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400/10',
          dot: 'bg-slate-400',
          icon: CheckCircle2,
          label: 'NORMAL',
        };
    }
  };

  const { container, dot, icon: Icon, label } = getStyles();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ring-1 transition-colors whitespace-nowrap ${container} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
