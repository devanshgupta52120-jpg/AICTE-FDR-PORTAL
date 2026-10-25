import React, { useState } from 'react';
import { FDRItem } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { FDRService } from '../services/fdrService';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileText,
  Building2,
  Landmark,
  Eye,
  Check,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface OfficerVerificationModalProps {
  fdr: FDRItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OfficerVerificationModal: React.FC<OfficerVerificationModalProps> = ({
  fdr,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();

  const [decision, setDecision] = useState<'verified' | 'discrepancy_reported' | 'rejected'>('verified');
  const [bankConfirmed, setBankConfirmed] = useState(true);
  const [receiptVerified, setReceiptVerified] = useState(true);
  const [remarks, setRemarks] = useState(
    'FDR verified with issuing bank confirmation letter. Mandatory joint lien marked in favor of Regional Officer, AICTE.'
  );

  const [selectedDiscrepancies, setSelectedDiscrepancies] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !fdr) return null;

  const commonDiscrepancies = [
    'Mandatory AICTE joint-lien endorsement clause missing on physical receipt reverse',
    'Bank branch confirmation letter not on official branch letterhead or seal missing',
    'IFSC code or branch manager signature smudged / illegible',
    'Joint account holder name does not state "Regional Officer, AICTE"',
    'Deposit amount differs from Council approval order sanction',
    'Tenure less than the mandated lock-in period (minimum 60 months required)',
  ];

  const toggleDiscrepancy = (item: string) => {
    setSelectedDiscrepancies((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleDecisionChange = (val: 'verified' | 'discrepancy_reported' | 'rejected') => {
    setDecision(val);
    if (val === 'verified') {
      setRemarks('FDR verified with issuing bank confirmation letter. Mandatory joint lien marked in favor of Regional Officer, AICTE.');
    } else if (val === 'discrepancy_reported') {
      setRemarks('Discrepancy observed during scrutiny. Please submit rectified FDR receipt and branch manager endorsement letter.');
    } else {
      setRemarks('Submission rejected due to failure to meet AICTE financial corpus requirements.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdr) return;

    try {
      setIsSubmitting(true);
      await FDRService.verifyFDR(fdr.id, decision, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        remarks,
        reasons: decision === 'discrepancy_reported' ? selectedDiscrepancies : undefined,
        bankConfirmed,
        receiptVerified,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Verification action failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#10233F] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Officer Scrutiny & Verification Desk</h2>
              <p className="text-xs text-slate-300">
                Official determination for FDR #{fdr.fdrNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Timeline */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Submitted</span>
            </div>
            <div className="h-0.5 w-8 bg-emerald-500" />
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>2. Scrutiny</span>
            </div>
            <div className="h-0.5 w-8 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">
                3
              </div>
              <span>Decision Sanction</span>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Quick Context Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block text-sm">{fdr.institutionName}</span>
              <span className="text-[11px] text-slate-500">
                PID: {fdr.institutionId} • {fdr.bankName} ({fdr.branchName})
              </span>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Pledged Corpus</span>
              <span className="text-base font-black text-slate-900">
                ₹{fdr.amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Document Access Row */}
          {fdr.documents && fdr.documents.length > 0 && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-700" />
                Submitted Scrutiny Documents ({fdr.documents.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {fdr.documents.map((d) => (
                  <a
                    key={d.id}
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-900 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-blue-100/50 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{d.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Verification Checkpoints */}
          <div className="space-y-2.5 pt-1">
            <span className="font-bold text-slate-900 uppercase tracking-wider block">
              Mandatory Scrutiny Checkpoints
            </span>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={bankConfirmed}
                onChange={(e) => setBankConfirmed(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Official Bank Confirmation Letter Received
                </span>
                <span className="text-[11px] text-slate-500">
                  Bank branch has formally acknowledged joint lien favoring Regional Officer, AICTE.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={receiptVerified}
                onChange={(e) => setReceiptVerified(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Original Physical Receipt Scan Verified
                </span>
                <span className="text-[11px] text-slate-500">
                  Endorsement clause verified; tenure matches mandatory statutory lock-in period.
                </span>
              </div>
            </label>
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold uppercase tracking-wider">
              Scrutiny Determination <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleDecisionChange('verified')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  decision === 'verified'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-950">Approve Lien</div>
                  <div className="text-[11px] text-emerald-700">Valid & Council-endorsed</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionChange('discrepancy_reported')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  decision === 'discrepancy_reported'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950">Discrepancy</div>
                  <div className="text-[11px] text-amber-700">Request Corrections</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionChange('rejected')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  decision === 'rejected'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-950">Reject</div>
                  <div className="text-[11px] text-rose-700">Non-compliant</div>
                </div>
              </button>
            </div>
          </div>

          {/* Discrepancy Reasons Checkboxes (if Discrepancy) */}
          {decision === 'discrepancy_reported' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
              <span className="font-bold text-amber-950 block">Select Discrepancy Grounds:</span>
              <div className="space-y-1.5">
                {commonDiscrepancies.map((reason) => (
                  <label key={reason} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDiscrepancies.includes(reason)}
                      onChange={() => toggleDiscrepancy(reason)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-[11px] text-amber-900 leading-snug">{reason}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Officer Remarks */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Officer Review Notes & Official Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs font-mono"
              required
            />
          </div>
        </form>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-5 py-2 rounded-lg text-white shadow-sm transition active:scale-95 ${
              decision === 'verified'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : decision === 'discrepancy_reported'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recording Action...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Submit {decision === 'verified' ? 'Approval' : decision === 'discrepancy_reported' ? 'Discrepancy Flag' : 'Rejection'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
