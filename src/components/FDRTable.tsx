import React, { useState } from 'react';
import { FDRItem, FDRStatus } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  ShieldCheck,
  RotateCw,
  ArrowUpRight,
  Landmark,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

interface FDRTableProps {
  fdrs: FDRItem[];
  viewMode: 'table' | 'grid';
  onSelectFDR: (fdr: FDRItem) => void;
  onOpenVerify: (fdr: FDRItem) => void;
  onOpenRenewal: (fdr: FDRItem) => void;
  onOpenRelease: (fdr: FDRItem) => void;
}

export const getMaturityDays = (maturityDateStr: string): number => {
  const now = new Date();
  const mat = new Date(maturityDateStr);
  return Math.ceil((mat.getTime() - now.getTime()) / (1000 * 3600 * 24));
};

export const renderStatusBadge = (status: FDRStatus) => {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Verified Lien
        </span>
      );
    case 'pending_verification':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
          <Clock className="w-3 h-3 text-amber-600" />
          Pending Scrutiny
        </span>
      );
    case 'discrepancy_reported':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Discrepancy Flagged
        </span>
      );
    case 'renewal_requested':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-300 px-2 py-0.5 rounded-full">
          <RotateCw className="w-3 h-3 text-indigo-600" />
          Renewal Requested
        </span>
      );
    case 'release_requested':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-300 px-2 py-0.5 rounded-full">
          <ArrowUpRight className="w-3 h-3 text-purple-600" />
          Release Requested
        </span>
      );
    case 'released':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-slate-500" />
          Displedged / Settled
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 border border-red-300 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3 text-red-600" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
          {status}
        </span>
      );
  }
};

export const renderMaturityPill = (maturityDateStr: string, status: FDRStatus) => {
  if (status === 'released') {
    return <span className="text-[11px] text-slate-400 font-medium">Archived</span>;
  }

  const days = getMaturityDays(maturityDateStr);

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
        <AlertCircle className="w-3 h-3 text-red-600" />
        Expired ({Math.abs(days)}d ago)
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-md animate-pulse">
        <AlertCircle className="w-3 h-3 text-rose-600" />
        {days} days left
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3 text-amber-600" />
        {days} days left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
      {days} days
    </span>
  );
};

export const FDRTable: React.FC<FDRTableProps> = ({
  fdrs,
  viewMode,
  onSelectFDR,
  onOpenVerify,
  onOpenRenewal,
  onOpenRelease,
}) => {
  const { currentUser } = useAuth();
  const isOfficerOrAdmin = currentUser.role === 'officer' || currentUser.role === 'admin';

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalRecords = fdrs.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  // Safe slice
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentRecords = fdrs.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (fdrs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs mb-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">No Matching FDR Records</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          No Fixed Deposit Receipts match your current filter criteria or search query.
        </p>
      </div>
    );
  }

  // Grid Mode View
  if (viewMode === 'grid') {
    return (
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentRecords.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {item.purpose}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1 font-mono">
                      {item.fdrNumber}
                    </h4>
                  </div>
                  {renderStatusBadge(item.status)}
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-start gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">{item.institutionName}</span>
                      <span className="text-[11px] text-slate-500 block">
                        PID: {item.institutionId} • {item.region}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {item.bankName} ({item.branchName})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Pledged Amount
                      </span>
                      <span className="text-base font-black text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Maturity Date
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {item.maturityDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      {item.documents?.length || 0} Doc{item.documents?.length !== 1 ? 's' : ''}
                    </span>
                    {renderMaturityPill(item.maturityDate, item.status)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectFDR(item)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>

                <div className="flex items-center gap-1.5">
                  {isOfficerOrAdmin &&
                    (item.status === 'pending_verification' || item.status === 'discrepancy_reported') && (
                      <button
                        onClick={() => onOpenVerify(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1.5 rounded-lg shadow-2xs transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Scrutinize
                      </button>
                    )}

                  {item.status === 'verified' && (
                    <>
                      <button
                        onClick={() => onOpenRenewal(item)}
                        className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition"
                        title="Request Term Renewal"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => onOpenRelease(item)}
                        className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-200 transition"
                        title="Request Refund/Release"
                      >
                        Release
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
            <span className="font-bold text-slate-900">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-semibold text-slate-800">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table Mode View
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs mb-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">FDR Number & Purpose</th>
              <th className="py-3.5 px-4">Institution & PID</th>
              <th className="py-3.5 px-4">Bank & Branch</th>
              <th className="py-3.5 px-4">Pledged Amount</th>
              <th className="py-3.5 px-4">Maturity Timeline</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-center">Docs</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentRecords.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-slate-900 text-xs">{item.fdrNumber}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.purpose}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Acc: {item.accountNumber}</div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 line-clamp-1">{item.institutionName}</div>
                  <div className="text-[11px] text-slate-500">
                    PID: <span className="font-mono text-slate-700 font-semibold">{item.institutionId}</span> • {item.region}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.city}, {item.state}</div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800">{item.bankName}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{item.branchName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{item.ifscCode}</div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-black text-slate-900 text-sm">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.interestRate}% • {item.tenureMonths} mo
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-800">{item.maturityDate}</div>
                  <div className="mt-1">{renderMaturityPill(item.maturityDate, item.status)}</div>
                </td>

                <td className="py-3.5 px-4">{renderStatusBadge(item.status)}</td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      item.documents?.length > 0
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                    title={`${item.documents?.length || 0} attached document(s)`}
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>{item.documents?.length || 0}</span>
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onSelectFDR(item)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isOfficerOrAdmin &&
                      (item.status === 'pending_verification' || item.status === 'discrepancy_reported') && (
                        <button
                          onClick={() => onOpenVerify(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-2xs transition active:scale-95"
                        >
                          Scrutinize
                        </button>
                      )}

                    {item.status === 'verified' && (
                      <>
                        <button
                          onClick={() => onOpenRenewal(item)}
                          className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition"
                          title="Renew FDR"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => onOpenRelease(item)}
                          className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition"
                          title="Release FDR"
                        >
                          Release
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
          <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
          <span className="font-bold text-slate-900">{totalRecords}</span> records
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-white transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-semibold text-slate-800">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-white transition"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
