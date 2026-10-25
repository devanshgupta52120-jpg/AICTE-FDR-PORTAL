import React, { useState } from 'react';
import { FDRItem } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { renderStatusBadge, renderMaturityPill } from './FDRTable';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  ArrowUpRight,
  Eye,
  Building2,
  Landmark,
  FileText,
  Lock,
} from 'lucide-react';
import { FDRService } from '../services/fdrService';

interface VerificationDeskProps {
  fdrs: FDRItem[];
  onSelectFDR: (fdr: FDRItem) => void;
  onOpenVerify: (fdr: FDRItem) => void;
  onRefresh: () => void;
}

export const VerificationDesk: React.FC<VerificationDeskProps> = ({
  fdrs,
  onSelectFDR,
  onOpenVerify,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const [activeQueue, setActiveQueue] = useState<'pending' | 'discrepancy' | 'renewal' | 'release'>('pending');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Sub-queues
  const pendingQueue = fdrs.filter((f) => f.status === 'pending_verification' || f.status === 'under_review');
  const discrepancyQueue = fdrs.filter((f) => f.status === 'discrepancy_reported');
  const renewalQueue = fdrs.filter((f) => f.status === 'renewal_requested');
  const releaseQueue = fdrs.filter((f) => f.status === 'release_requested');

  let currentList = pendingQueue;
  if (activeQueue === 'discrepancy') currentList = discrepancyQueue;
  if (activeQueue === 'renewal') currentList = renewalQueue;
  if (activeQueue === 'release') currentList = releaseQueue;

  const handleApproveRenewal = async (fdr: FDRItem) => {
    const remarks = prompt(
      'Enter officer approval remarks for this renewal:',
      'Renewal verified with bank extension letter.'
    );
    if (!remarks) return;

    try {
      setApprovingId(fdr.id);
      await FDRService.approveRenewal(fdr.id, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        role: currentUser.role,
        remarks,
      });
      onRefresh();
      alert(`Renewal approved successfully for ${fdr.fdrNumber}`);
    } catch (err: any) {
      alert(`Failed to approve renewal: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveRelease = async (fdr: FDRItem) => {
    const orderNo = prompt(
      'Enter AICTE Displedge Order Number:',
      `AICTE-DISPLEDGE-2026-${(fdr.region || 'HQ').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    );
    if (!orderNo) return;
    const remarks = prompt(
      'Enter officer closing remarks:',
      'All regulatory compliance verified. Displedge sanctioned.'
    );
    if (!remarks) return;

    try {
      setApprovingId(fdr.id);
      await FDRService.approveRelease(fdr.id, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        role: currentUser.role,
        displedgeOrderNumber: orderNo,
        remarks,
      });
      onRefresh();
      alert(`Release sanctioned with Order No: ${orderNo}`);
    } catch (err: any) {
      alert(`Failed to approve release: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Officer Desk Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-700 border border-amber-500/20">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Regulatory Verification Bureau
                </span>
                <span className="text-xs text-slate-400">• Statutory Workflows</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                AICTE Officer Scrutiny & Approval Desk
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Active Jurisdiction:</span>
            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              {currentUser.region || 'All Regional Bureaus'}
            </span>
          </div>
        </div>

        {/* Queues Navigation Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveQueue('pending')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition ${
              activeQueue === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Scrutiny ({pendingQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveQueue('discrepancy')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition ${
              activeQueue === 'discrepancy'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Discrepancy Flagged ({discrepancyQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveQueue('renewal')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition ${
              activeQueue === 'renewal'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Renewal Requests ({renewalQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveQueue('release')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition ${
              activeQueue === 'release'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Release / Refund Requests ({releaseQueue.length})</span>
          </button>
        </div>
      </div>

      {/* Queue Content */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Queue is Cleared</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no items currently awaiting officer action in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {currentList.map((fdr) => (
              <div
                key={fdr.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                    <span>
                      PID: <strong className="text-slate-700">{fdr.institutionId}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Bank: <strong className="text-slate-700">{fdr.bankName}</strong> ({fdr.branchName})
                    </span>
                    <span>•</span>
                    <span>
                      Pledged: <strong className="text-slate-900 font-bold">₹{fdr.amount.toLocaleString('en-IN')}</strong>
                    </span>
                    <span>•</span>
                    <span>Matures: {fdr.maturityDate}</span>
                  </div>

                  {fdr.verification?.officerRemarks && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
                      Latest Notes: {fdr.verification.officerRemarks}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectFDR(fdr)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  {/* Queue specific actions */}
                  {(activeQueue === 'pending' || activeQueue === 'discrepancy') && (
                    <button
                      onClick={() => onOpenVerify(fdr)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition active:scale-95"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Scrutinize & Verify</span>
                    </button>
                  )}

                  {activeQueue === 'renewal' && (
                    <button
                      onClick={() => handleApproveRenewal(fdr)}
                      disabled={approvingId === fdr.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs transition active:scale-95"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{approvingId === fdr.id ? 'Approving...' : 'Approve Renewal'}</span>
                    </button>
                  )}

                  {activeQueue === 'release' && (
                    <button
                      onClick={() => handleApproveRelease(fdr)}
                      disabled={approvingId === fdr.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-2xs transition active:scale-95"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{approvingId === fdr.id ? 'Sanctioning...' : 'Sanction Displedge'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
