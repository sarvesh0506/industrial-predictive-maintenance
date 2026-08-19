import React from 'react';

export default function StatusBadge({ status }) {
  const getBadgeStyle = (s) => {
    const val = (s || '').toUpperCase();
    switch (val) {
      case 'RUNNING':
      case 'OPERATIONAL':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'IDLE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'MAINTENANCE':
      case 'MAINTENANCE_REQUIRED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'OFFLINE':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border tracking-wider ${getBadgeStyle(status)}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}
