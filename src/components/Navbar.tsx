import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/fdr';
import {
  Landmark,
  ShieldAlert,
  Building2,
  UserCheck,
  ShieldCheck,
  FileText,
  Clock,
  History,
  Settings,
  ChevronDown,
  LogOut,
  Database,
  LogIn,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'portfolio' | 'maturity' | 'verification' | 'audit' | 'config';
  onSelectTab: (tab: 'portfolio' | 'maturity' | 'verification' | 'audit' | 'config') => void;
  onOpenNewFDR: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenNewFDR }) => {
  const { currentUser, firebaseUser, switchDemoUser, logout, isLiveFirebase, signInWithGoogle } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const roles: { role: UserRole; title: string; desc: string; icon: any; color: string }[] = [
    {
      role: 'institution',
      title: 'Institution User',
      desc: 'College/University Principal or Registrar',
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      role: 'officer',
      title: 'AICTE Regional Officer',
      desc: 'Regional verification & scrutiny officer',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      role: 'admin',
      title: 'AICTE Administrator',
      desc: 'HQ Finance Bureau Director / Super Admin',
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
  ];

  const currentRoleConfig = roles.find((r) => r.role === currentUser.role) || roles[0];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Gov Tricolor Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* AICTE Official Brand & Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => onSelectTab('portfolio')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-amber-700 flex items-center justify-center text-white shadow-md ring-2 ring-orange-200">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-sm">
                  Govt. of India
                </span>
                <span className="text-xs font-semibold text-slate-500">Ministry of Education</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                AICTE FDR Portal
                <span className="text-xs font-normal text-slate-500 hidden md:inline">
                  (Fixed Deposit Receipt Management)
                </span>
              </h1>
            </div>
          </div>

          {/* Right Header: Auth, Role Switcher & User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Live / Demo Status Pill */}
            <button
              onClick={() => onSelectTab('config')}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                isLiveFirebase
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to view Firebase setup details"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isLiveFirebase ? 'Firebase Connected' : 'Demo Local Mode'}</span>
            </button>

            {/* Google Sign-in or User Badge */}
            {firebaseUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 transition"
                >
                  {firebaseUser.photoURL ? (
                    <img
                      src={firebaseUser.photoURL}
                      alt="Google avatar"
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {firebaseUser.email?.[0].toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden md:inline max-w-[120px] truncate">
                    {firebaseUser.displayName || firebaseUser.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{firebaseUser.displayName || 'Firebase User'}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{firebaseUser.email}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Authenticated via Google</div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 font-semibold hover:bg-slate-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95"
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
                <span>Google Sign-In</span>
              </button>
            )}

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition shadow-xs ${currentRoleConfig.color}`}
              >
                <currentRoleConfig.icon className="w-4 h-4" />
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">Active Role</div>
                  <div>{currentRoleConfig.title}</div>
                </div>
                <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500">
                    Switch Persona for Testing & Workflow Evaluation:
                  </div>
                  {roles.map((item) => (
                    <button
                      key={item.role}
                      onClick={() => {
                        switchDemoUser(item.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition ${
                        currentUser.role === item.role ? 'bg-slate-100/70 font-semibold' : ''
                      }`}
                    >
                      <item.icon className="w-5 h-5 text-slate-700 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                  <div className="mt-2 pt-2 border-t border-slate-100 px-3">
                    <button
                      onClick={() => {
                        logout();
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left text-xs text-red-600 font-medium py-1.5 flex items-center gap-2 hover:underline"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Reset Persona
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            {currentUser.role !== 'officer' && (
              <button
                onClick={onOpenNewFDR}
                className="hidden md:inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
              >
                <span>+ Submit FDR</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-slate-100 text-xs sm:text-sm font-medium text-slate-600 no-scrollbar">
          <button
            onClick={() => onSelectTab('portfolio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              currentTab === 'portfolio'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>FDR Portfolio</span>
          </button>

          <button
            onClick={() => onSelectTab('maturity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              currentTab === 'maturity'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Maturity Alerts & Tracker</span>
          </button>

          <button
            onClick={() => onSelectTab('verification')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              currentTab === 'verification'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Verification Desk</span>
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              currentTab === 'audit'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => onSelectTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              currentTab === 'config'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Firebase & Docs</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
