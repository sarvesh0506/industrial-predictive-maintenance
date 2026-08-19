import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import CriticalityBadge from './CriticalityBadge';
import PaginationControls from './PaginationControls';
import { Search, Filter, Plus, Edit, Trash2, Eye, Server, RefreshCw } from 'lucide-react';

export default function MachineListPage({ onSelectMachine, onNavigateCreate, onNavigateEdit }) {
  const { role } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [criticality, setCriticality] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const isManagementAllowed = role === 'ADMIN' || role === 'ENGINEER';

  const fetchMachines = () => {
    setLoading(true);
    axios.get('/api/machines', {
      params: {
        search: search || undefined,
        status: status !== 'ALL' ? status : undefined,
        criticality: criticality !== 'ALL' ? criticality : undefined,
        page,
        size: 9,
        sortBy,
        sortDir
      }
    })
    .then((res) => {
      if (res.data?.content) {
        setMachines(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      } else {
        setMachines(res.data || []);
        setTotalPages(1);
        setTotalElements((res.data || []).length);
      }
      setLoading(false);
    })
    .catch(() => {
      setMachines([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMachines();
  }, [search, status, criticality, sortBy, sortDir, page]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this industrial asset?')) {
      axios.delete(`/api/machines/${id}`)
        .then(() => fetchMachines())
        .catch((err) => alert(err.response?.data?.message || 'Failed to delete machine'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar / Filters */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Server className="w-6 h-6 text-blue-400" /> Machine Asset Inventory
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Monitor, filter, and manage physical plant machinery across bays and facilities.
            </p>
          </div>

          {isManagementAllowed && (
            <button
              onClick={onNavigateCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Industrial Machine
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search code, name, location..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="RUNNING">RUNNING</option>
              <option value="IDLE">IDLE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Criticality Filter */}
          <div className="relative">
            <select
              value={criticality}
              onChange={(e) => { setCriticality(e.target.value); setPage(0); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Criticalities</option>
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="CRITICAL">CRITICAL Risk</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="machineCode">Machine Code</option>
              <option value="machineName">Machine Name</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              title="Toggle Sort Direction"
              className="px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white"
            >
              {sortDir.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> Fetching asset inventory...
        </div>
      ) : machines.length === 0 ? (
        <div className="bg-slate-800/40 p-12 rounded-2xl border border-slate-800 text-center text-slate-400">
          <p className="text-base font-semibold mb-1">No machines match your criteria.</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms or filter constraints.</p>
        </div>
      ) : (
        /* Machine Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMachine(m.id)}
              className="bg-slate-800/90 hover:bg-slate-800 p-5 rounded-2xl border border-slate-700/80 hover:border-blue-500/50 shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {m.machineCode}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 group-hover:text-blue-400 transition-colors">
                      {m.machineName}
                    </h3>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                <div className="space-y-1 text-xs text-slate-400 mb-4">
                  <div className="flex justify-between">
                    <span>Type:</span> <span className="text-slate-200 font-medium">{m.machineType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span> <span className="text-slate-200 font-medium">{m.location || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manufacturer:</span> <span className="text-slate-200 font-medium">{m.manufacturer || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <CriticalityBadge criticality={m.criticality} />

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectMachine(m.id); }}
                    className="p-1.5 bg-slate-700/60 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 rounded-lg transition-colors"
                    title="View Asset Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isManagementAllowed && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigateEdit(m.id); }}
                        className="p-1.5 bg-slate-700/60 hover:bg-amber-600/30 text-slate-300 hover:text-amber-400 rounded-lg transition-colors"
                        title="Edit Machine"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, m.id)}
                        className="p-1.5 bg-slate-700/60 hover:bg-red-600/30 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete Machine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}
