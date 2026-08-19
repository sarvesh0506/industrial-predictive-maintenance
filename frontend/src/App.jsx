import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import RealtimeDashboardPage from './components/RealtimeDashboardPage';
import MachineListPage from './components/MachineListPage';
import MachineDetailPage from './components/MachineDetailPage';
import MachineFormPage from './components/MachineFormPage';
import SensorListPage from './components/SensorListPage';
import MaintenanceDashboardPage from './components/MaintenanceDashboardPage';
import AlertsCenterPage from './components/AlertsCenterPage';
import { Activity, Server, Cpu, LayoutDashboard, LogOut, UserCheck, Wrench, Bell } from 'lucide-react';

function NavigationHeader({ currentRoute, onNavigate }) {
  const { user, role, logout } = useAuth();

  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 mb-8 border-b border-slate-800 gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
          Industrial Predictive Maintenance Platform
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-Time Asset Telemetry, AI Failure Anomaly Detection & Asset Intelligence Operations
        </p>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={() => onNavigate('/')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentRoute === '/' || currentRoute === '/dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Real-time Dashboard
          </button>

          <button
            onClick={() => onNavigate('/machines')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentRoute.startsWith('/machines')
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> Machine Inventory
          </button>

          <button
            onClick={() => onNavigate('/sensors')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentRoute.startsWith('/sensors')
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Telemetry Sensors
          </button>

          <button
            onClick={() => onNavigate('/alerts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentRoute.startsWith('/alerts')
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Alert Center
          </button>

          <button
            onClick={() => onNavigate('/maintenance')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentRoute.startsWith('/maintenance')
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Maintenance Work Orders
          </button>
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="flex flex-wrap items-center gap-3">
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

        <button
          onClick={logout}
          className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [route, setRoute] = useState('/');
  const [activeMachineId, setActiveMachineId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing Authentication Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onNavigateLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setAuthView('register')} />;
  }

  const navigateTo = (path, machineId = null) => {
    setRoute(path);
    if (machineId) setActiveMachineId(machineId);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'OPERATOR']}>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
        <NavigationHeader currentRoute={route} onNavigate={(path) => navigateTo(path)} />

        {/* Route Handler */}
        {route === '/' || route === '/dashboard' ? (
          <RealtimeDashboardPage
            onSelectMachine={(id) => navigateTo('/machines/detail', id)}
          />
        ) : route === '/sensors' ? (
          <SensorListPage />
        ) : route === '/alerts' ? (
          <AlertsCenterPage
            onNavigateMachine={(id) => navigateTo('/machines/detail', id)}
          />
        ) : route === '/maintenance' ? (
          <MaintenanceDashboardPage
            onNavigateMachine={(id) => navigateTo('/machines/detail', id)}
          />
        ) : route === '/machines/new' ? (
          <MachineFormPage
            onBack={() => navigateTo('/machines')}
            onSuccess={() => navigateTo('/machines')}
          />
        ) : route === '/machines/edit' ? (
          <MachineFormPage
            machineId={activeMachineId}
            onBack={() => navigateTo('/machines')}
            onSuccess={() => navigateTo('/machines')}
          />
        ) : route === '/machines/detail' ? (
          <MachineDetailPage
            machineId={activeMachineId}
            onBack={() => navigateTo('/machines')}
            onNavigateEdit={(id) => navigateTo('/machines/edit', id)}
          />
        ) : (
          <MachineListPage
            onSelectMachine={(id) => navigateTo('/machines/detail', id)}
            onNavigateCreate={() => navigateTo('/machines/new')}
            onNavigateEdit={(id) => navigateTo('/machines/edit', id)}
          />
        )}
      </div>
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
