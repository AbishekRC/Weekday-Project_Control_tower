/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  InterviewRequest,
  ContactAttempt,
  AuditLogEntry,
  InternName,
  BlockerType,
  ImportSummaryReport,
  ViewTab,
  BookingEvidence,
} from '../types';
import { generateSeedData } from '../services/seedData';
import { parseWorkbookData } from '../services/excelService';
import { runAllOperationalTests, TestSuiteSummary } from '../services/testRunner';
import { calculateSla, getDynamicStatus } from '../utils/sla';

interface SchedulingContextType {
  requests: InterviewRequest[];
  contactAttempts: ContactAttempt[];
  auditLogs: AuditLogEntry[];
  virtualNow: Date;
  isTimeSimulated: boolean;
  timeOffsetHours: number;
  activeView: ViewTab;
  setActiveView: (view: ViewTab) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  matchingGlobalRequests: InterviewRequest[];
  testSuite: TestSuiteSummary | null;
  runTests: () => TestSuiteSummary;

  // Clock Actions
  advanceClock: (hours: number) => void;
  setVirtualClock: (date: Date) => void;
  resetClock: () => void;

  // Operational Actions
  logEmailOutreach: (requestId: string, template: string, notes?: string) => void;
  logCallAttempt: (
    requestId: string,
    callResult: NonNullable<ContactAttempt['callResult']>,
    notes?: string
  ) => void;
  logCandidateReply: (
    requestId: string,
    replyType: 'SCHEDULED' | 'WITHDRAW' | 'RESCHEDULE' | 'GENERAL',
    notes?: string
  ) => void;
  flagException: (requestId: string, blockerType: BlockerType, reason: string) => void;
  resolveException: (requestId: string, newCalendlyUrl?: string, notes?: string) => void;
  reassignRequest: (requestId: string, newAssignee: InternName, reason: string) => void;
  confirmBooking: (requestId: string, evidence?: Partial<BookingEvidence>) => void;
  cancelBooking: (requestId: string, reason: string) => void;
  withdrawCandidate: (requestId: string, reason: string) => void;

  // Excel & Storage Actions
  importExcelData: (fileBuffer: ArrayBuffer) => ImportSummaryReport;
  resetAllData: () => void;
}

const SchedulingContext = createContext<SchedulingContextType | null>(null);

const STORAGE_KEYS = {
  REQUESTS: 'weekday_sched_requests_v1',
  ATTEMPTS: 'weekday_sched_attempts_v1',
  AUDIT: 'weekday_sched_audit_v1',
  CLOCK_OFFSET: 'weekday_sched_clock_offset_v1',
};

