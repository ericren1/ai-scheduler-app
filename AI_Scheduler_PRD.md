# Personal AI Scheduler — Product Requirements Document (PRD)

**Status:** Requirements baseline v1.0  
**Date:** 2026-10-21  
**Audience:** Product owner, designer, developer, QA  
**Scope:** Single-user, authenticated, cloud-synced personal scheduling web application

## 1. Product vision

A calendar-first personal productivity application that organizes tasks into feasible daily and weekly schedules. The user sets priorities, daily/weekly time goals, deadlines, allowed days, and fixed commitments. A deterministic scheduling engine allocates time; an AI assistant interprets conversational scheduling requests and explains changes. The user explicitly marks work done and controls significant adjustments.

**Product principle:** The app schedules time to work on tasks; it does not estimate when a project will be finished or infer progress from elapsed time.

## 2. User and problem

**Primary user:** One person balancing employment, university work, technical projects, applications, fitness, and other routines. Uses desktop and mobile devices.

**Problems:** Manually arranging competing priorities; keeping daily plans stable while adjusting to new availability; distinguishing planned work from completed work; reviewing goal consistency without accumulating automatic catch-up work; minimizing AI API costs.

## 3. Success criteria

- A feasible next-day schedule is automatically finalized at the user's configured time.
- Tasks with configured time goals are placed subject to constraints and ranked priorities.
- Deadline risks, unscheduled work, and conflicts are visible rather than silently discarded.
- A user can edit the calendar and request scheduling changes conversationally.
- Completion and actual time are explicitly recorded, not inferred.
- Core calendar/task functions remain available if AI is unavailable or the normal AI budget threshold is reached.
- Previously loaded calendar and task data remain viewable offline, with queued supported edits synchronized on reconnection.

## 4. Product experience

### 4.1 Main navigation

- **Planner:** Tweek-inspired compact weekly overview plus detailed daily time-slot calendar. Views stay synchronized.
- **Tasks:** Nested drag-and-drop category folders, individual tasks, tags, task priorities, archive, and status.
- **Events:** Fixed and movable commitments, recurrence, reminders, notes.
- **Day Templates:** Weekday defaults for office, work-from-home, school, weekend, etc.; date and date-range overrides.
- **Goals:** Daily/weekly time goals and independent aggregate goals linked to multiple tasks.
- **Analytics:** Planned versus actual time, completion, consistency, categories, and trends.
- **Settings:** Schedule finalization time, sleep/work hours, notification preferences, AI model/budget, authentication, backup/export, and personal AI memory.
- **AI assistant:** Persistent collapsible sidebar, expandable to full-screen, with multiple saved conversation threads.

### 4.2 Tasks

Tasks support a title, notes/objective, category/tags, ranked priority, optional deadline, allowed weekdays, optional preferred time windows, daily preferred time goal, weekly target, scheduling mode, and completion/progress tracking. Tasks can be recurring, flexible, or on demand; fixed recurrence can specify particular days/times. Task-based objectives (e.g. apply to five jobs) and time-based goals remain distinct.

**No required estimate of total time to finish a task.** Work continues being scheduled under its applicable rules until the user marks it complete, archives it, blocks/pauses it through applicable controls, or changes its settings. A task may have no time goal; such tasks can receive leftover capacity after goal-driven work and urgent deadlines.

### 4.3 Scheduling behavior

- Backend deterministic engine schedules within sleep, work, fixed event, template, allowed-day, preferred-window, and other constraints.
- Automatic placements use 15-minute boundaries; manual edits may use exact minutes.
- Sessions may be split and distributed across available days.
- Saved task rankings are strict ordered preferences, but urgent deadlines can temporarily override normal order without changing stored ranks.
- Daily goals are preferred amounts and may flex to support weekly targets. Once a weekly target is met, optional extra sessions stop; daily goals on selected days continue.
- Weekly goals reset normally; missed recurring sessions are recorded but not carried forward as added work.
- Tasks without goals are eligible for remaining time after goal-driven scheduling and urgent deadline needs.
- When capacity is insufficient, show overflow and risks; do not silently delete work or violate hard constraints.
- Weekly plan remains tentative; the next day finalizes automatically at the user's configured evening time.
- Finalized days remain stable unless explicitly edited. An explicit update creating new availability may fill only the new gap, without moving existing sessions.
- Early completion leaves freed time open. Overruns require an approved proposed rearrangement.
- Recurring-task setting changes affect future unfinalized sessions, not finalized days or historical records.

### 4.4 AI role

