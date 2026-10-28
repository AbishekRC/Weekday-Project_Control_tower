/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  Clock,
  PhoneCall,
  Mail,
} from 'lucide-react';

export const SopViewer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const goldenRules = [
    {
      title: 'The 24-Hour SLA Clock Never Resets',
      desc: 'The SLA clock starts at request_created_at. Reassignments between Ram and Shyam, Excel re-imports, or status changes NEVER reset or pause the 24-hour deadline.',
    },
    {
      title: 'Never Close Without Evidence',
      desc: 'A request is NEVER marked BOOKED merely because an outreach email was sent, a phone call was answered, or a candidate promised to book later. Only verified booking evidence qualifies.',
    },
    {
      title: 'Zero Unnecessary Outreach',
      desc: 'Once an interview is booked or a candidate withdraws, immediately halt all scheduled reminders and phone calls to avoid annoying candidates.',
    },
    {
      title: 'Log Every Touchpoint Within 5 Minutes',
      desc: 'Every candidate outreach, phone call outcome, voicemail, or blocker report must be recorded in the tracker immediately for team auditability.',
    },
  ];

  const ifThenRules = [
    {
      condition: 'New request arrives and no outreach has been recorded',
      action: 'IF request creation was <60 mins ago, THEN send approved Initial Outreach Email containing Calendly link. Set next-action check for +4 hours.',
      urgency: 'NORMAL',
    },
    {
      condition: 'Request received >2 hours ago with zero outreach recorded',
      action: 'THEN treat as High Priority Backlog. Send outreach immediately and tag intern note "DELAYED_INITIAL_OUTREACH".',
      urgency: 'HIGH',
    },
    {
      condition: 'Verified booking confirmation received',
      action: 'THEN immediately update status to BOOKED. Cancel all pending follow-up tasks. Record booking ID and slot in audit log.',
      urgency: 'SUCCESS',
    },
    {
      condition: 'Outreach sent >4 hours ago, no booking, SLA >12h (Green)',
      action: 'THEN send Follow-up Reminder #1 (Email). Mention preferred interview round and slot urgency. Set next check for +6 hours.',
      urgency: 'NORMAL',
    },
    {
      condition: 'Outreach sent >10 hours ago, no booking, SLA 4–12h (Amber)',
      action: 'THEN initiate Direct Voice Outreach (Phone Call). Follow approved call script. If voicemail, leave concise 20s message and send SMS nudge.',
      urgency: 'HIGH',
    },
    {
      condition: 'Phone call attempted and candidate answers',
      action: 'THEN offer to stay on the line while candidate opens Calendly, or lock preferred slot immediately. Log call outcome as CONNECTED.',
      urgency: 'SUCCESS',
    },
    {
      condition: 'Phone call attempted: Voicemail / No Answer / Busy',
      action: 'THEN log outcome as NO_ANSWER or VOICEMAIL. Send SMS reminder. Maximum 2 calls in a 4-hour window.',
      urgency: 'NORMAL',
    },
    {
      condition: 'SLA remaining <4 hours and unbooked (Red)',
      action: 'THEN mark request priority as CRITICAL / AT_RISK. Alert Operations Manager. Attempt secondary phone outreach.',
      urgency: 'URGENT',
    },
    {
      condition: 'SLA deadline passes (t <= 0h) and unbooked (Overdue)',
      action: 'THEN mark request as OVERDUE. Trigger mandatory manager escalation. Request remains active in Overdue Queue until resolved.',
      urgency: 'URGENT',
    },
    {
      condition: 'Calendly link is broken, 404, or invalid URL format',
      action: 'THEN do NOT contact candidate with broken link. Immediately flag as BLOCKED_EXCEPTION (INVALID_LINK). Notify partner coordinator.',
      urgency: 'BLOCKER',
    },
    {
      condition: 'Calendly calendar shows 0 available slots in next 14 days',
      action: 'THEN flag request as BLOCKED_EXCEPTION (NO_SLOTS). Send urgent request to hiring company coordinator requesting added availability blocks.',
      urgency: 'BLOCKER',
    },
    {
      condition: 'Candidate replies stating they withdraw or opted out',
      action: 'THEN stop all outreach immediately. Update status to WITHDRAWN. Record reason in audit log and notify partner recruiting team.',
      urgency: 'NORMAL',
    },
    {
      condition: 'Intern (Ram or Shyam) absent or off duty',
      action: 'THEN Team Lead executes batch reassignment to counterpart. Original SLA clock strictly preserved. Log as INTERN_ABSENCE_HANDOVER.',
      urgency: 'NORMAL',
    },
  ];

  const templates = [
    {
      id: 'template_a',
      title: 'Template A: Initial Outreach (Email)',
      channel: 'EMAIL',
      subject: 'Next steps: Schedule your interview with {{company_name}} ({{interview_round}})',
      body: `Hi {{candidate_first_name}},\n\nWe are excited to coordinate your upcoming {{interview_round}} with {{company_name}}!\n\nPlease select your preferred time slot directly on the interviewer's calendar using the link below:\n👉 {{calendly_url}}\n\nThe team is eager to speak with you. To secure your preferred time before interviewer slots fill up, please book within the next 24 hours.\n\nIf you have any scheduling constraints or questions, simply reply to this email.\n\nBest regards,\n{{intern_name}} | Weekday Scheduling Operations`,
    },
    {
      id: 'template_b',
      title: 'Template B: Follow-up Reminder #1 (4-hour mark)',
      channel: 'EMAIL',
      subject: 'Quick reminder: Lock in your {{company_name}} interview slot',
      body: `Hi {{candidate_first_name}},\n\nJust following up on our earlier message regarding your interview for the {{interview_round}} role at {{company_name}}.\n\nInterviewer slots are filling quickly. You can confirm your schedule in 30 seconds here:\n👉 {{calendly_url}}\n\nThank you,\n{{intern_name}} | Weekday Scheduling Operations`,
    },
    {
      id: 'template_c',
      title: 'Template C: Phone Call Script (10-14 hour mark)',
      channel: 'PHONE',
      subject: 'Voice Call Guidance & Script',
      body: `"Hello {{candidate_first_name}}, this is {{intern_name}} from Weekday coordinating your interview with {{company_name}} for the {{interview_round}}. I wanted to ensure you received the calendar booking link sent earlier today. Do you have 30 seconds to open the link together or confirm a preferred time?"\n\n• If Candidate Agrees: Guide them to open link or verify slot.\n• If Voicemail: "Hi {{candidate_first_name}}, this is {{intern_name}} from Weekday. Please check your inbox for your {{company_name}} interview booking link. Feel free to call or text me back at this number to secure your time."`,
    },
  ];

  const filteredRules = ifThenRules.filter(
    (r) =>
      r.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            Deliverable 4: Scheduling Standard Operating Procedure
          </span>
          <span className="text-xs text-slate-400">Version 1.0.0 • Strict IF/THEN Operational Matrix</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Intern Scheduling Standard Operating Procedure (SOP)
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Unambiguous instructions for Ram and Shyam to eliminate missed follow-ups, premature closures, and duplicate touches while guaranteeing &gt;=80% 24h booking SLA compliance.
        </p>
      </div>

      {/* Golden Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goldenRules.map((rule, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
          >
            <div className="flex items-center gap-2 font-bold text-white text-xs">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[10px]">
                {idx + 1}
              </span>
              <span>{rule.title}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-7">{rule.desc}</p>
          </div>
        ))}
      </div>

      {/* IF/THEN Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Explicit IF / THEN Operational Decision Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Clear rules mapping intake, follow-ups, and partner exceptions
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search condition or rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-1/3">Condition (IF)</th>
                <th className="py-2.5 px-3">Prescribed Action (THEN)</th>
                <th className="py-2.5 px-3 w-28 text-right">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRules.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-white">
                    <span className="text-cyan-400 font-bold mr-1">IF:</span> {r.condition}
                  </td>
                  <td className="py-3 px-3 text-slate-300 leading-relaxed">
                    <span className="text-amber-400 font-bold mr-1">THEN:</span> {r.action}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        r.urgency === 'URGENT'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : r.urgency === 'BLOCKER'
                          ? 'bg-red-950 text-red-300 border border-red-700'
                          : r.urgency === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : r.urgency === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {r.urgency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved Templates */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Approved Outreach & Phone Scripts
          </h3>
          <p className="text-xs text-slate-400">
            Standardized communications ensuring consistent brand presence across all candidates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="font-bold text-white">{tpl.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300">
                    {tpl.channel}
                  </span>
                </div>
                <div className="text-slate-400 mb-2 font-medium">
                  Subject: <span className="text-slate-200">{tpl.subject}</span>
                </div>
                <pre className="font-sans text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-900">
                  {tpl.body}
                </pre>
              </div>

              <button
                onClick={() => handleCopy(tpl.id, `Subject: ${tpl.subject}\n\n${tpl.body}`)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                {copiedId === tpl.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
