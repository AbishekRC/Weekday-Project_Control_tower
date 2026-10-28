/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { calculateSla, getSlaBadgeClass } from '../utils/sla';
import {
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FastForward,
  Mail,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const DemoCenter: React.FC = () => {
  const {
    requests,
    virtualNow,
    advanceClock,
    resetClock,
    logEmailOutreach,
    confirmBooking,
    setSelectedRequestId,
    setActiveView,
    resetAllData,
  } = useScheduling();

  const [activeScenario, setActiveScenario] = useState<'A' | 'B'>('A');

  // Find candidate for Scenario A: uncontacted fresh request
  const scenarioAReq = requests.find((r) => r.candidateName.includes('Aarav') || r.status === 'UNCONTACTED') || requests[0];

  // Find candidate for Scenario B: uncontacted or fresh request for Priya Patel / Airbnb
  const scenarioBReq = requests.find((r) => r.candidateName.includes('Priya') || (r.id !== scenarioAReq?.id && r.status === 'UNCONTACTED')) || requests[1];

  // Step trackers for demo
  const [stepA, setStepA] = useState<number>(1);
  const [stepB, setStepB] = useState<number>(1);

  const slaA = scenarioAReq ? calculateSla(scenarioAReq.originalCreatedAt, virtualNow) : null;
  const slaB = scenarioBReq ? calculateSla(scenarioBReq.originalCreatedAt, virtualNow) : null;

  const handleStepA_Outreach = () => {
    if (!scenarioAReq) return;
    logEmailOutreach(
      scenarioAReq.id,
      'Template A: Initial Outreach',
      '[DEMO STEP 2] Dispatched approved outreach email with candidate Calendly link.'
    );
    setStepA(2);
  };

  const handleStepA_Booking = () => {
    if (!scenarioAReq) return;
    confirmBooking(scenarioAReq.id, {
      bookingId: `demo-cal-${Date.now().toString(36)}`,
      bookedSlotTime: new Date(virtualNow.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      interviewer: scenarioAReq.interviewerName,
      candidateEmail: scenarioAReq.candidateEmail,
      confirmedAt: virtualNow.toISOString(),
      source: 'CALENDLY_SIMULATION',
      isSimulated: true,
    });
    setStepA(3);
  };

  const handleStepB_Outreach = () => {
    if (!scenarioBReq) return;
    logEmailOutreach(
      scenarioBReq.id,
      'Template A: Initial Outreach',
      '[DEMO SCENARIO B] Initial outreach sent.'
    );
    setStepB(2);
  };

  const handleStepB_Advance4h = () => {
    advanceClock(5); // +5 hours triggers follow-up
    setStepB(3);
  };

  const handleStepB_Advance18h = () => {
    advanceClock(16); // Into Red / Escalation
    setStepB(4);
  };

  const handleStepB_Advance26h = () => {
    advanceClock(8); // Into Overdue
    setStepB(5);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-900/40 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            Deliverable 6: Deterministic End-to-End Demo
          </span>
          <span className="text-xs text-slate-400">Zero External API Credentials Required</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Operations Lifecycle Demonstration Center
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Demonstrate both required operational scenarios in a live 5-minute interview presentation. All simulated communications and booking events are clearly labeled <strong className="text-amber-400">[SIMULATED]</strong>.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveScenario('A')}
          className={`p-5 rounded-2xl border text-left transition ${
            activeScenario === 'A'
              ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Scenario A
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Happy Path
            </span>
          </div>
          <h3 className="font-bold text-white text-base">Successful Candidate Booking Flow</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Intake request → Initial outreach → Pending booking observation → Verified Calendly booking event → Follow-ups auto-cancelled → 24h SLA compliance achieved.
          </p>
        </button>

        <button
          onClick={() => setActiveScenario('B')}
          className={`p-5 rounded-2xl border text-left transition ${
            activeScenario === 'B'
              ? 'bg-slate-900 border-rose-500 ring-1 ring-rose-500/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Scenario B
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
              Escalation Path
            </span>
          </div>
          <h3 className="font-bold text-white text-base">Unbooked Request Aging & Escalation Flow</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Outreach sent → Virtual clock advance → Candidate unresponsive → Follow-up #1 triggered → Approaching SLA Amber/Red alert → Overdue manager escalation.
          </p>
        </button>
      </div>

      {/* SCENARIO A RUNNER */}
      {activeScenario === 'A' && scenarioAReq && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                Scenario A Active Candidate:
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                {scenarioAReq.candidateName}
                <span className="text-xs font-normal text-slate-400">
                  ({scenarioAReq.company} • {scenarioAReq.interviewRound})
                </span>
              </h3>
              <div className="text-xs text-slate-400 mt-1">
                Assigned Intern: <strong className="text-white">{scenarioAReq.assignedTo}</strong> • Status:{' '}
                <span className="text-cyan-300 font-mono font-semibold">{scenarioAReq.status}</span> • SLA:{' '}
                <span className="text-emerald-400 font-mono font-semibold">{slaA?.formattedRemaining}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedRequestId(scenarioAReq.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Inspect Candidate Dossier
              </button>
            </div>
          </div>

          {/* Step-by-Step Flow */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Step-by-Step Demonstration Execution:
            </h4>

            {/* Step 1 */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              stepA >= 1 ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/40 border-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-mono">1</span>
                  Select Uncontacted Request & Verify Owner
                </div>
                <span className="text-emerald-400 font-mono font-semibold">Ready</span>
              </div>
              <p className="text-slate-400">
                Request #{scenarioAReq.sourceRowNumber} is assigned to <strong>{scenarioAReq.assignedTo}</strong> with a 24-hour deadline of{' '}
                <span className="font-mono text-slate-300">{new Date(slaA?.deadlineIso || '').toLocaleString()}</span>.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              stepA >= 2 ? 'bg-slate-950 border-emerald-900/50' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-mono">2</span>
                  Record Approved Initial Outreach Email
                </div>
                {stepA >= 2 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                  </span>
                ) : (
                  <button
                    onClick={handleStepA_Outreach}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Send Initial Email</span>
                  </button>
                )}
              </div>
              <p className="text-slate-400">
                Dispatches approved outreach template containing Calendly URL (<code>{scenarioAReq.calendlyUrl}</code>). Request transitions to <code>OUTREACH_SENT</code> and schedules Follow-up #1 for +4 hours.
              </p>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              stepA >= 3 ? 'bg-slate-950 border-emerald-500/50' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400 font-mono">3</span>
                  Trigger Verified Calendly Booking Confirmation Event
                </div>
                {stepA >= 3 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Booking Confirmed
                  </span>
                ) : (
                  <button
                    onClick={handleStepA_Booking}
                    disabled={stepA < 2}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Trigger Verified Booking</span>
                  </button>
                )}
              </div>
              <p className="text-slate-400">
                Simulates receipt of verified Calendly webhook payload with confirmed slot. Status immediately locks to <code>BOOKED</code>, cancels future reminders, and increments 24h SLA compliance.
              </p>
            </div>
          </div>

          {scenarioAReq.bookingStatus === 'BOOKED' && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
              <div className="text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Scenario A Complete: Verified Booking Recorded
              </div>
              <div className="text-slate-300">
                Booking ID: <strong className="text-white font-mono">{scenarioAReq.bookingEvidence?.bookingId}</strong> • Slot:{' '}
                <span className="text-white font-mono">
                  {new Date(scenarioAReq.bookingEvidence?.bookedSlotTime || '').toLocaleString()}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveView('management')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                >
                  View Management Compliance Rate
                </button>
                <button
                  onClick={() => setSelectedRequestId(scenarioAReq.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  View Candidate Audit History
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCENARIO B RUNNER */}
      {activeScenario === 'B' && scenarioBReq && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-rose-400 font-bold uppercase tracking-wider">
                Scenario B Active Candidate:
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                {scenarioBReq.candidateName}
                <span className="text-xs font-normal text-slate-400">
                  ({scenarioBReq.company} • {scenarioBReq.interviewRound})
                </span>
              </h3>
              <div className="text-xs text-slate-400 mt-1">
                Assigned Intern: <strong className="text-white">{scenarioBReq.assignedTo}</strong> • Current Status:{' '}
                <span className="text-amber-400 font-mono font-semibold">{scenarioBReq.status}</span> • SLA:{' '}
                <span className="text-rose-400 font-mono font-semibold">{slaB?.formattedRemaining}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedRequestId(scenarioBReq.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Inspect Candidate Dossier
              </button>
            </div>
          </div>

          {/* Step-by-Step Flow */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Step-by-Step Escalation Execution:
            </h4>

            {/* Step 1: Initial Outreach */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              stepB >= 2 ? 'bg-slate-950 border-slate-800' : 'bg-slate-950 border-cyan-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-mono">1</span>
                  Record Initial Outreach Action
                </div>
                {stepB >= 2 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                ) : (
                  <button
                    onClick={handleStepB_Outreach}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Send Outreach</span>
                  </button>
                )}
              </div>
              <p className="text-slate-400">
                Initial email sent. Request is now awaiting candidate booking response.
              </p>
            </div>

            {/* Step 2: Advance Clock +5h */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              stepB >= 3 ? 'bg-slate-950 border-slate-800' : 'bg-slate-950 border-amber-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-mono">2</span>
                  Advance Clock +5h (No Booking Received)
                </div>
                {stepB >= 3 ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Follow-up Due
                  </span>
                ) : (
                  <button
                    onClick={handleStepB_Advance4h}
                    disabled={stepB < 2}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition disabled:opacity-50"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>Warp Clock +5h</span>
                  </button>
                )}
              </div>
              <p className="text-slate-400">
                Candidate did not book within 4 hours. Status advances to <code>FOLLOW_UP_DUE</code>, and request surfaces in {scenarioBReq.assignedTo}&apos;s Follow-ups Due queue.
              </p>
            </div>

            {/* Step 3: Advance Clock +16h */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              stepB >= 4 ? 'bg-slate-950 border-slate-800' : 'bg-slate-950 border-rose-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-rose-400 font-mono">3</span>
                  Advance Clock into Critical Window (&lt;4h SLA Remaining)
                </div>
                {stepB >= 4 ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> SLA Critical / At Risk
                  </span>
                ) : (
                  <button
                    onClick={handleStepB_Advance18h}
                    disabled={stepB < 3}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition disabled:opacity-50"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>Warp Clock +16h</span>
                  </button>
                )}
              </div>
              <p className="text-slate-400">
                SLA time remaining drops under 4 hours. Priority elevates to <strong>URGENT</strong>, badge flashes red, and intern is instructed to initiate voice outreach.
              </p>
            </div>

            {/* Step 4: Advance past 24h */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              stepB >= 5 ? 'bg-slate-950 border-red-700/60' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-red-400 font-mono">4</span>
                  Advance Past 24h Deadline (OVERDUE Escalation)
                </div>
                {stepB >= 5 ? (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE Breach
                  </span>
                ) : (
                  <button
                    onClick={handleStepB_Advance26h}
                    disabled={stepB < 4}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold transition disabled:opacity-50"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>Warp Past 24h</span>
                  </button>
                )}
              </div>
              <p className="text-slate-400">
                24-hour SLA window expires without booking. Request enters <code>OVERDUE</code> state, triggers manager alert, and is retained in the Overdue queue for partner follow-up.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5-Minute Interview Demonstration Script */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          5-Minute Interview Demonstration Script
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold">Minute 0 - 1</span>
            <div className="font-semibold text-white">Problem & Architecture</div>
            <p className="text-slate-400 text-[11px]">
              Show Management Control Tower. Explain 500+ daily volume, 80% 24h SLA target, and 50/50 intern split (Ram & Shyam).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold">Minute 1 - 2</span>
            <div className="font-semibold text-white">Central Tracker & Excel</div>
            <p className="text-slate-400 text-[11px]">
              Show Central Tracker. Demonstrate de-duplication, source row mapping, search/filter, and Excel import engine.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold">Minute 2 - 3</span>
            <div className="font-semibold text-white">Intern Workbenches</div>
            <p className="text-slate-400 text-[11px]">
              Switch to Ram&apos;s Workbench. Show &quot;Action Now&quot; queue, Calendly one-click preview, email templates, and call logging.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold">Minute 3 - 4</span>
            <div className="font-semibold text-white">Scenario A Demo</div>
            <p className="text-slate-400 text-[11px]">
              Execute Scenario A in Demo Center. Trigger verified booking event. Show how follow-ups are cancelled and SLA metrics update.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold">Minute 4 - 5</span>
            <div className="font-semibold text-white">Scenario B & SOP / QA</div>
            <p className="text-slate-400 text-[11px]">
              Fast-forward Operations Clock. Show Follow-up Due and Overdue escalation. Show 19/19 passing test suite and SOP IF/THEN rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
