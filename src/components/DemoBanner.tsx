import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Loader2,
  X,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { FDRService } from '../services/fdrService';
import { SeedingResult } from '../types/fdr';

interface DemoBannerProps {
  onOpenConfig: () => void;
  onRefreshData: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onOpenConfig, onRefreshData }) => {
  const { isLiveFirebase, currentUser, firebaseUser, switchDemoUser, signInWithGoogle } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedingResult, setSeedingResult] = useState<SeedingResult | null>(null);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleSeedToFirestore = async () => {
    // 1. Verify that Firebase Authentication has a valid signed-in user
    if (!firebaseUser) {
      setShowAuthRequiredModal(true);
      return;
    }

    try {
      setSeeding(true);
      // 2 & 3. Execute write to live Cloud Firestore database
      const result = await FDRService.seedDemoToFirestore({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email || 'AICTE User',
        role: currentUser.role,
      });

      setSeedingResult(result);
      if (result.success && result.addedCount > 0) {
        onRefreshData();
      }
    } catch (err: any) {
      setSeedingResult({
        success: false,
        addedCount: 0,
        skippedCount: 0,
        totalAttempted: 0,
        databaseId: 'ai-studio-aictefdrmanageme-6d482198-9618-4626-b21d-d57291c17023',
        projectId: 'gen-lang-client-0423881117',
        userEmail: firebaseUser.email || 'N/A',
        userUid: firebaseUser.uid,
        addedFdrNumbers: [],
        skippedFdrNumbers: [],
        error: err instanceof Error ? err.message : String(err),
        errorCode: err?.code || 'unknown/error',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleConfirmReset = () => {
    FDRService.resetDemoData();
    setShowResetConfirmModal(false);
    onRefreshData();
  };

  const copyDatabaseId = () => {
    navigator.clipboard.writeText('ai-studio-aictefdrmanageme-6d482198-9618-4626-b21d-d57291c17023');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <>
      <div
        className={`border-b px-4 py-2.5 text-xs sm:text-sm transition-colors ${
          firebaseUser
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isLiveFirebase
            ? 'bg-blue-50/90 border-blue-200 text-blue-950'
            : 'bg-amber-50/90 border-amber-200 text-amber-950'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {firebaseUser ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : isLiveFirebase ? (
              <Database className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>
              {firebaseUser ? (
                <span className="font-semibold text-emerald-800">
                  Live Cloud Firestore Active: Signed in as <strong>{firebaseUser.email}</strong>. Target database:{' '}
                  <code className="bg-emerald-100 text-emerald-900 px-1 rounded-sm text-[11px]">
                    ai-studio-aictefdrmanageme-6d482198-9618-4626-b21d-d57291c17023
                  </code>
                </span>
              ) : isLiveFirebase ? (
                <span>
                  <strong className="font-bold text-blue-900">Firebase Backend Provisioned:</strong> Cloud Firestore & Auth are ready. Sign in with Google to write records to persistent cloud storage.
                </span>
              ) : (
                <span>
                  <strong className="font-bold text-amber-900">DEMO MODE ACTIVE:</strong> Browser local storage.
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Populate Live Firestore Button */}
            {isLiveFirebase && (
              <button
                type="button"
                onClick={handleSeedToFirestore}
                disabled={seeding}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Write sample AICTE FDR records to Cloud Firestore"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing to Firestore...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Populate Live Firestore</span>
                  </>
                )}
              </button>
            )}

            {/* Persona switcher */}
            <span className="text-xs text-slate-500 hidden lg:inline">Active Persona:</span>
            <div className="inline-flex rounded-md shadow-2xs border border-slate-300 overflow-hidden bg-white text-xs">
              <button
                onClick={() => switchDemoUser('institution')}
                className={`px-2.5 py-1 font-medium transition ${
                  currentUser.role === 'institution'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                College
              </button>
              <button
                onClick={() => switchDemoUser('officer')}
                className={`px-2.5 py-1 font-medium transition ${
                  currentUser.role === 'officer'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Officer
              </button>
              <button
                onClick={() => switchDemoUser('admin')}
                className={`px-2.5 py-1 font-medium transition ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Admin
              </button>
            </div>

            <button
              onClick={onOpenConfig}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300 text-xs font-semibold shadow-2xs transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              <span>Firebase Details</span>
            </button>

            {!firebaseUser && (
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300 text-xs font-semibold shadow-2xs transition"
                title="Reset Local Preview Cache"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Reset Preview</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Required Modal */}
      {showAuthRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Google Sign-In Required</h3>
                  <p className="text-xs text-slate-500">Firebase Authentication Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthRequiredModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 space-y-2">
              <p>
                Cloud Firestore security rules require an authenticated user to write records. To populate your persistent database, please sign in with your Google account.
              </p>
              <div className="text-[11px] text-slate-500">
                Target Database: <code>ai-studio-aictefdrmanageme-6d482198-9618-4626-b21d-d57291c17023</code>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAuthRequiredModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowAuthRequiredModal(false);
                  await signInWithGoogle();
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Sign In with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seeding Result Modal */}
      {seedingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    seedingResult.success
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  {seedingResult.success ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {seedingResult.success
                      ? 'Cloud Firestore Seeding Succeeded'
                      : 'Cloud Firestore Seeding Failed'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Project: <code>{seedingResult.projectId}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSeedingResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Breakdown Box */}
            <div className="space-y-3 text-xs">
              {/* Database ID verification box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Connected Database</div>
                  <code className="text-slate-900 font-bold font-mono text-[11px]">
                    {seedingResult.databaseId}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={copyDatabaseId}
                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-md"
                  title="Copy Database ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {seedingResult.success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Database Mutation Complete:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>{seedingResult.addedCount} new FDR records</strong> successfully written to Cloud Firestore.
                    </li>
                    <li>
                      <strong>{seedingResult.skippedCount} records skipped</strong> because they already exist (duplicate prevention verified; zero records overwritten).
                    </li>
                    <li>
                      Author UID: <code className="text-[11px] font-mono">{seedingResult.userUid}</code> ({seedingResult.userEmail})
                    </li>
                  </ul>
                  {seedingResult.addedFdrNumbers.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200 text-[11px]">
                      <span className="font-semibold block mb-1">Added FDR Numbers:</span>
                      <div className="flex flex-wrap gap-1">
                        {seedingResult.addedFdrNumbers.map((num) => (
                          <span
                            key={num}
                            className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-sm font-mono text-[10px]"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {seedingResult.skippedFdrNumbers.length > 0 && (
                    <div className="pt-1 text-[11px] text-slate-600">
                      <span className="font-semibold block mb-1">Pre-existing FDR Numbers (Untouched):</span>
                      <div className="flex flex-wrap gap-1">
                        {seedingResult.skippedFdrNumbers.map((num) => (
                          <span
                            key={num}
                            className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-sm font-mono text-[10px]"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900">
                  <div className="font-bold text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Firestore Error Details:</span>
                  </div>
                  <div>
                    <strong>Error Code:</strong>{' '}
                    <code className="font-mono bg-rose-100 px-1.5 py-0.5 rounded-sm text-rose-800">
                      {seedingResult.errorCode || 'UNKNOWN'}
                    </code>
                  </div>
                  <div className="text-slate-800">
                    <strong>Error Message:</strong> {seedingResult.error}
                  </div>
                  <div className="text-[11px] text-slate-600 pt-1">
                    Please ensure that you have signed in with an authorized Google account and that Cloud Firestore security rules are deployed.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSeedingResult(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Sample Preview</h3>
                <p className="text-xs text-slate-500">Restore default demo data</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to restore the initial sample dataset in your local browser cache?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
