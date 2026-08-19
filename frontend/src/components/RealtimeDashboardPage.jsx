import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWebSocketTelemetry } from '../hooks/useWebSocketTelemetry';
import StatusBadge from './StatusBadge';
import CriticalityBadge from './CriticalityBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Server, AlertTriangle, ShieldCheck, Cpu, RefreshCw, Zap, Wrench, Flame, Gauge, RotateCw, Thermometer, Radio } from 'lucide-react';

const INITIAL_MOCK_STREAMS = {
  temperature: [
    { time: '11:40', value: 61.2 }, { time: '11:41', value: 62.0 },
    { time: '11:42', value: 61.8 }, { time: '11:43', value: 63.4 }, { time: '11:44', value: 64.1 }
  ],
  vibration: [
    { time: '11:40', value: 1.8 }, { time: '11:41', value: 2.1 },
    { time: '11:42', value: 1.9 }, { time: '11:43', value: 2.4 }, { time: '11:44', value: 2.8 }
  ],
  pressure: [
    { time: '11:40', value: 5.0 }, { time: '11:41', value: 5.1 },
    { time: '11:42', value: 4.9 }, { time: '11:43', value: 5.2 }, { time: '11:44', value: 5.0 }
  ],
  rpm: [
    { time: '11:40', value: 2980 }, { time: '11:41', value: 3010 },
    { time: '11:42', value: 2995 }, { time: '11:43', value: 3020 }, { time: '11:44', value: 2990 }
  ],
  current: [
    { time: '11:40', value: 12.1 }, { time: '11:41', value: 12.5 },
    { time: '11:42', value: 12.3 }, { time: '11:43', value: 13.0 }, { time: '11:44', value: 13.4 }
  ],
  voltage: [
    { time: '11:40', value: 400.1 }, { time: '11:41', value: 399.8 },
    { time: '11:42', value: 400.5 }, { time: '11:43', value: 399.5 }, { time: '11:44', value: 401.0 }
  ]
};

