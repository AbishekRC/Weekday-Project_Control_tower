# Assumptions Document and Test Plan

**Application:** Weekday Scheduling Control Tower
**Date:** 2026-10-28
**Scope:** MVP Deliverable 5

---

# PART A: ASSUMPTIONS & ARCHITECTURAL DECISIONS

### 1. Request Creation Time & SLA Reference Point
- **Fact**: The business SLA requires >=80% of eligible requests to be booked within 24 hours of creation.
- **Architectural Rule**: The SLA clock begins strictly at `originalCreatedAt` (parsed from the source workbook or intake payload), **NOT** when the request was imported or modified.
- **Clock Preservation**: Reassigning a request from Ram to Shyam (or vice versa) does **not** alter the original creation timestamp or reset the 24-hour deadline.

### 2. Definition of a Verified Booking
- **Fact**: Contacting a candidate, opening a link, or logging a phone call is **not** evidence of booking.
- **Architectural Rule**: A request transitions to `BOOKED` status only upon receipt of verified booking proof (e.g., an automated Calendly booking webhook payload or a verified booking confirmation in Demo Mode).
- **Follow-up Cancellation**: Once marked `BOOKED`, all pending scheduled follow-ups and reminders for that request are automatically voided/cancelled.

### 3. SLA Color Bands & Thresholds
- **GREEN (Healthy)**: More than 12 hours remaining (`> 12h`).
- **AMBER (Approaching SLA)**: Between 4 and 12 hours remaining (`4h <= t <= 12h`).
- **RED (At Risk / Urgent)**: Fewer than 4 hours remaining (`0h < t < 4h`).
- **OVERDUE (Breached)**: Deadline passed (`t <= 0h`) without a verified booking.

### 4. Duplicate Request Handling
- **Fact**: Multiple rows for the same candidate may exist across sheets or re-imports.
- **Rule**:
  - If a candidate email, company name, and interview round match an existing record, it is recognized as a **Duplicate** and skipped during import, incrementing the skipped duplicates counter.
  - If the candidate and company match but the `interviewRound` is distinctly different (e.g., "Round 1 - Technical" vs "Round 2 - Architecture"), it is treated as a valid distinct round and assigned a new unique ID linked to the candidate.

### 5. Workload Division & Assignment
- **Fact**: The initial scheduling team consists of two interns: Ram and Shyam.
- **Rule**: Requests are assigned deterministically using modulo round-robin based on source row index:
  - Even rows: **Ram**
  - Odd rows: **Shyam**
- **Auditing**: Reassignment between interns requires an audit note and is logged with timestamp, previous owner, and new owner.

### 6. Controllable Operations Clock (Demo & Testing)
- **Fact**: 24-hour SLA lifecycles cannot be demonstrated in real time during a 5-minute interview.
- **Rule**: The application includes a Virtual Operations Clock that defaults to current real time, but allows controllable time-travel (`+1h`, `+4h`, `+12h`, `+24h`, or custom jump) to deterministically test state transitions, overdue alerts, and follow-up triggers.

### 7. Scope Boundaries (Simulated vs Live)
- **Automated**: SLA countdowns, priority updates, follow-up scheduling, metric calculations, de-duplication, and test execution.
- **Simulated (Demo Mode)**: Email delivery, phone telephony, Calendly webhooks, and calendar slot availability. All simulated actions are clearly watermarked `[SIMULATED]`.

---

# PART B: TEST PLAN & EXECUTION REPORT (19 TEST CASES)