The AI interprets requests such as “Move my gym session to 5 PM” or “I need another hour for coding,” queries structured application state through controlled backend operations, and proposes or applies changes according to risk-based permission rules. Straightforward explicit changes may execute immediately; changes affecting protected commitments or major tradeoffs require approval. Changes are logged and reversible where feasible.

The backend performs routine scheduling, constraint checks, timers, reminders, and analytics without LLM calls. AI may support weekly insights and optional recommendations under normal budget conditions; when the configured monthly AI budget threshold is reached, nonessential AI features pause but essential conversational scheduling stays available. No separate reserve is required; therefore the threshold is a **soft cap** and essential requests may incur overage. Track usage and estimated costs transparently.

### 4.5 Tracking and accountability

- Optional timers with start, pause, resume, stop; manual actual-time entry.
- Planned time, actual time, task completion, and partial objective progress are distinct fields.
- Start-of-session notification and one configurable accountability follow-up if no start confirmation.
- Dismissible end-of-session prompt: completed, partial, or skipped; no automatic rescheduling of finalized days.
- Intentional skips count as missed for adherence reporting; optional notes explain circumstances.
- Historical sessions remain visible with filters.

### 4.6 Analytics and retention

- Daily, weekly, and monthly planned-versus-actual trends, completion, goal attainment, and category breakdowns.
- Detailed tracking history retained 12 months; older detail rolled up into compact monthly summaries before deletion.
- Scheduling uses recent history when relevant, not stale three-month-old performance by default.
- Archived tasks retain relevant history subject to retention; confirmed permanent deletion removes associated data.

### 4.7 Security, synchronization, and resilience

- One authenticated account, cloud synchronization across desktop and phone; no public registration in v1.
- Offline: view cached schedule/tasks; record supported completion and note edits; queue and sync on reconnection.
- Conflict rule: last-write-wins (potential overwrite risk acknowledged).
- Daily automated backups, recent restore points, manual JSON export/import.
- Validated atomic schedule updates, retry transient failures safely, preserve existing schedule on failed commits, clear error messages.

## 5. Key user journeys

1. **Weekly planning:** User reviews last week's recorded outcomes, confirms or adjusts goals, and sees a tentative week generated without modifying finalized days.
2. **Daily finalization:** At configured time, engine finalizes tomorrow's feasible calendar; user opens detailed day view in morning.
3. **Task creation:** User adds “Build AI Job Agent,” ranks it, sets 2h preferred daily and 10h weekly, selects allowed days; engine allocates time without asking for a total-work estimate.
4. **Midday adjustment:** User says “I need another hour”; assistant presents necessary moves for approval before changing existing sessions.
5. **Unexpected availability:** User says “My 1–3 PM meeting was cancelled”; app fills only the new gap, leaving existing sessions untouched.
6. **Completion:** User marks project done; future automatic scheduling stops, while finalized calendar entries remain stable until explicitly edited.
7. **Budget threshold:** Nonessential AI insights pause; essential scheduling commands and deterministic scheduling continue; overage remains visible.
8. **Offline:** User checks cached calendar, records completion, reconnects, and queued changes sync using last-write-wins.

## 6. Out of scope for initial version

- Multi-user registration and collaboration.
- Notion integration.
- Predicting total project completion time from elapsed work.
- Automatic catch-up of missed recurring goals.
- Energy-level modeling.
- Automatically changing user-set priorities or weekly goals.
- Fully offline AI conversations or local scheduling engine.
- Automated solutions to deadline risks (warnings only).
- Advanced versioned per-record recovery UI.

## 7. Dependencies and open design decisions (not additional product requirements)

- Final frontend/backend/database/cloud stack, hosting region, authentication provider.
- Backup storage provider and number of recent restore points.
- Notification implementation and platform support.
- Exact scheduling objective weights and deterministic tie-breakers.
- AI provider/model support, model pricing, and safeguards against unexpectedly high essential-mode overages.
- Offline sync version/timestamp strategy and reliable retry idempotency.
- Accessibility, performance budgets, test infrastructure, and deployment pipeline.

## 8. Milestones

1. Approve PRD/SRS baseline and resolve specification conflicts.
2. User journeys, wireframes, and interactive UI prototype.
3. Architecture, data model, scheduling algorithm specification, API contracts.
4. MVP: authentication, tasks, templates, events, deterministic scheduling, daily/weekly calendar.
5. AI assistant and controlled scheduling actions.
6. Tracking, analytics, notifications, offline sync, backups, security hardening.
7. Automated tests, usability validation, deployment, README and portfolio documentation.
