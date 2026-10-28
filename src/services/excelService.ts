/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { ImportSummaryReport, InterviewRequest } from '../types';

export function parseExcelDate(val: unknown): string {
  if (!val) return new Date().toISOString();

  if (val instanceof Date) {
    return val.toISOString();
  }

  if (typeof val === 'number') {
    // Excel date serial number (days since 1899-12-30)
    const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
  }

  if (typeof val === 'string') {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Normalizes string keys to lowercase alphanumeric for robust header matching
 */
function normalizeHeader(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseWorkbookData(
  fileBuffer: ArrayBuffer,
  existingRequests: InterviewRequest[]
): {
  newRequests: InterviewRequest[];
  report: ImportSummaryReport;
} {
  const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;

  // Prefer "INPUT Interview Requests", or any sheet containing "input" / "request", or the first sheet
  const targetSheetName =
    sheetNames.find((s) => {
      const lower = s.toLowerCase();
      return lower.includes('input') || lower.includes('request') || lower.includes('interview');
    }) || sheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    throw new Error(`Target worksheet "${targetSheetName}" could not be read.`);
  }

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
  });

  const detectedHeaders = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  // Demo seed rows must not block importing the assignment workbook.
  // The source workbook can legitimately contain repeated candidate/company/round
  // combinations, so use the source sheet + row number for re-import protection.
  const importedRequests = existingRequests.filter((r) => !r.isDemoData);
  const existingSourceRows = new Set(
    importedRequests
      .map((r) => {
        const match = r.notes?.match(/Imported from sheet "(.+)", row #(\d+)/);
        return match ? `${match[1]}|${match[2]}` : '';
      })
      .filter(Boolean)
  );

  const newRequests: InterviewRequest[] = [];
  const warnings: string[] = [];
  let duplicatesSkipped = 0;
  let rejectedCount = 0;
  let assignedRam = 0;
  let assignedShyam = 0;

  rawRows.forEach((row, index) => {
    const sourceRowNumber = index + 2; // Accounting for 1-indexed header

    // Map fields flexibly across variations
    const normRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normRow[normalizeHeader(k)] = v;
    }

    // Candidate Name
    let candidateName = String(
      normRow['candidatename'] ||
        normRow['name'] ||
        normRow['candidate'] ||
        normRow['applicant'] ||
        normRow['student'] ||
        normRow['fullname'] ||
        normRow['person'] ||
        ''
    ).trim();

    // Candidate Email
    let candidateEmail = String(
      normRow['candidateemail'] ||
        normRow['email'] ||
        normRow['emailaddress'] ||
        normRow['contactemail'] ||
        normRow['mail'] ||
        normRow['candidateemailid'] ||
        ''
    ).trim();

    // If email wasn't found by known header, scan values for an '@' symbol
    if (!candidateEmail) {
      for (const val of Object.values(row)) {
        const strVal = String(val).trim();
        if (strVal.includes('@') && strVal.includes('.')) {
          candidateEmail = strVal;
          break;
        }
      }
    }

    // If candidate name is empty but email exists, synthesize name from email
    if (!candidateName && candidateEmail) {
      const handle = candidateEmail.split('@')[0];
      candidateName = handle
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Candidate Phone
    const candidatePhone = String(
      normRow['candidatephone'] ||
        normRow['phone'] ||
        normRow['phonenumber'] ||
        normRow['contact'] ||
        normRow['mobile'] ||
        normRow['contactnumber'] ||
        normRow['cell'] ||
        '+1 (555) 000-0000'
    ).trim();

    // Company
    const company = String(
      normRow['company'] ||
        normRow['companyname'] ||
        normRow['client'] ||
        normRow['partner'] ||
        normRow['organization'] ||
        normRow['employer'] ||
        'Partner Co'
    ).trim();

    // Interviewer Name
    const interviewerName = String(
      normRow['interviewername'] ||
        normRow['interviewer'] ||
        normRow['interviewerfullname'] ||
        normRow['hiringmanager'] ||
        'Engineering Team'
    ).trim();

    // Interviewer Email
    const interviewerEmail = String(
      normRow['intervieweremail'] ||
        normRow['interviewermail'] ||
        normRow['hiringmanageremail'] ||
        'interviews@example.com'
    ).trim();

    // Interview Round
    const interviewRound = String(
      normRow['interviewround'] ||
        normRow['round'] ||
        normRow['stage'] ||
        normRow['interviewtype'] ||
        normRow['type'] ||
        normRow['level'] ||
        'Round 1 - Technical Screen'
    ).trim();

    // Calendly URL
    const calendlyField = String(
      normRow['calendlyurl'] ||
        normRow['calendlylink'] ||
        normRow['calendly'] ||
        normRow['schedulinglink'] ||
        normRow['link'] ||
        normRow['url'] ||
        normRow['bookinglink'] ||
        ''
    ).trim();

    // The assigned workbook stores per-round links in a multiline "Scheduling method"
    // cell. Extract the matching round entry when present; do not invent a URL when
    // the workbook contains only a placeholder such as <calendly_link>.
    const schedulingMethod = String(normRow['schedulingmethod'] || '').trim();
    const roundMatch = schedulingMethod
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*(Round\s*\d+)\s*:\s*(.*?)\s*$/i))
      .find((match) => match && normalizeHeader(match[1]) === normalizeHeader(interviewRound));
    const calendlyUrl = calendlyField || (roundMatch ? roundMatch[2] : '').trim();

    // Request Created At timestamp
    const rawCreatedAt =
      normRow['createdat'] ||
      normRow['requestdate'] ||
      normRow['requestcreationtime'] ||
      normRow['timestamp'] ||
      normRow['date'] ||
      normRow['creationdate'] ||
      normRow['requestedat'] ||
      normRow['time'] ||
      normRow['createdtime'] ||
      normRow['addedon'];

    // Validation checks
    if (!candidateEmail) {
      rejectedCount++;
      warnings.push(`Row ${sourceRowNumber}: Skipped due to missing candidate email.`);
      return;
    }

    // Skip only a row that has already been imported from the same source sheet
    // and row number. Do not collapse distinct source rows just because candidate,
    // company and round happen to match.
    const sourceKey = `${targetSheetName}|${sourceRowNumber}`;
    if (existingSourceRows.has(sourceKey)) {
      duplicatesSkipped++;
      return;
    }

    // Check Calendly link
    const isValidUrl = calendlyUrl.startsWith('http://') || calendlyUrl.startsWith('https://');
    if (!isValidUrl && calendlyUrl) {
      warnings.push(`Row ${sourceRowNumber} (${candidateName}): Invalid Calendly URL format ("${calendlyUrl}").`);
    }

    // Check if row already has explicit intern assignment
    const explicitOwner = String(
      normRow['assignedto'] || normRow['owner'] || normRow['intern'] || ''
    ).trim().toLowerCase();

    let assignedTo: 'Ram' | 'Shyam';
    if (explicitOwner === 'ram' || explicitOwner.includes('ram')) {
      assignedTo = 'Ram';
      assignedRam++;
    } else if (explicitOwner === 'shyam' || explicitOwner.includes('shyam')) {
      assignedTo = 'Shyam';
      assignedShyam++;
    } else {
      // Deterministic round-robin 50/50 assignment
      assignedTo = (importedRequests.length + newRequests.length) % 2 === 0 ? 'Ram' : 'Shyam';
      if (assignedTo === 'Ram') assignedRam++;
      else assignedShyam++;
    }

    const originalCreatedAt = parseExcelDate(rawCreatedAt);
    const isMissingLink = !calendlyUrl || !isValidUrl;

    const request: InterviewRequest = {
      id: `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      sourceRowNumber,
      candidateName: candidateName || 'Candidate',
      candidateEmail,
      candidatePhone,
      company,
      interviewerName,
      interviewerEmail,
      interviewRound,
      calendlyUrl: isValidUrl ? calendlyUrl : '',
      originalCreatedAt,
      assignedTo,
      status: isMissingLink ? 'BLOCKED_EXCEPTION' : 'UNCONTACTED',
      priority: 'NORMAL',
      nextAction: isMissingLink ? 'Resolve missing/broken Calendly link' : 'Send approved Initial Outreach Email',
      nextActionDueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      bookingStatus: 'NOT_BOOKED',
      blockerReason: isMissingLink ? 'Missing or malformed Calendly URL provided by partner' : undefined,
      blockerType: isMissingLink ? 'INVALID_LINK' : undefined,
      notes: `Imported from sheet "${targetSheetName}", row #${sourceRowNumber}`,
      isDemoData: false,
    };

    existingSourceRows.add(sourceKey);
    newRequests.push(request);
  });

  const report: ImportSummaryReport = {
    totalRowsRead: rawRows.length,
    importedCount: newRequests.length,
    duplicatesSkipped,
    rejectedCount,
    warnings,
    assignedRam,
    assignedShyam,
    timestamp: new Date().toISOString(),
    sheetNamesDetected: sheetNames,
    targetSheetName,
    detectedHeaders,
  };

  return { newRequests, report };
}

