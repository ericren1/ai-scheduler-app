# Personal AI Scheduler — Software Requirements Specification (SRS)

**Status:** Draft baseline v1.0  
**Date:** 2026-10-21  
**System type:** Single-user authenticated cloud-synced scheduling web application

## 1. Purpose and conventions

This SRS translates the confirmed product decisions into verifiable behavior. **MUST** indicates a requirement; **SHOULD** indicates a desired but nonblocking design preference. IDs support traceability into tests. Architecture choices and numerical service-level objectives are deferred until technical design.

## 2. Actors and system boundaries

- **User:** Owns tasks, goals, calendar, account, preferences, and AI conversations.
- **Scheduling engine:** Deterministic service that creates/validates/persists schedules.
- **AI assistant:** Natural-language interface that requests validated backend operations; cannot bypass constraints.
- **Notification service:** In-app and device/browser notifications subject to permissions and platform support.
- **Storage/sync:** Cloud database plus limited offline client cache/queue.

## 3. Functional requirements

### 3.1 Identity and data

- **AUTH-01** System MUST require authentication to access the user's private data.
- **AUTH-02** System MUST support exactly one provisioned account in v1; no public registration.
- **AUTH-03** Authenticated desktop and mobile sessions MUST access shared cloud state.
- **DATA-01** System MUST persist tasks, events, templates, goals, calendar sessions, statuses, tracking, settings, AI conversations, approved memories, and change history.
- **DATA-02** System MUST create daily backups and expose a supported restore process.
- **DATA-03** System MUST export and import user data in a documented JSON format.
- **DATA-04** Detailed tracking history MUST be retained for 12 months and rolled into monthly aggregate summaries before detail is removed.
- **DATA-05** Archived tasks MUST be restorable; permanent deletion MUST require explicit confirmation and remove associated task data subject to backup retention rules.

### 3.2 Tasks, categories, and priorities

- **TASK-01** User MUST create/edit tasks with name, notes/objective, category, tags, scheduling mode, optional deadline, allowed days, optional preferred time windows, and priority.
- **TASK-02** Tasks MUST support a strict user-reorderable priority ranking; the engine MUST NOT persist automatic ranking changes.
- **TASK-03** A task MUST NOT require an estimate of total time to completion.
- **TASK-04** User MUST be able to configure a preferred daily time goal and a weekly time target, independently or together.
- **TASK-05** Tasks with no time goal MUST remain eligible for automatic scheduling in leftover capacity after defined goals and urgent deadlines.
- **TASK-06** Tasks MUST support recurring, flexible, and on-demand scheduling modes, with fixed/flexible recurrence and optional time preferences.
- **TASK-07** User MUST be able to mark one-time tasks complete; completed tasks MUST cease future automatic scheduling without silently editing finalized sessions.
- **TASK-08** Recurring objective progress MUST reset per occurrence; one-time objective progress MUST persist until completion/cancellation.
- **TASK-09** System MUST support hierarchical drag-and-drop category folders and optional cross-category tags; folders MUST NOT be schedulable tasks.
- **TASK-10** User MUST be able to archive, restore, and request confirmed permanent deletion.
- **TASK-11** Task settings changed in the present MUST affect only future unfinalized sessions unless the user explicitly edits finalized ones.
- **TASK-12** User MUST be able to specify allowed weekdays for each task; automatic scheduling MUST NOT violate them. Manual placement MAY override.
- **TASK-13** Optional task prerequisites MUST prevent blocked downstream work from being automatically scheduled until prerequisite conditions are met.

### 3.3 Goals and weekly planning

- **GOAL-01** System MUST track per-task daily/weekly time goals and aggregate goals linked to multiple tasks, without double-counting time within a goal.
- **GOAL-02** Weekly targets MUST reset at the beginning of each configured week without automatically carrying forward missed occurrences.
- **GOAL-03** Daily goals MUST continue to drive scheduling on selected days after a weekly target has been reached.
- **GOAL-04** Once a weekly target is met, system MUST stop adding optional extra sessions beyond applicable daily commitments; manual extra sessions remain permitted.
- **GOAL-05** User MUST be able to confirm or edit weekly targets during a weekly review; if skipped, the last confirmed targets MUST carry forward unchanged.
- **GOAL-06** System MUST track goal attainment using recorded actual time or explicitly marked outcomes, not planned duration alone.

### 3.4 Events, templates, and constraints

- **CAL-01** System MUST provide synchronized compact weekly and detailed daily time-slot views.
- **CAL-02** User MUST be able to drag, resize, duplicate, move, and bulk-edit calendar sessions, subject to conflict checks and undo.
- **CAL-03** System MUST support recurring fixed and movable events, notes, and reminders.
- **CAL-04** Automatic planning MUST protect fixed events, sleep, working hours, and explicit hard scheduling constraints.
- **CAL-05** Movable events MUST NOT be moved automatically without an explicit user request.
- **CAL-06** System MUST support weekday-default day templates and specific-date/date-range overrides.
- **CAL-07** New event conflicts MUST be surfaced; user MUST be able to approve a resolution or intentionally keep an overlap.
- **CAL-08** Compatible simultaneous activities MAY share wall-clock time when the user explicitly configures the pairing; actual time per activity MUST be tracked independently.

