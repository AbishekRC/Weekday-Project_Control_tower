/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { calculateSla, getDynamicStatus, getSlaBadgeClass } from '../utils/sla';
import { InterviewRequest, InternName } from '../types';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  CalendarCheck,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Send,
  Calendar,
  CheckCircle2,
  Sparkles,
  Search,
} from 'lucide-react';

interface InternWorkbenchProps {
  internName: InternName;
  onOpenActions: (request: InterviewRequest) => void;
  onOpenDetails: (request: InterviewRequest) => void;
}

type QueueCategory =
  | 'ALL_ACTIVE'
  | 'ACTION_NOW'
  | 'FOLLOW_UP_DUE'
  | 'APPROACHING_SLA'
  | 'OVERDUE'
  | 'AWAITING_BOOKING'
  | 'EXCEPTIONS'
  | 'COMPLETED';

export const InternWorkbench: React.FC<InternWorkbenchProps> = ({
  internName,
  onOpenActions,
  onOpenDetails,
}) => {
  const { requests, virtualNow, globalSearchQuery, setGlobalSearchQuery } = useScheduling();
  const [selectedQueue, setSelectedQueue] = useState<QueueCategory>('ALL_ACTIVE');

  // Filter requests for this specific intern (and globalSearchQuery if active)
  const internRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.assignedTo !== internName) return false;
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase().trim();
        const rowIdStr = r.sourceRowNumber.toString();
        const matches =
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
          r.status.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, internName, globalSearchQuery]);

  // Categorize queues
  const categorized = useMemo(() => {
    const actionNow: InterviewRequest[] = [];
    const followUpsDue: InterviewRequest[] = [];
    const approachingSla: InterviewRequest[] = [];
    const overdue: InterviewRequest[] = [];
    const awaitingBooking: InterviewRequest[] = [];
    const exceptions: InterviewRequest[] = [];
    const completed: InterviewRequest[] = [];

    internRequests.forEach((req) => {
      const status = getDynamicStatus(req, virtualNow);
      const sla = calculateSla(req.originalCreatedAt, virtualNow);

      if (req.bookingStatus === 'BOOKED') {
        completed.push(req);
        return;
      }

      if (status === 'BLOCKED_EXCEPTION' || Boolean(req.blockerReason)) {
        exceptions.push(req);
        return;
      }

      if (sla.isBreached || status === 'OVERDUE') {
        overdue.push(req);
        return;
      }

      if (status === 'UNCONTACTED') {
        actionNow.push(req);
      } else if (status === 'FOLLOW_UP_DUE') {
        followUpsDue.push(req);
      } else if (sla.hoursRemaining < 12) {
        approachingSla.push(req);
      } else {
        awaitingBooking.push(req);
      }
    });

    const allActive = [
      ...actionNow,
      ...followUpsDue,
      ...approachingSla,
      ...overdue,
      ...awaitingBooking,
      ...exceptions,
    ];

    return {
      allActive,
      actionNow,
      followUpsDue,
      approachingSla,
      overdue,
      awaitingBooking,
      exceptions,
      completed,
    };
  }, [internRequests, virtualNow]);

  const activeQueueList = useMemo(() => {
    switch (selectedQueue) {
      case 'ALL_ACTIVE':
        return categorized.allActive;
      case 'ACTION_NOW':
        return categorized.actionNow;
      case 'FOLLOW_UP_DUE':
        return categorized.followUpsDue;
      case 'APPROACHING_SLA':
        return categorized.approachingSla;
      case 'OVERDUE':
        return categorized.overdue;
      case 'AWAITING_BOOKING':
        return categorized.awaitingBooking;
      case 'EXCEPTIONS':
        return categorized.exceptions;
      case 'COMPLETED':
        return categorized.completed;
    }
  }, [selectedQueue, categorized]);

  const queueTabs: Array<{
    id: QueueCategory;
    label: string;
    count: number;
    color: string;
    alert?: boolean;
  }> = [
    {
      id: 'ALL_ACTIVE',
      label: 'All Active Tasks',
      count: categorized.allActive.length,
      color: 'text-white',
    },
    {
      id: 'ACTION_NOW',
      label: 'Action Now (New)',
      count: categorized.actionNow.length,
      color: 'text-amber-400',
      alert: categorized.actionNow.length > 0,
    },
    {
      id: 'FOLLOW_UP_DUE',
      label: 'Follow-ups Due',
      count: categorized.followUpsDue.length,
      color: 'text-cyan-400',
      alert: categorized.followUpsDue.length > 0,
    },
    {
      id: 'APPROACHING_SLA',
      label: 'Approaching SLA (<12h)',
      count: categorized.approachingSla.length,
      color: 'text-rose-400',
      alert: categorized.approachingSla.length > 0,
    },
    {
      id: 'OVERDUE',
      label: 'Overdue (>24h)',
      count: categorized.overdue.length,
      color: 'text-red-400',
      alert: categorized.overdue.length > 0,
    },
    {
      id: 'AWAITING_BOOKING',
      label: 'Awaiting Booking',
      count: categorized.awaitingBooking.length,
      color: 'text-slate-300',
    },
    {
      id: 'EXCEPTIONS',
      label: 'Active Blockers',
      count: categorized.exceptions.length,
      color: 'text-rose-300',
    },
    {
      id: 'COMPLETED',
      label: 'Booked / Won',
      count: categorized.completed.length,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                internName === 'Ram'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              Assigned Operations Intern: {internName}
            </span>
            <span className="text-xs text-slate-400">
              Deterministic 50/50 Allocation
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {internName}&apos;s Scheduling Workbench
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Prioritized task queues designed for fast execution. Always take action on <strong>Action Now</strong> and <strong>Follow-ups Due</strong> first to maintain 80%+ 24h SLA compliance.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
          <div className="text-center">
            <div className="text-xs text-slate-400">Total Assigned</div>
            <div className="text-xl font-black text-white">{internRequests.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-xs text-slate-400">Action Required</div>
            <div className="text-xl font-black text-amber-400">
              {categorized.actionNow.length + categorized.followUpsDue.length}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-xs text-slate-400">Booked</div>
            <div className="text-xl font-black text-emerald-400">
              {categorized.completed.length}
            </div>
          </div>
        </div>
      </div>

      {/* Active Global Search Indicator */}
      {globalSearchQuery && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Filtering {internName}&apos;s tasks matching global search: <strong>&quot;{globalSearchQuery}&quot;</strong> ({internRequests.length} matching)
            </span>
          </div>
          <button
            onClick={() => setGlobalSearchQuery('')}
            className="text-cyan-400 hover:text-white underline font-semibold text-[11px]"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Task Queue Selector Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {queueTabs.map((tab) => {
          const isActive = selectedQueue === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedQueue(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                  tab.alert
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-950 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Request Cards Grid */}
      {activeQueueList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-base">Queue is completely clear!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No candidate requests currently in &quot;{queueTabs.find((t) => t.id === selectedQueue)?.label}&quot;. Great work keeping up with SLA!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeQueueList.map((req) => {
            const sla = calculateSla(req.originalCreatedAt, virtualNow);
            const badgeStyle = getSlaBadgeClass(sla.band);
            const dynamicStatus = getDynamicStatus(req, virtualNow);

            return (
              <div
                key={req.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition hover:border-slate-700 flex flex-col justify-between space-y-4 shadow-lg ${
                  sla.band === 'RED'
                    ? 'border-rose-900/60 bg-gradient-to-br from-slate-900 to-rose-950/20'
                    : sla.band === 'OVERDUE'
                    ? 'border-red-600/70 bg-gradient-to-br from-slate-900 to-red-950/40'
                    : 'border-slate-800'
                }`}
              >
                {/* Card Top: Candidate + SLA Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-medium text-cyan-400">
                          #{req.sourceRowNumber} • {req.company}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                          {dynamicStatus}
                        </span>
                      </div>
                      <h3
                        onClick={() => onOpenDetails(req)}
                        className="font-bold text-white text-base hover:text-cyan-300 cursor-pointer transition"
                      >
                        {req.candidateName}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {req.interviewRound}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeStyle.badge}`}
                      >
                        {sla.formattedRemaining}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Deadline: {new Date(sla.deadlineIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Pills */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="font-mono">{req.candidateEmail}</span>
                    <span>•</span>
                    <span className="font-mono">{req.candidatePhone}</span>
                  </div>

                  {/* Actionable Next Step Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                      Next Prescribed Action:
                    </div>
                    <div className="font-semibold text-white">{req.nextAction}</div>
                    {req.lastContactAt && (
                      <div className="text-slate-400 text-[10px]">
                        Last contact attempt:{' '}
                        {new Date(req.lastContactAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({req.lastContactChannel})
                      </div>
                    )}
                  </div>

                  {/* Active Blocker Alert */}
                  {req.blockerReason && (
                    <div className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200">
                      <strong>Blocker:</strong> {req.blockerReason}
                    </div>
                  )}

                  {/* Booking Evidence Stamp */}
                  {req.bookingEvidence && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 font-mono">
                      Verified Booking ID: {req.bookingEvidence.bookingId} • Slot:{' '}
                      {new Date(req.bookingEvidence.bookedSlotTime).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href={req.calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    title="Open candidate Calendly URL"
                  >
                    <span>Calendly</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDetails(req)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      History
                    </button>

                    <button
                      onClick={() => onOpenActions(req)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