/**
 * Exports the current central tracker to an Excel workbook with sheets:
 * 1. INPUT Interview Requests
 * 2. OUTPUT ToDos for Ram
 * 3. OUTPUT ToDos for Shyam
 */
export function exportToExcel(requests: InterviewRequest[]): void {
  const wb = XLSX.utils.book_new();

  const mapRequestToRow = (r: InterviewRequest) => ({
    'Source Row': r.sourceRowNumber,
    'Candidate Name': r.candidateName,
    'Candidate Email': r.candidateEmail,
    'Candidate Phone': r.candidatePhone,
    'Company': r.company,
    'Interviewer': r.interviewerName,
    'Interview Round': r.interviewRound,
    'Calendly Link': r.calendlyUrl,
    'Request Created At': r.originalCreatedAt,
    'Assigned To': r.assignedTo,
    'Status': r.status,
    'Priority': r.priority,
    'Booking Status': r.bookingStatus,
    'Next Action': r.nextAction,
    'Next Action Due': r.nextActionDueAt || '',
    'Notes': r.notes || '',
  });

  const allRows = requests.map(mapRequestToRow);
  const ramRows = requests.filter((r) => r.assignedTo === 'Ram').map(mapRequestToRow);
  const shyamRows = requests.filter((r) => r.assignedTo === 'Shyam').map(mapRequestToRow);

  const wsAll = XLSX.utils.json_to_sheet(allRows);
  const wsRam = XLSX.utils.json_to_sheet(ramRows);
  const wsShyam = XLSX.utils.json_to_sheet(shyamRows);

  XLSX.utils.book_append_sheet(wb, wsAll, 'INPUT Interview Requests');
  XLSX.utils.book_append_sheet(wb, wsRam, 'OUTPUT ToDos for Ram');
  XLSX.utils.book_append_sheet(wb, wsShyam, 'OUTPUT ToDos for Shyam');

  XLSX.writeFile(wb, `Weekday_Scheduling_Tracker_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
