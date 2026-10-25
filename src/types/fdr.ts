export type UserRole = 'institution' | 'officer' | 'admin';

export type FDRStatus =
  | 'draft'
  | 'pending_verification'
  | 'under_review'
  | 'verified'
  | 'discrepancy_reported'
  | 'renewal_requested'
  | 'renewed'
  | 'release_requested'
  | 'released'
  | 'encashed'
  | 'rejected';

export type FDRPurpose =
  | 'New Institute Approval'
  | 'Course Expansion'
  | 'Increase in Intake'
  | 'Change of Site'
  | 'Mandatory Endowment Fund'
  | 'Post-Graduate Program Security'
  | 'Disciplinary Compliance';

export type DocumentType =
  | 'fdr_receipt'
  | 'bank_pledge_letter'
  | 'board_resolution'
  | 'noc_certificate'
  | 'renewal_receipt'
  | 'release_order'
  | 'other';

export interface FDRDocument {
  id: string;
  name: string;
  type: DocumentType;
  fileSize: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

export interface VerificationDetails {
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  officerRemarks?: string;
  bankConfirmationReceived?: boolean;
  physicalReceiptVerified?: boolean;
  discrepancyReasons?: string[];
}

export interface RenewalRecord {
  id: string;
  previousMaturityDate: string;
  newMaturityDate: string;
  newAmount: number;
  newInterestRate: number;
  newReceiptNumber?: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  documentUrl?: string;
  remarks?: string;
}

export interface ReleaseDetails {
  reason: string;
  requestedAt: string;
  requestedBy: string;
  nocReferenceNumber?: string;
  closureApprovalDate?: string;
  approvedAt?: string;
  approvedBy?: string;
  displedgeOrderNumber?: string;
  refundAccountDetails?: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  rejectionReason?: string;
}

export interface FDRItem {
  id: string;
  fdrNumber: string;
  institutionId: string; // AICTE Permanent Institute ID (PID)
  institutionName: string;
  region: string; // e.g. North, North-West, South, West, Central, East
  state: string;
  city: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  accountNumber: string; // Joint FDR account number
  amount: number; // in INR
  depositDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  interestRate: number; // e.g. 7.25%
  tenureMonths: number;
  jointHolderName: string; // "Regional Officer, AICTE"
  purpose: FDRPurpose;
  status: FDRStatus;
  documents: FDRDocument[];
  verification?: VerificationDetails;
  renewalHistory?: RenewalRecord[];
  releaseDetails?: ReleaseDetails;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
}

export interface AuditLogEntry {
  id: string;
  fdrId?: string;
  fdrNumber?: string;
  action: string;
  performedBy: string;
  performedByName: string;
  role: UserRole;
  details: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
  region?: string;
  designation?: string;
  phone?: string;
}

export interface DashboardStats {
  totalFDRs: number;
  totalPledgedAmount: number;
  verifiedFDRs: number;
  pendingReviewFDRs: number;
  expiringIn30Days: number;
  expiringIn90Days: number;
  expiredFDRs: number;
  releasedFDRs: number;
}

export interface SeedingResult {
  success: boolean;
  addedCount: number;
  skippedCount: number;
  totalAttempted: number;
  databaseId: string;
  projectId: string;
  userEmail: string;
  userUid: string;
  addedFdrNumbers: string[];
  skippedFdrNumbers: string[];
  error?: string;
  errorCode?: string;
}

