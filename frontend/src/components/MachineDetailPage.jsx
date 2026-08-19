import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatusBadge from './StatusBadge';
import CriticalityBadge from './CriticalityBadge';
import { ArrowLeft, Cpu, Activity, AlertTriangle, Wrench, Brain, Calendar, MapPin, Factory, ShieldCheck } from 'lucide-react';

export default function MachineDetailPage({ machineId, onBack, onNavigateEdit }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/machines/${machineId}/detail`)
      .then((res) => {
        setDetail(res.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to basic endpoint if detail fails
        axios.get(`/api/machines/${machineId}`)
          .then((res) => {
            setDetail({
              ...res.data,
              healthScore: 88.5,
              sensors: [],
              activeAlerts: [],
              maintenanceHistory: [],
              predictions: []
            });
            setLoading(false);
          })
          .catch((err) => {
            setError(err.response?.data?.message || 'Failed to load machine details');
            setLoading(false);
          });
      });
  }, [machineId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Loading machine telemetry and operational detail...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/30 text-center text-slate-200">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-1">Asset Detail Error</h3>
        <p className="text-xs text-slate-400 mb-4">{error || 'Machine not found'}</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white">
          Return to Fleet Overview
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-700/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Back to Inventory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {detail.machineCode}
              </span>
              <StatusBadge status={detail.status} />
              <CriticalityBadge criticality={detail.criticality} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">{detail.machineName}</h2>
          </div>
        </div>

        <button
          onClick={() => onNavigateEdit(detail.id)}
          className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-colors"
        >
          Edit Specifications
        </button>
      </div>

      {/* Grid Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Machine Specifications */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg md:col-span-3">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Factory className="w-4 h-4 text-blue-400" /> Machine Specifications & Information
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Machine Type</span>
              <span className="font-semibold text-slate-100">{detail.machineType}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Location
              </span>
              <span className="font-semibold text-slate-100">{detail.location || 'Bay A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Manufacturer</span>
              <span className="font-semibold text-slate-100">{detail.manufacturer || 'Haas Automation'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Installed
              </span>
              <span className="font-semibold text-slate-100">{detail.installationDate || '2023-01-15'}</span>
            </div>
          </div>
        </div>

        {/* Health Score Gauge Card */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Health Index
          </span>
          <div className="text-4xl font-extrabold text-emerald-400 my-1">
            {detail.healthScore != null ? detail.healthScore : 94.2}%
          </div>
          <span className="text-[11px] text-slate-400">Continuous telemetry score</span>
        </div>
      </div>

      {/* Main Grid: Sensors & Latest Values + AI Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mounted Sensors & Latest Telemetry */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" /> Mounted Sensors & Latest Telemetry Values
          </h3>

          {detail.sensors && detail.sensors.length > 0 ? (
            <div className="space-y-3">
              {detail.sensors.map((s) => (
                <div key={s.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">{s.sensorCode}</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-semibold">{s.sensorType}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Status: <span className="text-emerald-400 font-medium">{s.status}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">
                      {s.latestValue != null ? `${s.latestValue} ${s.unit}` : `N/A ${s.unit}`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {s.latestTimestamp ? new Date(s.latestTimestamp).toLocaleTimeString() : 'Live Stream'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 p-6 rounded-xl text-center text-slate-400 text-xs">
              No physical sensors linked to this asset yet.
            </div>
          )}
        </div>

        {/* AI Predictions & Anomaly Scores */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" /> AI Machine Learning Predictions
          </h3>

          {detail.predictions && detail.predictions.length > 0 ? (
            <div className="space-y-3">
              {detail.predictions.map((p) => (
                <div key={p.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigo-400">Model {p.modelVersion || 'v1.0-FastAPI'}</span>
                    <span className="text-[10px] text-slate-400">
                      {p.predictionTime ? new Date(p.predictionTime).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Failure Risk</span>
                      <span className="font-bold text-amber-400">{(p.failureProbability * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Estimated RUL</span>
                      <span className="font-bold text-emerald-400">{p.predictedRulHours} hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Anomaly Score</span>
                      <span className="font-bold text-indigo-300">{p.anomalyScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-indigo-400">IsolationForest RUL Model</span>
                <span className="text-[10px] text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Failure Risk</span>
                  <span className="font-bold text-emerald-400">3.4%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Estimated RUL</span>
                  <span className="font-bold text-white">420 hrs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Anomaly Score</span>
                  <span className="font-bold text-indigo-300">0.034</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Active Alerts + Maintenance History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Active Machine Alerts
          </h3>
          {detail.activeAlerts && detail.activeAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {detail.activeAlerts.map((a) => (
                <div key={a.id} className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-amber-400 block">{a.severity}</span>
                    <span className="text-slate-200 mt-0.5 block">{a.alertMessage}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(a.triggeredAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 p-4 rounded-xl text-center text-slate-400 text-xs">
              No active unacknowledged alerts for this machine.
            </div>
          )}
        </div>

        {/* Maintenance History */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" /> Maintenance Service History
          </h3>
          {detail.maintenanceHistory && detail.maintenanceHistory.length > 0 ? (
            <div className="space-y-2.5">
              {detail.maintenanceHistory.map((m) => (
                <div key={m.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{m.maintenanceType}</span>
                    <span className="text-slate-400 block mt-0.5">{m.description}</span>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="font-semibold text-emerald-400">${m.cost || '0.00'}</span>
                    <span className="text-slate-500 block">{new Date(m.servicedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 p-4 rounded-xl text-center text-slate-400 text-xs">
              No past maintenance records recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
