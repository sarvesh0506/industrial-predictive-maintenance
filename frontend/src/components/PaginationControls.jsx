import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({ currentPage, totalPages, totalElements, onPageChange }) {
  if (totalPages <= 1 && totalElements <= 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-slate-800 gap-4 text-xs text-slate-400">
      <div>
        Showing page <span className="font-semibold text-white">{currentPage + 1}</span> of{' '}
        <span className="font-semibold text-white">{Math.max(1, totalPages)}</span> ({totalElements} total assets)
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded border border-slate-700 text-white font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded font-semibold text-blue-400">
          {currentPage + 1}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || totalPages === 0}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded border border-slate-700 text-white font-medium transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
