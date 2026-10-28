/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { InterviewRequest, BlockerType, ContactAttempt } from '../types';
import { calculateSla, getSlaBadgeClass } from '../utils/sla';
import {
  Mail,
  Phone,
  CalendarCheck,
  AlertOctagon,
  UserCheck,
  ExternalLink,
  X,
  Copy,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RequestActionModalProps {
  request: InterviewRequest;
  onClose: () => void;
}

type TabType = 'email' | 'call' | 'booking' | 'exception' | 'reassign';

export const RequestActionModal: React.FC<RequestActionModalProps> = ({ request, onClose }) => {
  const {
    virtualNow,
    logEmailOutreach,
    logCallAttempt,
    flagException,
    reassignRequest,
    confirmBooking,
    withdrawCandidate,
  } = useScheduling();

  const [activeTab, setActiveTab] = useState<TabType>('email');

  // Email form state
  const [selectedTemplate, setSelectedTemplate] = useState<'A' | 'B' | 'URGENT'>('A');
  const [emailNotes, setEmailNotes] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Call form state
  const [callResult, setCallResult] = useState<NonNullable<ContactAttempt['callResult']>>('CONNECTED');
  const [callNotes, setCallNotes] = useState('');

  // Exception form state
  const [blockerType, setBlockerType] = useState<BlockerType>('NO_SLOTS');
  const [blockerReason, setBlockerReason] = useState('');

  // Reassign form state
  const [newAssignee, setNewAssignee] = useState<'Ram' | 'Shyam'>(
    request.assignedTo === 'Ram' ? 'Shyam' : 'Ram'
  );
  const [reassignReason, setReassignReason] = useState('');

  // Booking form state
  const [bookingSlotDate, setBookingSlotDate] = useState(() => {
    const d = new Date(virtualNow.getTime() + 48 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [customBookingId, setCustomBookingId] = useState('');

  const sla = calculateSla(request.originalCreatedAt, virtualNow);
  const badgeStyle = getSlaBadgeClass(sla.band);

  // Dynamic template text
  const candidateFirstName = request.candidateName.split(' ')[0] || request.candidateName;

  const emailTemplates = {
    A: {
      name: 'Template A: Initial Outreach',
      subject: `Next steps: Schedule your interview with ${request.company} (${request.interviewRound})`,
      body: `Hi ${candidateFirstName},\n\nWe are excited to coordinate your upcoming ${request.interviewRound} with ${request.company}!\n\nPlease select your preferred time slot directly on the interviewer's calendar using the link below:\n👉 ${request.calendlyUrl}\n\nThe team is eager to speak with you. To secure your preferred time before interviewer slots fill up, please book within the next 24 hours.\n\nBest regards,\n${request.assignedTo} | Weekday Scheduling Operations`,
    },
    B: {
      name: 'Template B: Follow-up Reminder #1',
      subject: `Quick reminder: Lock in your ${request.company} interview slot`,
      body: `Hi ${candidateFirstName},\n\nJust following up on our earlier message regarding your interview for ${request.company} (${request.interviewRound}).\n\nInterviewer slots are filling quickly. You can confirm your schedule in 30 seconds here:\n👉 ${request.calendlyUrl}\n\nThank you,\n${request.assignedTo} | Weekday Scheduling Operations`,
    },
    URGENT: {
      name: 'Template C: Urgent SLA Warning',
      subject: `Urgent: Action required on your ${request.company} interview`,
      body: `Hi ${candidateFirstName},\n\nWe noticed your interview slot for ${request.company} has not yet been selected. We have only a few remaining availability blocks this week.\n\nPlease confirm your preferred time here:\n👉 ${request.calendlyUrl}\n\nIf you have any difficulty finding a time, please reply to this email or call us immediately.\n\nBest regards,\n${request.assignedTo} | Weekday Scheduling Operations`,
    },
  };

  const currentTemplate = emailTemplates[selectedTemplate];

  const handleCopyTemplate = () => {
    const text = `Subject: ${currentTemplate.subject}\n\n${currentTemplate.body}`;
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    logEmailOutreach(request.id, currentTemplate.name, emailNotes);
    onClose();
  };

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    logCallAttempt(request.id, callResult, callNotes);
    onClose();
  };

  const handleFlagException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerReason.trim()) return;
    flagException(request.id, blockerType, blockerReason);
    onClose();
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignReason.trim()) return;
    reassignRequest(request.id, newAssignee, reassignReason);
    onClose();
  };

  const handleSimulateBooking = () => {
    const bookingId = customBookingId.trim() || `cal-evt-${Date.now().toString(36)}`;
    confirmBooking(request.id, {
      bookingId,
      bookedSlotTime: new Date(bookingSlotDate).toISOString(),
      interviewer: request.interviewerName,
      candidateEmail: request.candidateEmail,
      confirmedAt: virtualNow.toISOString(),
      source: 'CALENDLY_SIMULATION',
      isSimulated: true,
    });
    onClose();
  };

  const handleWithdraw = () => {
    if (confirm(`Confirm withdrawal for ${request.candidateName}? This will pause all outreach.`)) {
      withdrawCandidate(request.id, 'Candidate opted out or accepted competing offer.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl text-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-cyan-400">
                #{request.sourceRowNumber} • {request.company}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeStyle.badge}`}>
                {sla.formattedRemaining} ({sla.band})
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {request.candidateName}
              <span className="text-xs font-normal text-slate-400">({request.interviewRound})</span>
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span>Owner: <strong className="text-slate-200">{request.assignedTo}</strong></span>
              <span>Email: <span className="text-slate-300 font-mono">{request.candidateEmail}</span></span>
              <span>Phone: <span className="text-slate-300 font-mono">{request.candidatePhone}</span></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Calendly Bar */}
        <div className="bg-cyan-950/30 border-b border-cyan-800/30 px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-cyan-400 font-medium">Calendly URL:</span>
            <span className="text-slate-300 font-mono truncate max-w-sm">{request.calendlyUrl}</span>
          </div>
          <a
            href={request.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] transition shrink-0"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Log Email</span>
          </button>

          <button
            onClick={() => setActiveTab('call')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'call'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Log Call</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'booking'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Verify Booking</span>
          </button>

          <button
            onClick={() => setActiveTab('exception')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'exception'
                ? 'border-rose-400 text-rose-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Flag Blocker</span>
          </button>

          <button
            onClick={() => setActiveTab('reassign')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'reassign'
                ? 'border-indigo-400 text-indigo-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Reassign</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* TAB 1: LOG EMAIL */}
          {activeTab === 'email' && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Approved SOP Outreach Template:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['A', 'B', 'URGENT'] as const).map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition ${
                        selectedTemplate === key
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 font-medium'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-white mb-0.5">{emailTemplates[key].name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{emailTemplates[key].subject}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Preview */}
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Subject: <span className="text-slate-200">{currentTemplate.subject}</span></span>
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-sans text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">
                  {currentTemplate.body}
                </pre>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Optional Outreach Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent via candidate Gmail; customized for Round 1"
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Logs outreach and schedules follow-up check in <strong>4 hours</strong>.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30"
                  >
                    Record Email Outreach
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: LOG CALL */}
          {activeTab === 'call' && (
            <form onSubmit={handleSaveCall} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Call Outcome:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'CONNECTED', label: 'Connected with Candidate', color: 'emerald' },
                    { id: 'VOICEMAIL', label: 'Left Voicemail', color: 'amber' },
                    { id: 'NO_ANSWER', label: 'No Answer / Rang Out', color: 'slate' },
                    { id: 'BUSY', label: 'Line Busy', color: 'slate' },
                    { id: 'SCHEDULED_ON_CALL', label: 'Locked Slot on Call', color: 'cyan' },
                    { id: 'WRONG_NUMBER', label: 'Invalid / Wrong Number', color: 'rose' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setCallResult(item.id as NonNullable<ContactAttempt['callResult']>)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition ${
                        callResult === item.id
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 font-medium'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-white">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Call Summary & Discussion Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Candidate answered, currently traveling, promised to book slot tonight after 7pm..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Phone attempts are logged in the request timeline.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30"
                  >
                    Record Call Attempt
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: VERIFIED BOOKING CONFIRMATION */}
          {activeTab === 'booking' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                <h4 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  Evidence-Gated Booking Verification
                </h4>
                <p className="text-emerald-200/90 leading-relaxed">
                  Per the Golden Operations Rule, a request can <strong>never</strong> be closed as booked merely because outreach was sent. It requires verified booking evidence (Calendly confirmation event).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Confirmed Interview Slot:
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingSlotDate}
                    onChange={(e) => setBookingSlotDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Booking ID / Reference Code:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. cal-evt-982189 (leave blank to auto-generate)"
                    value={customBookingId}
                    onChange={(e) => setCustomBookingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 font-semibold mb-1">Simulated Evidence Payload:</div>
                <div className="text-slate-300">Candidate: <strong className="text-white">{request.candidateEmail}</strong></div>
                <div className="text-slate-300">Interviewer: <strong className="text-white">{request.interviewerName}</strong> ({request.company})</div>
                <div className="text-slate-300">Action on Confirmation: <span className="text-emerald-400 font-medium">Transitions to BOOKED, cancels all pending follow-ups, updates 24h SLA dashboard.</span></div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500">
                  Simulated events are watermarked [SIMULATED] in audit records.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateBooking}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Confirm Verified Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FLAG EXCEPTION / BLOCKER */}
          {activeTab === 'exception' && (
            <form onSubmit={handleFlagException} className="space-y-4">
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200">
                Flagging a blocker pauses automated intern follow-ups to avoid annoying candidates with broken links or unbookable schedules.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Blocker Category:
                </label>
                <select
                  value={blockerType}
                  onChange={(e) => setBlockerType(e.target.value as BlockerType)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="NO_SLOTS">No Available Slots in Next 14 Days</option>
                  <option value="INVALID_LINK">Broken / 404 Calendly Link</option>
                  <option value="INVALID_CONTACT">Candidate Email Bounced or Wrong Phone</option>
                  <option value="CANDIDATE_UNRESPONSIVE">Candidate Non-Responsive After 4 Touchpoints</option>
                  <option value="OTHER">Other Partner Blocker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Blocker Description (Sent to Partner Coordinator):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Checked Calendly link: calendar has zero slots through next month. Partner coordinator contacted to add slots."
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="text-xs text-slate-400 hover:text-rose-400 underline font-medium"
                >
                  Candidate Opted Out / Withdraw?
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30"
                  >
                    Flag Blocker
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 5: REASSIGN REQUEST */}
          {activeTab === 'reassign' && (
            <form onSubmit={handleReassign} className="space-y-4">
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200">
                <strong>Critical SLA Rule:</strong> Reassigning a request transfers task ownership between Ram and Shyam, but <strong>strictly preserves the original creation timestamp and 24-hour SLA deadline</strong>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Current Owner:</label>
                  <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs">
                    {request.assignedTo}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">New Assignee:</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value as 'Ram' | 'Shyam')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-bold text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Ram">Ram</option>
                    <option value="Shyam">Shyam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mandatory Reassignment Reason:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workload balancing / Ram out of office"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Logged in audit trail with previous and new owners.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/30"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