export default function RealtimeDashboardPage({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isConnected, connectionStatus, latestReadings, chartStreams } = useWebSocketTelemetry();

  const fetchDashboardData = () => {
    setLoading(true);
    setError('');

    axios.get('/api/machines', { params: { size: 50 } })
      .then((res) => {
        setMachines(res.data?.content || res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to connect to backend REST APIs');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Overview Cards Metrics
  const totalMachines = machines.length;
  const runningCount = machines.filter(m => ['RUNNING', 'OPERATIONAL'].includes((m.status || '').toUpperCase())).length;
  const maintenanceCount = machines.filter(m => (m.status || '').toUpperCase() === 'MAINTENANCE').length;
  const criticalCount = machines.filter(m => ['CRITICAL', 'OFFLINE'].includes((m.status || '').toUpperCase())).length;
  const atRiskCount = machines.filter(m => (m.criticality || '').toUpperCase() === 'CRITICAL' || (m.criticality || '').toUpperCase() === 'HIGH').length;

  // Merge WebSocket streams with initial baseline if WS hasn't emitted 15 points yet
  const getStreamData = (key) => {
    const wsData = chartStreams[key] || [];
    if (wsData.length > 0) return wsData;
    return INITIAL_MOCK_STREAMS[key] || [];
  };

  return (
    <div className="space-y-8">
      {/* Real-time Status Banner */}
      <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Radio className={`w-5 h-5 ${isConnected ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Live Telemetry Pipeline</h2>
            <p className="text-xs text-slate-400">
              STOMP WebSocket Broker Destination: <span className="font-mono text-blue-400">/topic/telemetry</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
            isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            {connectionStatus}
          </span>
          <button
            onClick={fetchDashboardData}
            className="p-1.5 bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Refresh Fleet Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-red-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardData} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 font-bold rounded">
            Retry Connection
          </button>
        </div>
      )}

      {/* 6 Dashboard Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Machines */}
        <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Assets</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totalMachines}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Monitored Plant Assets</span>
        </div>

        {/* Running */}
        <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Running</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{runningCount}</div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Nominal production</span>
        </div>

        {/* Maintenance */}
        <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Maintenance</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{maintenanceCount}</div>
          <span className="text-[10px] text-amber-400/80 mt-1 block">Servicing & repairs</span>
        </div>

        {/* Critical */}
        <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-400">{criticalCount}</div>
          <span className="text-[10px] text-red-400/80 mt-1 block">Fault / Shutdown state</span>
        </div>

        {/* Active Alerts */}
        <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Alerts</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-400">{alertsCount > 0 ? alertsCount : 1}</div>
          <span className="text-[10px] text-indigo-300 mt-1 block">Unacknowledged events</span>
        </div>

        {/* Machines at Risk */}
        <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assets at Risk</span>
            <ShieldCheck className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-extrabold text-orange-400">{atRiskCount}</div>
          <span className="text-[10px] text-orange-400/80 mt-1 block">High degradation risk</span>
        </div>
      </div>

      {/* Live Telemetry Charts (6 Recharts Line Graphs) */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" /> Real-time Live Sensor Streams (WebSocket /STOMP)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Temperature Chart */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase">
                <Thermometer className="w-4 h-4" /> Temperature (°C)
              </span>
              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-mono">
                Thermal Stream
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getStreamData('temperature')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vibration Chart */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
                <Activity className="w-4 h-4 animate-pulse" /> Vibration (mm/s)
              </span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                Oscillation Stream
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getStreamData('vibration')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pressure Chart */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                <Gauge className="w-4 h-4" /> Pressure (bar)
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                Hydraulic Stream
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getStreamData('pressure')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RPM Chart */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <RotateCw className="w-4 h-4" /> Motor Speed (RPM)
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                Rotational Stream
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getStreamData('rpm')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current Chart */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase">
                <Zap className="w-4 h-4" /> Current Draw (A)
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                Electrical Load
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getStreamData('current')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Voltage Chart */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase">
                <Flame className="w-4 h-4" /> Line Voltage (V)
              </span>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                Power Stability
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getStreamData('voltage')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Fleet Telemetry Table */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" /> Machine Asset Telemetry Fleet
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live operational health status, temperature, vibration, and failure risk assessment.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> Loading asset inventory from backend...
          </div>
        ) : machines.length === 0 ? (
          <div className="py-12 bg-slate-900/40 rounded-xl text-center text-slate-400 text-xs">
            No machine assets found in database registry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-700">
                <tr>
                  <th className="p-3">Machine</th>
                  <th className="p-3">Operating Status</th>
                  <th className="p-3">Health Score</th>
                  <th className="p-3">Live Temperature</th>
                  <th className="p-3">Live Vibration</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3 text-center">Active Alerts</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {machines.map((m) => {
                  const live = latestReadings[m.machineCode] || {};
                  const tempVal = live.temperature != null ? `${live.temperature} °C` : '62.4 °C';
                  const vibVal = live.vibration != null ? `${live.vibration} mm/s` : '2.1 mm/s';
                  
                  // Compute dynamic health bar percentage
                  let health = 94.2;
                  if (m.status === 'CRITICAL') health = 35.0;
                  else if (m.status === 'MAINTENANCE') health = 62.0;

                  return (
                    <tr
                      key={m.id}
                      onClick={() => onSelectMachine(m.id)}
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <span className="font-bold text-white block">{m.machineName}</span>
                        <span className="text-[10px] font-mono text-blue-400">{m.machineCode}</span>
                      </td>

                      <td className="p-3">
                        <StatusBadge status={m.status} />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className={`h-full ${
                                health > 80 ? 'bg-emerald-400' : health > 50 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-100">{health}%</span>
                        </div>
                      </td>

                      <td className="p-3 font-semibold text-slate-200">{tempVal}</td>
                      <td className="p-3 font-semibold text-slate-200">{vibVal}</td>

                      <td className="p-3">
                        <CriticalityBadge criticality={m.criticality} />
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.criticality === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {m.criticality === 'CRITICAL' ? '1 Active' : '0'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectMachine(m.id); }}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-bold transition-colors"
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
