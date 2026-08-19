import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        Validating platform session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will trigger login view in App wrapper
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md text-center bg-slate-800 p-8 rounded-2xl border border-red-500/30">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied (403 Forbidden)</h2>
          <p className="text-slate-400 text-sm mb-4">
            Your role (<span className="text-amber-400 font-mono font-bold">{role}</span>) does not have sufficient permissions to view this module.
          </p>
          <span className="text-xs text-slate-500">Contact your system administrator for elevated privileges.</span>
        </div>
      </div>
    );
  }

  return children;
}
