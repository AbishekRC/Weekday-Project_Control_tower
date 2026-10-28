/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InterviewRequest, ContactAttempt, AuditLogEntry } from '../types';

export function generateSeedData(referenceDate: Date = new Date()): {
  requests: InterviewRequest[];
  contactAttempts: ContactAttempt[];
  auditLogs: AuditLogEntry[];
} {
  const refMs = referenceDate.getTime();
  const hoursAgo = (h: number) => new Date(refMs - h * 60 * 60 * 1000).toISOString();
  const hoursAhead = (h: number) => new Date(refMs + h * 60 * 60 * 1000).toISOString();

  const rawSeeds: Array<{
    name: string;
    email: string;
    phone: string;
    company: string;
    interviewer: string;
    round: string;
    calendly: string;
    createdHoursAgo: number;
    status: InterviewRequest['status'];
    priority: InterviewRequest['priority'];
    nextAction: string;
    nextDueHoursAhead?: number;
    blockerReason?: string;
    blockerType?: InterviewRequest['blockerType'];
    isBooked?: boolean;
    bookedHoursAgo?: number;
    notes?: string;
  }> = [
    // 1. Fresh Requests (Green, >12h left)
    {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+1 (415) 890-1201',
      company: 'Stripe',
      interviewer: 'David Chen (Staff Infra Eng)',
      round: 'Round 1 - Distributed Systems',
      calendly: 'https://calendly.com/stripe-interviews/infra-chen',
      createdHoursAgo: 1.5,
      status: 'UNCONTACTED',
      priority: 'NORMAL',
      nextAction: 'Send approved Initial Outreach Email',
      nextDueHoursAhead: 0.5,
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+1 (415) 890-1202',
      company: 'Airbnb',
      interviewer: 'Sarah Jenkins (Eng Manager)',
      round: 'Round 2 - Product Architecture',
      calendly: 'https://calendly.com/airbnb-talent/sarah-j',
      createdHoursAgo: 2.2,
      status: 'UNCONTACTED',
      priority: 'NORMAL',
      nextAction: 'Send approved Initial Outreach Email',
      nextDueHoursAhead: 0.8,
    },
    {
      name: 'Rohan Gupta',
      email: 'rohan.gupta@example.com',
      phone: '+1 (415) 890-1203',
      company: 'Databricks',
      interviewer: 'Alex Rivera (Principal Engineer)',
      round: 'Round 1 - Data Structures & Algorithms',
      calendly: 'https://calendly.com/databricks-eng/alex-rivera',
      createdHoursAgo: 3.5,
      status: 'OUTREACH_SENT',
      priority: 'NORMAL',
      nextAction: 'Monitor booking status; Follow-up #1 scheduled',
      nextDueHoursAhead: 2.5,
    },
    {
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@example.com',
      phone: '+1 (415) 890-1204',
      company: 'Figma',
      interviewer: 'Elena Rostova (Lead Designer & Eng)',
      round: 'Round 1 - Canvas Engine Fundamentals',
      calendly: 'https://calendly.com/figma-hiring/elena-rostova',
      createdHoursAgo: 4.0,
      status: 'OUTREACH_SENT',
      priority: 'NORMAL',
      nextAction: 'Follow-up #1 due soon if unbooked',
      nextDueHoursAhead: 1.0,
    },
    {
      name: 'Karan Malhotra',
      email: 'karan.malhotra@example.com',
      phone: '+1 (415) 890-1205',
      company: 'Snowflake',
      interviewer: 'Markus Weber (Core DB Architect)',
      round: 'Round 2 - Query Optimizer Deep Dive',
      calendly: 'https://calendly.com/snowflake-interviews/weber-m',
      createdHoursAgo: 5.5,
      status: 'OUTREACH_SENT',
      priority: 'NORMAL',
      nextAction: 'Check candidate response inbox',
      nextDueHoursAhead: 3.0,
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      phone: '+1 (415) 890-1206',
      company: 'Rippling',
      interviewer: 'Anita Roy (Director of Eng)',
      round: 'Round 1 - Technical Screen',
      calendly: 'https://calendly.com/rippling-eng/anita-r',
      createdHoursAgo: 6.0,
      status: 'OUTREACH_SENT',
      priority: 'NORMAL',
      nextAction: 'Follow-up Reminder #1 due',
      nextDueHoursAhead: 0.2,
    },
    {
      name: 'Vikram Joshi',
      email: 'vikram.joshi@example.com',
      phone: '+1 (415) 890-1207',
      company: 'Notion',
      interviewer: 'Kenji Sato (Sync Engine Lead)',
      round: 'Round 1 - Collaborative State & CRDTs',
      calendly: 'https://calendly.com/notion-team/kenji-s',
      createdHoursAgo: 8.0,
      status: 'OUTREACH_SENT',
      priority: 'NORMAL',
      nextAction: 'Follow-up Reminder #1 pending response',
      nextDueHoursAhead: 1.5,
    },
    {
      name: 'Meera Iyer',
      email: 'meera.iyer@example.com',
      phone: '+1 (415) 890-1208',
      company: 'Vercel',
      interviewer: 'Guillermo Vance (Platform VP)',
      round: 'Round 2 - Edge Compute Runtime',
      calendly: 'https://calendly.com/vercel-hiring/platform-vance',
      createdHoursAgo: 9.5,
      status: 'OUTREACH_SENT',
      priority: 'NORMAL',
      nextAction: 'Scheduled phone check-in attempt',
      nextDueHoursAhead: 1.0,
    },

    // 2. Approaching SLA (Amber, 4-12h left)
    {
      name: 'Aditya Nair',
      email: 'aditya.nair@example.com',
      phone: '+1 (415) 890-1209',
      company: 'Supabase',
      interviewer: 'Thorsten Ball (Lead Systems Eng)',
      round: 'Round 1 - Postgres Internals',
      calendly: 'https://calendly.com/supabase-jobs/thorsten-b',
      createdHoursAgo: 13.5, // 10.5h left
      status: 'FOLLOW_UP_DUE',
      priority: 'HIGH',
      nextAction: 'Direct Voice Outreach (Phone Call Attempt #1)',
      nextDueHoursAhead: -0.5,
    },
    {
      name: 'Divya Rao',
      email: 'divya.rao@example.com',
      phone: '+1 (415) 890-1210',
      company: 'Brex',
      interviewer: 'Felipe Santos (Fintech Core Lead)',
      round: 'Round 2 - Ledger & Payment Rails',
      calendly: 'https://calendly.com/brex-hiring/felipe-s',
      createdHoursAgo: 15.0, // 9.0h left
      status: 'FOLLOW_UP_DUE',
      priority: 'HIGH',
      nextAction: 'Phone call attempt + SMS booking reminder',
      nextDueHoursAhead: -1.0,
    },
    {
      name: 'Arjun Singhania',
      email: 'arjun.singhania@example.com',
      phone: '+1 (415) 890-1211',
      company: 'Ramp',
      interviewer: 'Jessica Miller (Head of Security)',
      round: 'Round 1 - AppSec & Cryptography',
      calendly: 'https://calendly.com/ramp-jobs/jessica-m',
      createdHoursAgo: 16.5, // 7.5h left
      status: 'FOLLOW_UP_DUE',
      priority: 'HIGH',
      nextAction: 'Second phone call attempt required',
      nextDueHoursAhead: -2.0,
    },
    {
      name: 'Kavita Menon',
      email: 'kavita.menon@example.com',
      phone: '+1 (415) 890-1212',
      company: 'Linear',
      interviewer: 'Karri Saarinen (Co-Founder & Design)',
      round: 'Round 2 - High-Performance UI',
      calendly: 'https://calendly.com/linear-team/karri-s',
      createdHoursAgo: 18.0, // 6.0h left
      status: 'FOLLOW_UP_DUE',
      priority: 'HIGH',
      nextAction: 'Urgent email nudge: SLA expires in 6 hours',
      nextDueHoursAhead: -1.5,
    },
    {
      name: 'Nikhil Verma',
      email: 'nikhil.verma@example.com',
      phone: '+1 (415) 890-1213',
      company: 'Retool',
      interviewer: 'Clark Kent (Frontend Infra Architect)',
      round: 'Round 1 - Component Sandbox Architecture',
      calendly: 'https://calendly.com/retool-eng/clark-k',
      createdHoursAgo: 19.5, // 4.5h left
      status: 'AT_RISK',
      priority: 'HIGH',
      nextAction: 'Immediate phone outreach before Amber threshold expires',
      nextDueHoursAhead: -2.5,
    },

    // 3. Urgent / Red (<4h left)
    {
      name: 'Tanvi Saxena',
      email: 'tanvi.saxena@example.com',
      phone: '+1 (415) 890-1214',
      company: 'DoorDash',
      interviewer: 'Brian O’Connor (Dispatch Algorithms)',
      round: 'Round 2 - Routing Optimization',
      calendly: 'https://calendly.com/doordash-eng/brian-oc',
      createdHoursAgo: 21.0, // 3.0h left
      status: 'AT_RISK',
      priority: 'URGENT',
      nextAction: 'ESCALATION: Alert Manager + Final Voice Call Attempt',
      nextDueHoursAhead: -3.0,
    },
    {
      name: 'Kabir Kapoor',
      email: 'kabir.kapoor@example.com',
      phone: '+1 (415) 890-1215',
      company: 'Datadog',
      interviewer: 'Jean-Luc Picard (Telemetry Lead)',
      round: 'Round 1 - High-Throughput Streaming',
      calendly: 'https://calendly.com/datadog-careers/jean-luc',
      createdHoursAgo: 22.5, // 1.5h left
      status: 'AT_RISK',
      priority: 'URGENT',
      nextAction: 'CRITICAL: 90m SLA window. Manager intervention requested.',
      nextDueHoursAhead: -4.0,
    },
    {
      name: 'Ishaan Aggarwal',
      email: 'ishaan.aggarwal@example.com',
      phone: '+1 (415) 890-1216',
      company: 'Uber',
      interviewer: 'Maya Lin (Staff Marketplace Systems)',
      round: 'Round 2 - Dynamic Pricing Engine',
      calendly: 'https://calendly.com/uber-eng/maya-lin',
      createdHoursAgo: 23.2, // 48m left
      status: 'AT_RISK',
      priority: 'URGENT',
      nextAction: 'EMERGENCY SLA ESCALATION: Candidate contact pending',
      nextDueHoursAhead: -4.5,
    },

    // 4. Overdue (>24h elapsed, unbooked)
    {
      name: 'Siddharth Roy',
      email: 'siddharth.roy@example.com',
      phone: '+1 (415) 890-1217',
      company: 'Coinbase',
      interviewer: 'Nakamoto Satoshi (Blockchain Protocols)',
      round: 'Round 1 - Consensus Algorithms',
      calendly: 'https://calendly.com/coinbase-talent/nakamoto',
      createdHoursAgo: 26.0, // 2h overdue
      status: 'OVERDUE',
      priority: 'URGENT',
      nextAction: 'OVERDUE: Daily ops review; ping partner coordinator',
      nextDueHoursAhead: -6.0,
    },
    {
      name: 'Riya Sen',
      email: 'riya.sen@example.com',
      phone: '+1 (415) 890-1218',
      company: 'Airbnb',
      interviewer: 'Chad Hurley (Host Platform Eng)',
      round: 'Round 1 - Graph Schema Design',
      calendly: 'https://calendly.com/airbnb-talent/chad-h',
      createdHoursAgo: 31.0, // 7h overdue
      status: 'OVERDUE',
      priority: 'URGENT',
      nextAction: 'OVERDUE: Candidate unresponsive; 3 call attempts logged',
      nextDueHoursAhead: -10.0,
    },
    {
      name: 'Varun Bhatia',
      email: 'varun.bhatia@example.com',
      phone: '+1 (415) 890-1219',
      company: 'Stripe',
      interviewer: 'Patrick Collison (Founding Eng)',
      round: 'Round 2 - Global Payments Orchestration',
      calendly: 'https://calendly.com/stripe-interviews/p-collison',
      createdHoursAgo: 38.0, // 14h overdue
      status: 'OVERDUE',
      priority: 'URGENT',
      nextAction: 'Manager decision: send final notice before closing',
      nextDueHoursAhead: -15.0,
    },

    // 5. Verified Bookings (Met SLA within 24h)
    {
      name: 'Anika Choudhury',
      email: 'anika.c@example.com',
      phone: '+1 (415) 890-1220',
      company: 'Figma',
      interviewer: 'Dylan Field (CEO & Founder)',
      round: 'Round 3 - Vision & Engineering Values',
      calendly: 'https://calendly.com/figma-exec/dylan-f',
      createdHoursAgo: 14.0,
      status: 'BOOKED',
      priority: 'NORMAL',
      nextAction: 'Interview confirmed; automated calendar invites sent',
      isBooked: true,
      bookedHoursAgo: 10.0,
    },
    {
      name: 'Yash Vardhan',
      email: 'yash.vardhan@example.com',
      phone: '+1 (415) 890-1221',
      company: 'Databricks',
      interviewer: 'Matei Zaharia (Chief Technologist)',
      round: 'Round 2 - Spark Architecture Deep Dive',
      calendly: 'https://calendly.com/databricks-eng/matei-z',
      createdHoursAgo: 20.0,
      status: 'BOOKED',
      priority: 'NORMAL',
      nextAction: 'Booking verified; follow-ups cancelled',
      isBooked: true,
      bookedHoursAgo: 14.5,
    },
    {
      name: 'Tara Pillai',
      email: 'tara.pillai@example.com',
      phone: '+1 (415) 890-1222',
      company: 'Supabase',
      interviewer: 'Paul Copplestone (CEO)',
      round: 'Round 1 - Open Source Systems',
      calendly: 'https://calendly.com/supabase-exec/paul-c',
      createdHoursAgo: 23.0,
      status: 'BOOKED',
      priority: 'NORMAL',
      nextAction: 'Booking confirmed within SLA window (T+6h)',
      isBooked: true,
      bookedHoursAgo: 17.0,
    },
    {
      name: 'Manish Rawat',
      email: 'manish.rawat@example.com',
      phone: '+1 (415) 890-1223',
      company: 'Vercel',
      interviewer: 'Lee Robinson (VP Product)',
      round: 'Round 1 - Next.js Framework Internals',
      calendly: 'https://calendly.com/vercel-hiring/lee-rob',
      createdHoursAgo: 28.0,
      status: 'BOOKED',
      priority: 'NORMAL',
      nextAction: 'Booking completed (late booking after 25h)',
      isBooked: true,
      bookedHoursAgo: 3.0, // Booked after 25h
    },

    // 6. Active Exceptions & Blockers
    {
      name: 'Deepak Nair',
      email: 'deepak.nair@example.com',
      phone: '+1 (415) 890-1224',
      company: 'Notion',
      interviewer: 'Ivan Zhao (Design & Systems)',
      round: 'Round 1 - Product Intuition',
      calendly: 'https://calendly.com/invalid-link-404-error',
      createdHoursAgo: 7.0,
      status: 'BLOCKED_EXCEPTION',
      priority: 'HIGH',
      nextAction: 'Partner coordinator notified to provide valid Calendly link',
      blockerReason: 'Invalid Calendly URL: returns 404 page not found',
      blockerType: 'INVALID_LINK',
    },
    {
      name: 'Pooja Hegde',
      email: 'pooja.hegde@example.com',
      phone: '+1 (415) 890-1225',
      company: 'Snowflake',
      interviewer: 'Benoit Dageville (Co-Founder)',
      round: 'Round 2 - Cloud Storage Engines',
      calendly: 'https://calendly.com/snowflake-interviews/dageville',
      createdHoursAgo: 11.0,
      status: 'BLOCKED_EXCEPTION',
      priority: 'HIGH',
      nextAction: 'Requesting interviewer open calendar slots for next week',
      blockerReason: 'No available interview slots found in next 14 days',
      blockerType: 'NO_SLOTS',
    },
    {
      name: 'Harsh Vardhan',
      email: 'harsh.v@example.com',
      phone: '+1 (415) 890-1226',
      company: 'Stripe',
      interviewer: 'Michelle Lee (Engineering Manager)',
      round: 'Round 1 - Backend Payments',
      calendly: 'https://calendly.com/stripe-interviews/m-lee',
      createdHoursAgo: 12.0,
      status: 'WITHDRAWN',
      priority: 'NORMAL',
      nextAction: 'Candidate opted out: Accepted competing offer at Google',
      notes: 'Candidate replied stating they accepted a competing offer.',
    },
  ];

  const requests: InterviewRequest[] = [];
  const contactAttempts: ContactAttempt[] = [];
  const auditLogs: AuditLogEntry[] = [];

  rawSeeds.forEach((seed, index) => {
    const sourceRowNumber = index + 2;
    // Round-robin 50/50 division
    const assignedTo = index % 2 === 0 ? 'Ram' : 'Shyam';
    const requestId = `req-seed-${index + 1}`;
    const createdAtStr = hoursAgo(seed.createdHoursAgo);

    const bookingEvidence = seed.isBooked
      ? {
          bookingId: `cal-evt-${Date.now().toString(36)}-${index}`,
          bookedSlotTime: new Date(refMs + (index + 2) * 24 * 60 * 60 * 1000).toISOString(),
          interviewer: seed.interviewer,
          candidateEmail: seed.email,
          confirmedAt: hoursAgo(seed.bookedHoursAgo || 2),
          source: 'CALENDLY_SIMULATION' as const,
          isSimulated: true,
        }
      : undefined;

    const req: InterviewRequest = {
      id: requestId,
      sourceRowNumber,
      candidateName: seed.name,
      candidateEmail: seed.email,
      candidatePhone: seed.phone,
      company: seed.company,
      interviewerName: seed.interviewer,
      interviewerEmail: `${seed.company.toLowerCase().replace(/[^a-z]/g, '')}.interviews@example.com`,
      interviewRound: seed.round,
      calendlyUrl: seed.calendly,
      originalCreatedAt: createdAtStr,
      assignedTo,
      status: seed.status,
      priority: seed.priority,
      lastContactAt: seed.status !== 'UNCONTACTED' ? hoursAgo(seed.createdHoursAgo - 1) : undefined,
      lastContactChannel: seed.status !== 'UNCONTACTED' ? 'EMAIL' : undefined,
      nextAction: seed.nextAction,
      nextActionDueAt: seed.nextDueHoursAhead !== undefined ? hoursAhead(seed.nextDueHoursAhead) : undefined,
      bookingStatus: seed.isBooked ? 'BOOKED' : 'NOT_BOOKED',
      bookingVerifiedAt: seed.isBooked ? hoursAgo(seed.bookedHoursAgo || 2) : undefined,
      bookingEvidence,
      blockerReason: seed.blockerReason,
      blockerType: seed.blockerType,
      notes: seed.notes || `Source row #${sourceRowNumber}. Division to ${assignedTo}.`,
      isDemoData: true,
    };

    requests.push(req);

    // Initial creation audit
    auditLogs.push({
      id: `audit-${requestId}-0`,
      requestId,
      timestamp: createdAtStr,
      actor: 'SYSTEM',
      action: 'REQUEST_IMPORTED',
      fieldChanged: 'status',
      newValue: 'UNCONTACTED',
      reason: `Ingested from Excel INPUT sheet. Assigned to ${assignedTo} via 50/50 round-robin.`,
    });

    // Add contact attempt if outreach was sent
    if (seed.status !== 'UNCONTACTED') {
      const outreachTime = hoursAgo(seed.createdHoursAgo - 0.5);
      contactAttempts.push({
        id: `attempt-${requestId}-1`,
        requestId,
        timestamp: outreachTime,
        channel: 'EMAIL',
        performedBy: assignedTo,
        templateUsed: 'Template A: Initial Outreach (Email)',
        summary: `Sent initial outreach email with Calendly link to ${seed.email}`,
      });

      auditLogs.push({
        id: `audit-${requestId}-1`,
        requestId,
        timestamp: outreachTime,
        actor: assignedTo,
        action: 'OUTREACH_RECORDED',
        fieldChanged: 'status',
        previousValue: 'UNCONTACTED',
        newValue: 'OUTREACH_SENT',
        reason: 'Initial outreach email dispatched.',
      });
    }

    if (seed.isBooked && bookingEvidence) {
      auditLogs.push({
        id: `audit-${requestId}-booked`,
        requestId,
        timestamp: bookingEvidence.confirmedAt,
        actor: 'SYSTEM',
        action: 'BOOKING_VERIFIED',
        fieldChanged: 'bookingStatus',
        previousValue: 'NOT_BOOKED',
        newValue: 'BOOKED',
        reason: `Calendly booking evidence verified [ID: ${bookingEvidence.bookingId}]. Pending follow-ups cancelled.`,
      });
    }

    if (seed.status === 'BLOCKED_EXCEPTION') {
      auditLogs.push({
        id: `audit-${requestId}-blocker`,
        requestId,
        timestamp: hoursAgo(seed.createdHoursAgo - 2),
        actor: assignedTo,
        action: 'BLOCKER_FLAGGED',
        fieldChanged: 'status',
        previousValue: 'UNCONTACTED',
        newValue: 'BLOCKED_EXCEPTION',
        reason: seed.blockerReason,
      });
    }
  });

  return { requests, contactAttempts, auditLogs };
}