export const SchedulingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewTab>('management');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLOCK_OFFSET);
    return saved ? parseFloat(saved) : 0;
  });

  const [testSuite, setTestSuite] = useState<TestSuiteSummary | null>(null);

  // Initialize or load from LocalStorage
  const [requests, setRequests] = useState<InterviewRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback to seeds
    }
    const seed = generateSeedData(new Date());
    return seed.requests;
  });

  const [contactAttempts, setContactAttempts] = useState<ContactAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    const seed = generateSeedData(new Date());
    return seed.contactAttempts;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    const seed = generateSeedData(new Date());
    return seed.auditLogs;
  });

  // Calculate current virtual time
  const virtualNow = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() + timeOffsetHours * 60 * 60 * 1000);
  }, [timeOffsetHours]);

  const isTimeSimulated = timeOffsetHours !== 0;

  // Filter requests matching global search across candidate details and row/interview IDs
  const matchingGlobalRequests = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const rowIdStr = r.sourceRowNumber.toString();
      return (
        r.id.toLowerCase().includes(q) ||
        r.candidateName.toLowerCase().includes(q) ||
        r.candidateEmail.toLowerCase().includes(q) ||
        r.candidatePhone.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.interviewerName.toLowerCase().includes(q) ||
        r.interviewRound.toLowerCase().includes(q) ||
        rowIdStr === q ||
        `#${rowIdStr}` === q ||
        `row ${rowIdStr}` === q ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [requests, globalSearchQuery]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(contactAttempts));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.CLOCK_OFFSET, String(timeOffsetHours));
    } catch (e) {
      console.error('Failed to sync to localStorage', e);
    }
  }, [requests, contactAttempts, auditLogs, timeOffsetHours]);

  // Run tests on mount once for initial health verification
  useEffect(() => {
    const summary = runAllOperationalTests();
    setTestSuite(summary);
  }, []);

  const runTests = useCallback(() => {
    const summary = runAllOperationalTests();
    setTestSuite(summary);
    return summary;
  }, []);

  // Clock methods
  const advanceClock = useCallback((hours: number) => {
    setTimeOffsetHours((prev) => prev + hours);
  }, []);

  const setVirtualClock = useCallback((targetDate: Date) => {
    const diffHours = (targetDate.getTime() - Date.now()) / (1000 * 60 * 60);
    setTimeOffsetHours(diffHours);
  }, []);

  const resetClock = useCallback(() => {
    setTimeOffsetHours(0);
  }, []);

  // Operational methods
  const logEmailOutreach = useCallback(
    (requestId: string, template: string, notes?: string) => {
      const nowStr = virtualNow.toISOString();
      const nextDue = new Date(virtualNow.getTime() + 4 * 60 * 60 * 1000).toISOString();

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            status: 'OUTREACH_SENT',
            lastContactAt: nowStr,
            lastContactChannel: 'EMAIL',
            nextAction: 'Follow-up Reminder #1 (Email)',
            nextActionDueAt: nextDue,
            notes: notes ? `${r.notes ? r.notes + ' | ' : ''}${notes}` : r.notes,
          };
        })
      );

      const targetReq = requests.find((r) => r.id === requestId);
      const actor = targetReq ? targetReq.assignedTo : 'Ram';

      setContactAttempts((prev) => [
        {
          id: `attempt-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          channel: 'EMAIL',
          performedBy: actor,
          templateUsed: template,
          summary: `Sent "${template}" outreach email`,
          details: notes,
        },
        ...prev,
      ]);

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor,
          action: 'EMAIL_OUTREACH_LOGGED',
          fieldChanged: 'status',
          previousValue: targetReq?.status,
          newValue: 'OUTREACH_SENT',
          reason: `Outreach email dispatched using "${template}". Follow-up #1 scheduled for +4h.`,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const logCallAttempt = useCallback(
    (
      requestId: string,
      callResult: NonNullable<ContactAttempt['callResult']>,
      notes?: string
    ) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      const actor = targetReq ? targetReq.assignedTo : 'Ram';

      let nextAction = 'Second voice call attempt or SMS reminder';
      let nextDue = new Date(virtualNow.getTime() + 3 * 60 * 60 * 1000).toISOString();

      if (callResult === 'SCHEDULED_ON_CALL') {
        nextAction = 'Candidate booked slot on call. Awaiting verified confirmation.';
      } else if (callResult === 'WRONG_NUMBER') {
        nextAction = 'Flagged: Invalid candidate phone number. Contact partner.';
      }

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            lastContactAt: nowStr,
            lastContactChannel: 'CALL',
            nextAction,
            nextActionDueAt: nextDue,
            notes: notes ? `${r.notes ? r.notes + ' | ' : ''}Call: ${callResult}` : r.notes,
          };
        })
      );

      setContactAttempts((prev) => [
        {
          id: `attempt-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          channel: 'CALL',
          performedBy: actor,
          callResult,
          summary: `Phone call attempt: ${callResult}`,
          details: notes,
        },
        ...prev,
      ]);

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor,
          action: 'CALL_ATTEMPT_LOGGED',
          fieldChanged: 'lastContactAt',
          reason: `Call outcome: ${callResult}. ${notes || ''}`,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const logCandidateReply = useCallback(
    (
      requestId: string,
      replyType: 'SCHEDULED' | 'WITHDRAW' | 'RESCHEDULE' | 'GENERAL',
      notes?: string
    ) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      const actor = targetReq ? targetReq.assignedTo : 'Ram';

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          if (replyType === 'WITHDRAW') {
            return {
              ...r,
              status: 'WITHDRAWN',
              nextAction: 'Candidate opted out / withdrawn from process',
              nextActionDueAt: undefined,
              notes: notes || 'Candidate requested withdrawal',
            };
          }
          return {
            ...r,
            nextAction: `Candidate replied: ${replyType}. ${notes || ''}`,
            notes: notes ? `${r.notes ? r.notes + ' | ' : ''}Reply: ${notes}` : r.notes,
          };
        })
      );

      setContactAttempts((prev) => [
        {
          id: `attempt-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          channel: 'REPLY',
          performedBy: actor,
          summary: `Candidate reply: ${replyType}`,
          details: notes,
        },
        ...prev,
      ]);

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor,
          action: 'CANDIDATE_REPLY_RECORDED',
          reason: `Candidate response: ${replyType}. ${notes || ''}`,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const flagException = useCallback(
    (requestId: string, blockerType: BlockerType, reason: string) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      const actor = targetReq ? targetReq.assignedTo : 'Ram';

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            status: 'BLOCKED_EXCEPTION',
            priority: 'HIGH',
            blockerType,
            blockerReason: reason,
            nextAction: `Exception Active (${blockerType}): ${reason}. Outreach paused.`,
            nextActionDueAt: undefined,
          };
        })
      );

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor,
          action: 'EXCEPTION_FLAGGED',
          fieldChanged: 'status',
          previousValue: targetReq?.status,
          newValue: 'BLOCKED_EXCEPTION',
          reason: `Blocker [${blockerType}]: ${reason}`,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const resolveException = useCallback(
    (requestId: string, newCalendlyUrl?: string, notes?: string) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      const actor = targetReq ? targetReq.assignedTo : 'Ram';

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            status: 'OUTREACH_SENT',
            calendlyUrl: newCalendlyUrl || r.calendlyUrl,
            blockerType: undefined,
            blockerReason: undefined,
            nextAction: 'Blocker resolved. Send refreshed outreach to candidate.',
            nextActionDueAt: new Date(virtualNow.getTime() + 60 * 60 * 1000).toISOString(),
          };
        })
      );

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor,
          action: 'EXCEPTION_RESOLVED',
          fieldChanged: 'status',
          previousValue: 'BLOCKED_EXCEPTION',
          newValue: 'OUTREACH_SENT',
          reason: notes || 'Blocker resolved by partner coordinator.',
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const reassignRequest = useCallback(
    (requestId: string, newAssignee: InternName, reason: string) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      if (!targetReq) return;

      const oldAssignee = targetReq.assignedTo;
      if (oldAssignee === newAssignee) return;

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          // IMPORTANT: originalCreatedAt and SLA deadline are strictly preserved!
          return {
            ...r,
            assignedTo: newAssignee,
            notes: `${r.notes ? r.notes + ' | ' : ''}Reassigned from ${oldAssignee} to ${newAssignee}: ${reason}`,
          };
        })
      );

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor: 'MANAGER',
          action: 'REQUEST_REASSIGNED',
          fieldChanged: 'assignedTo',
          previousValue: oldAssignee,
          newValue: newAssignee,
          reason: `Reassigned from ${oldAssignee} to ${newAssignee}. Original SLA clock strictly preserved. Reason: ${reason}`,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const confirmBooking = useCallback(
    (requestId: string, evidence?: Partial<BookingEvidence>) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      if (!targetReq) return;

      const verifiedEvidence: BookingEvidence = {
        bookingId: evidence?.bookingId || `cal-evt-${Date.now().toString(36)}`,
        bookedSlotTime:
          evidence?.bookedSlotTime ||
          new Date(virtualNow.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        interviewer: evidence?.interviewer || targetReq.interviewerName,
        candidateEmail: evidence?.candidateEmail || targetReq.candidateEmail,
        confirmedAt: evidence?.confirmedAt || nowStr,
        source: evidence?.source || 'CALENDLY_SIMULATION',
        isSimulated: evidence?.isSimulated ?? true,
      };

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            status: 'BOOKED',
            bookingStatus: 'BOOKED',
            bookingVerifiedAt: nowStr,
            bookingEvidence: verifiedEvidence,
            nextAction: `Booking Confirmed [Slot: ${new Date(verifiedEvidence.bookedSlotTime).toLocaleDateString()}]. Pending follow-ups voided.`,
            nextActionDueAt: undefined, // Cancel all follow-ups
          };
        })
      );

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor: targetReq.assignedTo,
          action: 'BOOKING_VERIFIED',
          fieldChanged: 'bookingStatus',
          previousValue: targetReq.bookingStatus,
          newValue: 'BOOKED',
          reason: `Verified booking confirmed via ${verifiedEvidence.source} [Booking ID: ${verifiedEvidence.bookingId}]. Pending follow-ups cancelled.`,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const cancelBooking = useCallback(
    (requestId: string, reason: string) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      if (!targetReq) return;

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            status: 'CANCELLED',
            bookingStatus: 'CANCELLED',
            nextAction: `Booking was cancelled: ${reason}. Awaiting rescheduling decision.`,
            nextActionDueAt: undefined,
          };
        })
      );

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor: targetReq.assignedTo,
          action: 'BOOKING_CANCELLED',
          fieldChanged: 'bookingStatus',
          previousValue: 'BOOKED',
          newValue: 'CANCELLED',
          reason,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const withdrawCandidate = useCallback(
    (requestId: string, reason: string) => {
      const nowStr = virtualNow.toISOString();
      const targetReq = requests.find((r) => r.id === requestId);
      if (!targetReq) return;

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            status: 'WITHDRAWN',
            nextAction: `Candidate withdrawn: ${reason}. Outreach stopped.`,
            nextActionDueAt: undefined,
          };
        })
      );

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          requestId,
          timestamp: nowStr,
          actor: targetReq.assignedTo,
          action: 'CANDIDATE_WITHDRAWN',
          fieldChanged: 'status',
          previousValue: targetReq.status,
          newValue: 'WITHDRAWN',
          reason,
        },
        ...prev,
      ]);
    },
    [virtualNow, requests]
  );

  const importExcelData = useCallback(
    (fileBuffer: ArrayBuffer): ImportSummaryReport => {
      const { newRequests, report } = parseWorkbookData(fileBuffer, requests);

      if (newRequests.length > 0) {
        // When the app still contains only seed/demo records, treat the workbook
        // import as the working dataset instead of appending it to the 26 demo rows.
        const currentDataIsOnlyDemo = requests.length > 0 && requests.every((r) => r.isDemoData);
        if (currentDataIsOnlyDemo) {
          setRequests(newRequests);
          setContactAttempts([]);
          setAuditLogs([]);
        } else {
          setRequests((prev) => [...prev, ...newRequests]);
        }

        // Add audit logs for imported items
        const newAuditEntries: AuditLogEntry[] = newRequests.map((r) => ({
          id: `audit-${r.id}-import`,
          requestId: r.id,
          timestamp: new Date().toISOString(),
          actor: 'SYSTEM',
          action: 'REQUEST_IMPORTED',
          fieldChanged: 'status',
          newValue: r.status,
          reason: `Ingested from Excel upload. Source row #${r.sourceRowNumber}, assigned to ${r.assignedTo}.`,
        }));

        setAuditLogs((prev) => [...newAuditEntries, ...prev]);
      }

      return report;
    },
    [requests]
  );

  const resetAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.CLOCK_OFFSET);

    const fresh = generateSeedData(new Date());
    setRequests(fresh.requests);
    setContactAttempts(fresh.contactAttempts);
    setAuditLogs(fresh.auditLogs);
    setTimeOffsetHours(0);
    setSelectedRequestId(null);
    setGlobalSearchQuery('');
  }, []);

  const value = {
    requests,
    contactAttempts,
    auditLogs,
    virtualNow,
    isTimeSimulated,
    timeOffsetHours,
    activeView,
    setActiveView,
    selectedRequestId,
    setSelectedRequestId,
    globalSearchQuery,
    setGlobalSearchQuery,
    matchingGlobalRequests,
    testSuite,
    runTests,
    advanceClock,
    setVirtualClock,
    resetClock,
    logEmailOutreach,
    logCallAttempt,
    logCandidateReply,
    flagException,
    resolveException,
    reassignRequest,
    confirmBooking,
    cancelBooking,
    withdrawCandidate,
    importExcelData,
    resetAllData,
  };

  return <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>;
};

export function useScheduling(): SchedulingContextType {
  const context = useContext(SchedulingContext);
  if (!context) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  return context;
}
