import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Shield,
  FileCode,
  Terminal,
  Database,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { isFirebaseConfigured, getFirebaseEnvConfig } from '../services/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'env' | 'rules' | 'indexes' | 'deploy'>('env');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentConfig = getFirebaseEnvConfig();
  const configured = isFirebaseConfigured();

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeEnv = `# =================================================================
# AICTE FDR Management Portal - Provisioned Firebase Configuration
# =================================================================
# Project ID: ${currentConfig.projectId}
# Database ID: ${currentConfig.firestoreDatabaseId}

VITE_FIREBASE_API_KEY="${currentConfig.apiKey || 'AIzaSyYourActualApiKey'}"
VITE_FIREBASE_AUTH_DOMAIN="${currentConfig.authDomain || 'your-project.firebaseapp.com'}"
VITE_FIREBASE_PROJECT_ID="${currentConfig.projectId || 'your-project-id'}"
VITE_FIREBASE_STORAGE_BUCKET="${currentConfig.storageBucket || 'your-project.firebasestorage.app'}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${currentConfig.messagingSenderId || '481809193516'}"
VITE_FIREBASE_APP_ID="${currentConfig.appId || '1:481809193516:web:7500c026021c90348d0f89'}"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="${currentConfig.firestoreDatabaseId || '(default)'}"
`;

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Default Deny All Catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    // Admins and AICTE Officers are validated via trusted collection or email domain
    function isAdmin() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        request.auth.token.email.matches('.*@aicte-india\\.org$')
      );
    }

    function isOfficer() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/officers/$(request.auth.uid)) ||
        isAdmin()
      );
    }

    // FDR Collection Rules
    match /fdrs/{fdrId} {
      // Institutions can read their own FDRs; Officers and Admins can read all
      allow get, list: if isSignedIn() && (
        isAdmin() ||
        isOfficer() ||
        resource.data.institutionId == request.auth.token.institutionId ||
        resource.data.createdBy == request.auth.uid
      );

      // Submission: Institutions can submit FDRs
      allow create: if isSignedIn() && (
        request.resource.data.createdBy == request.auth.uid &&
        request.resource.data.status in ['draft', 'pending_verification'] &&
        request.resource.data.amount > 0 &&
        request.resource.data.fdrNumber is string
      );

      // Updates: Officers can update status/verification; Institution can update before verification or request renewal/release
      allow update: if isSignedIn() && (
        isAdmin() ||
        isOfficer() ||
        (
          resource.data.createdBy == request.auth.uid &&
          request.resource.data.createdBy == resource.data.createdBy &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'renewalHistory', 'releaseDetails', 'documents', 'updatedAt'])
        )
      );

      // Deletion: Admin only
      allow delete: if isAdmin();
    }

    // Audit Logs Collection Rules
    match /audit_logs/{logId} {
      allow read: if isSignedIn() && (isAdmin() || isOfficer());
      allow create: if isSignedIn();
      allow update, delete: if false; // Append-only audit trail
    }

    // User Profiles
    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow write: if isSignedIn() && (request.auth.uid == userId || isAdmin());
    }
  }
}`;

  const sampleIndexes = `{
  "indexes": [
    {
      "collectionGroup": "fdrs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "institutionId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "fdrs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "region", "order": "ASCENDING" },
        { "fieldPath": "maturityDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "fdrs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "maturityDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fdrId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}`;

  const sampleDeployCommands = `# 1. Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase with your Google account
firebase login

# 3. Initialize Firebase in this project directory
firebase init firestore
firebase init storage

# 4. Deploy hardened Security Rules and Indexes
firebase deploy --only firestore:rules,firestore:indexes,storage

# 5. Build and deploy frontend app
npm run build
firebase deploy --only hosting
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/30 rounded-lg text-orange-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Firebase Configuration & Security Rules</h2>
              <p className="text-xs text-slate-300">
                Setup guide for persistent Cloud Firestore, Auth & Storage integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Status Banner */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Connection Status:</span>
            {configured ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Connected to Firebase ({currentConfig.projectId})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Running in In-Memory / Local Storage Demo Mode
              </span>
            )}
          </div>
          <span className="text-slate-500 hidden sm:inline">Zero private keys exposed in client bundle</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'env'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>.env Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'rules'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>firestore.rules (ABAC)</span>
          </button>
          <button
            onClick={() => setActiveTab('indexes')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'indexes'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Indexes (JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'deploy'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>CLI & Deployment</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Security Best Practice:</strong> Frontend apps only require the public web configuration keys.
                  Never commit service-account private keys (<code>credentials.json</code>) or write secrets into client code.
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Environment Template (.env)
                  </span>
                  <button
                    onClick={() => copyToClipboard(activeEnv, 'env')}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold bg-slate-100 px-2.5 py-1 rounded-md hover:bg-slate-200 transition"
                  >
                    {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'env' ? 'Copied!' : 'Copy Config'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {activeEnv}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900">
                <strong>ABAC & RBAC Enforcement:</strong> Institutional users can only read and manage FDRs associated with their institute. AICTE Regional Officers and Admins have supervisory oversight.
              </div>
              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    firestore.rules
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleRules, 'rules')}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold bg-slate-100 px-2.5 py-1 rounded-md hover:bg-slate-200 transition"
                  >
                    {copiedKey === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'rules' ? 'Copied!' : 'Copy Rules'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                  {sampleRules}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'indexes' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Composite indexes required for fast multi-field filtering by Region, Maturity Date, and Status:
              </p>
              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    firestore.indexes.json
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleIndexes, 'indexes')}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold bg-slate-100 px-2.5 py-1 rounded-md hover:bg-slate-200 transition"
                  >
                    {copiedKey === 'indexes' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'indexes' ? 'Copied!' : 'Copy Indexes'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-amber-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {sampleIndexes}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Run these standard commands in your local terminal to authenticate and deploy rules & hosting:
              </p>
              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    CLI Workflow
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleDeployCommands, 'deploy')}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold bg-slate-100 px-2.5 py-1 rounded-md hover:bg-slate-200 transition"
                  >
                    {copiedKey === 'deploy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'deploy' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-cyan-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {sampleDeployCommands}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
