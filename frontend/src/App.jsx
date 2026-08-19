import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, Server, ShieldCheck, AlertTriangle, Database, Zap, LogOut, UserCheck, Plus, Shield } from 'lucide-react';

const mockTelemetry = [
  { time: '10:00', vibration: 2.1, temperature: 62, pressure: 5.1 },
  { time: '10:05', vibration: 2.4, temperature: 64, pressure: 5.2 },
  { time: '10:10', vibration: 2.3, temperature: 63, pressure: 5.0 },
  { time: '10:15', vibration: 2.8, temperature: 68, pressure: 5.4 },
  { time: '10:20', vibration: 3.5, temperature: 72, pressure: 5.8 },
  { time: '10:25', vibration: 4.2, temperature: 78, pressure: 6.2 },
];

function DashboardContent() {
  const { user, role, logout } = useAuth();
  const [backendHealth, setBackendHealth] = useState('CHECKING');
  const [mlHealth, setMlHealth] = useState('CHECKING');
  const [machines, setMachines] = useState([]);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachine, setNewMachine] = useState({ machineCode: '', machineName: '', machineType: 'Milling', status: 'OPERATIONAL', criticality: 'MEDIUM' });

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
    fetchMachines();
  }, []);

  const fetchMachines = () => {
    axios.get('/api/machines')
      .then(res => {
        setMachines(res.data?.content || res.data || []);
      })
      .catch(() => {
        setMachines([
          { id: 1, machineCode: 'MCH-CNC-001', machineName: 'CNC Milling Machine', status: 'OPERATIONAL', criticality: 'CRITICAL' },
          { id: 2, machineCode: 'MCH-PMP-002', machineName: 'Coolant Pump', status: 'OPERATIONAL', criticality: 'HIGH' },
          { id: 3, machineCode: 'MCH-CMP-003', machineName: 'Air Compressor', status: 'MAINTENANCE_REQUIRED', criticality: 'MEDIUM' }
        ]);
      });
  };

  const handleCreateMachine = (e) => {
    e.preventDefault();
    axios.post('/api/machines', newMachine)
      .then(() => {
        fetchMachines();
        setShowAddMachine(false);
        setNewMachine({ machineCode: '', machineName: '', machineType: 'Milling', status: 'OPERATIONAL', criticality: 'MEDIUM' });
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to create machine'));
  };

  const isEngineerOrAdmin = role === 'ADMIN' || role === 'ENGINEER';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      {/* Top Navigation / Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
            Industrial Predictive Maintenance Platform
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time Asset Telemetry, AI Anomaly Detection & Asset Intelligence Operations
          </p>
        </div>

        {/* User Info & System Health Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Current User Badge */}
          <div className="flex items-center gap-2.5 bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <div className="text-xs">
              <span className="font-bold text-white block">{user?.fullName || user?.username}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{user?.email}</span>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ml-1 ${
              role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
              role === 'ENGINEER' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {role}
            </span>
          </div>

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

          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Role Action Bar for Engineers & Admins */}
      {isEngineerOrAdmin && (
        <div className="mb-6 flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Management Tools ({role} Access)</span>
          </div>
          <button
            onClick={() => setShowAddMachine(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Industrial Machine
          </button>
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddMachine && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Register New Machine Asset</h3>
            <form onSubmit={handleCreateMachine} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Machine Code</label>
                <input type="text" required value={newMachine.machineCode} onChange={e=>setNewMachine({...newMachine, machineCode: e.target.value})} placeholder="MCH-CNC-99" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"/>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Machine Name</label>
                <input type="text" required value={newMachine.machineName} onChange={e=>setNewMachine({...newMachine, machineName: e.target.value})} placeholder="High Speed Lathe" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"/>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-xs">Save Machine</button>
                <button type="button" onClick={()=>setShowAddMachine(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            Live Telemetry Telematics Stream (CNC Milling Machine)
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

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing Authentication Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (view === 'register') {
      return <RegisterPage onNavigateLogin={() => setView('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setView('register')} />;
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'OPERATOR']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
