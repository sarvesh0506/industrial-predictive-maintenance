import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Bell, AlertTriangle, ShieldAlert, Info, CheckCircle2, Filter, Search, Settings, X, RefreshCw, Layers
} from 'lucide-react';

export default function AlertsCenterPage({ onNavigateMachine }) {
  const [alerts, setAlerts] = useState([]);
  const [thresholdConfigs, setThresholdConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveToast, setLiveToast] = useState(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  const socketRef = useRef(null);

  const fetchAlerts = () => {
    setLoading(true);
    let url = '/api/alerts';
    const params = [];
    if (severityFilter) params.push(`severity=${severityFilter}`);
    if (sourceFilter) params.push(`source=${sourceFilter}`);
    if (statusFilter) params.push(`status=${statusFilter}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    axios.get(url)
      .then((res) => {
        setAlerts(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    axios.get('/api/alerts/threshold-configs')
      .then((res) => setThresholdConfigs(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();

    // Native Browser STOMP WebSocket Connection over /topic/alerts
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/websocket`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        ws.send("CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0");
      };

      ws.onmessage = (event) => {
        const message = event.data;
        if (message.startsWith('CONNECTED')) {
          ws.send("SUBSCRIBE\nid:sub-alerts\ndestination:/topic/alerts\n\n\0");
          return;
        }
        if (message.startsWith('MESSAGE')) {
          try {
            const bodyIndex = message.indexOf('\n\n');
            if (bodyIndex !== -1) {
              const bodyStr = message.substring(bodyIndex + 2, message.length - 1).trim();
              if (bodyStr) {
                const alert = JSON.parse(bodyStr);
                if (alert.severity === 'CRITICAL' || alert.severity === 'WARNING') {
                  setLiveToast(alert);
                  setTimeout(() => setLiveToast(null), 8000);
                }
                fetchAlerts();
              }
            }
          } catch (e) {}
        }
      };
    } catch (e) {}

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [severityFilter, sourceFilter, statusFilter]);

  const handleAcknowledge = (id) => {
    axios.put(`/api/alerts/${id}/acknowledge`)
      .then(() => fetchAlerts())
      .catch((err) => alert(err.response?.data?.message || 'Failed to acknowledge alert'));
  };

  const handleResolve = (id) => {
    axios.put(`/api/alerts/${id}/resolve`)
      .then(() => fetchAlerts())
      .catch((err) => alert(err.response?.data?.message || 'Failed to resolve alert'));
  };

  const handleSaveThresholdConfig = (e) => {
    e.preventDefault();
    if (!editingConfig) return;

    axios.put('/api/alerts/threshold-configs', editingConfig)
      .then(() => {
        setEditingConfig(null);
        axios.get('/api/alerts/threshold-configs').then((res) => setThresholdConfigs(res.data));
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to save threshold settings'));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.alertMessage || '').toLowerCase().includes(q) ||
      (a.machineCode || '').toLowerCase().includes(q) ||
      (a.alertSource || '').toLowerCase().includes(q)
    );
  });

  const severityBadge = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'WARNING': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  const statusBadge = (st) => {
    switch ((st || '').toUpperCase()) {
      case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'ACKNOWLEDGED': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default: return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      {/* Live STOMP Toast Notification */}
      {liveToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 border border-red-500/50 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-bounce">
          <div className="p-2 bg-red-500/20 rounded-xl text-red-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">LIVE {liveToast.severity} ALERT</span>
              <button onClick={() => setLiveToast(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-white">{liveToast.alertMessage}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Machine: {liveToast.machineCode} • {new Date(liveToast.triggeredAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" /> Industrial Alert & Notification Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-source alert notifications, STOMP broadcasts, and configurable sensor threshold settings
          </p>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-600"
        >
          <Settings className="w-4 h-4 text-indigo-400" /> Threshold Settings
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by message, asset code, source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Alert Sources</option>
            <option value="SENSOR_THRESHOLD">SENSOR_THRESHOLD</option>
            <option value="ANOMALY_DETECTION">ANOMALY_DETECTION</option>
            <option value="FAILURE_PREDICTION">FAILURE_PREDICTION</option>
            <option value="RUL_WARNING">RUL_WARNING</option>
            <option value="MACHINE_OFFLINE">MACHINE_OFFLINE</option>
            <option value="OVERDUE_MAINTENANCE">OVERDUE_MAINTENANCE</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Table */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading alert notification log...
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Alert Source</th>
                  <th className="p-4">Asset</th>
                  <th className="p-4">Notification Message</th>
                  <th className="p-4">Triggered Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {filteredAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${severityBadge(a.severity)}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-indigo-300 font-bold">
                        {a.alertSource}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onNavigateMachine && onNavigateMachine(a.machineId)}
                        className="font-mono font-bold text-blue-400 hover:underline block text-xs"
                      >
                        {a.machineCode}
                      </button>
                      <span className="text-[10px] text-slate-400 block">{a.machineName}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-white block max-w-md">{a.alertMessage}</span>
                      {a.acknowledgedBy && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Acked by: <strong className="text-slate-300">{a.acknowledgedBy}</strong> ({new Date(a.acknowledgedAt).toLocaleTimeString()})
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-slate-400">
                        {new Date(a.triggeredAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!a.isAcknowledged && a.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-bold"
                          >
                            Acknowledge
                          </button>
                        )}
                        {a.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold"
                          >
                            Resolve
                          </button>
                        )}
                        {a.status === 'RESOLVED' && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No alert notifications matching active filters.
          </div>
        )}
      </div>

      {/* Threshold Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" /> Configurable Sensor Threshold Settings
              </h3>
              <button onClick={() => { setShowConfigModal(false); setEditingConfig(null); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingConfig ? (
              <form onSubmit={handleSaveThresholdConfig} className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Configure {editingConfig.sensorType} Thresholds</span>
                  <button type="button" onClick={() => setEditingConfig(null)} className="text-slate-400 text-[10px] underline">Back to List</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Warning Max Limit</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingConfig.warningMax || ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, warningMax: parseFloat(e.target.value) || null })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Critical Max Limit</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingConfig.criticalMax || ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, criticalMax: parseFloat(e.target.value) || null })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Warning Min Limit</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingConfig.warningMin || ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, warningMin: parseFloat(e.target.value) || null })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Critical Min Limit</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingConfig.criticalMin || ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, criticalMin: parseFloat(e.target.value) || null })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                  <button type="button" onClick={() => setEditingConfig(null)} className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold">Save Settings</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {thresholdConfigs.map((cfg) => (
                    <div key={cfg.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white">{cfg.sensorType} ({cfg.unit})</span>
                        <div className="text-[11px] text-slate-400 gap-3 flex mt-0.5">
                          <span>Warning Max: <strong className="text-amber-400">{cfg.warningMax ?? 'N/A'}</strong></span>
                          <span>Critical Max: <strong className="text-red-400">{cfg.criticalMax ?? 'N/A'}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingConfig(cfg)}
                        className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-700">
                  <button onClick={() => setShowConfigModal(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl font-bold text-xs">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
