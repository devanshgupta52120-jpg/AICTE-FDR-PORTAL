# AICTE FDR Management Portal - Firebase Integration & Deployment Guide

This document provides full instructions for provisioning, configuring, and deploying Firebase Authentication, Cloud Firestore, and Cloud Storage for the AICTE FDR Management Portal.

---

## 1. Project & Database Identification

- **GCP / Firebase Project ID**: `gen-lang-client-0423881117`
- **Connected Firestore Database**: `ai-studio-aictefdrmanageme-6d482198-9618-4626-b21d-d57291c17023`
- **Storage Bucket**: `gen-lang-client-0423881117.firebasestorage.app`
- **Direct Console URL**:
  `https://console.firebase.google.com/project/gen-lang-client-0423881117/firestore/databases/ai-studio-aictefdrmanageme-6d482198-9618-4626-b21d-d57291c17023/rules`

---

## 2. Architecture & Security Model

The AICTE FDR Portal uses **Attribute-Based Access Control (ABAC)** and **Role-Based Access Control (RBAC)** across three distinct persona tiers:

1. **Institution User (`institution`)**:
   - Represents the Principal or Registrar of an AICTE-approved engineering college or polytechnic.
   - Can submit new Fixed Deposit Receipts (FDR) pledged in favor of AICTE.
   - Status on creation is restricted by server rules to `'draft'` or `'pending_verification'`.
   - Cannot self-verify, self-approve, or change FDR status to `'verified'` or `'renewed'`.
   - Can request renewal (`status == 'renewal_requested'`) or release (`status == 'release_requested'`).
   - Querying is constrained to records created by their own authenticated UID (`createdBy == request.auth.uid`).

2. **AICTE Regional Officer (`officer`)**:
   - Authorized officers across AICTE Regional Offices.
   - Scrutinizes submitted FDRs, verifies bank confirmation letters, validates joint lien endorsements, and marks verification status (`'verified'`, `'discrepancy_reported'`, `'rejected'`).
   - Approves term renewals and sanctions displedge / release orders.

3. **AICTE Administrator (`admin`)**:
   - Server-enforced via trusted allowlist (`devanshgupta52120@gmail.com`, `admin@aicte-india.org`) and `/admins/{uid}` collection.
   - Global supervisory visibility, final displedge sanction authority, immutable audit trail inspection, and system configuration.

---

## 3. Server-Enforced Firestore Security Rules

The active rules in `firestore.rules` enforce:
- **Default Deny All Catch-all**: Unmatched paths reject all operations.
- **Identity Integrity**: `createdBy` and `performedBy` must match the authenticated `request.auth.uid`.
- **Anti-Self-Approval**: Institution users can never set `status` to `'verified'` or modify verification blocks.
- **Append-Only Audit Trail**: Records in `audit_logs` can be written by authenticated users but never updated or deleted (`allow update, delete: if false`).

---

## 4. Manual Deployment via Firebase Console (if needed)

If you ever wish to inspect or update the rules directly in the Firebase Console:

1. Navigate to:
   `https://console.firebase.google.com/project/gen-lang-client-0423881117/firestore`
2. Select database: **`ai-studio-aictefdrmanageme-6d482198-9618-4626-b21d-d57291c17023`** (using the database selector dropdown at the top).
3. Click the **Rules** tab.
4. Copy the entire contents of `/firestore.rules` from this repository.
5. Paste into the editor and click **Publish**.

---

## 5. Deployment via Firebase CLI

Run in the project root:

```bash
# Deploys rules and indexes to both the custom database and (default)
firebase deploy --only firestore:rules,firestore:indexes
```
