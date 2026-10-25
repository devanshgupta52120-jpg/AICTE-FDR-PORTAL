import React, { useState } from 'react';
import { FDRItem, FDRDocument } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { FDRService } from '../services/fdrService';
import {
  X,
  ArrowUpRight,
  ShieldAlert,
  Upload,
  AlertTriangle,
  Building2,
  CheckSquare,
} from 'lucide-react';

interface ReleaseModalProps {
  fdr: FDRItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReleaseModal: React.FC<ReleaseModalProps> = ({
  fdr,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();

  const [reason, setReason] = useState<string>('Completion of 10-year statutory lock-in period with NBA Accreditation');
  const [nocRef, setNocRef] = useState<string>('AICTE/APH/REL/2026/092');
  const [closureDate, setClosureDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [accountHolder, setAccountHolder] = useState<string>(fdr?.institutionName || '');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>(fdr?.bankName || '');
  const [ifscCode, setIfscCode] = useState<string>(fdr?.ifscCode || '');
  const [nocDoc, setNocDoc] = useState<FDRDocument | null>(null);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !fdr) return null;

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNocDoc({
      id: `doc-${Date.now()}`,
      name: file.name,
      type: 'noc_certificate',
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.displayName,
    });
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      alert('Please confirm the statutory compliance declaration.');
      return;
    }

    try {
      setIsSubmitting(true);
      await FDRService.requestRelease(
        fdr.id,
        {
          reason,
          nocReferenceNumber: nocRef.trim() || undefined,
          closureApprovalDate: closureDate || undefined,
          refundAccountDetails: accountNumber.trim()
            ? {
                accountHolder,
                accountNumber,
                bankName,
                ifscCode: ifscCode.toUpperCase(),
              }
            : undefined,
          document: nocDoc || undefined,
        },
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          role: currentUser.role,
        }
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Release request failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600/30 rounded-lg text-purple-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Request FDR Displedge / Refund Release</h3>
              <p className="text-xs text-slate-300 font-mono">{fdr.fdrNumber} • ₹{fdr.amount.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-purple-900">
            <strong>Release Policy:</strong> Pledged FDRs can only be released upon fulfilling statutory conditions defined in the AICTE Approval Process Handbook (APH), such as formal program closure, approved reduction of seats, or completion of lock-in period with Council NOC.
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Reason for Release Request *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="Completion of 10-year statutory lock-in period with NBA Accreditation">
                Completion of 10-year statutory lock-in period with NBA Accreditation
              </option>
              <option value="Approved Course Closure / Surrender of Affiliation">
                Approved Course Closure / Surrender of Affiliation
              </option>
              <option value="Reduction in Student Intake Capacity">
                Reduction in Student Intake Capacity
              </option>
              <option value="Excess Endowment Corpus Adjustment">
                Excess Endowment Corpus Adjustment
              </option>
              <option value="Conversion to State University / Autonomous Entity">
                Conversion to State University / Autonomous Entity
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">AICTE NOC / Council Approval Ref</label>
              <input
                type="text"
                value={nocRef}
                onChange={(e) => setNocRef(e.target.value)}
                placeholder="e.g. AICTE/NOC/2026/781"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Approval Date</label>
              <input
                type="date"
                value={closureDate}
                onChange={(e) => setClosureDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Refund Account Info */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Refund / Displedge Beneficiary Account
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="block text-slate-700 font-medium mb-0.5">Account Beneficiary Name</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-0.5">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 501002938102"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-0.5">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001187"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono"
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Upload Council NOC / Inspection Order</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Document</span>
                <input type="file" className="hidden" onChange={handleDocUpload} />
              </label>
              {nocDoc && (
                <span className="text-emerald-700 font-medium truncate max-w-xs">
                  {nocDoc.name} ({nocDoc.fileSize})
                </span>
              )}
            </div>
          </div>

          {/* Compliance Confirmation */}
          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-slate-600">
                I certify that there are no pending student grievances, unpaid faculty salaries, or judicial stay orders concerning the courses covered by this FDR corpus.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !confirmed}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Release Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
