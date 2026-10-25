import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/fdr';
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Clock,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  ShieldCheck,
  UserCheck,
  Database,
  X,
  ExternalLink,
  Landmark,
  Sparkles,
} from 'lucide-react';

export type PortalTab = 'dashboard' | 'portfolio' | 'maturity' | 'verification' | 'audit' | 'config';

interface SidebarProps {
  currentTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    totalFDRs: number;
    pendingVerification: number;
    urgentMaturity: number;
    pendingReleases: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  counts,
}) => {
  const { currentUser, isLiveFirebase, switchDemoUser } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as PortalTab,
      label: 'Executive Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Analytics, KPI cards & priorities',
    },
    {
      id: 'portfolio' as PortalTab,
      label: 'FDR Repository',
      shortLabel: 'Repository',
      icon: FileText,
      badge: counts.totalFDRs > 0 ? String(counts.totalFDRs) : null,
      badgeColor: 'bg-slate-700/80 text-slate-200',
      description: 'Search, filter & manage all records',
    },
    {
      id: 'verification' as PortalTab,
      label: 'Verification Desk',
      shortLabel: 'Verification',
      icon: ShieldAlert,
      badge: counts.pendingVerification > 0 ? String(counts.pendingVerification) : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold animate-pulse',
      description: 'Officer scrutiny & discrepancy review',
    },
    {
      id: 'maturity' as PortalTab,
      label: 'Maturity & Rollover',
      shortLabel: 'Maturity',
      icon: Clock,
      badge: counts.urgentMaturity > 0 ? String(counts.urgentMaturity) : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold',
      description: 'Expiry monitor & notice generator',
    },
    {
      id: 'audit' as PortalTab,
      label: 'Audit & Compliance',
      shortLabel: 'Audit Trail',
      icon: History,
      badge: null,
      description: 'Immutable regulatory action log',
    },
    {
      id: 'config' as PortalTab,
      label: 'Firebase & System',
      shortLabel: 'System',
      icon: Settings,
      badge: isLiveFirebase ? 'Live' : 'Demo',
      badgeColor: isLiveFirebase
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      description: 'Cloud Firestore & environment settings',
    },
  ];

  const handleNavClick = (tab: PortalTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const roleStyles = {
    institution: {
      title: 'Institution User',
      subtitle: 'College / Institute Principal',
      icon: Building2,
      badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
    officer: {
      title: 'AICTE Regional Officer',
      subtitle: 'Scrutiny & Verification Desk',
      icon: ShieldCheck,
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    admin: {
      title: 'HQ Finance Director',
      subtitle: 'Council Administrator',
      icon: UserCheck,
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
  };

  const currentRoleInfo = roleStyles[currentUser.role] || roleStyles.institution;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between text-slate-100 select-none overflow-hidden">
      {/* Top Branding Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center gap-3 cursor-pointer transition-opacity ${
              collapsed ? 'justify-center w-full' : ''
            }`}
          >
            {/* AICTE Crest Emblem */}
            <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-700 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#10233F] rounded-[10px] flex items-center justify-center text-amber-400">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            {!collapsed && (
              <div className="overflow-hidden min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-sm">
                    Govt. of India
                  </span>
                </div>
                <h1 className="text-sm font-bold text-white tracking-tight leading-snug truncate">
                  AICTE FDR Portal
                </h1>
                <p className="text-[11px] text-slate-400 truncate">
                  Financial Lien & Compliance
                </p>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            aria-label="Close mobile menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Modules
            </div>
          )}

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md font-semibold ring-1 ring-blue-400/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Active Role & System Health */}
      <div className="p-3 border-t border-white/10 bg-[#0c1b31] space-y-2">
        {/* Active Role Quick Card */}
        <div
          className={`rounded-xl border p-2.5 transition ${
            collapsed ? 'text-center' : ''
          } ${currentRoleInfo.badgeBg}`}
        >
          {collapsed ? (
            <div className="flex justify-center" title={`${currentRoleInfo.title} (${currentRoleInfo.subtitle})`}>
              <currentRoleInfo.icon className="w-4 h-4 text-amber-300" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-black/20 shrink-0">
                <currentRoleInfo.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Active Persona
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {currentRoleInfo.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentRoleInfo.subtitle}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Database Connectivity Status */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] bg-white/5 text-slate-300 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          title={isLiveFirebase ? 'Google Cloud Firestore Connected' : 'Local In-Memory Demo Storage'}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLiveFirebase ? 'bg-emerald-400' : 'bg-blue-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveFirebase ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
              />
            </span>
            {!collapsed && (
              <span className="truncate text-[11px] font-medium text-slate-300">
                {isLiveFirebase ? 'Firestore Online' : 'Local Demo Mode'}
              </span>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => handleNavClick('config')}
              className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
            >
              Config
            </button>
          )}
        </div>

        {/* Desktop Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex w-full items-center justify-center gap-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Collapse Navigation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Desktop Sidebar (Persistent) */}
      <aside
        style={{ backgroundColor: '#10233F' }}
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-30 border-r border-slate-800 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <aside
        style={{ backgroundColor: '#10233F' }}
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
