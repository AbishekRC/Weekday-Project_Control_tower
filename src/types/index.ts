/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InternName = 'Ram' | 'Shyam';

export type RequestStatus =
  | 'UNCONTACTED'
  | 'OUTREACH_SENT'
  | 'FOLLOW_UP_DUE'
  | 'BOOKED'
  | 'AT_RISK'
  | 'OVERDUE'
  | 'BLOCKED_EXCEPTION'
  | 'WITHDRAWN'
  | 'CANCELLED';

export type RequestPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export type SlaBand = 'GREEN' | 'AMBER' | 'RED' | 'OVERDUE';

export interface BookingEvidence {
  bookingId: string;
  bookedSlotTime: string;
  interviewer: string;
  candidateEmail: string;
  confirmedAt: string;
  source: 'CALENDLY_SIMULATION' | 'CALENDLY_WEBHOOK' | 'MANUAL_VERIFIED';
  isSimulated: boolean;
}

export type BlockerType =
  | 'INVALID_LINK'
  | 'NO_SLOTS'
  | 'INVALID_CONTACT'
  | 'CANDIDATE_UNRESPONSIVE'
  | 'OTHER';

export interface InterviewRequest {
  id: string;
  sourceRowNumber: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  company: string;
  interviewerName: string;
  interviewerEmail: string;
  interviewRound: string;
  calendlyUrl: string;
  originalCreatedAt: string; // ISO 8601 string
  assignedTo: InternName;
  status: RequestStatus;
  priority: RequestPriority;
  lastContactAt?: string;
  lastContactChannel?: 'EMAIL' | 'CALL' | 'SMS' | 'REPLY';
  nextAction: string;
  nextActionDueAt?: string;
  bookingStatus: 'NOT_BOOKED' | 'BOOKED' | 'CANCELLED';
  bookingVerifiedAt?: string;
  bookingEvidence?: BookingEvidence;
  blockerReason?: string;
  blockerType?: BlockerType;
  notes?: string;
  isDemoData?: boolean;
}

export interface ContactAttempt {
  id: string;
  requestId: string;
  timestamp: string;
  channel: 'EMAIL' | 'CALL' | 'REPLY' | 'SMS' | 'INTERNAL_NOTE';
  performedBy: InternName | 'MANAGER' | 'SYSTEM';
  callResult?: 'CONNECTED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'SCHEDULED_ON_CALL';
  templateUsed?: string;
  summary: string;
  details?: string;
}

export interface AuditLogEntry {
  id: string;
  requestId: string;
  timestamp: string;
  actor: InternName | 'MANAGER' | 'SYSTEM';
  action: string;
  fieldChanged?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}

export interface SlaCalculation {
  timeRemainingMs: number;
  hoursRemaining: number;
  formattedRemaining: string;
  band: SlaBand;
  isMature: boolean; // age >= 24h
  isBreached: boolean;
  deadlineIso: string;
}

export interface ImportSummaryReport {
  totalRowsRead: number;
  importedCount: number;
  duplicatesSkipped: number;
  rejectedCount: number;
  warnings: string[];
  assignedRam: number;
  assignedShyam: number;
  timestamp: string;
  sheetNamesDetected?: string[];
  targetSheetName?: string;
  detectedHeaders?: string[];
}

export type ViewTab =
  | 'management'
  | 'tracker'
  | 'ram'
  | 'shyam'
  | 'demo'
  | 'sop'
  | 'test_plan';
