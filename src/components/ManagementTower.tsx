/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { calculateSla, getDynamicStatus, getSlaBadgeClass } from '../utils/sla';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building,
  ShieldAlert,
  ArrowRight,
  Activity,
} from 'lucide-react';

export const ManagementTower: React.FC = () => {
  const {
    requests,
    auditLogs,
    virtualNow,
    setSelectedRequestId,
    setActiveView,
  } = useScheduling();

  // Metrics computation
  const metrics = useMemo(() => {
    const totalRequests = requests.length;

    // SLA mature requests: created >= 24h ago
    const matureRequests = requests.filter(
      (r) => calculateSla(r.originalCreatedAt, virtualNow).isMature
    );

    // Active requests within SLA window: created < 24h ago
    const withinSlaRequests = requests.filter(
      (r) => !calculateSla(r.originalCreatedAt, virtualNow).isMature
    );

    // Booked requests
    const allBooked = requests.filter((r) => r.bookingStatus === 'BOOKED');

    // Booked within 24 hours: (bookingVerifiedAt - originalCreatedAt) <= 24h
    const bookedWithin24h = matureRequests.filter((r) => {
      if (r.bookingStatus !== 'BOOKED' || !r.bookingVerifiedAt) return false;
      const durationMs =
        new Date(r.bookingVerifiedAt).getTime() - new Date(r.originalCreatedAt).getTime();
      return durationMs <= 24 * 60 * 60 * 1000;
    });

    // Booked after 24 hours (Late bookings)
    const bookedAfter24h = matureRequests.filter((r) => {
      if (r.bookingStatus !== 'BOOKED' || !r.bookingVerifiedAt) return false;
      const durationMs =
        new Date(r.bookingVerifiedAt).getTime() - new Date(r.originalCreatedAt).getTime();
      return durationMs > 24 * 60 * 60 * 1000;
    });

    // Unbooked mature requests
    const unbookedMature = matureRequests.filter((r) => r.bookingStatus !== 'BOOKED');

    // Currently unbooked active requests
    const unbookedActive = requests.filter((r) => r.bookingStatus !== 'BOOKED');

    // 24-hour SLA Compliance %: (Booked within 24h / Mature Requests) * 100
    // Strictly display N/A if denominator is zero!
    const slaComplianceRate =
      matureRequests.length > 0
        ? Math.round((bookedWithin24h.length / matureRequests.length) * 100)
        : null;

    // Overall booking conversion rate: (All Booked / Total Requests) * 100
    const overallBookingRate =
      totalRequests > 0 ? Math.round((allBooked.length / totalRequests) * 100) : null;

    // Band counts for active unbooked requests
    let greenCount = 0;
    let amberCount = 0;
    let redCount = 0;
    let overdueCount = 0;

    unbookedActive.forEach((r) => {
      const sla = calculateSla(r.originalCreatedAt, virtualNow);
      if (sla.band === 'GREEN') greenCount++;
      else if (sla.band === 'AMBER') amberCount++;
      else if (sla.band === 'RED') redCount++;
      else if (sla.band === 'OVERDUE') overdueCount++;
    });

    // Exceptions
    const activeExceptions = requests.filter(
      (r) => r.status === 'BLOCKED_EXCEPTION' || Boolean(r.blockerReason)
    );

    // Intern split
    const ramRequests = requests.filter((r) => r.assignedTo === 'Ram');
    const shyamRequests = requests.filter((r) => r.assignedTo === 'Shyam');

    const ramBooked = ramRequests.filter((r) => r.bookingStatus === 'BOOKED').length;
    const shyamBooked = shyamRequests.filter((r) => r.bookingStatus === 'BOOKED').length;

    const ramActionDue = ramRequests.filter((r) => {
      const s = getDynamicStatus(r, virtualNow);
      return s === 'UNCONTACTED' || s === 'FOLLOW_UP_DUE' || s === 'AT_RISK' || s === 'OVERDUE';
    }).length;

    const shyamActionDue = shyamRequests.filter((r) => {
      const s = getDynamicStatus(r, virtualNow);
      return s === 'UNCONTACTED' || s === 'FOLLOW_UP_DUE' || s === 'AT_RISK' || s === 'OVERDUE';
    }).length;

    // Partner company breakdown
    const companyMap = new Map<
      string,
      { total: number; booked: number; exceptions: number; overdue: number }
    >();

    requests.forEach((r) => {
      const existing = companyMap.get(r.company) || {
        total: 0,
        booked: 0,
        exceptions: 0,
        overdue: 0,
      };
      existing.total++;
      if (r.bookingStatus === 'BOOKED') existing.booked++;
      if (r.status === 'BLOCKED_EXCEPTION') existing.exceptions++;
      const sla = calculateSla(r.originalCreatedAt, virtualNow);
      if (sla.band === 'OVERDUE' && r.bookingStatus !== 'BOOKED') existing.overdue++;
      companyMap.set(r.company, existing);
    });

    const partnerBreakdown = Array.from(companyMap.entries()).map(([company, stats]) => ({
      company,
      ...stats,
      rate: Math.round((stats.booked / stats.total) * 100),
    }));

    return {
      totalRequests,
      matureRequests: matureRequests.length,
      withinSlaRequests: withinSlaRequests.length,
      allBooked: allBooked.length,
      bookedWithin24h: bookedWithin24h.length,
      bookedAfter24h: bookedAfter24h.length,
      unbookedMature: unbookedMature.length,
      slaComplianceRate,
      overallBookingRate,
      greenCount,
      amberCount,
      redCount,
      overdueCount,
      activeExceptions,
      ramTotal: ramRequests.length,
      shyamTotal: shyamRequests.length,
      ramBooked,
      shyamBooked,
      ramActionDue,
      shyamActionDue,
      partnerBreakdown,
    };
  }, [requests, virtualNow]);

  return (
    <div className="space-y-6">
      {/* Target SLA Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Core Operations Goal: &gt;=80% within 24h
              </span>
              <span className="text-xs text-slate-400">
                Window: Request Creation + 24 Hours
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Management Operations Control Tower
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Real-time pipeline analytics, SLA compliance calculation, intern queue balance, and partner exception tracking across Weekday’s interview pipeline.
            </p>
          </div>

          {/* Primary SLA Gauge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center gap-6 min-w-[280px]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                24h SLA Compliance
              </div>
              <div className="text-3xl font-black text-white mt-0.5 flex items-baseline gap-2">
                {metrics.slaComplianceRate !== null ? (
                  <>
                    <span
                      className={
                        metrics.slaComplianceRate >= 80
                          ? 'text-emerald-400'
                          : metrics.slaComplianceRate >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                    >
                      {metrics.slaComplianceRate}%
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      (Target: 80%)
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 text-2xl">N/A</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {metrics.matureRequests > 0 ? (
                  <span>
                    <strong>{metrics.bookedWithin24h}</strong> of{' '}
                    <strong>{metrics.matureRequests}</strong> mature requests met SLA
                  </span>
                ) : (
                  <span>No mature requests (&gt;=24h) yet</span>
                )}
              </div>
            </div>

            <div className="w-14 h-14 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                  metrics.slaComplianceRate && metrics.slaComplianceRate >= 80
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {metrics.slaComplianceRate !== null ? `${metrics.slaComplianceRate}%` : '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Intake Volume</span>
            <Building className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalRequests}</div>
          <div className="text-[11px] text-slate-400">
            {metrics.allBooked} booked total ({metrics.overallBookingRate ?? '0'}% overall)
          </div>
        </div>

        {/* Mature vs In-Window */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Mature Cohort (&gt;=24h)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.matureRequests}</div>
          <div className="text-[11px] text-slate-400">
            {metrics.unbookedMature} unbooked mature requests
          </div>
        </div>

        {/* Active Unbooked */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>In-Flight Unbooked</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics.totalRequests - metrics.allBooked}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics.withinSlaRequests} within 24h SLA window
          </div>
        </div>

        {/* Exceptions & Blockers */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Exceptions</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {metrics.activeExceptions.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Broken links or zero interview slots
          </div>
        </div>
      </div>

      {/* Intern Workload Division & SLA Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intern Workload Split */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Intern Queue Balance (50/50 Division)
              </h3>
              <p className="text-xs text-slate-400">
                Workload allocation and pending action queue per intern
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ram Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Ram</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {metrics.ramActionDue} Action Due
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Assigned Requests:</span>
                  <strong className="text-white">{metrics.ramTotal}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Verified Booked:</span>
                  <strong className="text-emerald-400">{metrics.ramBooked}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pending Outreach:</span>
                  <strong className="text-amber-400">{metrics.ramActionDue}</strong>
                </div>
              </div>
              <button
                onClick={() => setActiveView('ram')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <span>Open Ram&apos;s Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shyam Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Shyam</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {metrics.shyamActionDue} Action Due
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Assigned Requests:</span>
                  <strong className="text-white">{metrics.shyamTotal}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Verified Booked:</span>
                  <strong className="text-emerald-400">{metrics.shyamBooked}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pending Outreach:</span>
                  <strong className="text-cyan-400">{metrics.shyamActionDue}</strong>
                </div>
              </div>
              <button
                onClick={() => setActiveView('shyam')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <span>Open Shyam&apos;s Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* SLA Aging & Risk Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Unbooked Request SLA Health Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Live aging profile calculated against 24h deadline
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Green */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                &gt;12h Healthy
              </div>
              <div className="text-2xl font-black text-emerald-300">{metrics.greenCount}</div>
              <div className="text-[10px] text-slate-400">GREEN Band</div>
            </div>

            {/* Amber */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                4-12h Amber
              </div>
              <div className="text-2xl font-black text-amber-300">{metrics.amberCount}</div>
              <div className="text-[10px] text-slate-400">Follow-up Due</div>
            </div>

            {/* Red */}
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-1 animate-pulse">
              <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                &lt;4h Urgent
              </div>
              <div className="text-2xl font-black text-rose-300">{metrics.redCount}</div>
              <div className="text-[10px] text-slate-400">RED / At Risk</div>
            </div>

            {/* Overdue */}
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-600/60 space-y-1">
              <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                &gt;24h Overdue
              </div>
              <div className="text-2xl font-black text-red-300">{metrics.overdueCount}</div>
              <div className="text-[10px] text-slate-400">Escalated</div>
            </div>
          </div>

          {/* Visual Bar */}
          <div className="space-y-1">
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-800">
              <div
                style={{
                  width: `${
                    (metrics.greenCount /
                      (metrics.greenCount + metrics.amberCount + metrics.redCount + metrics.overdueCount || 1)) *
                    100
                  }%`,
                }}
                className="bg-emerald-500 transition-all"
                title={`Green: ${metrics.greenCount}`}
              />
              <div
                style={{
                  width: `${
                    (metrics.amberCount /
                      (metrics.greenCount + metrics.amberCount + metrics.redCount + metrics.overdueCount || 1)) *
                    100
                  }%`,
                }}
                className="bg-amber-500 transition-all"
                title={`Amber: ${metrics.amberCount}`}
              />
              <div
                style={{
                  width: `${
                    (metrics.redCount /
                      (metrics.greenCount + metrics.amberCount + metrics.redCount + metrics.overdueCount || 1)) *
                    100
                  }%`,
                }}
                className="bg-rose-500 transition-all"
                title={`Red: ${metrics.redCount}`}
              />
              <div
                style={{
                  width: `${
                    (metrics.overdueCount /
                      (metrics.greenCount + metrics.amberCount + metrics.redCount + metrics.overdueCount || 1)) *
                    100
                  }%`,
                }}
                className="bg-red-600 transition-all"
                title={`Overdue: ${metrics.overdueCount}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Healthy Pipeline</span>
              <span>Critical Breach Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Companies Volume & Conversion */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Partner Company Booking Velocity & Exception Health
            </h3>
            <p className="text-xs text-slate-400">
              Top hiring partners submitting 500+ daily candidate scheduling requests
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Partner Company</th>
                <th className="py-2.5 px-3">Total Requests</th>
                <th className="py-2.5 px-3">Verified Booked</th>
                <th className="py-2.5 px-3">Conversion Rate</th>
                <th className="py-2.5 px-3">Overdue</th>
                <th className="py-2.5 px-3">Active Blockers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {metrics.partnerBreakdown.map((partner) => (
                <tr key={partner.company} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-semibold text-white">{partner.company}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{partner.total}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{partner.booked}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        partner.rate >= 50
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : partner.rate > 0
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {partner.rate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {partner.overdue > 0 ? (
                      <span className="text-red-400 font-bold">{partner.overdue}</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {partner.exceptions > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> {partner.exceptions} Blocker
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px]">Clear</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Exceptions Drawer */}
      {metrics.activeExceptions.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-rose-300 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Unresolved Exceptions Requiring Intervention ({metrics.activeExceptions.length})
            </h3>
            <span className="text-xs text-rose-300/80">
              Outreach paused to prevent candidate confusion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.activeExceptions.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedRequestId(req.id)}
                className="p-3.5 rounded-xl bg-slate-900 border border-rose-900/50 hover:border-rose-500/80 cursor-pointer transition text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{req.candidateName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-300">
                    {req.blockerType}
                  </span>
                </div>
                <div className="text-slate-400">
                  {req.company} • Owner: <strong>{req.assignedTo}</strong>
                </div>
                <div className="text-rose-200 text-[11px] line-clamp-2">
                  {req.blockerReason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
