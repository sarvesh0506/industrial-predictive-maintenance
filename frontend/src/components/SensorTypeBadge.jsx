import React from 'react';
import { Thermometer, Activity, Gauge, RotateCw, Zap, Flame } from 'lucide-react';

export default function SensorTypeBadge({ type }) {
  const getBadgeDetails = (t) => {
    const val = (t || '').toUpperCase();
    switch (val) {
      case 'TEMPERATURE':
        return {
          label: 'TEMPERATURE',
          style: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <Thermometer className="w-3.5 h-3.5" />
        };
      case 'VIBRATION':
        return {
          label: 'VIBRATION',
          style: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          icon: <Activity className="w-3.5 h-3.5 animate-pulse" />
        };
      case 'PRESSURE':
        return {
          label: 'PRESSURE',
          style: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: <Gauge className="w-3.5 h-3.5" />
        };
      case 'RPM':
        return {
          label: 'RPM',
          style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <RotateCw className="w-3.5 h-3.5" />
        };
      case 'CURRENT':
        return {
          label: 'CURRENT',
          style: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <Zap className="w-3.5 h-3.5" />
        };
      case 'VOLTAGE':
        return {
          label: 'VOLTAGE',
          style: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: <Flame className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: val || 'UNKNOWN',
          style: 'bg-slate-700 text-slate-300 border-slate-600',
          icon: <Cpu className="w-3.5 h-3.5" />
        };
    }
  };

  const details = getBadgeDetails(type);

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded border tracking-wider uppercase ${details.style}`}>
      {details.icon}
      {details.label}
    </span>
  );
}
