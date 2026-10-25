import React from 'react';
import { FDRItem, FDRStatus } from '../types/fdr';
import {
  IndianRupee,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface DashboardStatsProps {
  fdrs: FDRItem[];
  selectedStatus: FDRStatus | 'all' | 'expiring_30' | 'expiring_90';
  onFilterClick: (status: FDRStatus | 'all' | 'expiring_30' | 'expiring_90') => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  fdrs,
  selectedStatus,
  onFilterClick,
}) => {
  const now = new Date();

  let totalAmount = 0;
  let verifiedCount = 0;
  let pendingCount = 0;
  let expiring30Count = 0;
  let expiring90Count = 0;
  let releasedCount = 0;

  fdrs.forEach((f) => {
    totalAmount += f.amount;
    if (f.status === 'verified') verifiedCount++;
    if (f.status === 'pending_verification' || f.status === 'under_review') pendingCount++;
    if (f.status === 'released') releasedCount++;

    if (f.status !== 'released' && f.status !== 'rejected') {
      const maturity = new Date(f.maturityDate);
      const diffDays = Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 30) {
        expiring30Count++;
      }
      if (diffDays > 0 && diffDays <= 90) {
        expiring90Count++;
      }
    }
  });

  const formatRupees = (val: number): string => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      id: 'all',
      title: 'Total Pledged Corpus',
      value: formatRupees(totalAmount),
      subValue: `${fdrs.length} Active & Archived FDRs`,
      icon: IndianRupee,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
      activeColor: 'ring-2 ring-indigo-500 bg-indigo-50/80',
    },
    {
      id: 'verified',
      title: 'Verified & Active Lien',
      value: `${verifiedCount}`,
      subValue: 'Officially authenticated',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-50/80',
    },
    {
      id: 'pending_verification',
      title: 'Pending Officer Review',
      value: `${pendingCount}`,
      subValue: 'Requires scrutiny & lien check',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400',
      activeColor: 'ring-2 ring-amber-500 bg-amber-50/80',
      highlight: pendingCount > 0,
    },
    {
      id: 'expiring_30',
      title: 'Expiring in <30 Days',
      value: `${expiring30Count}`,
      subValue: 'Critical maturity warning',
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
      activeColor: 'ring-2 ring-rose-500 bg-rose-50/80',
      highlight: expiring30Count > 0,
    },
    {
      id: 'released',
      title: 'Displedged / Released',
      value: `${releasedCount}`,
      subValue: 'Approved closure/settled',
      icon: CheckCircle2,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400',
      activeColor: 'ring-2 ring-slate-500 bg-slate-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const isSelected = selectedStatus === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterClick(card.id as any)}
            className={`text-left p-4 rounded-xl border transition cursor-pointer shadow-2xs relative overflow-hidden ${
              card.color
            } ${isSelected ? card.activeColor : ''}`}
          >
            {card.highlight && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {card.title}
              </span>
              <card.icon className="w-4 h-4 opacity-75" />
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {card.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">
              {card.subValue}
            </div>
          </button>
        );
      })}
    </div>
  );
};
