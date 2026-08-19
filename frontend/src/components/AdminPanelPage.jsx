import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Users, FileText, Settings, UserCheck, UserX, Shield, Search, Filter, RefreshCw, Cpu, Server, Lock
} from 'lucide-react';

export default function AdminPanelPage({ onNavigateTab }) {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const fetchUsers = () => {
    setLoadingUsers(true);
    axios.get('/api/admin/users')
      .then((res) => {
        setUsers(res.data);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  };

  const fetchAuditLogs = () => {
    setLoadingAudit(true);
    let url = '/api/admin/audit-logs';
    if (auditActionFilter) url += `?action=${auditActionFilter}`;

    axios.get(url)
      .then((res) => {
        setAuditLogs(res.data);
        setLoadingAudit(false);
      })
      .catch(() => setLoadingAudit(false));
  };

  useEffect(() => {
    if (role === 'ADMIN') {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [role, auditActionFilter]);

  const handleToggleStatus = (userId, currentEnabled) => {
    const nextStatus = !currentEnabled;
    axios.put(`/api/admin/users/${userId}/status?enabled=${nextStatus}`)
      .then(() => {
        fetchUsers();
        fetchAuditLogs();
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to update user status'));
  };

  const handleChangeRole = (userId, newRole) => {
    axios.put(`/api/admin/users/${userId}/role?role=${newRole}`)
      .then(() => {
        fetchUsers();
        fetchAuditLogs();
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to update user role'));
  };

  if (role !== 'ADMIN') {
    return (
      <div className="bg-slate-800/80 p-8 rounded-2xl border border-red-500/40 text-center max-w-lg mx-auto shadow-2xl space-y-4">
        <div className="p-3 bg-red-500/20 rounded-full w-14 h-14 mx-auto text-red-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400">
          The Administration Panel & System Audit Logs are strictly reserved for users possessing the <strong className="text-purple-400">ADMIN</strong> role.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter((l) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      (l.adminUsername || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.targetEntity || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" /> Administration Panel & System Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            User account lifecycle management, role assignment, asset configuration, and administrative audit trails
          </p>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User Management
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Audit Logs
          </button>
        </div>
      </div>

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search users by name, email, role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Users
            </button>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
            {loadingUsers ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading user registry...</div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-4">User Details</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Registered Date</th>
                      <th className="p-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-200">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-white block">{u.fullName || u.username}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">@{u.username} • {u.email}</span>
                        </td>
                        <td className="p-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-purple-300 font-extrabold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="ENGINEER">ENGINEER</option>
                            <option value="OPERATOR">OPERATOR</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${
                            u.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'
                          }`}>
                            {u.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(u.id, u.enabled)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-colors border ${
                              u.enabled
                                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.enabled ? 'Deactivate User' : 'Activate User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">No user accounts found matching active search query.</div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail by admin, target, details..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">All Administrative Actions</option>
                <option value="USER_ACTIVATED">USER_ACTIVATED</option>
                <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
                <option value="ROLE_CHANGED">ROLE_CHANGED</option>
                <option value="MACHINE_CONFIGURED">MACHINE_CONFIGURED</option>
                <option value="SENSOR_CONFIGURED">SENSOR_CONFIGURED</option>
                <option value="THRESHOLD_UPDATED">THRESHOLD_UPDATED</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
              </button>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
            {loadingAudit ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading audit trail records...</div>
            ) : filteredAuditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Admin Username</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target Entity</th>
                      <th className="p-4">Change Summary & Details</th>
                      <th className="p-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-200">
                    {filteredAuditLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 text-slate-400">
                          {new Date(l.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-purple-300">
                          @{l.adminUsername}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-indigo-300 font-bold">
                            {l.action}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-white">
                          {l.targetEntity}
                        </td>
                        <td className="p-4 text-slate-300">
                          {l.details}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[10px]">
                          {l.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">No administrative audit log entries found matching filters.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
