import React, { useState } from 'react';
import { FDRItem } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { getMaturityDays, renderStatusBadge } from './FDRTable';
import {
  Clock,
  AlertTriangle,
  FileText,
  RotateCw,
  Send,
  Building2,
  Landmark,
  ShieldAlert,
  Calendar,
  AlertCircle,
  Eye,
  Printer,
  Info,
} from 'lucide-react';

interface MaturityTrackerProps {
  fdrs: FDRItem[];
  onOpenNotice: (fdr: FDRItem) => void;
  onOpenRenewal: (fdr: FDRItem) => void;
  onSelectFDR: (fdr: FDRItem) => void;
}

export const MaturityTracker: React.FC<MaturityTrackerProps> = ({
  fdrs,
  onOpenNotice,
  onOpenRenewal,
  onSelectFDR,
}) => {
  const { currentUser } = useAuth();
  const [filterBucket, setFilterBucket] = useState<'all' | 'expired' | 'urgent' | 'upcoming'>('all');

  // Categorize
  const activeFDRs = fdrs.filter((f) => f.status !== 'released' && f.status !== 'rejected');

  const expired = activeFDRs.filter((f) => getMaturityDays(f.maturityDate) < 0);
  const urgent = activeFDRs.filter((f) => {
    const days = getMaturityDays(f.maturityDate);
    return days >= 0 && days <= 30;
  });
  const upcoming = activeFDRs.filter((f) => {
    const days = getMaturityDays(f.maturityDate);
    return days > 30 && days <= 90;
  });
  const healthy = activeFDRs.filter((f) => getMaturityDays(f.maturityDate) > 90);

  let displayed = activeFDRs;
  if (filterBucket === 'expired') displayed = expired;
  if (filterBucket === 'urgent') displayed = urgent;
  if (filterBucket === 'upcoming') displayed = upcoming;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#10233F] via-[#162f55] to-[#1c3c6b] text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Statutory Compliance Watch
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              AICTE FDR Maturity & Rollover Monitor
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time surveillance of fixed deposit receipts approaching expiration. AICTE requires institutions to maintain continuous joint lien without lock-in lapses.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-rose-300 block">Critical Overdue</span>
              <span className="text-2xl font-black text-rose-400">{expired.length}</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">&lt;30 Days Window</span>
              <span className="text-2xl font-black text-amber-400">{urgent.length}</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-blue-300 block">Safe Horizon</span>
              <span className="text-2xl font-black text-blue-300">{healthy.length}</span>
            </div>
          </div>
        </div>

        {/* Bucket Filters */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 text-xs">
          <button
            onClick={() => setFilterBucket('all')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
              filterBucket === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            All Active ({activeFDRs.length})
          </button>

          <button
            onClick={() => setFilterBucket('expired')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
              filterBucket === 'expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white/10 text-rose-300 hover:bg-white/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Expired / Overdue ({expired.length})</span>
          </button>

          <button
            onClick={() => setFilterBucket('urgent')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
              filterBucket === 'urgent'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/10 text-amber-300 hover:bg-white/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Critical &lt;30 Days ({urgent.length})</span>
          </button>

          <button
            onClick={() => setFilterBucket('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
              filterBucket === 'upcoming'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Approaching 31-90 Days ({upcoming.length})
          </button>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>AICTE Procedural Notice:</strong> Formal notices generated through this module produce official Council letters compliant with the AICTE Approval Process Handbook (APH). Formal dispatch is handled by the Regional Bureau or authorized email gateway.
        </div>
      </div>

      {/* List of Tracked Records */}
      <div className="space-y-3.5">
        {displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No FDRs in this Watch Category</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All active records meet the current tenure threshold.
            </p>
          </div>
        ) : (
          displayed.map((fdr) => {
            const daysLeft = getMaturityDays(fdr.maturityDate);
            const isExpired = daysLeft < 0;
            const isCritical = daysLeft >= 0 && daysLeft <= 30;

            return (
              <div
                key={fdr.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isExpired
                    ? 'border-rose-300 bg-rose-50/20'
                    : isCritical
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {fdr.fdrNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {fdr.institutionName}
                    </span>
                    {renderStatusBadge(fdr.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>PID: {fdr.institutionId}</span>
                    <span>•</span>
                    <span>{fdr.bankName}</span>
                    <span>•</span>
                    <span>Corpus: <strong className="text-slate-900 font-bold">₹{fdr.amount.toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>Matures on: <strong className="text-slate-800">{fdr.maturityDate}</strong></span>
                  </div>

                  <div className="pt-1">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Expired {Math.abs(daysLeft)} days ago — Non-compliant without renewal
                      </span>
                    ) : isCritical ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        Urgent Rollover Window: {daysLeft} days remaining
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                        {daysLeft} days until expiration
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectFDR(fdr)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => onOpenNotice(fdr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition active:scale-95"
                    title="Generate AICTE Statutory Notice"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Generate Notice</span>
                  </button>

                  <button
                    onClick={() => onOpenRenewal(fdr)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition active:scale-95"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Renew FDR</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
