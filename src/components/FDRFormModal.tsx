import React, { useState } from 'react';
import { FDRItem, FDRPurpose, FDRDocument } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { FDRService } from '../services/fdrService';
import {
  X,
  Building2,
  Landmark,
  Calendar,
  Upload,
  CheckCircle2,
  Check,
  FileText,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Eye,
  IndianRupee,
  FileCheck2,
  Percent,
  Clock,
  Info,
} from 'lucide-react';

interface FDRFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: FDRItem) => void;
}

export const FDRFormModal: React.FC<FDRFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Institution Details
  const [institutionId, setInstitutionId] = useState(currentUser.institutionId || '1-49281039');
  const [institutionName, setInstitutionName] = useState(
    currentUser.institutionName || 'Delhi Institute of Engineering & Technology'
  );
  const [region, setRegion] = useState(currentUser.region || 'North-West');
  const [state, setState] = useState('Delhi');
  const [city, setCity] = useState('New Delhi');
  const [purpose, setPurpose] = useState<FDRPurpose>('New Institute Approval');

  // Step 2: Bank and FDR Details
  const [bankName, setBankName] = useState('State Bank of India');
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [fdrNumber, setFdrNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [jointHolderName, setJointHolderName] = useState('Regional Officer, AICTE');

  // Step 3: Amount and Dates
  const [amount, setAmount] = useState<number>(3500000);
  const [depositDate, setDepositDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tenureMonths, setTenureMonths] = useState<number>(60);
  const [interestRate, setInterestRate] = useState<number>(7.25);

  // Step 4: Documents
  const [uploadedDocs, setUploadedDocs] = useState<FDRDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<FDRDocument['type']>('fdr_receipt');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Step 5: Review & Declaration
  const [statutoryDeclaration, setStatutoryDeclaration] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Auto-calculate maturity date
  const calculateMaturityDate = (depDateStr: string, months: number): string => {
    try {
      const d = new Date(depDateStr);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const maturityDate = calculateMaturityDate(depositDate, tenureMonths);

  // Format currency helper
  const formatLakhsCrores = (val: number): string => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Crore`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Step Validation logic
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!institutionId.trim()) errs.institutionId = 'Permanent Institute ID (PID) is required.';
      if (!institutionName.trim()) errs.institutionName = 'Institution Name is required.';
      if (!city.trim()) errs.city = 'City is required.';
      if (!state.trim()) errs.state = 'State is required.';
    }

    if (step === 2) {
      if (!fdrNumber.trim()) errs.fdrNumber = 'FDR Certificate Number is required.';
      if (!branchName.trim()) errs.branchName = 'Bank Branch name is required.';
      if (!ifscCode.trim()) {
        errs.ifscCode = 'IFSC Code is required (e.g. SBIN0001187).';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
        errs.ifscCode = 'Invalid 11-character IFSC format (e.g. SBIN0001187).';
      }
      if (!accountNumber.trim()) errs.accountNumber = 'Joint FDR Account Number is required.';
      if (!jointHolderName.trim()) errs.jointHolderName = 'Joint holder must be Regional Officer, AICTE.';
    }

    if (step === 3) {
      if (!amount || amount <= 0) errs.amount = 'Pledged deposit amount must be greater than zero.';
      if (!depositDate) errs.depositDate = 'Deposit date is required.';
      if (!tenureMonths || tenureMonths < 12) {
        errs.tenureMonths = 'Minimum statutory lock-in tenure is 12 months (typically 60-120 months).';
      }
      if (!interestRate || interestRate <= 0) {
        errs.interestRate = 'Valid rate of interest is required.';
      }
    }

    if (step === 4) {
      const hasReceipt = uploadedDocs.some((d) => d.type === 'fdr_receipt');
      if (!hasReceipt) {
        errs.documents = 'Mandatory FDR Physical Receipt Scan must be uploaded before submission.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Document upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ documents: 'File size exceeds 10 MB limit. Please compress and upload.' });
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ documents: 'Only PDF, JPEG, PNG or WebP files are allowed.' });
      return;
    }

    setErrors({});
    setIsUploading(true);
    setUploadProgress(20);

    // Simulated progress for UX
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 30;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const newDoc: FDRDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: selectedDocType,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.displayName,
      };

      setUploadedDocs((prev) => [...prev, newDoc]);
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }, 600);
  };

  const handleRemoveDoc = (id: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Submit complete FDR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statutoryDeclaration) {
      setErrors({ declaration: 'You must agree to the statutory AICTE lien declaration before submitting.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await FDRService.createFDR(
        {
          fdrNumber: fdrNumber.trim(),
          institutionId: institutionId.trim(),
          institutionName: institutionName.trim(),
          region,
          state: state.trim(),
          city: city.trim(),
          bankName,
          branchName: branchName.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          accountNumber: accountNumber.trim(),
          amount: Number(amount),
          depositDate,
          maturityDate,
          interestRate: Number(interestRate),
          tenureMonths: Number(tenureMonths),
          jointHolderName: jointHolderName.trim(),
          purpose,
          status: 'pending_verification',
          documents: uploadedDocs,
          createdBy: currentUser.uid,
          createdByName: currentUser.displayName,
        },
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          role: currentUser.role,
        }
      );

      onSuccess(created);
      onClose();
    } catch (err: any) {
      alert(`Submission failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Institution Details', icon: Building2 },
    { num: 2, title: 'Bank & FDR Details', icon: Landmark },
    { num: 3, title: 'Amount & Dates', icon: Calendar },
    { num: 4, title: 'Document Uploads', icon: Upload },
    { num: 5, title: 'Review & Submit', icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#10233F] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-sm">
                  AICTE Form FDR-1
                </span>
                <span className="text-xs text-slate-400">• Statutory Submission</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold">New Joint Fixed Deposit Receipt Submission</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Progress Stepper Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((st, index) => {
              const isDone = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              const Icon = st.icon;

              return (
                <React.Fragment key={st.num}>
                  <div
                    onClick={() => {
                      // Allow going back to visited steps
                      if (st.num < currentStep) setCurrentStep(st.num);
                    }}
                    className={`flex items-center gap-2 cursor-pointer group ${
                      isCurrent
                        ? 'text-blue-700 font-bold'
                        : isDone
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-400 font-normal'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                          : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : st.num}
                    </div>
                    <span className="text-xs hidden md:inline truncate max-w-[110px]">
                      {st.title}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors ${
                        currentStep > st.num ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Institution Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Step 1: Permanent Institute Details
                </h3>
                <p className="text-xs text-slate-500">
                  Verify the AICTE Permanent Institute ID (PID) and geographical jurisdiction.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    AICTE Permanent Institute ID (PID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    placeholder="e.g. 1-49281039"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                  />
                  {errors.institutionId && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{errors.institutionId}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Institution / University Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Full registered institution name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                  />
                  {errors.institutionName && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{errors.institutionName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    AICTE Regional Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="North-West">North-West (Delhi, Haryana, Punjab, etc.)</option>
                    <option value="Northern">Northern (UP, Uttarakhand)</option>
                    <option value="Western">Western (Maharashtra, Goa)</option>
                    <option value="Southern">Southern (Tamil Nadu, Puducherry)</option>
                    <option value="South-Western">South-Western (Karnataka, Kerala)</option>
                    <option value="Eastern">Eastern (WB, Odisha, Bihar, Assam, etc.)</option>
                    <option value="Central">Central (MP, Gujarat, Chhattisgarh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Statutory Purpose of FDR <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as FDRPurpose)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="New Institute Approval">New Institute Approval</option>
                    <option value="Course Expansion">Course Expansion</option>
                    <option value="Increase in Intake">Increase in Intake</option>
                    <option value="Change of Site">Change of Site</option>
                    <option value="Mandatory Endowment Fund">Mandatory Endowment Fund</option>
                    <option value="Post-Graduate Program Security">Post-Graduate Program Security</option>
                    <option value="Disciplinary Compliance">Disciplinary Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                  {errors.city && <span className="text-rose-600 text-[11px]">{errors.city}</span>}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State / UT <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                  {errors.state && <span className="text-rose-600 text-[11px]">{errors.state}</span>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Bank & FDR Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  Step 2: Issuing Bank & Joint Account Details
                </h3>
                <p className="text-xs text-slate-500">
                  Fixed deposits must be created in a Nationalized or Scheduled Commercial Bank with mandatory joint lien.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    FDR Certificate / Receipt Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fdrNumber}
                    onChange={(e) => setFdrNumber(e.target.value)}
                    placeholder="e.g. FDR-2026-SBI-89210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 uppercase"
                  />
                  {errors.fdrNumber && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{errors.fdrNumber}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Issuing Scheduled Bank <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Union Bank of India">Union Bank of India</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Branch Name & Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Connaught Place Branch, New Delhi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                  {errors.branchName && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{errors.branchName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Bank IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001187 (11 chars)"
                    maxLength={11}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white uppercase"
                  />
                  {errors.ifscCode && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{errors.ifscCode}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Joint FDR Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 40291084729"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                  {errors.accountNumber && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{errors.accountNumber}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mandatory Joint Lien Holder <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={jointHolderName}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Statutory AICTE regulation: Lien is held jointly with Regional Officer, AICTE.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Amount & Dates */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Step 3: Financial Corpus & Tenure
                </h3>
                <p className="text-xs text-slate-500">
                  Specify the pledged deposit amount, deposit date, and lock-in period.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2 bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <label className="block text-blue-950 font-bold mb-1">
                      Pledged Principal Amount (INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative max-w-sm">
                      <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={100000}
                        step={50000}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-blue-300 rounded-lg text-base font-black text-slate-900 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">Words</span>
                    <span className="text-base sm:text-lg font-black text-blue-900">
                      {formatLakhsCrores(amount)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Deposit / Issue Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                  {errors.depositDate && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{errors.depositDate}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mandatory Lock-in Tenure (Months) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value={12}>12 Months (1 Year - Minimum interim)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={60}>60 Months (5 Years - Standard AICTE lock-in)</option>
                    <option value={96}>96 Months (8 Years)</option>
                    <option value={120}>120 Months (10 Years - Mandatory Endowment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Rate of Interest (% p.a.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    placeholder="e.g. 7.25"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Calculated Maturity Date (Auto)
                  </label>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-bold flex items-center justify-between">
                    <span>{maturityDate}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                      Lock-in until {maturityDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Document Uploads */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Step 4: Supporting Regulatory Document Uploads
                </h3>
                <p className="text-xs text-slate-500">
                  Upload scanned copies of the original FDR receipt with joint lien endorsement stamp.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/70 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Select Document Type & Upload File
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Supports PDF, PNG, JPG (Max 10 MB per file)
                  </div>
                </div>

                <div className="max-w-xs mx-auto flex items-center gap-2 text-xs">
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs"
                  >
                    <option value="fdr_receipt">FDR Physical Receipt Scan *</option>
                    <option value="bank_pledge_letter">Bank Branch Lien Endorsement Letter</option>
                    <option value="board_resolution">Governing Body Board Resolution</option>
                    <option value="noc_certificate">AICTE Approval Letter / NOC</option>
                    <option value="other">Other Official Document</option>
                  </select>

                  <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition shadow-2xs active:scale-95 shrink-0">
                    <span>Browse</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {isUploading && (
                  <div className="max-w-xs mx-auto space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Uploading document...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full bg-blue-600 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {errors.documents && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errors.documents}</span>
                </div>
              )}

              {/* Uploaded List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Attached Documents ({uploadedDocs.length})
                </span>

                {uploadedDocs.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No documents attached yet. Please upload at least the FDR physical receipt.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {uploadedDocs.map((doc) => (
                      <div key={doc.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 truncate block">
                              {doc.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {doc.type.replace(/_/g, ' ').toUpperCase()} • {doc.fileSize}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-500 hover:text-blue-600 rounded transition"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Remove Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Statutory Submission */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Step 5: Final Verification & Declaration
                </h3>
                <p className="text-xs text-slate-500">
                  Review all entered details before officially submitting to AICTE Cloud Firestore.
                </p>
              </div>

              {/* Review Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Institution & PID</div>
                  <div className="font-bold text-slate-900">{institutionName}</div>
                  <div className="text-slate-600">PID: {institutionId} • {region} Region</div>
                  <div className="text-slate-500">{city}, {state}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Bank & Joint FDR</div>
                  <div className="font-bold text-slate-900">{fdrNumber}</div>
                  <div className="text-slate-600">{bankName} ({branchName})</div>
                  <div className="font-mono text-slate-500">IFSC: {ifscCode} • Acc: {accountNumber}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Deposit Corpus & Term</div>
                  <div className="text-base font-black text-slate-900">
                    ₹{amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-slate-600">{tenureMonths} Months @ {interestRate}% p.a.</div>
                  <div className="text-slate-600">Matures on: {maturityDate}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Compliance & Docs</div>
                  <div className="font-bold text-slate-900">{purpose}</div>
                  <div className="text-slate-600">{uploadedDocs.length} Document(s) attached</div>
                  <div className="text-emerald-700 font-semibold">✓ Joint lien with Regional Officer</div>
                </div>
              </div>

              {/* Statutory Declaration Checkbox */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statutoryDeclaration}
                    onChange={(e) => {
                      setStatutoryDeclaration(e.target.checked);
                      if (e.target.checked && errors.declaration) {
                        setErrors({});
                      }
                    }}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-800 leading-relaxed font-medium">
                    I, on behalf of <strong>{institutionName}</strong>, hereby solemnly declare that the Fixed Deposit Receipt details provided above are true, accurate, and created strictly under the terms of the AICTE Approval Process Handbook. I confirm that a joint lien has been marked in favor of the Regional Officer, AICTE, and the deposit cannot be liquidated or encashed without prior written council sanction.
                  </span>
                </label>
                {errors.declaration && (
                  <span className="text-rose-600 text-[11px] font-semibold block">{errors.declaration}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !statutoryDeclaration}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-sm transition active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting to Council...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit FDR</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
