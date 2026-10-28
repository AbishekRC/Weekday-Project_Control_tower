/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { Clock, FastForward, RotateCcw, AlertTriangle, Calendar } from 'lucide-react';

export const ClockController: React.FC = () => {
  const { virtualNow, isTimeSimulated, timeOffsetHours, advanceClock, resetClock, setVirtualClock } =
    useScheduling();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDateTime) return;
    const target = new Date(customDateTime);
    if (!isNaN(target.getTime())) {
      setVirtualClock(target);
      setShowDatePicker(false);
    }
  };

  return (
    <div
      className={`border-b px-4 py-2 text-xs transition-colors ${
        isTimeSimulated
          ? 'bg-amber-950/60 border-amber-600/50 text-amber-200'
          : 'bg-slate-900/90 border-slate-800 text-slate-300'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Current Time Display */}
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isTimeSimulated ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            Operations Clock:
          </span>
          <span className="font-mono font-medium text-white px-2 py-0.5 rounded bg-black/40 border border-white/10">
            {formatDateTime(virtualNow)}
          </span>
          {isTimeSimulated ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-3 h-3" />
              SIMULATED (+{timeOffsetHours.toFixed(1)}h)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              LIVE REAL-TIME
            </span>
          )}
        </div>

        {/* Warp Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Time Travel:</span>
          <button
            onClick={() => advanceClock(1)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Advance clock by 1 hour"
          >
            <FastForward className="w-3 h-3" /> +1h
          </button>
          <button
            onClick={() => advanceClock(4)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Advance clock by 4 hours (Trigger Follow-up due)"
          >
            <FastForward className="w-3 h-3 text-amber-400" /> +4h
          </button>
          <button
            onClick={() => advanceClock(12)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Advance clock by 12 hours (Approaching Amber SLA)"
          >
            <FastForward className="w-3 h-3 text-amber-400" /> +12h
          </button>
          <button
            onClick={() => advanceClock(24)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/60 transition"
            title="Advance clock by 24 hours (Trigger Overdue)"
          >
            <FastForward className="w-3 h-3 text-rose-400" /> +24h
          </button>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Pick custom date/time"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {isTimeSimulated && (
            <button
              onClick={resetClock}
              className="flex items-center gap-1 ml-1 px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 transition font-medium"
              title="Reset to current real-world time"
            >
              <RotateCcw className="w-3 h-3" /> Reset Clock
            </button>
          )}
        </div>
      </div>

      {showDatePicker && (
        <form
          onSubmit={handleCustomDateSubmit}
          className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-end gap-2"
        >
          <span className="text-slate-400">Jump to specific time:</span>
          <input
            type="datetime-local"
            value={customDateTime}
            onChange={(e) => setCustomDateTime(e.target.value)}
            className="px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            required
          />
          <button
            type="submit"
            className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
          >
            Set Time
          </button>
          <button
            type="button"
            onClick={() => setShowDatePicker(false)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
