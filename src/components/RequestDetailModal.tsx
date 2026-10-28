/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { calculateSla, getSlaBadgeClass } from '../utils/sla';
import {
  X,
  Clock,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  History,
  FileText,
} from 'lucide-react';

interface RequestDetailModalProps {
  requestId: string;
  onClose: () => void;
  onOpenActions: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  requestId,
  onClose,
  onOpenActions,
}) => {
  const { requests, contactAttempts, auditLogs, virtualNow } = useScheduling();

  const request = requests.find((r) => r.id === requestId);
  if (!request) return null;

  const sla = calculateSla(request.originalCreatedAt, virtualNow);
  const badgeStyle = getSlaBadgeClass(sla.band);

  const relatedAttempts = contactAttempts.filter((a) => a.requestId === requestId);
  const relatedAuditLogs = auditLogs.filter((l) => l.requestId === requestId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl text-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-medium text-cyan-400">
                Source Row #{request.sourceRowNumber} • ID: {request.id}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${badgeStyle.badge}`}>
                {sla.formattedRemaining} ({sla.band})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {request.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {request.candidateName}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Role/Stage: <strong className="text-slate-200">{request.interviewRound}</strong> at{' '}
              <strong className="text-white">{request.company}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenActions}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition"
            >
              Take Action
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Candidate & Contact */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Candidate Info
              </div>
              <div>
                <span className="text-slate-400">Email:</span>{' '}
                <span className="text-slate-200 font-mono">{request.candidateEmail}</span>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>{' '}
                <span className="text-slate-200 font-mono">{request.candidatePhone}</span>
              </div>
              <div>
                <span className="text-slate-400">Assigned To:</span>{' '}
                <strong className="text-cyan-300">{request.assignedTo}</strong>
              </div>
            </div>

            {/* Company & Interviewer */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Building className="w-3.5 h-3.5 text-cyan-400" /> Company & Stage
              </div>
              <div>
                <span className="text-slate-400">Company:</span>{' '}
                <strong className="text-white">{request.company}</strong>
              </div>
              <div>
                <span className="text-slate-400">Interviewer:</span>{' '}
                <span className="text-slate-200">{request.interviewerName}</span>
              </div>
              <div>
                <span className="text-slate-400">Priority:</span>{' '}
                <span className="font-semibold text-amber-400">{request.priority}</span>
              </div>
            </div>

            {/* SLA Clock Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> 24h SLA Countdown
              </div>
              <div>
                <span className="text-slate-400">Created:</span>{' '}
                <span className="text-slate-200 font-mono text-[11px]">
                  {new Date(request.originalCreatedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Deadline:</span>{' '}
                <span className="text-slate-200 font-mono text-[11px]">
                  {new Date(sla.deadlineIso).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">SLA Status:</span>{' '}
                <strong className={badgeStyle.text}>{sla.formattedRemaining}</strong>
              </div>
            </div>
          </div>

          {/* Actionable Next Step Card */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">
                Actionable Next Step
              </div>
              <div className="text-sm font-semibold text-white">{request.nextAction}</div>
              {request.nextActionDueAt && (
                <div className="text-slate-400 text-[11px]">
                  Target execution time:{' '}
                  <span className="font-mono text-slate-300">
                    {new Date(request.nextActionDueAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Calendly Link Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="truncate mr-4">
              <span className="text-slate-400 mr-2 font-medium">Candidate Calendly Link:</span>
              <span className="text-cyan-400 font-mono truncate">{request.calendlyUrl}</span>
            </div>
            <a
              href={request.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition shrink-0"
            >
              <span>Test Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Booking Evidence (if booked) */}
          {request.bookingEvidence && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Verified Booking Evidence
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono">
                <div>Booking ID: <strong className="text-white">{request.bookingEvidence.bookingId}</strong></div>
                <div>Slot: <strong className="text-white">{new Date(request.bookingEvidence.bookedSlotTime).toLocaleString()}</strong></div>
                <div>Confirmed At: <span className="text-slate-400">{new Date(request.bookingEvidence.confirmedAt).toLocaleString()}</span></div>
                <div>Source: <span className="text-emerald-300">{request.bookingEvidence.source}</span></div>
              </div>
            </div>
          )}

          {/* Active Blocker (if blocked) */}
          {request.blockerReason && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <ShieldAlert className="w-4 h-4" /> Active Exception / Blocker ({request.blockerType})
              </div>
              <p className="text-rose-200">{request.blockerReason}</p>
            </div>
          )}

          {/* Contact Attempts History */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Contact History ({relatedAttempts.length})
            </h3>
            {relatedAttempts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No contact attempts recorded yet. Click &quot;Take Action&quot; to send initial outreach.
              </div>
            ) : (
              <div className="space-y-2">
                {relatedAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{attempt.summary}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          {attempt.channel}
                        </span>
                        {attempt.callResult && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                            {attempt.callResult}
                          </span>
                        )}
                      </div>
                      {attempt.details && (
                        <p className="text-slate-400 text-[11px] leading-relaxed">{attempt.details}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-slate-300 text-[11px] font-medium">{attempt.performedBy}</div>
                      <div className="text-slate-400 text-[10px] font-mono">
                        {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Log Stream */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyan-400" /> Audit Log Trail ({relatedAuditLogs.length})
            </h3>
            <div className="space-y-1.5 font-mono text-[11px]">
              {relatedAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-900 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="text-cyan-400 font-semibold">{log.action}:</span>{' '}
                    <span className="text-slate-300">{log.reason || 'Updated state'}</span>
                  </div>
                  <div className="text-slate-400 shrink-0 text-[10px]">
                    {log.actor} • {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
