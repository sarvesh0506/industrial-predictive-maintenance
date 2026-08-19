import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, AlertCircle, Server } from 'lucide-react';

export default function MachineFormPage({ machineId, onBack, onSuccess }) {
  const isEditMode = !!machineId;

  const [formData, setFormData] = useState({
    machineCode: '',
    machineName: '',
    machineType: 'Milling Machine',
    location: '',
    manufacturer: '',
    model: '',
    installationDate: '',
    status: 'RUNNING',
    criticality: 'MEDIUM'
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      axios.get(`/api/machines/${machineId}`)
        .then((res) => {
          const data = res.data;
          setFormData({
            machineCode: data.machineCode || '',
            machineName: data.machineName || '',
            machineType: data.machineType || 'Milling Machine',
            location: data.location || '',
            manufacturer: data.manufacturer || '',
            model: data.model || '',
            installationDate: data.installationDate || '',
            status: data.status || 'RUNNING',
            criticality: data.criticality || 'MEDIUM'
          });
          setFetching(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load machine parameters');
          setFetching(false);
        });
    }
  }, [machineId, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        await axios.put(`/api/machines/${machineId}`, formData);
      } else {
        await axios.post('/api/machines', formData);
      }
      onSuccess();
    } catch (err) {
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        setError(err.response.data.details.join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to save machine asset');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Loading machine configuration for editing...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-3 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
        <button
          onClick={onBack}
          className="p-2 bg-slate-700/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            {isEditMode ? 'Edit Industrial Machine Specification' : 'Register New Machine Asset'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEditMode ? 'Update existing machine metadata & operating configuration' : 'Add a new physical asset to the plant telemetry monitoring registry'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Machine Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="machineCode"
              required
              value={formData.machineCode}
              onChange={handleChange}
              placeholder="e.g. MCH-CNC-004"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Machine Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="machineName"
              required
              value={formData.machineName}
              onChange={handleChange}
              placeholder="e.g. Hydraulic Compression Press"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Machine Type <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="machineType"
              required
              value={formData.machineType}
              onChange={handleChange}
              placeholder="e.g. Milling, Pump, Compressor"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Plant Bay</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Bay B - Sector 4"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              placeholder="e.g. Haas, Grundfos"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Model Name/Number</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g. VF-2SS"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Installation Date</label>
            <input
              type="date"
              name="installationDate"
              value={formData.installationDate}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Operating Status <span className="text-red-400">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="RUNNING">RUNNING (Active Production)</option>
              <option value="IDLE">IDLE (Standby Mode)</option>
              <option value="MAINTENANCE">MAINTENANCE (Servicing)</option>
              <option value="OFFLINE">OFFLINE (Powered Off)</option>
              <option value="CRITICAL">CRITICAL (Degraded State)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Criticality Rating <span className="text-red-400">*</span>
            </label>
            <select
              name="criticality"
              value={formData.criticality}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="CRITICAL">CRITICAL Risk</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Parameters...' : isEditMode ? 'Update Machine Asset' : 'Register Machine Asset'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 font-bold text-xs text-slate-300 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