### 3.5 Deterministic scheduling

- **SCH-01** Engine MUST generate tentative weekly schedules and finalize the next day's schedule automatically at a user-configurable time.
- **SCH-02** Automatic placements MUST align to 15-minute boundaries; manual placement MUST support exact-minute start/end times.
- **SCH-03** Engine MUST allow tasks to be split across sessions and distribute multi-session work across available days.
- **SCH-04** Engine MUST consider ranked priorities, deadline urgency, applicable daily/weekly goals, allowed days, preferred windows, available capacity, and fixed constraints.
- **SCH-05** Approaching deadlines MAY override ordinary ranking preference in scheduling decisions but MUST NOT change stored ranks.
- **SCH-06** Engine MUST prioritize urgent deadlines and defined time goals before allocating leftover capacity to tasks without goals.
- **SCH-07** If not all work fits, engine MUST expose unscheduled work/conflicts and MUST NOT silently drop work or violate fixed constraints.
- **SCH-08** Engine MUST preserve finalized days against automatic replanning, except when explicitly instructed to fill newly available slots without moving existing sessions.
- **SCH-09** Explicit availability increases MUST fill only the newly available gaps; existing sessions MUST remain in place.
- **SCH-10** Early completion MUST NOT trigger automatic rescheduling or new task suggestions.
- **SCH-11** A user-reported overrun requiring movement of existing sessions MUST present proposed changes and require approval before application.
- **SCH-12** Engine MUST NOT assume remaining work equals an original estimate minus tracked hours; no total-work estimate is required.
- **SCH-13** Deadline warnings MUST identify scheduling conflicts or insufficient planned opportunity, not claim reliable project completion predictions without workload estimates.
- **SCH-14** Deadline warnings MUST NOT automatically generate or apply deadline-resolution suggestions.
- **SCH-15** Schedule updates MUST be validated and applied atomically; failed updates MUST leave the prior committed schedule intact.

### 3.6 Session tracking and analytics

- **TRACK-01** Sessions MUST separately store planned duration, optional actual tracked duration, completion status, and optional objective progress.
- **TRACK-02** User MUST be able to run pause/resume/stop timers and manually enter actual duration.
- **TRACK-03** System MUST NOT infer completion or actual time from planned time or elapsed wall-clock time without an explicit tracked timer or user input.
- **TRACK-04** Session statuses MUST include completed, partial, missed/skipped and be retained in calendar history.
- **TRACK-05** Intentional skipped sessions MUST count as missed for adherence statistics, with optional notes.
- **TRACK-06** System MUST show daily/weekly/monthly planned-versus-actual analytics, category breakdowns, and goal progress.
- **TRACK-07** System MUST offer status filters for historical calendar sessions.

### 3.7 AI assistant and permissions

- **AI-01** User MUST be able to converse through a persistent sidebar and expanded chat view, with multiple saved threads.
- **AI-02** Assistant MUST interpret explicit scheduling commands and access application state via authorized backend operations.
- **AI-03** Simple explicit schedule changes MAY apply immediately after backend validation; material tradeoffs, protected commitments, or destructive changes MUST require approval.
- **AI-04** Assistant MUST present a structured change summary and support undo/history for reversible actions.
- **AI-05** Assistant MUST NOT silently invent task objectives, completion, actual work, or new priority rankings.
- **AI-06** AI memory MUST be compact, user-manageable, and based on approved suggestions or explicit remember requests; structured settings remain canonical.
- **AI-07** User MUST be able to configure an AI model and view estimated token usage and costs.
- **AI-08** System MUST detect when the configured monthly AI spending threshold is reached and disable nonessential AI suggestions, reviews, and insights.
- **AI-09** Essential AI scheduling and scheduling commands MUST remain available after the threshold, with no reserved budget; UI MUST clearly disclose that this is a soft cap and essential calls may incur additional charges.
- **AI-10** Routine deterministic scheduling, calendar management, timers, reminders, and analytics MUST NOT depend on successful LLM calls.

### 3.8 Notifications and review

- **NOTIF-01** System MUST support in-app and permitted device/browser notifications for scheduled starts, reminders, and deadline risks.
- **NOTIF-02** If user has not confirmed starting a session, system MAY send one follow-up after a configurable delay, but MUST NOT repeatedly nag.
- **NOTIF-03** End-of-session prompts MUST be dismissible and allow completed/partial/skipped responses.
- **NOTIF-04** Notification quiet hours MUST be configurable, subject to explicit urgent-notification preferences.

### 3.9 Offline and synchronization

- **SYNC-01** Previously loaded tasks and calendar sessions MUST be viewable offline.
- **SYNC-02** Offline completion changes and note edits MUST queue locally and synchronize after connectivity returns.
- **SYNC-03** Conflicting device edits MUST resolve by last-write-wins using a defined, consistent modification ordering.
- **SYNC-04** AI conversations and cloud scheduling MUST require connectivity; offline support MUST NOT falsely indicate these operations succeeded.
- **SYNC-05** Sync retries MUST be idempotent or otherwise protected against duplicate application.

