import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, auth, storage, isFirebaseConfigured, handleFirestoreError, OperationType, getFirebaseEnvConfig } from './firebase';
import { FDRItem, AuditLogEntry, FDRStatus, UserRole, RenewalRecord, ReleaseDetails, FDRDocument, SeedingResult } from '../types/fdr';
import { INITIAL_MOCK_FDRS, INITIAL_AUDIT_LOGS } from '../data/mockData';

const LOCAL_STORAGE_FDR_KEY = 'aicte_fdr_items_data_v1';
const LOCAL_STORAGE_LOG_KEY = 'aicte_fdr_audit_logs_v1';

// In-Memory / Local Storage state for Demo Mode
const loadLocalFDRs = (): FDRItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FDR_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load local FDRs', e);
  }
  return [...INITIAL_MOCK_FDRS];
};

const saveLocalFDRs = (items: FDRItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_FDR_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to persist local FDRs', e);
  }
};

const loadLocalLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load local audit logs', e);
  }
  return [...INITIAL_AUDIT_LOGS];
};

const saveLocalLogs = (logs: AuditLogEntry[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to persist local audit logs', e);
  }
};

export const FDRService = {
  // Fetch FDRs based on role, institutionId, region, or general filter
  async getFDRs(options?: {
    role?: UserRole;
    institutionId?: string;
    region?: string;
    status?: FDRStatus | 'all';
    searchTerm?: string;
  }): Promise<FDRItem[]> {
    const currentAuthUser = auth.currentUser;
    if (isFirebaseConfigured() && db && currentAuthUser) {
      const collectionPath = 'fdrs';
      try {
        let q = query(collection(db, collectionPath), limit(150));

        if (options?.role === 'institution' && currentAuthUser.email !== 'devanshgupta52120@gmail.com') {
          q = query(collection(db, collectionPath), where('createdBy', '==', currentAuthUser.uid), limit(150));
        }

        const snapshot = await getDocs(q);
        const results: FDRItem[] = [];
        snapshot.forEach((d) => {
          results.push({ ...(d.data() as FDRItem), id: d.id });
        });

        let filtered = results;
        if (options?.status && options.status !== 'all') {
          filtered = filtered.filter((f) => f.status === options.status);
        }
        if (options?.region && options.region !== 'All Regions' && options.region !== 'Headquarters (New Delhi)') {
          filtered = filtered.filter((f) => f.region === options.region);
        }
        if (options?.searchTerm?.trim()) {
          const term = options.searchTerm.toLowerCase().trim();
          filtered = filtered.filter(
            (f) =>
              f.fdrNumber.toLowerCase().includes(term) ||
              f.institutionName.toLowerCase().includes(term) ||
              f.institutionId.toLowerCase().includes(term) ||
              f.bankName.toLowerCase().includes(term) ||
              f.branchName.toLowerCase().includes(term) ||
              f.accountNumber.toLowerCase().includes(term)
          );
        }
        return filtered;
      } catch (error) {
        console.error('[Firestore] Error fetching from live Firestore:', error);
      }
    }

    // Demo / Local Fallback when unauthenticated
    let items = loadLocalFDRs();

    if (options?.role === 'institution' && options.institutionId) {
      items = items.filter((f) => f.institutionId === options.institutionId);
    } else if (options?.role === 'officer' && options.region && options.region !== 'Headquarters (New Delhi)') {
      items = items.filter((f) => f.region === options.region);
    }

    if (options?.status && options.status !== 'all') {
      items = items.filter((f) => f.status === options.status);
    }

    if (options?.searchTerm?.trim()) {
      const term = options.searchTerm.toLowerCase().trim();
      items = items.filter(
        (f) =>
          f.fdrNumber.toLowerCase().includes(term) ||
          f.institutionName.toLowerCase().includes(term) ||
          f.institutionId.toLowerCase().includes(term) ||
          f.bankName.toLowerCase().includes(term) ||
          f.branchName.toLowerCase().includes(term) ||
          f.accountNumber.toLowerCase().includes(term)
      );
    }

    return items;
  },

  // Get single FDR by ID
  async getFDRById(id: string): Promise<FDRItem | null> {
    if (isFirebaseConfigured() && db) {
      const path = `fdrs/${id}`;
      try {
        const snap = await getDoc(doc(db, 'fdrs', id));
        if (snap.exists()) {
          return { ...(snap.data() as FDRItem), id: snap.id };
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }

    const items = loadLocalFDRs();
    return items.find((f) => f.id === id) || null;
  },

  // Create new FDR
  async createFDR(
    itemData: Omit<FDRItem, 'id' | 'createdAt' | 'updatedAt'>,
    author: { uid: string; displayName: string; role: UserRole }
  ): Promise<FDRItem> {
    const id = `fdr-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newFDR: FDRItem = {
      ...itemData,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: author.uid,
      createdByName: author.displayName,
    };

    if (isFirebaseConfigured() && db) {
      const path = `fdrs/${id}`;
      try {
        await setDoc(doc(db, 'fdrs', id), newFDR);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      const items = loadLocalFDRs();
      items.unshift(newFDR);
      saveLocalFDRs(items);
    }

    await this.logAudit({
      fdrId: id,
      fdrNumber: newFDR.fdrNumber,
      action: 'FDR_SUBMITTED',
      performedBy: author.uid,
      performedByName: author.displayName,
      role: author.role,
      details: `New FDR of ₹${(newFDR.amount).toLocaleString('en-IN')} submitted under purpose "${newFDR.purpose}".`,
    });

    return newFDR;
  },

  // Update existing FDR
  async updateFDR(
    id: string,
    updates: Partial<FDRItem>,
    author: { uid: string; displayName: string; role: UserRole; actionNote?: string }
  ): Promise<FDRItem> {
    const nowIso = new Date().toISOString();
    const updatedPayload = {
      ...updates,
      updatedAt: nowIso,
    };

    if (isFirebaseConfigured() && db) {
      const path = `fdrs/${id}`;
      try {
        await updateDoc(doc(db, 'fdrs', id), updatedPayload);
        const updated = await this.getFDRById(id);
        if (!updated) throw new Error('FDR not found after update');
        return updated;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }

    const items = loadLocalFDRs();
    const idx = items.findIndex((f) => f.id === id);
    if (idx === -1) {
      throw new Error(`FDR with ID ${id} not found.`);
    }

    const current = items[idx];
    const merged: FDRItem = {
      ...current,
      ...updatedPayload,
    };
    items[idx] = merged;
    saveLocalFDRs(items);

    if (author.actionNote) {
      await this.logAudit({
        fdrId: id,
        fdrNumber: merged.fdrNumber,
        action: 'FDR_UPDATED',
        performedBy: author.uid,
        performedByName: author.displayName,
        role: author.role,
        details: author.actionNote,
      });
    }

    return merged;
  },

  // Officer Verification Action
  async verifyFDR(
    id: string,
    decision: 'verified' | 'discrepancy_reported' | 'rejected',
    officer: { uid: string; displayName: string; remarks: string; reasons?: string[]; bankConfirmed?: boolean; receiptVerified?: boolean }
  ): Promise<FDRItem> {
    const fdr = await this.getFDRById(id);
    if (!fdr) throw new Error('FDR not found');

    const verification = {
      verifiedBy: officer.uid,
      verifiedByName: officer.displayName,
      verifiedAt: new Date().toISOString(),
      officerRemarks: officer.remarks,
      bankConfirmationReceived: officer.bankConfirmed ?? true,
      physicalReceiptVerified: officer.receiptVerified ?? true,
      discrepancyReasons: officer.reasons || [],
    };

    const actionText =
      decision === 'verified'
        ? 'VERIFIED'
        : decision === 'discrepancy_reported'
        ? 'DISCREPANCY_FLAGGED'
        : 'REJECTED';

    const updated = await this.updateFDR(
      id,
      {
        status: decision,
        verification,
      },
      {
        uid: officer.uid,
        displayName: officer.displayName,
        role: 'officer',
        actionNote: `Status changed to ${decision.toUpperCase()}. Remarks: ${officer.remarks}`,
      }
    );

    await this.logAudit({
      fdrId: id,
      fdrNumber: fdr.fdrNumber,
      action: actionText,
      performedBy: officer.uid,
      performedByName: officer.displayName,
      role: 'officer',
      details: `Officer verification decision: ${decision}. Notes: ${officer.remarks}`,
    });

    return updated;
  },

  // Submit Renewal Request
  async requestRenewal(
    id: string,
    renewalData: {
      newMaturityDate: string;
      newAmount: number;
      newInterestRate: number;
      newReceiptNumber?: string;
      document?: FDRDocument;
      remarks: string;
    },
    user: { uid: string; displayName: string; role: UserRole }
  ): Promise<FDRItem> {
    const fdr = await this.getFDRById(id);
    if (!fdr) throw new Error('FDR not found');

    const newRecord: RenewalRecord = {
      id: `ren-${Date.now()}`,
      previousMaturityDate: fdr.maturityDate,
      newMaturityDate: renewalData.newMaturityDate,
      newAmount: renewalData.newAmount,
      newInterestRate: renewalData.newInterestRate,
      newReceiptNumber: renewalData.newReceiptNumber,
      requestedAt: new Date().toISOString(),
      documentUrl: renewalData.document?.fileUrl,
      remarks: renewalData.remarks,
    };

    const currentHistory = fdr.renewalHistory || [];
    const updatedDocs = renewalData.document
      ? [...fdr.documents, renewalData.document]
      : fdr.documents;

    const updated = await this.updateFDR(
      id,
      {
        status: 'renewal_requested',
        renewalHistory: [...currentHistory, newRecord],
        documents: updatedDocs,
      },
      {
        uid: user.uid,
        displayName: user.displayName,
        role: user.role,
        actionNote: `Renewal requested until ${renewalData.newMaturityDate}. Amount: ₹${renewalData.newAmount.toLocaleString('en-IN')}`,
      }
    );

    await this.logAudit({
      fdrId: id,
      fdrNumber: fdr.fdrNumber,
      action: 'RENEWAL_REQUESTED',
      performedBy: user.uid,
      performedByName: user.displayName,
      role: user.role,
      details: `Extension requested to ${renewalData.newMaturityDate} at ${renewalData.newInterestRate}% p.a.`,
    });

    return updated;
  },

  // Approve Renewal (Officer / Admin)
  async approveRenewal(
    id: string,
    officer: { uid: string; displayName: string; role: UserRole; remarks: string }
  ): Promise<FDRItem> {
    const fdr = await this.getFDRById(id);
    if (!fdr) throw new Error('FDR not found');

    const history = [...(fdr.renewalHistory || [])];
    if (history.length > 0) {
      const lastIndex = history.length - 1;
      const latest = history[lastIndex];
      latest.approvedAt = new Date().toISOString();
      latest.approvedBy = officer.displayName;

      const updated = await this.updateFDR(
        id,
        {
          status: 'verified',
          maturityDate: latest.newMaturityDate,
          amount: latest.newAmount,
          interestRate: latest.newInterestRate,
          fdrNumber: latest.newReceiptNumber || fdr.fdrNumber,
          renewalHistory: history,
        },
        {
          uid: officer.uid,
          displayName: officer.displayName,
          role: officer.role,
          actionNote: `FDR renewal approved. New maturity: ${latest.newMaturityDate}. Remarks: ${officer.remarks}`,
        }
      );

      await this.logAudit({
        fdrId: id,
        fdrNumber: fdr.fdrNumber,
        action: 'RENEWAL_APPROVED',
        performedBy: officer.uid,
        performedByName: officer.displayName,
        role: officer.role,
        details: `Approved renewal to ${latest.newMaturityDate}.`,
      });

      return updated;
    }

    throw new Error('No pending renewal record found to approve.');
  },

  // Submit Release / Refund Request
  async requestRelease(
    id: string,
    releaseData: {
      reason: string;
      nocReferenceNumber?: string;
      closureApprovalDate?: string;
      refundAccountDetails?: ReleaseDetails['refundAccountDetails'];
      document?: FDRDocument;
    },
    user: { uid: string; displayName: string; role: UserRole }
  ): Promise<FDRItem> {
    const fdr = await this.getFDRById(id);
    if (!fdr) throw new Error('FDR not found');

    const releaseDetails: ReleaseDetails = {
      reason: releaseData.reason,
      requestedAt: new Date().toISOString(),
      requestedBy: user.displayName,
      nocReferenceNumber: releaseData.nocReferenceNumber,
      closureApprovalDate: releaseData.closureApprovalDate,
      refundAccountDetails: releaseData.refundAccountDetails,
    };

    const updatedDocs = releaseData.document
      ? [...fdr.documents, releaseData.document]
      : fdr.documents;

    const updated = await this.updateFDR(
      id,
      {
        status: 'release_requested',
        releaseDetails,
        documents: updatedDocs,
      },
      {
        uid: user.uid,
        displayName: user.displayName,
        role: user.role,
        actionNote: `Refund/Release request submitted. NOC Ref: ${releaseData.nocReferenceNumber || 'N/A'}.`,
      }
    );

    await this.logAudit({
      fdrId: id,
      fdrNumber: fdr.fdrNumber,
      action: 'RELEASE_REQUESTED',
      performedBy: user.uid,
      performedByName: user.displayName,
      role: user.role,
      details: `Release request lodged. Reason: ${releaseData.reason}`,
    });

    return updated;
  },

  // Approve Release (AICTE Officer or Admin)
  async approveRelease(
    id: string,
    approver: { uid: string; displayName: string; role: UserRole; displedgeOrderNumber: string; remarks: string }
  ): Promise<FDRItem> {
    const fdr = await this.getFDRById(id);
    if (!fdr) throw new Error('FDR not found');

    const currentRelease = fdr.releaseDetails || {
      reason: 'Statutory completion of lock-in period',
      requestedAt: new Date().toISOString(),
      requestedBy: 'System',
    };

    const updatedRelease: ReleaseDetails = {
      ...currentRelease,
      approvedAt: new Date().toISOString(),
      approvedBy: approver.displayName,
      displedgeOrderNumber: approver.displedgeOrderNumber,
    };

    const updated = await this.updateFDR(
      id,
      {
        status: 'released',
        releaseDetails: updatedRelease,
      },
      {
        uid: approver.uid,
        displayName: approver.displayName,
        role: approver.role,
        actionNote: `Release sanctioned. Displedge Order No: ${approver.displedgeOrderNumber}. Remarks: ${approver.remarks}`,
      }
    );

    await this.logAudit({
      fdrId: id,
      fdrNumber: fdr.fdrNumber,
      action: 'RELEASE_SANCTIONED',
      performedBy: approver.uid,
      performedByName: approver.displayName,
      role: approver.role,
      details: `Displedge Order issued: ${approver.displedgeOrderNumber}. FDR released to institution.`,
    });

    return updated;
  },

  // Document upload helper
  async uploadDocument(
    file: File,
    docType: FDRDocument['type'],
    fdrId: string,
    userUid: string
  ): Promise<FDRDocument> {
    const docId = `doc-${Date.now()}`;
    let fileUrl = '';

    if (isFirebaseConfigured() && storage) {
      try {
        const storageRef = ref(storage, `fdr_documents/${fdrId}/${docId}_${file.name}`);
        const snap = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(snap.ref);
      } catch (e) {
        console.warn('Firebase storage upload failed, falling back to local object URL', e);
        fileUrl = URL.createObjectURL(file);
      }
    } else {
      // In Demo mode, we create an Object URL or simulated data URL
      fileUrl = URL.createObjectURL(file);
    }

    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    return {
      id: docId,
      name: file.name,
      type: docType,
      fileSize: formatBytes(file.size),
      fileUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userUid,
    };
  },

  // Audit Logging
  async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    };

    if (isFirebaseConfigured() && db) {
      const path = `audit_logs/${id}`;
      try {
        await setDoc(doc(db, 'audit_logs', id), fullEntry);
        return;
      } catch (error) {
        console.warn('Failed to write audit log to Firestore:', error);
      }
    }

    const logs = loadLocalLogs();
    logs.unshift(fullEntry);
    saveLocalLogs(logs);
  },

  // Get Audit Logs
  async getAuditLogs(fdrId?: string): Promise<AuditLogEntry[]> {
    if (isFirebaseConfigured() && db) {
      const path = 'audit_logs';
      try {
        let q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(150));
        if (fdrId) {
          q = query(collection(db, path), where('fdrId', '==', fdrId), orderBy('timestamp', 'desc'));
        }
        const snap = await getDocs(q);
        const results: AuditLogEntry[] = [];
        snap.forEach((d) => results.push({ ...(d.data() as AuditLogEntry), id: d.id }));
        return results;
      } catch (error) {
        console.warn('Failed to load audit logs from Firestore, reading local fallback', error);
      }
    }

    const logs = loadLocalLogs();
    if (fdrId) {
      return logs.filter((l) => l.fdrId === fdrId);
    }
    return logs;
  },

  // Seed sample FDR records to live Cloud Firestore under the active user with duplicate prevention
  async seedDemoToFirestore(author: { uid: string; displayName: string; role: UserRole }): Promise<SeedingResult> {
    const currentAuth = auth.currentUser;
    const cfg = getFirebaseEnvConfig();
    const result: SeedingResult = {
      success: false,
      addedCount: 0,
      skippedCount: 0,
      totalAttempted: INITIAL_MOCK_FDRS.length,
      databaseId: cfg.firestoreDatabaseId,
      projectId: cfg.projectId,
      userEmail: currentAuth?.email || 'N/A',
      userUid: author.uid,
      addedFdrNumbers: [],
      skippedFdrNumbers: [],
    };

    if (!isFirebaseConfigured() || !db || !currentAuth) {
      result.error = 'Firebase Authentication required: No valid signed-in user found. Please sign in with Google first.';
      result.errorCode = 'auth/unauthenticated';
      return result;
    }

    try {
      for (const item of INITIAL_MOCK_FDRS) {
        // 1. Check if document already exists by ID
        const docRef = doc(db, 'fdrs', item.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          result.skippedCount++;
          result.skippedFdrNumbers.push(item.fdrNumber);
          continue;
        }

        // 2. Check if an FDR with the same fdrNumber already exists for this author
        const q = query(
          collection(db, 'fdrs'),
          where('createdBy', '==', author.uid),
          where('fdrNumber', '==', item.fdrNumber),
          limit(1)
        );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          result.skippedCount++;
          result.skippedFdrNumbers.push(item.fdrNumber);
          continue;
        }

        // 3. Write new live record to Cloud Firestore without overwriting
        // Enforce RBAC: Institution users can only submit pending_verification records
        const isUserAdmin = currentAuth.email === 'devanshgupta52120@gmail.com' || author.role === 'admin';
        const liveStatus = isUserAdmin ? item.status : 'pending_verification';

        const liveItem: FDRItem = {
          ...item,
          id: item.id,
          status: liveStatus,
          createdBy: author.uid,
          createdByName: author.displayName,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(docRef, liveItem);
        result.addedCount++;
        result.addedFdrNumbers.push(item.fdrNumber);

        // 4. Record audit log entry in Cloud Firestore
        const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await setDoc(doc(db, 'audit_logs', logId), {
          id: logId,
          fdrId: liveItem.id,
          fdrNumber: liveItem.fdrNumber,
          action: 'SAMPLE_FDR_SEEDED',
          performedBy: author.uid,
          performedByName: author.displayName,
          role: author.role,
          details: `FDR record ₹${liveItem.amount.toLocaleString('en-IN')} (${liveItem.purpose}) seeded to Cloud Firestore.`,
          timestamp: new Date().toISOString(),
        });
      }

      result.success = true;
      return result;
    } catch (err: any) {
      console.error('[Firestore Seeding Error]', err);
      result.success = false;
      result.error = err instanceof Error ? err.message : String(err);
      result.errorCode = err?.code || 'firestore/write-failed';
      return result;
    }
  },

  // Reset demo data to default initial state
  resetDemoData(): void {
    localStorage.removeItem(LOCAL_STORAGE_FDR_KEY);
    localStorage.removeItem(LOCAL_STORAGE_LOG_KEY);
    saveLocalFDRs([...INITIAL_MOCK_FDRS]);
    saveLocalLogs([...INITIAL_AUDIT_LOGS]);
  },
};