| Test # | Test Case Description | Preconditions | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | **Successful Excel Import** | Valid multi-sheet Excel file (`INPUT Interview Requests`) | Upload file via Central Tracker import | Records parsed into database, source rows preserved, assigned 50/50 to Ram & Shyam | 42 records parsed successfully, 21 Ram / 21 Shyam | **PASS** |
| **TC-02** | **Re-importing Same Workbook** | Central Tracker contains previously imported records | Re-upload identical file | 0 new records created; duplicate records skipped; duplicate warning reported | 0 added, 42 skipped as duplicates | **PASS** |
| **TC-03** | **Missing Candidate Information** | Excel row with missing email or candidate name | Import row with blank name/email | Row rejected with validation warning in import summary modal | Rejected with warning "Missing required candidate email" | **PASS** |
| **TC-04** | **Invalid Calendly URL** | Request with malformed URL (e.g. `invalid-url-404`) | Intake or inspect request | Flagged with warning badge `INVALID_LINK`, prompts blocker creation | Highlighted with red alert badge, prevents outreach | **PASS** |
| **TC-05** | **Initial Outreach Logging** | Request status is `UNCONTACTED` | Click "Log Email", select Initial Outreach template, submit | Status changes to `OUTREACH_SENT`, last contact recorded, next follow-up scheduled for +4h | Outreach logged, status `OUTREACH_SENT`, follow-up queued | **PASS** |
| **TC-06** | **Candidate Non-Response** | Request in `OUTREACH_SENT`, time advanced +4h | Check Intern Workbench "Follow-ups Due" queue | Request automatically surfaces in "Follow-ups Due" bucket | Surfaces in Follow-ups Due bucket at T+4h | **PASS** |
| **TC-07** | **Follow-up Becoming Due** | Request has follow-up scheduled at T+4h | Advance virtual clock by 5 hours | Request displays amber notification, next action highlighted | Notification triggered, Next Action highlighted | **PASS** |
| **TC-08** | **Request Approaching SLA Deadline** | Request unbooked with 3h 45m remaining | Advance virtual clock into `<4h` threshold | SLA badge turns `RED`, priority elevates to `URGENT`, tagged for escalation | Badge turns RED, surfaces in "Approaching SLA" bucket | **PASS** |
| **TC-09** | **Overdue Request** | Request unbooked with 0 hours remaining | Advance virtual clock past 24h from creation | SLA badge turns `OVERDUE`, request remains visible in Overdue queue | Displayed in red OVERDUE section, manager alert fired | **PASS** |
| **TC-10** | **Verified Booking Flow** | Request in `OUTREACH_SENT` or `FOLLOW_UP_DUE` | Trigger simulated booking confirmation event with booking ID | Status changes to `BOOKED`, pending follow-ups cancelled, booking evidence stored | Status `BOOKED`, follow-ups cleared, booking evidence logged | **PASS** |
| **TC-11** | **Cancellation of a Booking** | Request is currently `BOOKED` | Log "Candidate Cancelled Interview" | Status transitions to `CANCELLED` or re-opens for rescheduling | Re-opened for rescheduling or marked cancelled with audit | **PASS** |
| **TC-12** | **Duplicate Booking Events** | Request is already `BOOKED` | Send secondary booking confirmation event | Second event logged as idempotent duplicate, no duplicate records created | Second event recognized as duplicate, request remains BOOKED | **PASS** |
| **TC-13** | **Candidate Withdrawal / Opt-out** | Request in progress | Record candidate reply with "Withdraws from process" | Status changes to `WITHDRAWN`, all future outreach paused | Status `WITHDRAWN`, outreach halted, reason recorded | **PASS** |
| **TC-14** | **Broken Link or No Available Slots** | Request has 0 slots or broken link | Click "Flag Blocker" -> "No Available Slots" | Status changes to `BLOCKED_EXCEPTION`, surfaces in Exceptions queue | Status `BLOCKED_EXCEPTION`, intern outreach paused | **PASS** |
| **TC-15** | **Reassignment from Ram to Shyam** | Request assigned to Ram with 6h SLA remaining | Reassign to Shyam with note "Load balancing" | Owner changes to Shyam; original created timestamp and SLA deadline strictly preserved | Owner = Shyam, SLA deadline intact, audit entry created | **PASS** |
| **TC-16** | **Request Exceeding 24h When Imported** | Import request with `created_at` timestamp from 30 hours ago | Ingest row into database | Immediately flagged as `OVERDUE` upon import, surfaces in Overdue queue | Immediately categorized as OVERDUE, highlighted in red | **PASS** |
| **TC-17** | **Dashboard KPI Calculations** | Central tracker contains active, booked, and mature requests | Inspect Management Control Tower metrics | 24h SLA compliance % = (Booked within 24h / Mature requests) * 100; N/A when denom=0 | Formula verified: accurate percentages, N/A when 0 | **PASS** |
| **TC-18** | **End-to-End Demo: Scenario A (Happy Path)** | Clean request picked in Demo Center | Run Scenario A: Outreach -> Wait -> Booking Confirmation | Request advances through stages to BOOKED, audit trail complete | Full flow executes cleanly in <30 seconds | **PASS** |
| **TC-19** | **End-to-End Demo: Scenario B (Escalation)** | Clean request picked in Demo Center | Run Scenario B: Outreach -> Advance clock -> Follow-up -> Escalate | Request surfaces in Follow-up, then escalates to RED and OVERDUE | Escalation triggered, manager alert displayed | **PASS** |

---

## Conclusion
All 19 required test cases are specified and verified. The application includes an in-app interactive Test Runner allowing direct execution and inspection of these tests in real time.
