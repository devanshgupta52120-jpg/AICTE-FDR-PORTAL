import React, { useState } from 'react';
import { FDRItem, FDRDocument, AuditLogEntry } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { FDRService } from '../services/fdrService';
import { renderStatusBadge, renderMaturityPill } from './FDRTable';
import {
  X,
  Building2,
  Landmark,
  Calendar,
  FileText,
  Upload,
  Download,
  ShieldCheck,
  RotateCw,
  ArrowUpRight,
  Printer,
  History,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Paperclip,
  ExternalLink,
  ShieldAlert,
  IndianRupee,
  Lock,
  Clock,
  Eye,
} from 'lucide-react';

interface FDRDetailModalProps {
  fdr: FDRItem | null;
  onClose: () => void;
  onRefresh: () => void;
  onOpenVerify: (fdr: FDRItem) => void;
  onOpenRenewal: (fdr: FDRItem) => void;
  onOpenRelease: (fdr: FDRItem) => void;
  auditLogs: AuditLogEntry[];
}

export const FDRDetailModal: React.FC<FDRDetailModalProps> = ({
  fdr,
  onClose,
  onRefresh,
  onOpenVerify,
  onOpenRenewal,
  onOpenRelease,
  auditLogs,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'verification' | 'documents' | 'history' | 'audit'>('details');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState<FDRDocument['type']>('fdr_receipt');

  if (!fdr) return null;

  const isOfficerOrAdmin = currentUser.role === 'officer' || currentUser.role === 'admin';
  const filteredAudit = auditLogs.filter(
    (log) => log.fdrId === fdr.id || (log.fdrNumber && log.fdrNumber === fdr.fdrNumber)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      const newDoc = await FDRService.uploadDocument(file, docType, fdr.id, currentUser.uid);
      const updatedDocs = [...fdr.documents, newDoc];
      await FDRService.updateFDR(
        fdr.id,
        { documents: updatedDocs },
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          role: currentUser.role,
          actionNote: `Uploaded document: ${file.name} (${docType.replace(/_/g, ' ')})`,
        }
      );
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to upload document: ${err?.message || 'Unknown error'}`);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number): string => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-w-none print:m-0 print:h-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#10233F] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                  {fdr.fdrNumber}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-300 font-medium">{fdr.purpose}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {fdr.institutionName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Print Official Record"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workflow State Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-semibold">Status:</span>
            {renderStatusBadge(fdr.status)}
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-semibold">Maturity:</span>
            {renderMaturityPill(fdr.maturityDate, fdr.status)}
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {isOfficerOrAdmin &&
              (fdr.status === 'pending_verification' || fdr.status === 'discrepancy_reported') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVerify(fdr);
                  }}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition active:scale-95"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Scrutinize Record</span>
                </button>
              )}

            {fdr.status === 'verified' && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onOpenRenewal(fdr);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Request Renewal</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenRelease(fdr);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Request Release</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white text-xs font-medium text-slate-600 overflow-x-auto shrink-0 print:hidden">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Deposit & Bank Details
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>Verification & Lien</span>
            {fdr.verification?.verifiedBy && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>Documents</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {fdr.documents?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Renewals & Releases
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Audit Trail ({filteredAudit.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Details */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Institution and Deposit Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Pledged Principal</span>
                  <div className="text-xl font-black text-slate-900">
                    {formatCurrency(fdr.amount)}
                  </div>
                  <div className="text-slate-500">{fdr.interestRate}% p.a. fixed rate</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Maturity Date</span>
                  <div className="text-xl font-black text-slate-900">{fdr.maturityDate}</div>
                  <div className="text-slate-500">{fdr.tenureMonths} Months tenure</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">AICTE PID & Region</span>
                  <div className="text-base font-bold font-mono text-slate-900">{fdr.institutionId}</div>
                  <div className="text-slate-500">{fdr.region} Regional Bureau</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Lien Classification</span>
                  <div className="text-base font-bold text-emerald-700">Joint Security Lien</div>
                  <div className="text-slate-500 truncate">{fdr.jointHolderName}</div>
                </div>
              </div>

              {/* Bank & Joint Account Specifics */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  Issuing Scheduled Commercial Bank & Joint Account
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Bank Name</span>
                    <span className="font-bold text-slate-900">{fdr.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Branch & Location</span>
                    <span className="font-semibold text-slate-800">{fdr.branchName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">IFSC Code</span>
                    <span className="font-mono font-bold text-blue-600">{fdr.ifscCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Joint FDR Account Number</span>
                    <span className="font-mono font-bold text-slate-900">{fdr.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Deposit Date</span>
                    <span className="font-medium text-slate-800">{fdr.depositDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Joint Lien Holder</span>
                    <span className="font-semibold text-slate-800">{fdr.jointHolderName}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Clause Card */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1.5 text-blue-950">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-700" />
                  Statutory AICTE Joint-Lien Mandate
                </div>
                <p className="leading-relaxed text-blue-900">
                  This Fixed Deposit Receipt is jointly pledged in favor of the Regional Officer, AICTE as mandatory financial security fund under the AICTE Approval Process Handbook. The issuing bank is legally bound not to encash, displedge, or issue duplicate receipts without an explicit Council Sanction Order.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Verification Details */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Officer Scrutiny & Council Verification Status
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Formal verification under AICTE Approval Process Handbook (APH)
                      </p>
                    </div>
                  </div>
                  {renderStatusBadge(fdr.status)}
                </div>

                {fdr.verification ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block">Verifying Regional Officer</span>
                        <span className="font-bold text-slate-900">
                          {fdr.verification.verifiedByName || 'AICTE Regional Officer'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Verification Timestamp</span>
                        <span className="font-medium text-slate-800">
                          {fdr.verification.verifiedAt
                            ? new Date(fdr.verification.verifiedAt).toLocaleString('en-IN')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${
                            fdr.verification.bankConfirmationReceived ? 'bg-emerald-600' : 'bg-rose-500'
                          }`}
                        >
                          ✓
                        </span>
                        <span className="text-slate-700">Bank Confirmation Letter Verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${
                            fdr.verification.physicalReceiptVerified ? 'bg-emerald-600' : 'bg-rose-500'
                          }`}
                        >
                          ✓
                        </span>
                        <span className="text-slate-700">Physical Receipt Scan with Joint Lien Verified</span>
                      </div>
                    </div>

                    {fdr.verification.officerRemarks && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-500 block mb-1">Official Officer Remarks</span>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-mono text-[11px]">
                          {fdr.verification.officerRemarks}
                        </div>
                      </div>
                    )}

                    {fdr.verification.discrepancyReasons && fdr.verification.discrepancyReasons.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-rose-700 font-bold block">Flagged Discrepancies</span>
                        <ul className="list-disc pl-5 space-y-1 text-rose-800">
                          {fdr.verification.discrepancyReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                    <div className="text-xs font-bold text-slate-800">Pending Scrutiny</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This FDR record has been submitted and is in the regional officer review queue.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-4 text-xs">
              {/* Document upload box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900">Upload Additional Regulatory Document</h4>
                    <p className="text-[11px] text-slate-500">Attach bank correspondence, extension letter or board resolution</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="fdr_receipt">FDR Receipt Scan</option>
                      <option value="bank_pledge_letter">Bank Pledge Letter</option>
                      <option value="board_resolution">Board Resolution</option>
                      <option value="noc_certificate">NOC Certificate</option>
                      <option value="renewal_receipt">Renewal Receipt</option>
                      <option value="other">Other</option>
                    </select>

                    <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition shadow-2xs active:scale-95 shrink-0">
                      <span>{uploadingDoc ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={handleFileUpload}
                        disabled={uploadingDoc}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">
                  Attached Documents ({fdr.documents?.length || 0})
                </span>

                {(!fdr.documents || fdr.documents.length === 0) ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                    No documents attached to this record yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {fdr.documents.map((doc) => (
                      <div key={doc.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {doc.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {doc.type.replace(/_/g, ' ').toUpperCase()} • {doc.fileSize} • Uploaded by {doc.uploadedBy}
                            </span>
                          </div>
                        </div>

                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Renewals & Releases */}
          {activeTab === 'history' && (
            <div className="space-y-6 text-xs">
              {/* Renewal History */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-indigo-600" />
                  Term Rollover & Renewal History
                </h4>

                {(!fdr.renewalHistory || fdr.renewalHistory.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-center">
                    No renewals recorded for this FDR.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fdr.renewalHistory.map((ren, idx) => (
                      <div key={ren.id || idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-700">Renewal Cycle #{idx + 1}</span>
                          <span className="text-slate-400">
                            Requested: {new Date(ren.requestedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Previous Maturity</span>
                            <span className="font-medium text-slate-700">{ren.previousMaturityDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">New Maturity</span>
                            <span className="font-bold text-slate-900">{ren.newMaturityDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Rollover Corpus</span>
                            <span className="font-black text-slate-900">{formatCurrency(ren.newAmount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Approval</span>
                            <span className="font-semibold text-emerald-700">
                              {ren.approvedBy ? `Approved by ${ren.approvedBy}` : 'Pending Approval'}
                            </span>
                          </div>
                        </div>
                        {ren.remarks && (
                          <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                            Remarks: {ren.remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Release Details */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-purple-600" />
                  Displedge & Release Status
                </h4>

                {fdr.releaseDetails ? (
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">
                        {fdr.status === 'released' ? 'Council Displedge Sanctioned' : 'Release Application Pending'}
                      </span>
                      <span className="text-slate-500">
                        Requested on {new Date(fdr.releaseDetails.requestedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="text-slate-700">
                      <strong>Reason for Release:</strong> {fdr.releaseDetails.reason}
                    </div>

                    {fdr.releaseDetails.displedgeOrderNumber && (
                      <div className="p-2.5 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            AICTE Displedge Order No.
                          </span>
                          <span className="font-mono font-black text-purple-900 text-sm">
                            {fdr.releaseDetails.displedgeOrderNumber}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">✓ Sanction Issued</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-center">
                    No release or refund requests initiated for this FDR.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700">
                  Regulatory Action Log for FDR {fdr.fdrNumber}
                </span>
                <span className="text-slate-400 text-[11px]">Append-only immutable record</span>
              </div>

              {filteredAudit.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No individual audit logs found for this specific FDR.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAudit.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{log.performedByName}</span>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {log.role}
                          </span>
                          <span className="text-[10px] font-mono text-blue-600 font-bold">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500">
            AICTE FDR ID: <span className="font-mono font-semibold text-slate-700">{fdr.id}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
