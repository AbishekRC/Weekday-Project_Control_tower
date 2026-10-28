# Standard Operating Procedure (SOP): Interview Scheduling Operations

**Document Version:** 1.0.0
**Effective Date:** 2026-10-28
**Applicability:** Operations Team (Ram, Shyam), Team Leads, Operations Managers
**Primary Objective:** Ensure **>=80%** of eligible interview requests are booked within **24 hours** of request creation time (`created_at`).

---

## 1. Golden Operational Rules

1. **The 24-Hour SLA Clock Never Resets**: The SLA clock begins at `request_created_at`. Reassignment, Excel re-imports, or status changes **never** reset or pause this deadline.
2. **Never Close Without Evidence**: A request is **never** marked `BOOKED` merely because an email was sent, a phone call was answered, or a candidate said "I will book tonight". Only an authorized booking confirmation (or verified Calendly event) qualifies.
3. **Zero Unnecessary Outreach**: If an interview is booked or a candidate withdraws, immediately halt all scheduled reminders and calls.
4. **Log Everything Immediately**: Every single candidate touchpoint (email sent, call answered, voicemail left, SMS sent, blocker reported) must be recorded in the tracker within 5 minutes.

---

## 2. Explicit IF / THEN Decision Matrix

| Condition (IF) | Prescribed Action (THEN) |
| :--- | :--- |
| **New request arrives and no outreach recorded** | **IF** request creation was <60 mins ago, **THEN** send approved Initial Outreach Email containing the company-specific Calendly link. Set next-action check for +4 hours. |
| **Request received >2 hours ago with no outreach** | **THEN** treat as **High Priority Backlog**. Send outreach immediately and tag intern note `DELAYED_INITIAL_OUTREACH`. |
| **Verified booking event received** | **THEN** immediately change status to `BOOKED`. Cancel all pending follow-up tasks. Record booking timestamp and interviewer details in audit log. |
| **Outreach sent >4 hours ago, no booking, SLA >12h (Green)** | **THEN** send **Follow-up Reminder #1** (Email). Mention the preferred interview round and slot urgency. Set next check for +6 hours. |
| **Outreach sent >10 hours ago, no booking, SLA 4–12h (Amber)** | **THEN** initiate **Direct Voice Outreach** (Phone Call). Follow phone script. If voicemail, leave concise 20-second message and send SMS/WhatsApp nudge. |
| **Call attempted and candidate answers** | **THEN** confirm candidate availability, offer to keep them on the line while opening the Calendly link, or offer to lock their preferred time immediately. Log call outcome as `CONNECTED`. |
| **Call attempted and candidate does not answer / Busy** | **THEN** log call outcome as `NO_ANSWER` or `VOICEMAIL`. Send follow-up SMS/Email note. Do not place more than 2 calls in a 4-hour window. |
| **SLA remaining <4 hours and unbooked (Red)** | **THEN** mark request priority as **CRITICAL / AT_RISK**. Ping Team Lead / Operations Manager on internal Slack/alert. Attempt secondary phone outreach. |
| **SLA reaches 0 hours (<0h Overdue) and unbooked** | **THEN** mark request as **OVERDUE**. Trigger mandatory manager escalation. Request remains active and visible in the Overdue Queue until resolved. |
| **Calendly link broken, 404, or invalid URL** | **THEN** do **NOT** contact candidate with broken link. Immediately flag request as `BLOCKED_EXCEPTION (INVALID_LINK)`. Notify hiring partner coordinator to provide valid link within 2 hours. |
| **Calendly shows "No Available Slots in Next 14 Days"** | **THEN** flag request as `BLOCKED_EXCEPTION (NO_SLOTS)`. Send canned request to hiring company coordinator requesting additional interviewer availability blocks. Pause candidate reminders. |
| **Candidate replies stating they withdraw or opted out** | **THEN** stop all outreach immediately. Update status to `WITHDRAWN`. Enter candidate's stated reason in audit log and notify partner recruiting team. |
| **Candidate requests alternative interviewer or reschedule** | **THEN** flag as `RESCHEDULE_REQUESTED`. Coordinate with partner company; do not mark as Booked. |
| **Same candidate & company request imported twice (Duplicate)** | **THEN** verify if interview round differs: **IF** identical round, skip duplicate and log deduplication warning. **IF** legitimate separate round (e.g., Round 1 Tech vs Round 2 System Design), create distinct child request linked to candidate. |
| **Intern (Ram or Shyam) absent or reassigned** | **THEN** Team Lead executes batch reassignment. Original SLA deadline is strictly retained. Reason must be recorded as `INTERN_ABSENCE_HANDOVER`. |
| **Candidate email bounces or phone number is invalid** | **THEN** flag as `BLOCKED_EXCEPTION (INVALID_CONTACT)`. Route to sourcing lead to retrieve alternative contact info from candidate resume. |

