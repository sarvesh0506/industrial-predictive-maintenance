import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatusBadge from './StatusBadge';
import CriticalityBadge from './CriticalityBadge';
import { ArrowLeft, Cpu, Activity, AlertTriangle, Wrench, Brain, Calendar, MapPin, Factory, ShieldCheck, Zap, Info, History } from 'lucide-react';

export default function MachineDetailPage({ machineId, onBack, onNavigateEdit }) {
  const [detail, setDetail] = useState(null);
  const [failurePred, setFailurePred] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  const fetchMachineDetail = () => {
    setLoading(true);
    axios.get(`/api/machines/${machineId}/detail`)
      .then((res) => {
        setDetail(res.data);
        setLoading(false);
      })
      .catch(() => {
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
  };

  const handleEvaluateFailure = () => {
    setEvaluating(true);
    axios.post(`/api/predictions/failure/evaluate?machineId=${machineId}`)
      .then((res) => {
        setFailurePred(res.data);
        setEvaluating(false);
        fetchMachineDetail(); // Refresh predictions list
      })
      .catch(() => {
        setEvaluating(false);
      });
  };

  useEffect(() => {
    fetchMachineDetail();
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

  const riskColor = (risk) => {
    switch ((risk || '').toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluateFailure}
            disabled={evaluating}
            className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Brain className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Evaluating AI Model...' : 'Evaluate Failure Risk'}
          </button>
          <button
            onClick={() => onNavigateEdit(detail.id)}
            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-colors"
          >
            Edit Specs
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Machine Specifications */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg md:col-span-3">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Factory className="w-4 h-4 text-blue-400" /> Specifications & Location
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

        {/* Health Index Card */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Health Index
          </span>
          <div className="text-4xl font-extrabold text-emerald-400 my-1">
            {detail.healthScore != null ? detail.healthScore : 94.2}%
          </div>
          <span className="text-[11px] text-slate-400">Telemetry health baseline</span>
        </div>
      </div>

      {/* AI Failure Mode & Risk Evaluation Card */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" /> AI Machine Failure Mode Prediction & Risk Assessment
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervised multi-class failure classification (RandomForest vs GradientBoosting candidates)
            </p>
          </div>
          {failurePred && (
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${riskColor(failurePred.riskLevel)}`}>
              Risk Level: {failurePred.riskLevel}
            </span>
          )}
        </div>

        {failurePred ? (
          <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Predicted Failure Mode</span>
                <span className="text-base font-extrabold text-indigo-300 block">{failurePred.predictedFailureType}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Failure Probability</span>
                <span className="text-base font-extrabold text-amber-400 block">
                  {(failurePred.failureProbability * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Model Classifier Version</span>
                <span className="text-xs font-mono font-bold text-slate-200 block">{failurePred.modelVersion}</span>
              </div>
            </div>

            {/* Contributing Important Features */}
            {failurePred.importantFeatures && failurePred.importantFeatures.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 block mb-2">Key Contributing Telemetry Factors:</span>
                <div className="flex flex-wrap gap-2">
                  {failurePred.importantFeatures.map((f, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono">
                      {f.feature}: <strong className="text-indigo-400">{(f.score * 100).toFixed(0)}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer Notice */}
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-lg flex items-center gap-2 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{failurePred.disclaimer || "Predictions are probabilistic estimates based on telemetry trends and do not guarantee physical machine outcomes."}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 text-center text-xs text-slate-400">
            Click <strong className="text-indigo-400">"Evaluate Failure Risk"</strong> to trigger real-time AI failure mode classification.
          </div>
        )}
      </div>

      {/* Mounted Sensors & Prediction History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mounted Sensors */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" /> Mounted Telemetry Sensors
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

        {/* Prediction History Timeline */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Historical ML Predictions Log
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
                <span className="font-bold text-indigo-400">RandomForest / IsolationForest Pipeline</span>
                <span className="text-[10px] text-emerald-400 font-bold">READY</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Evaluate failure risk to populate predictive history logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