### 3.10 Reliability and auditability

- **REL-01** System MUST validate all mutations server-side, including AI-requested actions.
- **REL-02** Multi-record calendar mutations MUST use safe atomic database transactions.
- **REL-03** Transient errors SHOULD trigger bounded retries with backoff where safe.
- **REL-04** Permanent failures MUST return clear actionable error messages; no partial success may be reported as full success.
- **REL-05** System MUST record who/what initiated a change, when it happened, and relevant before/after details for auditable schedule edits.
- **REL-06** System MUST offer undo/restore for supported reversible changes without corrupting newer state.

## 4. Acceptance scenarios

| ID | Given | When | Then |
|---|---|---|---|
| AT-01 | A task has 2h daily, 10h weekly goals | Weekly planning runs | Eligible sessions are placed without asking for total hours to finish |
| AT-02 | Weekly goal is already met | A selected daily-goal day is planned | Daily-goal time may still be scheduled; optional extras stop |
| AT-03 | Task has no time goal | Goal-driven and urgent work have been allocated | Remaining time may be allocated by rank to the task |
| AT-04 | A day is finalized | Routine replanning runs | Existing finalized sessions remain unchanged |
| AT-05 | User explicitly frees 1–3 PM | Gap filling runs | Only 1–3 PM is filled; existing sessions do not move |
| AT-06 | A task has allowed days Mon–Fri | Engine plans Sunday | Task is not automatically placed on Sunday |
| AT-07 | User manually places that task Sunday | Calendar edit validates | Placement may succeed with manual override |
| AT-08 | A task has a deadline tomorrow but no remaining-work estimate | Risk evaluation runs | App warns of relevant scheduling constraints, not a fabricated completion prediction |
| AT-09 | Session planned for 60 minutes | User works 20 minutes and marks partial | Actual time is 20 minutes; completion remains partial |
| AT-10 | Monthly AI threshold reached | User requests schedule edit | Essential AI request remains available and any extra cost is tracked |
| AT-11 | Monthly AI threshold reached | Automatic AI coaching would run | Nonessential AI coaching does not run |
| AT-12 | Phone offline, laptop online | Conflicting edits sync | Defined last-write-wins ordering chooses one value |
| AT-13 | Multi-session schedule update fails mid-transaction | Commit aborts | Prior calendar remains intact |
| AT-14 | A recurring session is missed | Next week begins | Normal target resets; no extra catch-up session is added |
| AT-15 | A task is archived | Planner runs | Archived task is not scheduled, but retained history remains accessible |
| AT-16 | A task's recurrence changes | Next schedule is generated | Future unfinalized sessions use new rule; finalized ones are untouched |

## 5. Nonfunctional requirements

- **NFR-01 Security:** Enforce authenticated access, authorization on all server APIs, secure secrets handling, and encrypted transport.
- **NFR-02 Privacy:** Keep account data isolated; only send relevant minimized context to configured AI provider.
- **NFR-03 Responsiveness:** Design for usable desktop and mobile interfaces; quantitative latency targets to be established in architecture/performance plan.
- **NFR-04 Accessibility:** Keyboard access, readable contrast, and accessible form labels should be built into design; target standard to be chosen before UI implementation.
- **NFR-05 Cost transparency:** Token/cost estimates must be labeled as estimates and soft-cap overage disclosed.
- **NFR-06 Observability:** Log errors and critical state transitions without exposing sensitive prompts or credentials unnecessarily.
- **NFR-07 Recovery:** Backup and import processes must be testable, not merely scheduled.
- **NFR-08 Maintainability:** Separate deterministic scheduling rules, persistence, and AI orchestration; provide automated unit and integration tests.

## 6. Specification clarifications to resolve during design

1. **Essential AI and soft cap:** Determine provider-level spending protection and how to warn before an unusually costly essential request. A true hard API spend limit is incompatible with unlimited essential calls unless a free/local fallback exists.
2. **Last-write-wins:** Define authoritative ordering for offline timestamps and conflict resolution, including device clock skew.
3. **Deadline risk without total-work estimate:** Define objective warning triggers (e.g., no session before due date, unsatisfied explicit time goals, incompatible allowed days).
4. **Goals and session eligibility:** Specify exact interplay among recurring fixed sessions, selected daily-goal days, flexible weekly allocation, and no-goal leftover scheduling.
5. **Completion and finalized sessions:** Confirm whether manually marking a task complete should display already-finalized future sessions as planned-but-cancelable or simply preserve them unchanged.
6. **Backups and deletion:** Define restore-point retention, purge behavior, and what happens to deleted information still present in backups.
7. **Scheduling algorithm:** Define scoring/tie-breaking and formal infeasibility behavior without requiring an LLM.

## 7. Next SDLC deliverables

- Wireframes for Planner, Tasks, Events, Templates, Goals, Analytics, AI sidebar, Settings.
- Data model / ERD, scheduling state machine, constraint specification, API endpoints, permission matrix.
- Prioritized MVP backlog and implementation milestones.
- Automated acceptance tests mapped to the IDs above.
