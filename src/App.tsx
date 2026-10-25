import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FDRItem, AuditLogEntry, FDRStatus } from './types/fdr';
import { FDRService } from './services/fdrService';
import { Sidebar, PortalTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DemoBanner } from './components/DemoBanner';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { FDRFilterBar } from './components/FDRFilterBar';
import { FDRTable, getMaturityDays } from './components/FDRTable';
import { FDRDetailModal } from './components/FDRDetailModal';
import { FDRFormModal } from './components/FDRFormModal';
import { RenewalModal } from './components/RenewalModal';
import { ReleaseModal } from './components/ReleaseModal';
import { OfficerVerificationModal } from './components/OfficerVerificationModal';
import { VerificationDesk as OfficerVerificationDesk } from './components/VerificationDesk';
import { MaturityTracker } from './components/MaturityTracker';
import { AuditLogView } from './components/AuditLogView';
import { NoticeGeneratorModal } from './components/NoticeGeneratorModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';

function PortalContent() {
  const { currentUser, isLiveFirebase } = useAuth();

  // Navigation & Shell State
  const [currentTab, setCurrentTab] = useState<PortalTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Data State
  const [fdrs, setFdrs] = useState<FDRItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Repository Filters & Sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('All Regions');
  const [bankFilter, setBankFilter] = useState<string>('All Banks');
  const [sortBy, setSortBy] = useState<string>('maturity_asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [selectedFDR, setSelectedFDR] = useState<FDRItem | null>(null);
  const [targetFDR, setTargetFDR] = useState<FDRItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState<boolean>(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState<boolean>(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Load FDRs and Audit Logs
  const loadData = async () => {
    try {
      setLoading(true);
      const items = await FDRService.getFDRs({
        role: currentUser.role,
        institutionId: currentUser.role === 'institution' ? currentUser.institutionId : undefined,
        region: currentUser.role === 'officer' ? currentUser.region : undefined,
      });
      const logs = await FDRService.getAuditLogs();
      setFdrs(items);
      setAuditLogs(logs);

      // If a modal is open with an active FDR, refresh its instance
      if (selectedFDR) {
        const fresh = items.find((i) => i.id === selectedFDR.id);
        if (fresh) setSelectedFDR(fresh);
      }
      if (targetFDR) {
        const freshTarget = items.find((i) => i.id === targetFDR.id);
        if (freshTarget) setTargetFDR(freshTarget);
      }
    } catch (err) {
      console.error('Failed to load portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.role, currentUser.institutionId, currentUser.region]);

  // Handle open config from sidebar tab
  useEffect(() => {
    if (currentTab === 'config') {
      setIsConfigModalOpen(true);
      setCurrentTab('dashboard');
    }
  }, [currentTab]);

  // Counts for sidebar badges
  const sidebarCounts = useMemo(() => {
    let pendingVerification = 0;
    let urgentMaturity = 0;
    let pendingReleases = 0;
    const now = new Date();

    fdrs.forEach((f) => {
      if (f.status === 'pending_verification' || f.status === 'under_review') {
        pendingVerification++;
      }
      if (f.status === 'release_requested') {
        pendingReleases++;
      }
      if (f.status !== 'released' && f.status !== 'rejected') {
        const days = getMaturityDays(f.maturityDate);
        if (days <= 30) {
          urgentMaturity++;
        }
      }
    });

    return {
      totalFDRs: fdrs.length,
      pendingVerification,
      urgentMaturity,
      pendingReleases,
    };
  }, [fdrs]);

  // Filtering & Sorting Logic for Repository
  const filteredFDRs = useMemo(() => {
    let result = [...fdrs];

    // Combine local repository search and topbar global search if active
    const activeSearch = searchTerm.trim() || globalSearch.trim();
    if (activeSearch) {
      const q = activeSearch.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.fdrNumber.toLowerCase().includes(q) ||
          f.institutionName.toLowerCase().includes(q) ||
          f.institutionId.toLowerCase().includes(q) ||
          f.bankName.toLowerCase().includes(q) ||
          f.branchName.toLowerCase().includes(q) ||
          f.ifscCode.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'expiring_30') {
      result = result.filter((f) => {
        const days = getMaturityDays(f.maturityDate);
        return days <= 30 && f.status !== 'released' && f.status !== 'rejected';
      });
    } else if (statusFilter === 'expiring_90') {
      result = result.filter((f) => {
        const days = getMaturityDays(f.maturityDate);
        return days > 0 && days <= 90 && f.status !== 'released' && f.status !== 'rejected';
      });
    } else if (statusFilter !== 'all') {
      result = result.filter((f) => f.status === statusFilter);
    }

    // Region filter
    if (regionFilter !== 'All Regions') {
      result = result.filter((f) => f.region === regionFilter);
    }

    // Bank filter
    if (bankFilter !== 'All Banks') {
      result = result.filter((f) => f.bankName === bankFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'maturity_asc') {
        return new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime();
      }
      if (sortBy === 'maturity_desc') {
        return new Date(b.maturityDate).getTime() - new Date(a.maturityDate).getTime();
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'inst_asc') {
        return a.institutionName.localeCompare(b.institutionName);
      }
      return 0;
    });

    return result;
  }, [fdrs, searchTerm, globalSearch, statusFilter, regionFilter, bankFilter, sortBy]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'FDR Number',
      'AICTE PID',
      'Institution Name',
      'Region',
      'Bank Name',
      'Branch',
      'IFSC Code',
      'Account Number',
      'Pledged Amount (INR)',
      'Deposit Date',
      'Maturity Date',
      'Rate of Interest (%)',
      'Lock-in Tenure (Months)',
      'Purpose',
      'Status',
    ];

    const rows = filteredFDRs.map((f) => [
      `"${f.fdrNumber}"`,
      `"${f.institutionId}"`,
      `"${f.institutionName.replace(/"/g, '""')}"`,
      `"${f.region}"`,
      `"${f.bankName}"`,
      `"${f.branchName.replace(/"/g, '""')}"`,
      `"${f.ifscCode}"`,
      `"${f.accountNumber}"`,
      f.amount,
      `"${f.depositDate}"`,
      `"${f.maturityDate}"`,
      f.interestRate,
      f.tenureMonths,
      `"${f.purpose}"`,
      `"${f.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_FDR_Portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FB] text-[#172B4D] font-sans">
      {/* 1. Deep Navy Collapsible Sidebar (#10233F) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        counts={sidebarCounts}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar with Breadcrumbs, Global Search, Notification Center & Role Switcher */}
        <TopBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenNewFDR={() => setIsNewModalOpen(true)}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          fdrs={fdrs}
          onSelectFDR={(fdr) => setSelectedFDR(fdr)}
        />

        {/* Demo vs Live Status Indicator Banner */}
        <DemoBanner
          onOpenConfig={() => setIsConfigModalOpen(true)}
          onRefreshData={loadData}
        />

        {/* Main Application Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* TAB 1: Executive Dashboard */}
          {currentTab === 'dashboard' && (
            <ExecutiveDashboard
              fdrs={fdrs}
              auditLogs={auditLogs}
              loading={loading}
              onNavigateTab={setCurrentTab}
              onSelectFilter={(st) => {
                setStatusFilter(st);
                setCurrentTab('portfolio');
              }}
              onOpenNewFDR={() => setIsNewModalOpen(true)}
              onSelectFDR={(fdr) => setSelectedFDR(fdr)}
              onOpenVerify={(fdr) => {
                setTargetFDR(fdr);
                setIsVerifyModalOpen(true);
              }}
              onOpenRenewal={(fdr) => {
                setTargetFDR(fdr);
                setIsRenewalModalOpen(true);
              }}
              onOpenNotice={(fdr) => {
                setTargetFDR(fdr);
                setIsNoticeModalOpen(true);
              }}
            />
          )}

          {/* TAB 2: FDR Repository & Data Explorer */}
          {currentTab === 'portfolio' && (
            <div>
              {/* Filter Bar with Search, Status, Region, Bank, Sort and CSV Export */}
              <FDRFilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                regionFilter={regionFilter}
                onRegionChange={setRegionFilter}
                bankFilter={bankFilter}
                onBankChange={setBankFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onOpenNewModal={() => setIsNewModalOpen(true)}
                onExportCSV={handleExportCSV}
                totalFiltered={filteredFDRs.length}
                canCreateFDR={currentUser.role !== 'officer'}
              />

              {/* FDR Table or Card Grid with Pagination & Badges */}
              {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <div className="text-sm font-semibold text-slate-700">Loading FDR Repository Records...</div>
                </div>
              ) : (
                <FDRTable
                  fdrs={filteredFDRs}
                  viewMode={viewMode}
                  onSelectFDR={(fdr) => setSelectedFDR(fdr)}
                  onOpenVerify={(fdr) => {
                    setTargetFDR(fdr);
                    setIsVerifyModalOpen(true);
                  }}
                  onOpenRenewal={(fdr) => {
                    setTargetFDR(fdr);
                    setIsRenewalModalOpen(true);
                  }}
                  onOpenRelease={(fdr) => {
                    setTargetFDR(fdr);
                    setIsReleaseModalOpen(true);
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 3: Officer Verification Desk */}
          {currentTab === 'verification' && (
            <div className="space-y-4">
              {currentUser.role === 'institution' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                  <span>
                    <strong>Evaluation Notice:</strong> You are viewing the Officer Verification Desk as an Institution User. Switch your active role to <strong>AICTE Regional Officer</strong> or <strong>Administrator</strong> in the header to execute official lien approvals.
                  </span>
                </div>
              )}
              <OfficerVerificationDesk
                fdrs={fdrs}
                onSelectFDR={(fdr) => setSelectedFDR(fdr)}
                onOpenVerify={(fdr) => {
                  setTargetFDR(fdr);
                  setIsVerifyModalOpen(true);
                }}
                onRefresh={loadData}
              />
            </div>
          )}

          {/* TAB 4: Maturity Alerts & Rollover Monitor */}
          {currentTab === 'maturity' && (
            <MaturityTracker
              fdrs={fdrs}
              onOpenNotice={(fdr) => {
                setTargetFDR(fdr);
                setIsNoticeModalOpen(true);
              }}
              onOpenRenewal={(fdr) => {
                setTargetFDR(fdr);
                setIsRenewalModalOpen(true);
              }}
              onSelectFDR={(fdr) => setSelectedFDR(fdr)}
            />
          )}

          {/* TAB 5: Immutable Audit Trail */}
          {currentTab === 'audit' && <AuditLogView logs={auditLogs} />}
        </main>

        {/* GovTech Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 shrink-0">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <div className="font-semibold text-slate-800">
              All India Council for Technical Education (AICTE) — Fixed Deposit Receipt (FDR) Management Portal
            </div>
            <div>
              Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | Statutory compliance under AICTE Approval Process Handbook (APH)
            </div>
          </div>
        </footer>
      </div>

      {/* Interactive Workflow Modals */}
      {selectedFDR && (
        <FDRDetailModal
          fdr={selectedFDR}
          onClose={() => setSelectedFDR(null)}
          onRefresh={loadData}
          onOpenVerify={(fdr) => {
            setTargetFDR(fdr);
            setIsVerifyModalOpen(true);
          }}
          onOpenRenewal={(fdr) => {
            setTargetFDR(fdr);
            setIsRenewalModalOpen(true);
          }}
          onOpenRelease={(fdr) => {
            setTargetFDR(fdr);
            setIsReleaseModalOpen(true);
          }}
          auditLogs={auditLogs}
        />
      )}

      {isNewModalOpen && (
        <FDRFormModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={(item) => {
            loadData();
            setSelectedFDR(item);
          }}
        />
      )}

      {isVerifyModalOpen && targetFDR && (
        <OfficerVerificationModal
          fdr={targetFDR}
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setTargetFDR(null);
          }}
          onSuccess={loadData}
        />
      )}

      {isRenewalModalOpen && targetFDR && (
        <RenewalModal
          fdr={targetFDR}
          isOpen={isRenewalModalOpen}
          onClose={() => {
            setIsRenewalModalOpen(false);
            setTargetFDR(null);
          }}
          onSuccess={loadData}
        />
      )}

      {isReleaseModalOpen && targetFDR && (
        <ReleaseModal
          fdr={targetFDR}
          isOpen={isReleaseModalOpen}
          onClose={() => {
            setIsReleaseModalOpen(false);
            setTargetFDR(null);
          }}
          onSuccess={loadData}
        />
      )}

      {isNoticeModalOpen && targetFDR && (
        <NoticeGeneratorModal
          fdr={targetFDR}
          isOpen={isNoticeModalOpen}
          onClose={() => {
            setIsNoticeModalOpen(false);
            setTargetFDR(null);
          }}
        />
      )}

      {isConfigModalOpen && (
        <FirebaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortalContent />
    </AuthProvider>
  );
}
