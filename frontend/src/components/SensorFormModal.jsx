import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, AlertCircle, Cpu } from 'lucide-react';

const DEFAULT_UNITS = {
  TEMPERATURE: '°C',
  VIBRATION: 'mm/s',
  PRESSURE: 'bar',
  RPM: 'RPM',
  CURRENT: 'A',
  VOLTAGE: 'V'
};

export default function SensorFormModal({ sensor, onClose, onSuccess }) {
  const isEditMode = !!sensor;

  const [formData, setFormData] = useState({
    sensorCode: sensor?.sensorCode || '',
    sensorType: sensor?.sensorType || 'TEMPERATURE',
    machineId: sensor?.machineId || '',
    unit: sensor?.unit || '°C',
    status: sensor?.status || 'ACTIVE'
  });

  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available machines for assignment dropdown
    axios.get('/api/machines', { params: { size: 100 } })
      .then((res) => {
        setMachines(res.data?.content || res.data || []);
      })
      .catch(() => {
        setMachines([
          { id: 1, machineCode: 'MCH-CNC-001', machineName: 'CNC Milling Machine' },
          { id: 2, machineCode: 'MCH-PMP-002', machineName: 'Coolant Pump' }
        ]);
      });
  }, []);

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    setFormData({
      ...formData,
      sensorType: selectedType,
      unit: DEFAULT_UNITS[selectedType] || formData.unit
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      ...formData,
      machineId: Number(formData.machineId)
    };

    try {
      if (isEditMode) {
        await axios.put(`/api/sensors/${sensor.id}`, payload);
      } else {
        await axios.post('/api/sensors', payload);
      }
      onSuccess();
    } catch (err) {
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        setError(err.response.data.details.join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to save sensor configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            {isEditMode ? 'Edit IoT Sensor Configuration' : 'Register New Telemetry Sensor'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sensor Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="sensorCode"
              required
              value={formData.sensorCode}
              onChange={handleChange}
              placeholder="e.g. SNR-TEMP-001"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sensor Type <span className="text-red-400">*</span>
            </label>
            <select
              name="sensorType"
              value={formData.sensorType}
              onChange={handleTypeChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="TEMPERATURE">TEMPERATURE (°C, °F)</option>
              <option value="VIBRATION">VIBRATION (mm/s, g)</option>
              <option value="PRESSURE">PRESSURE (bar, PSI)</option>
              <option value="RPM">RPM (Rotational Speed)</option>
              <option value="CURRENT">CURRENT (Amperes)</option>
              <option value="VOLTAGE">VOLTAGE (Volts)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assign to Machine Asset <span className="text-red-400">*</span>
            </label>
            <select
              name="machineId"
              required
              value={formData.machineId}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Machine...</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.machineCode} — {m.machineName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Measurement Unit <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="unit"
                required
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g. °C, mm/s, bar"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="FAULTY">FAULTY</option>
                <option value="CALIBRATING">CALIBRATING</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : isEditMode ? 'Update Sensor' : 'Register Sensor'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
