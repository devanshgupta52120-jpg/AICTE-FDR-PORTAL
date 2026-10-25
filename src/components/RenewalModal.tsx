import React, { useState } from 'react';
import { FDRItem, FDRDocument } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { FDRService } from '../services/fdrService';
import {
  X,
  RotateCw,
  Calendar,
  IndianRupee,
  Upload,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface RenewalModalProps {
  fdr: FDRItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({
  fdr,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();

  const [tenureMonths, setTenureMonths] = useState<number>(60);
  const [newAmount, setNewAmount] = useState<number>(fdr?.amount || 0);
  const [newInterestRate, setNewInterestRate] = useState<number>(fdr?.interestRate || 7.25);
  const [newReceiptNumber, setNewReceiptNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [renewalDoc, setRenewalDoc] = useState<FDRDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !fdr) return null;

  // Calculate new maturity date based on current maturity date + tenureMonths
  const calculateNewMaturity = (): string => {
    try {
      const base = new Date(fdr.maturityDate);
      base.setMonth(base.getMonth() + tenureMonths);
      return base.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const newMaturityDate = calculateNewMaturity();

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRenewalDoc({
      id: `doc-${Date.now()}`,
      name: file.name,
      type: 'renewal_receipt',
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.displayName,
    });
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdr) return;

    try {
      setIsSubmitting(true);
      await FDRService.requestRenewal(
        fdr.id,
        {
          newMaturityDate,
          newAmount: Number(newAmount),
          newInterestRate: Number(newInterestRate),
          newReceiptNumber: newReceiptNumber.trim() || undefined,
          document: renewalDoc || undefined,
          remarks: remarks.trim() || 'Institutional rollover request submitted with renewed terms.',
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
      alert(`Renewal submission failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/30 rounded-lg text-indigo-400">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Request FDR Term Renewal / Rollover</h3>
              <p className="text-xs text-slate-300 font-mono">{fdr.fdrNumber} • {fdr.bankName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Current Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Amount</span>
              <span className="font-bold text-slate-900 text-sm">₹{fdr.amount.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Maturity</span>
              <span className="font-bold text-rose-700 text-sm">{fdr.maturityDate}</span>
            </div>
          </div>

          {/* New Tenure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Renewal Extension Period</label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value={36}>36 Months (3 Years)</option>
                <option value={60}>60 Months (5 Years - Recommended)</option>
                <option value={96}>96 Months (8 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Maturity Date</label>
              <input
                type="date"
                value={newMaturityDate}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Revised Amount & ROI */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Renewed Amount (INR)</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Rate of Interest (% p.a.)</label>
              <input
                type="number"
                step="0.05"
                value={newInterestRate}
                onChange={(e) => setNewInterestRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Revised FDR Certificate / Receipt No. (If reissued by Bank)
            </label>
            <input
              type="text"
              value={newReceiptNumber}
              onChange={(e) => setNewReceiptNumber(e.target.value)}
              placeholder="e.g. FDR/SBI/2026/ROL-9921"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          {/* Upload Renewed Document */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Upload Bank Rollover Advice / Endorsement Certificate
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose File</span>
                <input type="file" className="hidden" onChange={handleDocUpload} />
              </label>
              {renewalDoc && (
                <span className="text-emerald-700 font-medium truncate max-w-xs">
                  {renewalDoc.name} ({renewalDoc.fileSize})
                </span>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Remarks & Justification</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Provide reason for renewal or auto-rollover request..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
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
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Renewal Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
