import React, { useState, useMemo } from 'react';
import { FDRItem, AuditLogEntry, FDRStatus, UserRole } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import { getMaturityDays, renderStatusBadge } from './FDRTable';
import {
  IndianRupee,
  ShieldCheck,
  Clock,
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
  RotateCw,
  FileText,
  Calendar,
  Building2,
  TrendingUp,
  Landmark,
  CheckCircle2,
  Check,
  ChevronRight,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Layers,
  Sparkles,
  PieChart,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';
import { PortalTab } from './Sidebar';

interface ExecutiveDashboardProps {
  fdrs: FDRItem[];
  auditLogs: AuditLogEntry[];
  loading: boolean;
  onNavigateTab: (tab: PortalTab) => void;
  onSelectFilter: (filter: string) => void;
  onOpenNewFDR: () => void;
  onSelectFDR: (fdr: FDRItem) => void;
  onOpenVerify: (fdr: FDRItem) => void;
  onOpenRenewal: (fdr: FDRItem) => void;
  onOpenNotice: (fdr: FDRItem) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  fdrs,
  auditLogs,
  loading,
  onNavigateTab,
  onSelectFilter,
  onOpenNewFDR,
  onSelectFDR,
  onOpenVerify,
  onOpenRenewal,
  onOpenNotice,
}) => {
  const { currentUser, isLiveFirebase } = useAuth();
  const [activeDonutSegment, setActiveDonutSegment] = useState<string | null>(null);

  // Format currency helpers
  const formatCurrency = (val: number): string => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate 6 KPIs strictly from actual records
  const kpiData = useMemo(() => {
    let totalCount = fdrs.length;
    let totalPledgedAmount = 0;
    let verifiedCount = 0;
    let pendingVerificationCount = 0;
    let upcomingMaturityCount = 0; // <= 90 days
    let expiredCount = 0;
    let pendingReleaseCount = 0;

    fdrs.forEach((f) => {
      totalPledgedAmount += f.amount;
      if (f.status === 'verified') verifiedCount++;
      if (f.status === 'pending_verification' || f.status === 'under_review') {
        pendingVerificationCount++;
      }
      if (f.status === 'release_requested') {
        pendingReleaseCount++;
      }

      if (f.status !== 'released' && f.status !== 'rejected') {
        const days = getMaturityDays(f.maturityDate);
        if (days < 0) {
          expiredCount++;
        } else if (days <= 90) {
          upcomingMaturityCount++;
        }
      }
    });

    const verifiedPercentage = totalCount > 0 ? ((verifiedCount / totalCount) * 100).toFixed(1) : '0';

    return {
      totalCount,
      totalPledgedAmount,
      verifiedCount,
      verifiedPercentage,
      pendingVerificationCount,
      upcomingMaturityCount,
      expiredCount,
      pendingReleaseCount,
    };
  }, [fdrs]);

  // Donut chart status breakdown
  const statusDistribution = useMemo(() => {
    const counts: Record<string, { count: number; amount: number }> = {
      verified: { count: 0, amount: 0 },
      pending_verification: { count: 0, amount: 0 },
      discrepancy_reported: { count: 0, amount: 0 },
      renewal_requested: { count: 0, amount: 0 },
      release_requested: { count: 0, amount: 0 },
      released: { count: 0, amount: 0 },
    };

    fdrs.forEach((f) => {
      if (counts[f.status]) {
        counts[f.status].count++;
        counts[f.status].amount += f.amount;
      } else {
        // map other statuses if any
        if (counts.pending_verification) {
          counts.pending_verification.count++;
          counts.pending_verification.amount += f.amount;
        }
      }
    });

    const total = fdrs.length || 1;

    return [
      {
        id: 'verified',
        label: 'Verified Lien',
        color: '#10B981', // Emerald
        count: counts.verified.count,
        amount: counts.verified.amount,
        percentage: ((counts.verified.count / total) * 100).toFixed(1),
      },
      {
        id: 'pending_verification',
        label: 'Pending Scrutiny',
        color: '#F59E0B', // Amber
        count: counts.pending_verification.count,
        amount: counts.pending_verification.amount,
        percentage: ((counts.pending_verification.count / total) * 100).toFixed(1),
      },
      {
        id: 'discrepancy_reported',
        label: 'Discrepancy Flagged',
        color: '#EF4444', // Red
        count: counts.discrepancy_reported.count,
        amount: counts.discrepancy_reported.amount,
        percentage: ((counts.discrepancy_reported.count / total) * 100).toFixed(1),
      },
      {
        id: 'renewal_requested',
        label: 'Renewal Requested',
        color: '#6366F1', // Indigo
        count: counts.renewal_requested.count,
        amount: counts.renewal_requested.amount,
        percentage: ((counts.renewal_requested.count / total) * 100).toFixed(1),
      },
      {
        id: 'release_requested',
        label: 'Release Requested',
        color: '#A855F7', // Purple
        count: counts.release_requested.count,
        amount: counts.release_requested.amount,
        percentage: ((counts.release_requested.count / total) * 100).toFixed(1),
      },
      {
        id: 'released',
        label: 'Displedged / Settled',
        color: '#64748B', // Slate
        count: counts.released.count,
        amount: counts.released.amount,
        percentage: ((counts.released.count / total) * 100).toFixed(1),
      },
    ].filter((s) => s.count > 0);
  }, [fdrs]);

  // Monthly Submissions breakdown
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { count: number; totalAmount: number; label: string }> = {};

    fdrs.forEach((f) => {
      const dateStr = f.depositDate || f.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          if (!monthMap[key]) {
            monthMap[key] = { count: 0, totalAmount: 0, label };
          }
          monthMap[key].count++;
          monthMap[key].totalAmount += f.amount;
        }
      }
    });

    const sortedKeys = Object.keys(monthMap).sort();
    return sortedKeys.slice(-6).map((k) => ({
      key: k,
      ...monthMap[k],
    }));
  }, [fdrs]);

  // Regional Workload Distribution
  const regionalWorkload = useMemo(() => {
    const regionMap: Record<string, { total: number; verified: number; pending: number }> = {};

    fdrs.forEach((f) => {
      const reg = f.region || 'North-West';
      if (!regionMap[reg]) {
        regionMap[reg] = { total: 0, verified: 0, pending: 0 };
      }
      regionMap[reg].total++;
      if (f.status === 'verified') regionMap[reg].verified++;
      if (f.status === 'pending_verification' || f.status === 'under_review') {
        regionMap[reg].pending++;
      }
    });

    return Object.entries(regionMap).map(([region, data]) => ({
      region,
      total: data.total,
      verified: data.verified,
      pending: data.pending,
      rate: data.total > 0 ? Math.round((data.verified / data.total) * 100) : 0,
    }));
  }, [fdrs]);

  // Critical Action Items
  const urgentActions = useMemo(() => {
    const actions: {
      id: string;
      title: string;
      subtitle: string;
      type: 'expired' | 'urgent_maturity' | 'pending_review' | 'release';
      fdr: FDRItem;
      buttonText: string;
      onAction: () => void;
    }[] = [];

    // 1. Expired FDRs
    fdrs
      .filter((f) => f.status !== 'released' && f.status !== 'rejected' && getMaturityDays(f.maturityDate) < 0)
      .slice(0, 3)
      .forEach((f) => {
        const days = Math.abs(getMaturityDays(f.maturityDate));
        actions.push({
          id: `act-exp-${f.id}`,
          title: `${f.institutionName}`,
          subtitle: `FDR ${f.fdrNumber} expired ${days} days ago (₹${(f.amount / 100000).toFixed(2)}L). Mandatory rollover required.`,
          type: 'expired',
          fdr: f,
          buttonText: 'Issue Notice',
          onAction: () => onOpenNotice(f),
        });
      });

    // 2. Pending Verification (if user is officer or admin)
    if (currentUser.role === 'officer' || currentUser.role === 'admin') {
      fdrs
        .filter((f) => f.status === 'pending_verification' || f.status === 'under_review')
        .slice(0, 3)
        .forEach((f) => {
          actions.push({
            id: `act-ver-${f.id}`,
            title: `${f.institutionName}`,
            subtitle: `New FDR ${f.fdrNumber} submitted for ${f.purpose}. Awaiting officer lien check.`,
            type: 'pending_review',
            fdr: f,
            buttonText: 'Scrutinize',
            onAction: () => onOpenVerify(f),
          });
        });
    }

    // 3. Urgent maturities (<30 days)
    fdrs
      .filter((f) => {
        if (f.status === 'released' || f.status === 'rejected') return false;
        const d = getMaturityDays(f.maturityDate);
        return d >= 0 && d <= 30;
      })
      .slice(0, 2)
      .forEach((f) => {
        const days = getMaturityDays(f.maturityDate);
        actions.push({
          id: `act-urg-${f.id}`,
          title: `${f.institutionName}`,
          subtitle: `FDR ${f.fdrNumber} matures in ${days} days. Submit renewal deposit receipt scan.`,
          type: 'urgent_maturity',
          fdr: f,
          buttonText: 'Renew FDR',
          onAction: () => onOpenRenewal(f),
        });
      });

    return actions.slice(0, 5);
  }, [fdrs, currentUser.role]);

  // 6 KPI Cards definition
  const cards = [
    {
      id: 'total',
      filterKey: 'all',
      title: 'Total Pledged FDRs',
      count: kpiData.totalCount,
      subValue: formatCurrency(kpiData.totalPledgedAmount),
      icon: IndianRupee,
      color: 'border-blue-200 bg-white hover:border-blue-400 text-blue-900',
      badge: 'Portfolio',
      badgeColor: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'verified',
      filterKey: 'verified',
      title: 'Verified Active Lien',
      count: kpiData.verifiedCount,
      subValue: `${kpiData.verifiedPercentage}% Verified Coverage`,
      icon: ShieldCheck,
      color: 'border-emerald-200 bg-white hover:border-emerald-400 text-emerald-950',
      badge: 'Council Endorsed',
      badgeColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'pending',
      filterKey: 'pending_verification',
      title: 'Pending Verification',
      count: kpiData.pendingVerificationCount,
      subValue: 'Awaiting Officer Scrutiny',
      icon: Clock,
      color: 'border-amber-200 bg-white hover:border-amber-400 text-amber-950',
      badge: kpiData.pendingVerificationCount > 0 ? 'Action Required' : 'Cleared',
      badgeColor: kpiData.pendingVerificationCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
      highlight: kpiData.pendingVerificationCount > 0,
    },
    {
      id: 'upcoming',
      filterKey: 'expiring_90',
      title: 'Upcoming Maturities',
      count: kpiData.upcomingMaturityCount,
      subValue: 'Within 90-Day Window',
      icon: AlertTriangle,
      color: 'border-orange-200 bg-white hover:border-orange-400 text-orange-950',
      badge: 'Watchlist',
      badgeColor: 'bg-orange-50 text-orange-700',
    },
    {
      id: 'expired',
      filterKey: 'expiring_30',
      title: 'Expired / Critical',
      count: kpiData.expiredCount,
      subValue: 'Statutory Lien Lapsed',
      icon: AlertCircle,
      color: 'border-rose-200 bg-white hover:border-rose-400 text-rose-950',
      badge: kpiData.expiredCount > 0 ? 'Urgent Notice' : 'Compliant',
      badgeColor: kpiData.expiredCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600',
      highlight: kpiData.expiredCount > 0,
    },
    {
      id: 'release',
      filterKey: 'release_requested',
      title: 'Pending Release Requests',
      count: kpiData.pendingReleaseCount,
      subValue: 'Displedge Sanction Queue',
      icon: ArrowUpRight,
      color: 'border-purple-200 bg-white hover:border-purple-400 text-purple-950',
      badge: 'Settlement',
      badgeColor: 'bg-purple-50 text-purple-700',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200" />
          <div className="h-72 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Personalized Welcome & GovTech Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#10233F] via-[#162f55] to-[#1c3c6b] text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-amber-500/30">
                AICTE APH Compliance Framework
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {currentDateFormatted}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {currentUser.displayName || 'Authorized Official'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitoring joint Fixed Deposit Receipts pledged in favor of Regional Officer, AICTE. 
              {isLiveFirebase ? (
                <span className="ml-1 text-emerald-300 font-semibold">
                  ✓ Synchronized with live Cloud Firestore repository.
                </span>
              ) : (
                <span className="ml-1 text-blue-300 font-semibold">
                  (Operating in Demo Mode with certified sample data).
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentUser.role !== 'officer' && (
              <button
                onClick={onOpenNewFDR}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Submit New FDR</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('portfolio')}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/15 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-300" />
              <span>Explore Repository</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Total Pledged Corpus</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {formatCurrency(kpiData.totalPledgedAmount)}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Active Lien Endorsements</div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
              {kpiData.verifiedCount} <span className="text-xs text-slate-300 font-normal">({kpiData.verifiedPercentage}%)</span>
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Urgent Expirations</div>
            <div className={`text-base sm:text-lg font-black mt-0.5 ${kpiData.expiredCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {kpiData.expiredCount} Overdue
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Awaiting Officer Scrutiny</div>
            <div className={`text-base sm:text-lg font-black mt-0.5 ${kpiData.pendingVerificationCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {kpiData.pendingVerificationCount} Pending
            </div>
          </div>
        </div>
      </div>

      {/* 2. Six Mandatory GovTech KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => {
                onSelectFilter(card.filterKey);
                onNavigateTab('portfolio');
              }}
              className={`text-left p-4 rounded-xl border shadow-2xs transition-all hover:shadow-md cursor-pointer relative overflow-hidden flex flex-col justify-between ${card.color}`}
            >
              {card.highlight && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                  <Icon className="w-4 h-4 opacity-70" />
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {card.count}
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1 line-clamp-1">
                  {card.title}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="truncate">{card.subValue}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Analytics Section: Donut Chart + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">FDR Status Distribution</h3>
            </div>
            <span className="text-[11px] text-slate-500">Live Breakdown</span>
          </div>

          {/* Donut Visual */}
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100"
                  strokeWidth="14"
                  fill="none"
                />

                {/* Status Segments */}
                {(() => {
                  let accumulatedPercent = 0;
                  const circumference = 2 * Math.PI * 40; // ~251.32

                  return statusDistribution.map((item) => {
                    const pct = Number(item.percentage) / 100;
                    const strokeDasharray = `${pct * circumference} ${circumference}`;
                    const strokeDashoffset = -(accumulatedPercent * circumference);
                    accumulatedPercent += pct;

                    const isHovered = activeDonutSegment === item.id;

                    return (
                      <circle
                        key={item.id}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={item.color}
                        strokeWidth={isHovered ? 18 : 14}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        fill="none"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setActiveDonutSegment(item.id)}
                        onMouseLeave={() => setActiveDonutSegment(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Details */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-none">
                  {activeDonutSegment
                    ? statusDistribution.find((s) => s.id === activeDonutSegment)?.count || kpiData.totalCount
                    : kpiData.totalCount}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
                  {activeDonutSegment
                    ? statusDistribution.find((s) => s.id === activeDonutSegment)?.label
                    : 'Total FDRs'}
                </span>
              </div>
            </div>

            {/* Legend & Percentages */}
            <div className="flex-1 space-y-2 text-xs w-full">
              {statusDistribution.map((item) => {
                const isHovered = activeDonutSegment === item.id;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveDonutSegment(item.id)}
                    onMouseLeave={() => setActiveDonutSegment(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition ${
                      isHovered ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900">{item.count}</span>
                      <span className="text-[11px] text-slate-400 w-9 text-right font-mono">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Submission & Deposit Inflow Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Monthly FDR Inflow & Pledged Value</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Past 6 Active Months</span>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              No historical monthly data recorded yet.
            </div>
          ) : (
            <div className="pt-4">
              <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-40 pb-2 border-b border-slate-100">
                {(() => {
                  const maxAmt = Math.max(...monthlyData.map((m) => m.totalAmount), 1);

                  return monthlyData.map((m) => {
                    const heightPercent = Math.max(Math.round((m.totalAmount / maxAmt) * 100), 12);
                    return (
                      <div key={m.key} className="flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[10px] text-slate-600 font-bold group-hover:text-blue-600 transition">
                          ₹{(m.totalAmount / 100000).toFixed(1)}L
                        </div>

                        <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-lg transition-all group-hover:from-blue-600 group-hover:to-teal-400 shadow-xs"
                          />
                        </div>

                        <div className="text-center">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            {m.label}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {m.count} FDR{m.count > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-1">
                <span>Aggregated from verified institutional deposit dates & council sanctions</span>
                <button
                  onClick={() => onNavigateTab('portfolio')}
                  className="font-semibold text-blue-600 hover:text-blue-800"
                >
                  View full portfolio →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Priorities: Urgent Action Center + Regional Scrutiny Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority-Based Action Center */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Priority Action Center</h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {urgentActions.length} Actions Required
            </span>
          </div>

          {urgentActions.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-bold text-slate-800">Operational Compliance Maintained</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No critical overdue maturities or unreviewed officer queues pending at this hour.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentActions.map((action) => (
                <div
                  key={action.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {action.title}
                      </span>
                      {action.type === 'expired' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shrink-0">
                          Expired
                        </span>
                      )}
                      {action.type === 'pending_review' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                          Scrutiny
                        </span>
                      )}
                      {action.type === 'urgent_maturity' && (
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded shrink-0">
                          Rollover
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {action.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectFDR(action.fdr)}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={action.onAction}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition active:scale-95"
                    >
                      {action.buttonText}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regional Workload & Verification Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Regional Bureau Verification Workload</h3>
            </div>
            <span className="text-[11px] text-slate-500">AICTE Regional Offices</span>
          </div>

          <div className="space-y-3 pt-1">
            {regionalWorkload.map((rw) => (
              <div key={rw.region} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{rw.region} Region</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-700 font-bold">{rw.verified} Verified</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-600">{rw.total} Total</span>
                    <span className="font-bold text-slate-900 ml-1">({rw.rate}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${rw.rate}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  />
                  {rw.pending > 0 && (
                    <div
                      style={{ width: `${(rw.pending / rw.total) * 100}%` }}
                      className="h-full bg-amber-400"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Verified
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Scrutiny In Progress
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('verification')}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Go to Officer Desk →
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Feed (Audit Events) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Regulatory Activity & Audit Events</h3>
          </div>
          <button
            onClick={() => onNavigateTab('audit')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View all immutable logs →
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No recent audit events recorded.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 5).map((log) => {
              const formattedTime = new Date(log.timestamp).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">{log.performedByName}</span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.role}
                        </span>
                        {log.fdrNumber && (
                          <span className="font-mono text-[11px] font-bold text-blue-600">
                            {log.fdrNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed truncate">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                    {formattedTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
