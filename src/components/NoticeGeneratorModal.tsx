import React from 'react';
import { FDRItem } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { X, Printer, Download, Landmark, FileText } from 'lucide-react';
import { getMaturityDays } from './FDRTable';

interface NoticeGeneratorModalProps {
  fdr: FDRItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NoticeGeneratorModal: React.FC<NoticeGeneratorModalProps> = ({
  fdr,
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  if (!isOpen || !fdr) return null;

  const daysLeft = getMaturityDays(fdr.maturityDate);
  const isExpired = daysLeft < 0;
  const noticeDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 print:shadow-none print:border-none print:m-0 print:w-full">
        {/* Header (hidden in print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold">Official AICTE Maturity Notice Generator</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Letter Body */}
        <div className="p-8 font-serif text-slate-900 text-sm leading-relaxed space-y-5 bg-white">
          {/* Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
              ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
            </div>
            <div className="text-xs text-slate-500">
              (A Statutory Body of the Government of India, Ministry of Education)
            </div>
            <div className="text-base font-bold uppercase tracking-wide text-slate-900">
              {fdr.region} Regional Office
            </div>
            <div className="text-xs text-slate-500">
              Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | www.aicte-india.org
            </div>
          </div>

          {/* Letter Metadata */}
          <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 pt-2">
            <div>
              Ref No: AICTE/{fdr.region.toUpperCase().replace(/\s+/g, '-')}/FDR-MAT/2026/
              {Math.floor(1000 + Math.random() * 9000)}
            </div>
            <div>Date: {noticeDate}</div>
          </div>

          {/* Recipient */}
          <div className="text-xs font-sans space-y-0.5">
            <div className="font-bold">To,</div>
            <div className="font-semibold text-slate-800">The Principal / Director / Chairman,</div>
            <div className="font-bold text-slate-900">{fdr.institutionName}</div>
            <div>AICTE Permanent Institute ID: <span className="font-mono font-bold">{fdr.institutionId}</span></div>
            <div>{fdr.city}, {fdr.state}</div>
          </div>

          {/* Subject */}
          <div className="bg-slate-100 p-3 rounded-md text-xs font-bold text-slate-900 uppercase">
            Subject: {isExpired ? 'URGENT NOTICE: Non-compliance regarding expired Fixed Deposit Receipt (FDR)' : 'REMINDER NOTICE: Impending Maturity and Mandatory Extension of Joint FDR'}
          </div>

          {/* Body Content */}
          <div className="space-y-3 text-xs text-justify font-sans text-slate-800">
            <p>
              Sir / Madam,
            </p>
            <p>
              This is in reference to the Fixed Deposit Receipt (FDR) bearing Certificate Number{' '}
              <strong className="font-mono">{fdr.fdrNumber}</strong> amounting to{' '}
              <strong>₹{fdr.amount.toLocaleString('en-IN')}</strong> deposited with{' '}
              <strong>{fdr.bankName} ({fdr.branchName})</strong>, pledged jointly in favor of the{' '}
              <strong>Regional Officer, AICTE</strong> towards statutory financial security for{' '}
              <strong>{fdr.purpose}</strong>.
            </p>

            <p>
              As per official records maintained on the AICTE Portal, the aforementioned FDR has a recorded maturity date of{' '}
              <strong className="text-rose-700">{fdr.maturityDate}</strong> (
              {isExpired ? (
                <span className="font-bold text-red-600">EXPIRED {Math.abs(daysLeft)} DAYS AGO</span>
              ) : (
                <span>maturing within {daysLeft} days</span>
              )}
              ).
            </p>

            <p>
              In accordance with Chapter I & II of the AICTE Approval Process Handbook (APH), technical institutions are mandated to keep the prescribed endowment / corpus FDR live and active during the entire tenure of approval. <strong>Premature withdrawal, failure to renew, or lien relaxation without the prior written concurrence of the Council is strictly prohibited</strong> and invites punitive action including reduction of intake or withdrawal of approval.
            </p>

            <p>
              You are hereby requested to instruct the issuing bank to renew / roll over the said FDR for a further period of at least <strong>60 (sixty) months</strong> with joint lien intact, and upload the scanned copy of the renewed FDR receipt along with the Bank's confirmation letter on the AICTE FDR Portal within <strong>15 days</strong> of receipt of this notice.
            </p>
          </div>

          {/* Signoff */}
          <div className="pt-6 flex justify-between items-end text-xs font-sans">
            <div className="text-[11px] text-slate-500 italic">
              * This is a computer-generated statutory notification transmitted via the AICTE FDR Portal.
            </div>
            <div className="text-right space-y-1">
              <div className="font-bold text-slate-900">{currentUser.displayName}</div>
              <div className="text-slate-600 font-medium">Regional Officer & Joint Director</div>
              <div className="text-slate-500">AICTE {fdr.region} Regional Office</div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
};
