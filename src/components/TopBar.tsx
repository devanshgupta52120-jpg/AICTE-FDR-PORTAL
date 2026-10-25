import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, FDRItem } from '../types/fdr';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  ShieldCheck,
  Building2,
  UserCheck,
  LogOut,
  Plus,
  Database,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  FileText,
  Landmark,
} from 'lucide-react';
import { PortalTab } from './Sidebar';

interface TopBarProps {
  currentTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  onOpenMobileMenu: () => void;
  onOpenNewFDR: () => void;
  onOpenConfig: () => void;
  globalSearch: string;
  onGlobalSearchChange: (query: string) => void;
  fdrs: FDRItem[];
  onSelectFDR: (fdr: FDRItem) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenNewFDR,
  onOpenConfig,
  globalSearch,
  onGlobalSearchChange,
  fdrs,
  onSelectFDR,
}) => {
  const { currentUser, firebaseUser, switchDemoUser, logout, isLiveFirebase, signInWithGoogle } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Notifications
  const now = new Date();
  const pendingOfficerItems = fdrs.filter(
    (f) => f.status === 'pending_verification' || f.status === 'under_review'
  );
  const urgentExpiringItems = fdrs.filter((f) => {
    if (f.status === 'released' || f.status === 'rejected') return false;
    const diffDays = Math.ceil((new Date(f.maturityDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });
  const pendingReleaseItems = fdrs.filter((f) => f.status === 'release_requested');

  const totalActionItems = pendingOfficerItems.length + urgentExpiringItems.length + pendingReleaseItems.length;

  // Filter search matches for quick jump
  const searchResults = globalSearch.trim().length >= 2
    ? fdrs
        .filter((f) => {
          const q = globalSearch.toLowerCase().trim();
          return (
            f.fdrNumber.toLowerCase().includes(q) ||
            f.institutionName.toLowerCase().includes(q) ||
            f.institutionId.toLowerCase().includes(q) ||
            f.bankName.toLowerCase().includes(q) ||
            f.branchName.toLowerCase().includes(q) ||
            f.ifscCode.toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
    : [];

  const tabTitles: Record<PortalTab, { title: string; breadcrumb: string }> = {
    dashboard: { title: 'Executive Overview & Analytics', breadcrumb: 'Executive Dashboard' },
    portfolio: { title: 'FDR Repository & Lien Records', breadcrumb: 'FDR Repository' },
    verification: { title: 'Officer Scrutiny & Verification Desk', breadcrumb: 'Verification Desk' },
    maturity: { title: 'Maturity Monitoring & Compliance Tracker', breadcrumb: 'Maturity & Rollover' },
    audit: { title: 'Immutable Regulatory Audit Log', breadcrumb: 'Audit Trail' },
    config: { title: 'System Environment & Cloud Firestore', breadcrumb: 'Firebase & System' },
  };

  const roles = [
    {
      role: 'institution' as UserRole,
      title: 'Institution User',
      desc: 'College / Institute Principal or Registrar',
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      role: 'officer' as UserRole,
      title: 'AICTE Regional Officer',
      desc: 'Scrutiny officer for verifying FDR & lien',
      icon: ShieldCheck,
      color: 'text-amber-600',
    },
    {
      role: 'admin' as UserRole,
      title: 'AICTE Administrator',
      desc: 'HQ Finance Bureau Director (Super Admin)',
      icon: UserCheck,
      color: 'text-emerald-600',
    },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Gov Tricolor Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Dynamic Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium truncate">
              <span>AICTE National Portal</span>
              <span className="text-slate-400">/</span>
              <span className="text-blue-600 font-semibold">{tabTitles[currentTab]?.breadcrumb}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate hidden sm:block">
              {tabTitles[currentTab]?.title}
            </h2>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search by FDR No, Institute PID, Bank, Branch... (Ctrl+K)"
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
            {globalSearch && (
              <button
                onClick={() => onGlobalSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Jump Search Dropdown */}
          {searchFocused && globalSearch.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 flex items-center justify-between">
                <span>Matching FDR Records ({searchResults.length})</span>
                <span className="text-[10px] text-slate-600 font-normal">Press Esc to close</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No FDR records found matching "{globalSearch}".
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((fdr) => (
                    <button
                      key={fdr.id}
                      onClick={() => {
                        onSelectFDR(fdr);
                        setSearchFocused(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-xs transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate">
                          {fdr.institutionName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-mono text-blue-600 font-bold">{fdr.fdrNumber}</span>
                          <span>•</span>
                          <span>{fdr.bankName}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900">
                          ₹{(fdr.amount / 100000).toFixed(2)}L
                        </div>
                        <span className="text-[10px] capitalize text-slate-600 font-medium">
                          {fdr.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    onSelectTab('portfolio');
                    setSearchFocused(false);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View all filtered records in Repository →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live vs Demo Pill */}
          <button
            onClick={onOpenConfig}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition shadow-2xs ${
              isLiveFirebase
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
            }`}
            title="Click to view Cloud Firestore & System details"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isLiveFirebase ? 'Firestore Connected' : 'Demo Mode'}
            </span>
            <span className="sm:hidden">{isLiveFirebase ? 'Live' : 'Demo'}</span>
          </button>

          {/* Quick Submit FDR Button */}
          {currentUser.role !== 'officer' && (
            <button
              onClick={onOpenNewFDR}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit New FDR</span>
            </button>
          )}

          {/* Notifications Center Bell */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {totalActionItems > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Priority Action Center</h3>
                    <p className="text-[11px] text-slate-500">
                      System generated alerts & statutory deadlines
                    </p>
                  </div>
                  {totalActionItems > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {totalActionItems} Pending
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {urgentExpiringItems.length > 0 && (
                    <div
                      onClick={() => {
                        onSelectTab('maturity');
                        setNotificationOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition"
                    >
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {urgentExpiringItems.length} FDR(s) Expiring Within 30 Days
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Requires immediate issuance of Rollover Notices under AICTE guidelines.
                        </div>
                      </div>
                    </div>
                  )}

                  {pendingOfficerItems.length > 0 && (
                    <div
                      onClick={() => {
                        onSelectTab('verification');
                        setNotificationOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition"
                    >
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {pendingOfficerItems.length} New Submission(s) Awaiting Scrutiny
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Institutions have pledged FDRs needing physical receipt & bank check.
                        </div>
                      </div>
                    </div>
                  )}

                  {pendingReleaseItems.length > 0 && (
                    <div
                      onClick={() => {
                        onSelectTab('verification');
                        setNotificationOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition"
                    >
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {pendingReleaseItems.length} Displedge / Release Request(s)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Lock-in tenure completed; pending formal council displedge order.
                        </div>
                      </div>
                    </div>
                  )}

                  {totalActionItems === 0 && (
                    <div className="p-6 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <div className="text-xs font-semibold text-slate-700">All Tasks Up to Date</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        No pending verifications or critical maturities at this moment.
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                  <span className="text-[10px] text-slate-500">
                    Notifications reflect current Firestore / repository state
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Role Persona Switcher Pill */}
          <div ref={roleRef} className="relative">
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
              title="Switch user role to evaluate institution vs officer permissions"
            >
              <span className="hidden sm:inline text-slate-600 font-medium">Role:</span>
              <span className="font-bold capitalize">{currentUser.role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">Switch Test Persona</div>
                  <div className="text-[11px] text-slate-500">
                    Evaluate role-based access control and approval flows
                  </div>
                </div>

                <div className="py-1">
                  {roles.map((r) => {
                    const isCurrent = currentUser.role === r.role;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchDemoUser(r.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition ${
                          isCurrent ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${r.color}`} />
                        <div>
                          <div className={`text-xs font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-900'}`}>
                            {r.title}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            {r.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Button */}
          <div ref={userRef} className="relative">
            {firebaseUser ? (
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
              >
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="User Avatar"
                    className="w-6 h-6 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {firebaseUser.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden lg:inline">
                  {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                title="Sign in with your Google account"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Google Sign In</span>
              </button>
            )}

            {userDropdownOpen && firebaseUser && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">
                    {firebaseUser.displayName || 'Authorized User'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {firebaseUser.email}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Authenticated via Google
                  </div>
                </div>

                <div className="p-2 border-b border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-500">Institution:</span>{' '}
                    {currentUser.institutionName || 'AICTE Headquarters'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Region:</span>{' '}
                    {currentUser.region || 'North-West'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
