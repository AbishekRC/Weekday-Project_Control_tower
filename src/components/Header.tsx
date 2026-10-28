/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { ViewTab } from '../types';
import { calculateSla, getDynamicStatus } from '../utils/sla';
import {
  LayoutDashboard,
  TableProperties,
  UserCheck,
  PlayCircle,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Search,
  X,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    requests,
    virtualNow,
    testSuite,
    resetAllData,
    globalSearchQuery,
    setGlobalSearchQuery,
    matchingGlobalRequests,
    setSelectedRequestId,
  } = useScheduling();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Compute pending actionable tasks for Ram & Shyam
  const ramPending = requests.filter((r) => {
    if (r.assignedTo !== 'Ram') return false;
    const status = getDynamicStatus(r, virtualNow);
    return (
      status === 'UNCONTACTED' ||
      status === 'FOLLOW_UP_DUE' ||
      status === 'AT_RISK' ||
      status === 'OVERDUE'
    );
  }).length;

  const shyamPending = requests.filter((r) => {
    if (r.assignedTo !== 'Shyam') return false;
    const status = getDynamicStatus(r, virtualNow);
    return (
      status === 'UNCONTACTED' ||
      status === 'FOLLOW_UP_DUE' ||
      status === 'AT_RISK' ||
      status === 'OVERDUE'
    );
  }).length;

  const navItems: Array<{
    id: ViewTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'management',
      label: 'Control Tower',
      icon: LayoutDashboard,
    },
    {
      id: 'tracker',
      label: 'Central Tracker',
      icon: TableProperties,
      badge: requests.length,
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'ram',
      label: "Ram's Workbench",
      icon: UserCheck,
      badge: ramPending,
      badgeColor: ramPending > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : undefined,
    },
    {
      id: 'shyam',
      label: "Shyam's Workbench",
      icon: UserCheck,
      badge: shyamPending,
      badgeColor: shyamPending > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : undefined,
    },
    {
      id: 'demo',
      label: 'Demo Center',
      icon: PlayCircle,
      badge: 'Interactive',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold',
    },
    {
      id: 'sop',
      label: 'Scheduling SOP',
      icon: BookOpen,
    },
    {
      id: 'test_plan',
      label: 'QA Test Plan',
      icon: CheckCircle2,
      badge: testSuite ? `${testSuite.passed}/${testSuite.total}` : '19/19',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
  ];

  const handleConfirmReset = () => {
    resetAllData();
    setShowResetConfirm(false);
  };

  return (
    <>
      <header className="bg-slate-950 border-b border-slate-800 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base tracking-tight text-white">
                    Weekday <span className="text-cyan-400 font-medium">Control Tower</span>
                  </h1>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                    MVP v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Candidate Interview Scheduling & 24h SLA Operations
                </p>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="relative flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Global search: candidate, #row, company, or ID..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => {
                    if (globalSearchQuery.trim()) setShowSearchDropdown(true);
                  }}
                  className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none transition shadow-inner"
                />
                {globalSearchQuery && (
                  <button
                    onClick={() => {
                      setGlobalSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live Search Results Dropdown */}
              {showSearchDropdown && globalSearchQuery.trim() && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSearchDropdown(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-80 flex flex-col">
                    <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Found <strong className="text-cyan-400">{matchingGlobalRequests.length}</strong> matching request(s)
                      </span>
                      <button
                        onClick={() => {
                          setActiveView('tracker');
                          setShowSearchDropdown(false);
                        }}
                        className="text-cyan-400 hover:underline font-semibold"
                      >
                        View in Tracker →
                      </button>
                    </div>

                    <div className="overflow-y-auto divide-y divide-slate-800/80">
                      {matchingGlobalRequests.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No candidate requests matching &quot;{globalSearchQuery}&quot;
                        </div>
                      ) : (
                        matchingGlobalRequests.slice(0, 8).map((req) => {
                          const sla = calculateSla(req.originalCreatedAt, virtualNow);
                          return (
                            <div
                              key={req.id}
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setShowSearchDropdown(false);
                              }}
                              className="p-2.5 hover:bg-slate-800/60 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    #{req.sourceRowNumber}
                                  </span>
                                  <span className="font-bold text-white truncate">
                                    {req.candidateName}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      req.assignedTo === 'Ram'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-cyan-500/20 text-cyan-300'
                                    }`}
                                  >
                                    {req.assignedTo}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {req.company} • {req.interviewRound}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    sla.band === 'OVERDUE'
                                      ? 'bg-red-600 text-white'
                                      : sla.band === 'RED'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : sla.band === 'AMBER'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {sla.formattedRemaining}
                                </span>
                                <div className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">
                                  {req.status}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
                title="Reset application to initial seed state"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Reset Demo Data</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none border-t border-slate-900 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg transition whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'border-cyan-400 text-cyan-300 bg-slate-900/80 shadow-sm'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        item.badgeColor || 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-400" />
              Reset All Application State?
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This will restore all candidate interview requests to their initial seed state, reset the operations clock to real time, and clear custom uploads. This is recommended before running an interview demonstration.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition shadow-lg shadow-rose-900/30"
              >
                Yes, Reset State
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
