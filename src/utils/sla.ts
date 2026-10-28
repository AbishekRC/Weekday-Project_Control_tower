/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InterviewRequest, SlaBand, SlaCalculation } from '../types';

export const SLA_WINDOW_HOURS = 24;
export const SLA_WINDOW_MS = SLA_WINDOW_HOURS * 60 * 60 * 1000;

export function calculateSla(
  createdDateStr: string,
  nowDate: Date = new Date()
): SlaCalculation {
  const createdDate = new Date(createdDateStr);
  const deadline = new Date(createdDate.getTime() + SLA_WINDOW_MS);
  const nowMs = nowDate.getTime();
  const timeRemainingMs = deadline.getTime() - nowMs;
  const hoursRemaining = timeRemainingMs / (1000 * 60 * 60);

  const isBreached = timeRemainingMs <= 0;
  const ageMs = nowMs - createdDate.getTime();
  const isMature = ageMs >= SLA_WINDOW_MS;

  let band: SlaBand = 'GREEN';
  if (isBreached) {
    band = 'OVERDUE';
  } else if (hoursRemaining < 4) {
    band = 'RED';
  } else if (hoursRemaining <= 12) {
    band = 'AMBER';
  } else {
    band = 'GREEN';
  }

  // Format remaining time nicely
  let formattedRemaining: string;
  const absRemainingMs = Math.abs(timeRemainingMs);
  const totalMins = Math.floor(absRemainingMs / (1000 * 60));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (isBreached) {
    formattedRemaining = `Overdue by ${hrs}h ${mins}m`;
  } else {
    formattedRemaining = `${hrs}h ${mins}m left`;
  }

  return {
    timeRemainingMs,
    hoursRemaining,
    formattedRemaining,
    band,
    isMature,
    isBreached,
    deadlineIso: deadline.toISOString(),
  };
}

/**
 * Returns dynamic status of a request relative to the current virtual clock.
 * E.g., if clock has advanced past follow-up due time or past SLA, dynamically flags status.
 */
export function getDynamicStatus(
  request: InterviewRequest,
  nowDate: Date
): InterviewRequest['status'] {
  // Terminal or blocked states don't automatically override
  if (
    request.status === 'BOOKED' ||
    request.status === 'WITHDRAWN' ||
    request.status === 'CANCELLED' ||
    request.status === 'BLOCKED_EXCEPTION'
  ) {
    return request.status;
  }

  const sla = calculateSla(request.originalCreatedAt, nowDate);

  if (sla.isBreached) {
    return 'OVERDUE';
  }

  if (sla.hoursRemaining < 4) {
    return 'AT_RISK';
  }

  if (request.nextActionDueAt && nowDate >= new Date(request.nextActionDueAt)) {
    return 'FOLLOW_UP_DUE';
  }

  return request.status;
}

export function getSlaBadgeClass(band: SlaBand): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (band) {
    case 'GREEN':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    case 'AMBER':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    case 'RED':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
      };
    case 'OVERDUE':
      return {
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        border: 'border-red-600/50',
        badge: 'bg-red-600 text-white font-semibold border-red-500',
      };
  }
}
