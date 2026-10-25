import React from 'react';
import { FDRStatus } from '../types/fdr';
import {
  Search,
  Filter,
  Download,
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';

interface FDRFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  regionFilter: string;
  onRegionChange: (val: string) => void;
  bankFilter: string;
  onBankChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (val: 'table' | 'grid') => void;
  onOpenNewModal: () => void;
  onExportCSV: () => void;
  totalFiltered: number;
  canCreateFDR: boolean;
}

export const FDRFilterBar: React.FC<FDRFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  regionFilter,
  onRegionChange,
  bankFilter,
  onBankChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenNewModal,
  onExportCSV,
  totalFiltered,
  canCreateFDR,
}) => {
  const regions = [
    'All Regions',
    'North-West',
    'Northern',
    'Western',
    'Southern',
    'South-Western',
    'Eastern',
    'Central',
  ];

  const banks = [
    'All Banks',
    'State Bank of India',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'HDFC Bank',
    'ICICI Bank',
  ];

  const hasActiveFilters =
    statusFilter !== 'all' ||
    regionFilter !== 'All Regions' ||
    bankFilter !== 'All Banks' ||
    Boolean(searchTerm);

  const resetFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onRegionChange('All Regions');
    onBankChange('All Banks');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-6 space-y-3.5">
      {/* Search Input & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by FDR No, Institution Name, AICTE PID, IFSC or Branch..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle, Export CSV & Submit */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Table / Grid Mode Switcher */}
          <div className="flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-slate-600">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-blue-700 font-bold' : 'hover:text-slate-900'
              }`}
              title="Data Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-700 font-bold' : 'hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
            title="Download CSV report of current records"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Submit New FDR Button */}
          {canCreateFDR && (
            <button
              type="button"
              onClick={onOpenNewModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Submit FDR</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row: Region, Bank, Status, Sort */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="verified">Verified Lien</option>
          <option value="pending_verification">Pending Scrutiny</option>
          <option value="discrepancy_reported">Discrepancy Reported</option>
          <option value="renewal_requested">Renewal Requested</option>
          <option value="release_requested">Release Requested</option>
          <option value="released">Displedged / Settled</option>
          <option value="rejected">Rejected</option>
          <option value="expiring_30">Expiring in &lt;30 Days</option>
          <option value="expiring_90">Expiring in &lt;90 Days</option>
        </select>

        {/* Region Filter */}
        <select
          value={regionFilter}
          onChange={(e) => onRegionChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:bg-white"
        >
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Bank Filter */}
        <select
          value={bankFilter}
          onChange={(e) => onBankChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:bg-white"
        >
          {banks.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Sorting Dropdown */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:bg-white"
          >
            <option value="maturity_asc">Maturity (Soonest First)</option>
            <option value="maturity_desc">Maturity (Furthest First)</option>
            <option value="amount_desc">Amount (High to Low)</option>
            <option value="amount_asc">Amount (Low to High)</option>
            <option value="date_desc">Submission Date (Newest)</option>
            <option value="inst_asc">Institution Name (A-Z)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-medium">Active:</span>
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              Status: {statusFilter.replace(/_/g, ' ')}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onStatusChange('all')} />
            </span>
          )}
          {regionFilter !== 'All Regions' && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              Region: {regionFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onRegionChange('All Regions')} />
            </span>
          )}
          {bankFilter !== 'All Banks' && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              Bank: {bankFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onBankChange('All Banks')} />
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              Search: "{searchTerm}"
              <X className="w-3 h-3 cursor-pointer" onClick={() => onSearchChange('')} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};
