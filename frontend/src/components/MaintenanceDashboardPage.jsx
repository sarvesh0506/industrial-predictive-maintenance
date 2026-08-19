import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Wrench, AlertTriangle, Clock, CheckCircle2, ShieldAlert, Plus, Search, Filter, UserCheck, Calendar, DollarSign, Brain, FileText, X
} from 'lucide-react';

export default function MaintenanceDashboardPage({ onNavigateMachine }) {
  const [summary, setSummary] = useState({ overdueCount: 0, upcomingCount: 0, completedCount: 0, criticalCount: 0 });
  const [tasks, setTasks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(null);

  // Form states
  const [newTask, setNewTask] = useState({
    machineId: '',
    taskTitle: '',
    maintenanceType: 'PREVENTIVE',
    priority: 'MEDIUM',
    assignedEngineer: '',
    dueDate: '',
    notes: ''
  });

  const [completeForm, setCompleteForm] = useState({ notes: '', cost: '' });

  const fetchData = () => {
    setLoading(true);
    axios.get('/api/maintenance/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch(() => {});

    let url = '/api/maintenance';
    const params = [];
    if (statusFilter) params.push(`status=${statusFilter}`);
    if (priorityFilter) params.push(`priority=${priorityFilter}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    axios.get(url)
      .then((res) => {
        setTasks(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    axios.get('/api/machines')
      .then((res) => setMachines(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.machineId) return;

    axios.post('/api/maintenance', {
      ...newTask,
      machineId: parseInt(newTask.machineId, 10),
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null
    })
      .then(() => {
        setShowCreateModal(false);
        setNewTask({ machineId: '', taskTitle: '', maintenanceType: 'PREVENTIVE', priority: 'MEDIUM', assignedEngineer: '', dueDate: '', notes: '' });
        fetchData();
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to create task'));
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    axios.put(`/api/maintenance/${taskId}`, { status: newStatus })
      .then(() => fetchData())
      .catch((err) => alert(err.response?.data?.message || 'Failed to update status'));
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!showCompleteModal) return;

    axios.put(`/api/maintenance/${showCompleteModal.id}/complete?notes=${encodeURIComponent(completeForm.notes)}&cost=${completeForm.cost || 0}`)
      .then(() => {
        setShowCompleteModal(null);
        setCompleteForm({ notes: '', cost: '' });
        fetchData();
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to complete task'));
  };

  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.taskTitle || '').toLowerCase().includes(q) ||
      (t.machineCode || '').toLowerCase().includes(q) ||
      (t.assignedEngineer || '').toLowerCase().includes(q) ||
      (t.notes || '').toLowerCase().includes(q)
    );
  });

  const priorityBadge = (pri) => {
    switch ((pri || '').toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const statusBadge = (st) => {
    switch ((st || '').toUpperCase()) {
      case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'ASSIGNED': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'CANCELLED': return 'bg-slate-800 text-slate-500 border-slate-700';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-400" /> Maintenance Management & Work Orders
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Schedule tasks, assign engineers, track due dates, and view AI-recommended maintenance triggers
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" /> Create Work Order
        </button>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overdue */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-red-500/30 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Overdue Tasks</span>
            <span className="text-3xl font-extrabold text-red-400">{summary.overdueCount}</span>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-blue-500/30 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Upcoming / Active</span>
            <span className="text-3xl font-extrabold text-blue-400">{summary.upcomingCount}</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Completed</span>
            <span className="text-3xl font-extrabold text-emerald-400">{summary.completedCount}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Critical */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-orange-500/30 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Critical Priority</span>
            <span className="text-3xl font-extrabold text-orange-400">{summary.criticalCount}</span>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, asset, engineer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Maintenance Tasks Table */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading maintenance tasks...
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Asset</th>
                  <th className="p-4">Task Title & Details</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned Engineer</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <button
                        onClick={() => onNavigateMachine && onNavigateMachine(t.machineId)}
                        className="font-mono font-bold text-blue-400 hover:underline block text-xs"
                      >
                        {t.machineCode}
                      </button>
                      <span className="text-[10px] text-slate-400 block">{t.machineName}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        {t.taskTitle}
                        {t.aiRecommended && (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5" title={t.recommendationReason}>
                            <Brain className="w-3 h-3" /> AI Triggered
                          </span>
                        )}
                      </div>
                      {t.description && <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm truncate">{t.description}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${priorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${statusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-300">
                        {t.assignedEngineer || <span className="text-slate-500 italic">Unassigned</span>}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-400">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                          <>
                            <select
                              value={t.status}
                              onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                            >
                              <option value="OPEN">OPEN</option>
                              <option value="ASSIGNED">ASSIGNED</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                            <button
                              onClick={() => setShowCompleteModal(t)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {t.status === 'COMPLETED' && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
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
            No maintenance work orders matching filters.
          </div>
        )}
      </div>

      {/* Modal: Create Maintenance Task */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" /> Create Work Order Task
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Asset Machine *</label>
                <select
                  required
                  value={newTask.machineId}
                  onChange={(e) => setNewTask({ ...newTask, machineId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Asset...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.machineCode} - {m.machineName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bearing Replacement & Spindle Alignment"
                  value={newTask.taskTitle}
                  onChange={(e) => setNewTask({ ...newTask, taskTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Engineer</label>
                  <input
                    type="text"
                    placeholder="e.g. eng.sarvesh"
                    value={newTask.assignedEngineer}
                    onChange={(e) => setNewTask({ ...newTask, assignedEngineer: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Task Notes & Description</label>
                <textarea
                  rows="3"
                  placeholder="Task instructions, tools needed, safety precautions..."
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Task */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Complete Work Order #{showCompleteModal.id}
              </h3>
              <button onClick={() => setShowCompleteModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Completion Notes</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Service summary, parts replaced, operational test outcome..."
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Service Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 250.00"
                  value={completeForm.cost}
                  onChange={(e) => setCompleteForm({ ...completeForm, cost: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
