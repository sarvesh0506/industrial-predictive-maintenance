import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SensorTypeBadge from './SensorTypeBadge';
import PaginationControls from './PaginationControls';
import SensorFormModal from './SensorFormModal';
import SensorHistoryModal from './SensorHistoryModal';
import { Search, Filter, Plus, Edit, Trash2, Activity, Cpu, RefreshCw } from 'lucide-react';

export default function SensorListPage() {
  const { role } = useAuth();
  const [sensors, setSensors] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sensorType, setSensorType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [machineId, setMachineId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [historySensor, setHistorySensor] = useState(null);

  const isManagementAllowed = role === 'ADMIN' || role === 'ENGINEER';

  useEffect(() => {
    // Fetch machines list for filter dropdown
    axios.get('/api/machines', { params: { size: 100 } })
      .then((res) => setMachines(res.data?.content || res.data || []))
      .catch(() => setMachines([]));
  }, []);

  const fetchSensors = () => {
    setLoading(true);
    axios.get('/api/sensors', {
      params: {
        search: search || undefined,
        sensorType: sensorType !== 'ALL' ? sensorType : undefined,
        status: status !== 'ALL' ? status : undefined,
        machineId: machineId ? Number(machineId) : undefined,
        page,
        size: 9,
        sortBy,
        sortDir
      }
    })
    .then((res) => {
      if (res.data?.content) {
        setSensors(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      } else {
        setSensors(res.data || []);
        setTotalPages(1);
        setTotalElements((res.data || []).length);
      }
      setLoading(false);
    })
    .catch(() => {
      setSensors([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSensors();
  }, [search, sensorType, status, machineId, sortBy, sortDir, page]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this sensor configuration?')) {
      axios.delete(`/api/sensors/${id}`)
        .then(() => fetchSensors())
        .catch((err) => alert(err.response?.data?.message || 'Failed to delete sensor'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-blue-400" /> IoT Sensor Registry & Telemetry Config
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage physical sensors, calibrate telemetry units, and inspect sensor reading streams.
            </p>
          </div>

          {isManagementAllowed && (
            <button
              onClick={() => { setSelectedSensor(null); setShowFormModal(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add IoT Sensor
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search code or unit..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sensor Type Filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <select
              value={sensorType}
              onChange={(e) => { setSensorType(e.target.value); setPage(0); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Sensor Types</option>
              <option value="TEMPERATURE">TEMPERATURE</option>
              <option value="VIBRATION">VIBRATION</option>
              <option value="PRESSURE">PRESSURE</option>
              <option value="RPM">RPM</option>
              <option value="CURRENT">CURRENT</option>
              <option value="VOLTAGE">VOLTAGE</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="FAULTY">FAULTY</option>
              <option value="CALIBRATING">CALIBRATING</option>
            </select>
          </div>

          {/* Machine Assignment Filter */}
          <div className="relative">
            <select
              value={machineId}
              onChange={(e) => { setMachineId(e.target.value); setPage(0); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Machines</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.machineCode} — {m.machineName}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="createdAt">Date Added</option>
              <option value="sensorCode">Sensor Code</option>
              <option value="sensorType">Sensor Type</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white"
            >
              {sortDir.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Sensor List Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> Fetching registered sensors...
        </div>
      ) : sensors.length === 0 ? (
        <div className="bg-slate-800/40 p-12 rounded-2xl border border-slate-800 text-center text-slate-400">
          <p className="text-base font-semibold mb-1">No telemetry sensors match your filter criteria.</p>
          <p className="text-xs text-slate-500">Try adjusting your filters or register a new sensor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map((s) => (
            <div
              key={s.id}
              className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {s.sensorCode}
                    </span>
                    <div className="mt-2">
                      <SensorTypeBadge type={s.sensorType} />
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${
                    s.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    s.status === 'FAULTY' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    s.status === 'CALIBRATING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mb-4 pt-2 border-t border-slate-700/50">
                  <div className="flex justify-between">
                    <span>Assigned Asset:</span>
                    <span className="font-semibold text-slate-200">
                      {s.machineCode ? `${s.machineCode} (${s.machineName || ''})` : `Machine #${s.machineId}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Measurement Unit:</span>
                    <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {s.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => setHistorySensor(s)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" /> Inspect History Stream
                </button>

                {isManagementAllowed && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedSensor(s); setShowFormModal(true); }}
                      className="p-1.5 bg-slate-700/60 hover:bg-amber-600/30 text-slate-300 hover:text-amber-400 rounded-lg transition-colors"
                      title="Edit Sensor Config"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 bg-slate-700/60 hover:bg-red-600/30 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
                      title="Delete Sensor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Form Modal */}
      {showFormModal && (
        <SensorFormModal
          sensor={selectedSensor}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => { setShowFormModal(false); fetchSensors(); }}
        />
      )}

      {/* Telemetry History Modal */}
      {historySensor && (
        <SensorHistoryModal
          sensor={historySensor}
          onClose={() => setHistorySensor(null)}
        />
      )}
    </div>
  );
}