---

## 3. Communication Cadence & Schedule

```
T + 00:00 (Intake)          ──> Validate Link & Send Initial Outreach Email
T + 04:00 (Follow-up #1)    ──> Soft Email Nudge (Calendly Link + Round reminder)
T + 10:00 (Follow-up #2)    ──> Phone Call Attempt #1 + SMS Nudge
T + 18:00 (SLA Warning)     ──> Phone Call Attempt #2 + Urgent Email ("SLA closing")
T + 20:00 (<4h Escalation)  ──> Internal Escalation to Manager + Slack Ping
T + 24:00 (Deadline)        ──> Mark OVERDUE, Audit Log review, Partner Escalation
```

---

## 4. Approved Outreach Templates

### Template A: Initial Outreach (Email)
> **Subject:** Next steps: Schedule your interview with {{company_name}} ({{interview_round}})
> **Body:**
> Hi {{candidate_first_name}},
>
> We are excited to coordinate your upcoming **{{interview_round}}** with **{{company_name}}**!
>
> Please select your preferred time slot directly on the interviewer's calendar using the link below:
> **👉 {{calendly_url}}**
>
> The team is eager to speak with you. To secure your preferred time before interviewer slots fill up, please book within the next 24 hours.
>
> If you have any scheduling constraints or questions, simply reply to this email.
>
> Best regards,
> {{intern_name}} | Weekday Scheduling Operations

### Template B: Follow-up Reminder #1 (4-hour mark)
> **Subject:** Quick reminder: Lock in your {{company_name}} interview slot
> **Body:**
> Hi {{candidate_first_name}},
>
> Just following up on our earlier message regarding your interview for the **{{interview_round}}** role at **{{company_name}}**.
>
> Interviewer slots are filling quickly. You can confirm your schedule in 30 seconds here:
> **👉 {{calendly_url}}**
>
> Thank you,
> {{intern_name}} | Weekday Scheduling Operations

### Template C: Phone Call Script (10-14 hour mark)
> *"Hello {{candidate_first_name}}, this is {{intern_name}} from Weekday coordinating your interview with {{company_name}} for the {{interview_round}}. I wanted to ensure you received the calendar booking link sent earlier today. Do you have 30 seconds to open the link together or confirm a preferred time?"*
> - **If candidate agrees:** Guide them to book immediately or verify their chosen slot.
> - **If candidate requests call back:** Log specific time callback requested.
> - **If voicemail:** *"Hi {{candidate_first_name}}, this is {{intern_name}} from Weekday. Please check your inbox for your {{company_name}} interview booking link. Feel free to call or text me back at this number to secure your time."*

---

## 5. Escalation Pathways & Responsibilities

1. **Tier 1 (Interns - Ram & Shyam)**:
   - Handle intake validation, Initial Outreach, Follow-up #1, Call Attempts, and Logging.
   - Authorized to reassign peer-to-peer for workload leveling.
2. **Tier 2 (Operations Lead / Manager)**:
   - Notified when SLA remaining < 4 hours (`RED`).
   - Resolves partner-side blockers (requesting fresh Calendly slots, clarifying hiring manager availability).
   - Authorizes closing non-responsive requests after 48 hours and 4 documented touchpoints.
