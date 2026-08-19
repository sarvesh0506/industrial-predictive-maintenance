import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Clock, Wrench, AlertTriangle, ShieldCheck, Activity, Download, Calendar, Filter, Zap, Cpu
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [range, setRange] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    let url = `/api/analytics/dashboard?range=${range}`;
    if (range === 'custom' && startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    axios.get(url)
      .then((res) => {
        setSummary(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const handleExportCsv = () => {
    let url = `/api/analytics/export/csv?range=${range}`;
    if (range === 'custom' && startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    axios.get(url, { responseType: 'blob' })
      .then((res) => {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `industrial_analytics_report_${range}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => alert('Failed to export CSV report'));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" /> Industrial Analytics & KPI Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real database metrics calculation for Uptime, Downtime, MTBF, MTTR, Health Trends, and Failure Risk
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Timeframe Filter Bar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Filter className="w-4 h-4 text-blue-400" /> Timeframe Range:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['24h', '7d', '30d', 'custom'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors uppercase ${
                range === r
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'Custom Range'}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white focus:outline-none"
            />
            <button
              onClick={fetchAnalytics}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {loading || !summary ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Computing real database operational metrics...
        </div>
      ) : (
        <>
          {/* 8 KPI Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Uptime */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Fleet Uptime</span>
              <div className="text-3xl font-extrabold text-emerald-400 my-1">{summary.uptimePercentage}%</div>
              <span className="text-[10px] text-slate-400">Operational availability</span>
            </div>

            {/* Downtime */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-amber-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Downtime</span>
              <div className="text-3xl font-extrabold text-amber-400 my-1">{summary.downtimeHours} hrs</div>
              <span className="text-[10px] text-slate-400">Offline & maintenance time</span>
            </div>

            {/* Maintenance Frequency */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-blue-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Maintenance Tasks</span>
              <div className="text-3xl font-extrabold text-blue-400 my-1">{summary.maintenanceFrequency}</div>
              <span className="text-[10px] text-slate-400">Work orders in range</span>
            </div>

            {/* Anomaly Frequency */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-red-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Anomalies Detected</span>
              <div className="text-3xl font-extrabold text-red-400 my-1">{summary.anomalyFrequency}</div>
              <span className="text-[10px] text-slate-400">AI flagged condition events</span>
            </div>

            {/* Failure Risk */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-orange-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Avg Fleet Failure Risk</span>
              <div className="text-3xl font-extrabold text-orange-400 my-1">{summary.averageFailureRisk}%</div>
              <span className="text-[10px] text-slate-400">RandomForest model probability</span>
            </div>

            {/* Machine Health */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-indigo-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Machine Health Index</span>
              <div className="text-3xl font-extrabold text-indigo-300 my-1">{summary.averageMachineHealth}%</div>
              <span className="text-[10px] text-slate-400">Continuous telemetry health</span>
            </div>

            {/* MTBF */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-teal-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">MTBF (Mean Time Between Failures)</span>
              <div className="text-3xl font-extrabold text-teal-300 my-1">{summary.mtbfHours} hrs</div>
              <span className="text-[10px] text-slate-400">Reliability mean time</span>
            </div>

            {/* MTTR */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-purple-500/30 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">MTTR (Mean Time To Repair)</span>
              <div className="text-3xl font-extrabold text-purple-300 my-1">{summary.mttrHours} hrs</div>
              <span className="text-[10px] text-slate-400">Average repair duration</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Machine Health Trend */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Machine Health Trend Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.healthTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[60, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Anomalies Over Time */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Anomalies Flagged Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.anomalyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="value" fill="#f87171" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Machine Downtime Distribution */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Downtime Hours per Machine Asset
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.machineDowntimeList}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="machineCode" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="value" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Failure Risk Distribution */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" /> Machine Failure Risk Category Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#fb923c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
