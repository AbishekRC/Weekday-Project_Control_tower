/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Download,
  Search,
  FileCheck2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const TestPlanViewer: React.FC = () => {
  const { testSuite, runTests } = useScheduling();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      runTests();
      setIsRunning(false);
    }, 250);
  };

  const handleDownloadReport = () => {
    if (!testSuite) return;
    const reportText = [
      '# WEEKDAY SCHEDULING CONTROL TOWER - QA TEST EXECUTION REPORT',
      `Executed At: ${testSuite.executedAt}`,
      `Total Tests: ${testSuite.total} | Passed: ${testSuite.passed} | Failed: ${testSuite.failed}`,
      `Pass Rate: ${Math.round((testSuite.passed / testSuite.total) * 100)}%`,
      '',
      ...testSuite.results.map(
        (r) =>
          `[${r.status}] ${r.id}: ${r.name}\n  Preconditions: ${r.preconditions}\n  Action: ${r.action}\n  Expected: ${r.expectedResult}\n  Actual: ${r.actualResult}\n  Execution Time: ${r.executionTimeMs}ms\n`
      ),
    ].join('\n');

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QA_Test_Execution_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = (testSuite?.results || []).filter((r) => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.actualResult.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Deliverable 5: Assumptions & Verified Test Plan
              </span>
              <span className="text-xs text-slate-400">19 Explicit Test Specifications</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Automated QA Test Execution Engine
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Every critical scheduling behavior—including Excel multi-sheet ingestion, de-duplication, 24h SLA color bands, follow-up scheduling, booking verification proof, and clock time-travel—is programmatically verified below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing 19 Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run All 19 Tests Live</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Download Markdown Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export QA Report</span>
            </button>
          </div>
        </div>

        {/* Test Summary Banner */}
        {testSuite && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Tests</span>
              <div className="text-2xl font-black text-white">{testSuite.total}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center">
              <span className="text-[10px] text-emerald-300 uppercase font-semibold">Passed</span>
              <div className="text-2xl font-black text-emerald-400">{testSuite.passed}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-center">
              <span className="text-[10px] text-rose-300 uppercase font-semibold">Failed</span>
              <div className="text-2xl font-black text-rose-400">{testSuite.failed}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Pass Rate</span>
              <div className="text-2xl font-black text-emerald-400">
                {Math.round((testSuite.passed / testSuite.total) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter Status:</span>
          {(['ALL', 'PASS', 'FAIL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterStatus === st
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search test case, assertion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Test Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-20">ID</th>
                <th className="py-3 px-3 w-56">Test Case</th>
                <th className="py-3 px-3">Action & Expected Result</th>
                <th className="py-3 px-3">Actual Verified Result</th>
                <th className="py-3 px-3 w-20 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredResults.map((tc) => (
                <tr key={tc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                    {tc.id}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-white text-xs">{tc.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Pre: {tc.preconditions}
                    </div>
                  </td>

                  <td className="py-3 px-3 space-y-1">
                    <div>
                      <span className="text-slate-400 font-semibold">Action:</span>{' '}
                      <span className="text-slate-200">{tc.action}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Expected:</span>{' '}
                      <span className="text-slate-300">{tc.expectedResult}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      {tc.actualResult}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                        tc.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {tc.status === 'PASS' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASS
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-400" /> FAIL
                        </>
                      )}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      {tc.executionTimeMs}ms
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
