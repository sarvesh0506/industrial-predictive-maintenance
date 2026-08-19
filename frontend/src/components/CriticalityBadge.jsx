import React from 'react';

export default function CriticalityBadge({ criticality }) {
  const getStyle = (c) => {
    const val = (c || '').toUpperCase();
    switch (val) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border tracking-wider ${getStyle(criticality)}`}>
      {criticality || 'LOW'} Risk
    </span>
  );
}
