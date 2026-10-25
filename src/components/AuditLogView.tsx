import React, { useState } from 'react';
import { AuditLogEntry, UserRole } from '../types/fdr';
import {
  History,
  Search,
  Filter,
  User,
  ShieldCheck,
  Building2,
  Calendar,
  Download,
  Lock,
  RotateCcw,
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.fdrNumber && log.fdrNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesRole = roleFilter === 'all' || log.role === roleFilter;

    return matchesSearch && matchesAction && matchesRole;
  });

  const exportAuditCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Action', 'FDR Number', 'Performed By', 'Role', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toLocaleString('en-IN')}"`,
      `"${l.action}"`,
      `"${l.fdrNumber || 'N/A'}"`,
      `"${l.performedByName}"`,
      `"${l.role}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_FDR_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'institution':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            <Building2 className="w-3 h-3" /> Institution User
          </span>
        );
      case 'officer':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" /> Regional Officer
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <User className="w-3 h-3" /> Council Admin
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-700 rounded-xl border border-blue-500/20">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Regulatory Compliance Trail
                </span>
                <span className="text-xs text-slate-400">• Append-Only Ledger</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Immutable Regulatory Audit Trail
              </h3>
            </div>
          </div>

          <button
            onClick={exportAuditCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 shrink-0"
            title="Download audit trail as CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit details, actor name, FDR number..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
          >
            <option value="all">All Roles</option>
            <option value="institution">Institution</option>
            <option value="officer">Regional Officer</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
          >
            <option value="all">All Action Types</option>
            <option value="FDR_SUBMITTED">FDR Submitted</option>
            <option value="VERIFIED">Lien Verified</option>
            <option value="DISCREPANCY_FLAGGED">Discrepancy Flagged</option>
            <option value="RENEWAL_REQUESTED">Renewal Requested</option>
            <option value="RENEWAL_APPROVED">Renewal Approved</option>
            <option value="RELEASE_REQUESTED">Release Requested</option>
            <option value="RELEASE_SANCTIONED">Release Sanctioned</option>
            <option value="SAMPLE_FDR_SEEDED">Sample FDR Seeded</option>
          </select>

          {(searchTerm || actionFilter !== 'all' || roleFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('all');
                setRoleFilter('all');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Audit records are cryptographically timestamped and protected by Firestore Security Rules.</span>
        </div>
        <span className="font-semibold text-slate-800">{filteredLogs.length} Records</span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">FDR Number</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {log.fdrNumber ? (
                      <span className="font-mono font-bold text-slate-900">{log.fdrNumber}</span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.performedByName}</div>
                    <div className="mt-0.5">{renderRoleBadge(log.role)}</div>
                  </td>
                  <td className="py-3 px-4 max-w-md text-slate-700 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
