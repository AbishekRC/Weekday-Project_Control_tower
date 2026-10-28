/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { useScheduling } from '../context/SchedulingContext';
import { calculateSla, getSlaBadgeClass } from '../utils/sla';
import { exportToExcel } from '../services/excelService';
import { InterviewRequest, ImportSummaryReport } from '../types';
import {
  Search,
  Filter,
  Download,
  Upload,
  ArrowUpDown,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface CentralTrackerProps {
  onOpenActions: (request: InterviewRequest) => void;
  onOpenDetails: (request: InterviewRequest) => void;
}

export const CentralTracker: React.FC<CentralTrackerProps> = ({
  onOpenActions,
  onOpenDetails,
}) => {
  const { requests, virtualNow, importExcelData, globalSearchQuery, setGlobalSearchQuery } = useScheduling();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<'ALL' | 'Ram' | 'Shyam'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSlaBand, setFilterSlaBand] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'sla_asc' | 'company'>(
    'created_desc'
  );

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<ImportSummaryReport | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter & Sort
  const filteredRequests = useMemo(() => {
    const activeQuery = (globalSearchQuery || searchQuery).trim().toLowerCase();

    return requests
      .filter((r) => {
        // Search
        if (activeQuery) {
          const rowIdStr = r.sourceRowNumber.toString();
          const matches =
            r.id.toLowerCase().includes(activeQuery) ||
            r.candidateName.toLowerCase().includes(activeQuery) ||
            r.candidateEmail.toLowerCase().includes(activeQuery) ||
            r.candidatePhone.toLowerCase().includes(activeQuery) ||
            r.company.toLowerCase().includes(activeQuery) ||
            r.interviewerName.toLowerCase().includes(activeQuery) ||
            r.interviewRound.toLowerCase().includes(activeQuery) ||
            rowIdStr === activeQuery ||
            `#${rowIdStr}` === activeQuery ||
            `row ${rowIdStr}` === activeQuery ||
            r.status.toLowerCase().includes(activeQuery);
          if (!matches) return false;
        }

        // Assignee
        if (filterAssignee !== 'ALL' && r.assignedTo !== filterAssignee) {
          return false;
        }

        // Status
        if (filterStatus !== 'ALL') {
          if (filterStatus === 'BOOKED' && r.bookingStatus !== 'BOOKED') return false;
          if (filterStatus === 'UNBOOKED' && r.bookingStatus === 'BOOKED') return false;
          if (filterStatus !== 'BOOKED' && filterStatus !== 'UNBOOKED' && r.status !== filterStatus) {
            return false;
          }
        }

        // SLA Band
        if (filterSlaBand !== 'ALL') {
          const sla = calculateSla(r.originalCreatedAt, virtualNow);
          if (sla.band !== filterSlaBand) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'created_desc') {
          return new Date(b.originalCreatedAt).getTime() - new Date(a.originalCreatedAt).getTime();
        }
        if (sortBy === 'created_asc') {
          return new Date(a.originalCreatedAt).getTime() - new Date(b.originalCreatedAt).getTime();
        }
        if (sortBy === 'sla_asc') {
          const slaA = calculateSla(a.originalCreatedAt, virtualNow).timeRemainingMs;
          const slaB = calculateSla(b.originalCreatedAt, virtualNow).timeRemainingMs;
          return slaA - slaB;
        }
        if (sortBy === 'company') {
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [requests, searchQuery, filterAssignee, filterStatus, filterSlaBand, sortBy, virtualNow]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        try {
          const report = importExcelData(buffer);
          setImportReport(report);
        } catch (err: unknown) {
          alert(`Import error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Central Intake & Scheduling Tracker
          </h2>
          <p className="text-xs text-slate-400">
            {requests.length} total imported requests • Preserving original timestamps, source row IDs, and 50/50 intern assignment
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* File Upload Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportToExcel(requests)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Tracker</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Excel Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
        }`}
      >
        <p className="text-xs">
          Drag & Drop <strong>Scheduling ToDos.xlsx</strong> here or click to browse. Reads sheets: <em>INPUT Interview Requests</em>, <em>OUTPUT ToDos for Ram</em>, <em>OUTPUT ToDos for Shyam</em>.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate, company, round, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Assignee */}
          <div>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value as 'ALL' | 'Ram' | 'Shyam')}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Interns (Ram & Shyam)</option>
              <option value="Ram">Ram Only</option>
              <option value="Shyam">Shyam Only</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNCONTACTED">Uncontacted</option>
              <option value="OUTREACH_SENT">Outreach Sent</option>
              <option value="FOLLOW_UP_DUE">Follow-up Due</option>
              <option value="BOOKED">Verified Booked</option>
              <option value="UNBOOKED">Unbooked Only</option>
              <option value="AT_RISK">At Risk (&lt;4h)</option>
              <option value="OVERDUE">Overdue (&gt;24h)</option>
              <option value="BLOCKED_EXCEPTION">Exceptions / Blockers</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="created_desc">Newest Created First</option>
              <option value="created_asc">Oldest Created First</option>
              <option value="sla_asc">SLA Urgency (Least time left)</option>
              <option value="company">Company (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>
            Showing <strong>{filteredRequests.length}</strong> of <strong>{requests.length}</strong> records
          </span>
          {(searchQuery || globalSearchQuery || filterAssignee !== 'ALL' || filterStatus !== 'ALL' || filterSlaBand !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setGlobalSearchQuery('');
                setFilterAssignee('ALL');
                setFilterStatus('ALL');
                setFilterSlaBand('ALL');
              }}
              className="text-cyan-400 hover:underline"
            >
              Reset Filters {globalSearchQuery && `(including "${globalSearchQuery}")`}
            </button>
          )}
        </div>
      </div>

      {/* Main Request Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-16">Row #</th>
                <th className="py-3 px-3">Candidate & Contact</th>
                <th className="py-3 px-3">Company & Round</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">SLA Countdown</th>
                <th className="py-3 px-3">Next Action</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching candidate requests found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const sla = calculateSla(req.originalCreatedAt, virtualNow);
                  const badgeStyle = getSlaBadgeClass(sla.band);

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-3 font-mono text-slate-400">
                        #{req.sourceRowNumber}
                      </td>

                      <td className="py-3 px-3">
                        <div
                          onClick={() => onOpenDetails(req)}
                          className="font-bold text-white hover:text-cyan-300 cursor-pointer transition"
                        >
                          {req.candidateName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                          {req.candidateEmail}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{req.company}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {req.interviewRound}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            req.assignedTo === 'Ram'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {req.assignedTo}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {req.bookingStatus === 'BOOKED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" /> BOOKED
                          </span>
                        ) : req.status === 'BLOCKED_EXCEPTION' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <AlertTriangle className="w-3 h-3" /> BLOCKER
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                            {req.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${badgeStyle.badge}`}
                        >
                          {sla.formattedRemaining}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="text-slate-300 text-[11px] truncate" title={req.nextAction}>
                          {req.nextAction}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <a
                          href={req.calendlyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                          title="Open Calendly URL"
                        >
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                          <span className="hidden lg:inline">Calendly</span>
                        </a>

                        <button
                          onClick={() => onOpenActions(req)}
                          className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold shadow-md shadow-cyan-900/30 transition"
                        >
                          Action
                        </button>

                        <button
                          onClick={() => onOpenDetails(req)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Summary Modal */}
      {importReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Excel Import Summary
              </h3>
              <button
                onClick={() => setImportReport(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Total Rows Read:</span>
                <div className="text-lg font-bold text-white">{importReport.totalRowsRead}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                <span className="text-emerald-300">Successfully Imported:</span>
                <div className="text-lg font-bold text-emerald-400">{importReport.importedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40">
                <span className="text-amber-300">Duplicates Skipped:</span>
                <div className="text-lg font-bold text-amber-400">{importReport.duplicatesSkipped}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40">
                <span className="text-rose-300">Rejected / Blank:</span>
                <div className="text-lg font-bold text-rose-400">{importReport.rejectedCount}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="font-semibold text-slate-300 mb-1">Intern 50/50 Division:</div>
              <div className="text-slate-400">
                Assigned to Ram: <strong className="text-white">{importReport.assignedRam}</strong> |{' '}
                Assigned to Shyam: <strong className="text-white">{importReport.assignedShyam}</strong>
              </div>
            </div>

            {importReport.targetSheetName && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">
                  Target Sheet Parsed: <strong className="text-cyan-300 font-mono">{importReport.targetSheetName}</strong>
                </div>
                {importReport.sheetNamesDetected && importReport.sheetNamesDetected.length > 1 && (
                  <div className="text-[11px] text-slate-500">
                    All sheets found: {importReport.sheetNamesDetected.join(', ')}
                  </div>
                )}
                {importReport.detectedHeaders && importReport.detectedHeaders.length > 0 && (
                  <div className="text-[11px] text-slate-400 truncate max-w-md pt-1">
                    Mapped columns: {importReport.detectedHeaders.slice(0, 7).join(', ')}
                    {importReport.detectedHeaders.length > 7 && '...'}
                  </div>
                )}
              </div>
            )}

            {importReport.warnings.length > 0 && (
              <div className="max-h-32 overflow-y-auto p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200 space-y-1">
                <div className="font-bold text-rose-400">Validation Warnings:</div>
                {importReport.warnings.map((w, idx) => (
                  <div key={idx} className="text-[11px]">{w}</div>
                ))}
              </div>
            )}

            <button
              onClick={() => setImportReport(null)}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Close & View Tracker
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
