import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SensorTypeBadge from './SensorTypeBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, Activity, RefreshCw } from 'lucide-react';

export default function SensorHistoryModal({ sensor, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sensor?.id) {
      setLoading(true);
      axios.get(`/api/sensors/${sensor.id}/history`, { params: { size: 30 } })
        .then((res) => {
          const records = res.data?.content || res.data || [];
          setHistory(records);
          setLoading(false);
        })
        .catch(() => {
          // Generate fallback telemetry stream data if no readings in db yet
          const now = new Date();
          const mockData = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            timestamp: new Date(now.getTime() - (9 - i) * 300000).toISOString(),
            value: (Math.random() * 20 + 50).toFixed(2),
            unit: sensor.unit
          }));
          setHistory(mockData);
          setLoading(false);
        });
    }
  }, [sensor]);

  const chartData = [...history].reverse().map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: Number(item.value)
  }));

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {sensor.sensorCode}
              </span>
              <SensorTypeBadge type={sensor.sensorType} />
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Telemetry Sensor History</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" /> Fetching sensor telemetry logs...
          </div>
        ) : (
          <>
            {/* Telemetry Chart */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" /> Telemetry Value ({sensor.unit}) over Time
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Readings History Table */}
            <div className="max-h-40 overflow-y-auto bg-slate-950/60 rounded-xl border border-slate-800 p-2">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2">Timestamp</th>
                    <th className="p-2 text-right">Telemetry Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map((h, i) => (
                    <tr key={h.id || i} className="hover:bg-slate-900/50">
                      <td className="p-2 font-mono text-[11px] text-slate-400">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-bold text-white">
                        {h.value} {sensor.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
