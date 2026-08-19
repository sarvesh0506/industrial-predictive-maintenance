import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, Server, ShieldCheck, AlertTriangle, Database, Zap } from 'lucide-react';

const mockTelemetry = [
  { time: '10:00', vibration: 2.1, temperature: 62, pressure: 5.1 },
  { time: '10:05', vibration: 2.4, temperature: 64, pressure: 5.2 },
  { time: '10:10', vibration: 2.3, temperature: 63, pressure: 5.0 },
  { time: '10:15', vibration: 2.8, temperature: 68, pressure: 5.4 },
  { time: '10:20', vibration: 3.5, temperature: 72, pressure: 5.8 },
  { time: '10:25', vibration: 4.2, temperature: 78, pressure: 6.2 },
];

export default function App() {
  const [backendHealth, setBackendHealth] = useState('CHECKING');
  const [mlHealth, setMlHealth] = useState('CHECKING');
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check Backend Health
    axios.get('/api/health')
      .then(res => setBackendHealth(res.data?.status || 'ONLINE'))
      .catch(() => setBackendHealth('OFFLINE'));

    // Check ML Service Health
    axios.get('/ml/health')
      .then(res => setMlHealth(res.data?.status || 'ONLINE'))
      .catch(() => setMlHealth('OFFLINE'));

    // Fetch Machines
    axios.get('/api/machines')
      .then(res => {
        setMachines(res.data?.content || res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setMachines([
          { id: 1, machineCode: 'MCH-CNC-001', machineName: 'CNC Milling Machine', status: 'OPERATIONAL', criticality: 'CRITICAL' },
          { id: 2, machineCode: 'MCH-PMP-002', machineName: 'Coolant Pump', status: 'OPERATIONAL', criticality: 'HIGH' },
          { id: 3, machineCode: 'MCH-CMP-003', machineName: 'Air Compressor', status: 'MAINTENANCE_REQUIRED', criticality: 'MEDIUM' }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      {/* Top Navigation / Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
            Industrial Predictive Maintenance Platform
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time Asset Telemetry, AI Anomaly Detection & Predictive Maintenance Operations
          </p>
        </div>

        {/* System Health Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Backend API:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              backendHealth === 'UP' || backendHealth === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {backendHealth}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">ML Engine:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              mlHealth === 'healthy' || mlHealth === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {mlHealth}
            </span>
          </div>
        </div>
      </header>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Monitored Assets</span>
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{machines.length}</div>
          <span className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <ShieldCheck className="w-3.5 h-3.5" /> All telemetry active
          </span>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">System Health Index</span>
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">94.2%</div>
          <span className="text-xs text-slate-400 mt-2 block">Nominal operating state</span>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Predicted Anomalies</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">1</div>
          <span className="text-xs text-amber-400 mt-2 block">MCH-CMP-003 high vibration</span>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg RUL Estimate</span>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white">420 hrs</div>
          <span className="text-xs text-slate-400 mt-2 block">Next service in 17 days</span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Telemetry Graph */}
        <div className="lg:col-span-2 bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Live Vibration & Temperature Telemetry (CNC Milling Machine)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTelemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                <Line type="monotone" dataKey="vibration" stroke="#3b82f6" strokeWidth={2} name="Vibration (mm/s)" />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monitored Assets List */}
        <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Asset Fleet Overview
          </h2>
          <div className="space-y-3">
            {machines.map(m => (
              <div key={m.id || m.machineCode} className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">{m.machineName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{m.machineCode}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    m.status === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {m.status}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1">
                    {m.criticality} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
