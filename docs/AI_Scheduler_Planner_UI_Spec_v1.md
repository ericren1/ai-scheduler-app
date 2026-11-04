# AI Scheduler — Planner UI & Interaction Specification

**Version:** 1.0 (design baseline)  
**Status:** Planner UI decisions consolidated; ready for design review  
**Scope:** Phase 1 manual scheduler / Tweek replacement. Phase 2 automatic scheduling and Phase 3 AI are excluded from implementation but must be supported by extensible data structures.

## 1. Product objective

Provide a usable, authenticated, responsive weekly time-based planner for manual scheduling, completion tracking, and managing linked task sessions. The desktop weekly calendar is the primary workspace; mobile defaults to a daily timeline with a seven-day date strip.

## 2. Screen structure

### Desktop wireframe (conceptual, not to scale)

```text
+--------------------------------------------------------------------------+
| [Nav toggle] Planner   [<] [>] Oct 19–25 [Date picker] [Today] [Zoom] [Tasks] |
+----------+--------------+------------------------------------------------+
| Nav      | Unscheduled  | MON  TUE  WED  THU  FRI  SAT  SUN               |
| Planner  | Tasks        | [All-day events / multi-day spans]               |
| Tasks    | [task card]  | [Untimed daily checklist per date]              |
| Goals    | [task card]  |  7 AM | timed sessions, duration-based blocks   |
| ...      | [task card]  |  8 AM |                                         |
|          |              |  9 AM |  overlapping sessions grouped           |
|          |              | ...                                            |
+----------+--------------+------------------------------------------------+
| Wednesday [collapse] — detailed hourly timeline (selected date)           |
| 7:00 | Gym                                                               |
| 8:00 | ...                                                               |
+--------------------------------------------------------------------------+
```

Navigation and unscheduled-task panels collapse independently; calendar expands into available width. Future AI panel must not require rebuilding the planner layout. On small screens, panels overlay rather than compress the timeline.

### Mobile wireframe

```text
+----------------------------------+
| [Menu] Wednesday, Oct 21 [Tasks]  |
| M  T  [W]  T  F  S  S            |
| All-day events                   |
| Untimed checklist                |
| 7:00  [Gym]                      |
| 8:00  [...]                      |
| 9:00  [Work]                     |
| ...                              |
+----------------------------------+
```

## 3. Visual rules

- **Weekly calendar:** Seven day columns and a vertical hourly grid. Timed activities occupy proportional vertical durations, not one fixed-height cell per activity.
- **Expanded day:** Selecting a day reveals a detailed hourly timeline below the week; collapsing returns to the full-week workspace. Both views edit the same session data.
- **All-day area:** Separate row above the hourly grid for all-day and multi-day events.
- **Untimed daily checklist:** Separate row/section per day above the hourly grid; distinct from all-day events and global unscheduled tasks.
- **Visible hours:** User-defined default start/end time with full 24-hour view available. Out-of-range events must remain discoverable.
- **Zoom:** Compact, Normal, Detailed. Zoom changes visual pixels per hour, never stored event times.
- **Colors:** Categories assign colors; cards inherit them. Relevant property icons are allowed, but **do not show recurrence-specific indicators on cards or in quick popovers**. Recurrence remains accessible in full editor.
- **Adaptive cards:** Show title at minimum; show time, completion indicator and optional note preview as available dimensions permit. Content must be truncated or accessible via details rather than overflow.
- **Completion:** Completed sessions retain their time slot, appear subtly faded, and show a checkmark; don't assume completion from time elapsed.
- **Now marker:** Thin current-time line in today's column and subtle highlight on activity scheduled at current time; highlight is not proof work started.
- **Overlap:** Activities occupying the same interval are grouped in a shared block, with access to each individually. Differentiate explicitly compatible overlaps from conflicts; don't hide a conflict merely by grouping.

## 4. User interactions

### 4.1 Navigation

- Previous/next controls move exactly one week.
- Today jumps to current week and selects current date.
- Date picker jumps to the week containing the chosen date.
- Mobile date strip selects one of seven days; swipe navigation may be implemented with appropriate touch behavior.
- Both desktop sidebars collapse independently, retaining current calendar context.

### 4.2 Create and inspect

- Click a vacant time slot or drag across a time interval to open **quick-create**, prefilled with date, start and end times. Enter title; save to create.
- **More options** opens the full editor for recurrence, notes, task association and advanced fields.
- Clicking an existing card opens **quick details** with time, completion, notes preview and actions. **Edit details** opens full editor.
- Editing a recurring session defaults to **this occurrence**; offer **this and future** and **all occurrences** explicitly. Preserve historical/finalized sessions except when specifically authorized by the user.
- Calendar cards and quick popovers do not display recurrence icons or recurrence summaries.

### 4.3 Task-to-session scheduling

- Tasks are canonical records on the Tasks page; scheduled sessions are separate records linked to a task.
- Dragging a task from the collapsible unscheduled sidebar into the calendar creates a linked session and **does not remove or complete the underlying task**.
- A task can have many sessions across a week; completing one session does not necessarily complete the task.
- Untimed daily tasks can be assigned to a day without a start/end time and later dragged into an hourly slot; preserve task identity and avoid duplicate underlying tasks.

### 4.4 Drag, resize and selection

- Dragging a session moves its start/end while retaining its duration, subject to validation.
- Resizing changes session duration. Manual edits support minute-level precision; any snapping policy is an implementation design detail, not permission to alter stored times silently.
- Ctrl/Cmd-click supports additive selection; an explicit selection mode supports touch and prevents collision with drag-to-create.
- Drag-selection rectangles select intersecting calendar sessions in selection mode.
- Bulk move, duplicate and delete operate on the selected set, with preview/conflict warnings and Undo. Confirm destructive or high-impact actions.
- Changes to overlapping/grouped activities must target the selected underlying session(s), not accidentally the entire group.

### 4.5 Conflicts and reliability

- While dragging or resizing, visually highlight conflicts before drop.
- On drop, show affected items and ask to **cancel** or **keep overlap**; no silent movement of existing activities.
- An intentionally compatible simultaneous activity may be allowed; a fixed commitment is still protected from automatic movement.
- Validate operations server-side and apply multi-record updates transactionally. On transient errors retry safely without duplicate writes; show actionable failure messages.
- Maintain change history and Undo for edits; successful UI state must reflect persisted data, with rollback or error indication on failure.

## 5. Primary interaction flows

**F-01 Create timed activity:** Select empty slot → quick-create appears with chosen interval → enter title → save → validated session appears at correct date/time.

**F-02 Schedule existing task:** Open task sidebar → drag task to available slot → preview → drop/confirm if conflict → linked session created → task remains in Tasks page.

**F-03 Complete session:** Open session quick details → mark completed → calendar fades card and shows checkmark → actual time remains unknown unless tracked or entered.

**F-04 Expand day:** Select Wednesday → Wednesday's detailed timeline expands below weekly view → edit session → both views reflect saved edit.

**F-05 Edit recurrence:** Open recurring occurrence → full editor → change time → scope defaults to this occurrence → save → only this occurrence changes unless a broader scope was explicitly selected.

**F-06 Group overlap:** Two sessions occupy same interval → one group block shown → open group → choose specific activity → edit or complete independently.

**F-07 Bulk selection:** Enter selection mode → drag rectangle over sessions → add/remove via click → choose bulk action → preview conflicts → confirm → update atomically, with Undo.

**F-08 Conflict preview:** Drag session over occupied slot → warning displayed live → drop → cancel or keep overlap; no other activity is silently moved.

**F-09 Mobile day navigation:** Open Planner on phone → current day's timeline shown beneath week strip → tap adjacent date → selected day changes without losing task status.

## 6. Core entities / data contracts (conceptual)

- **Task:** persistent work definition, category/folder, completion type, goals, priority, recurrence configuration, notes and archive status.
- **Session:** dated scheduled instance, optional task reference, start/end or untimed assignment, completion status, notes and actual tracked time.
- **Event:** fixed or movable commitment; may be timed, all-day or multi-day; may recur.
- **Category:** label and color used by tasks/sessions.
- **Recurrence series:** rule plus exceptions/overrides for individual occurrences; edits preserve historical instances.
- **Calendar preferences:** visible hours, zoom, selected date, sidebar visibility and other view state.
- **Change record:** actor, timestamp, affected entities, before/after data or equivalent reversible change representation.

**Open technical design questions:** precise recurrence expansion strategy, handling time zones/DST, touch selection gesture, keyboard accessibility, overlap grouping algorithm, responsive breakpoints, offline sync semantics, and the transactional Undo mechanism. These are engineering decisions to resolve during architecture/implementation planning, not additional product-feature choices.

## 7. Acceptance criteria (Phase 1)

1. A signed-in user can view seven date columns with time-proportional activity blocks and switch weeks via arrows, Today and date picker.
2. An existing task can be scheduled multiple times without duplicating the task record; sessions reference the same task.
3. The weekly view and expanded daily timeline show consistent saved state after edits.
4. A user can add an all-day event, an untimed daily task and a timed session; they render in three separate areas.
5. Compact/Normal/Detailed zoom and visible-hours settings do not modify persisted session timestamps.
6. Overlapping sessions are grouped; a user can inspect and modify an individual session without modifying the others.
7. Conflict highlighting appears during drag/resize, and conflicts require an explicit decision before saving.
8. A completed session is visibly faded with a completion indicator but remains in its original slot.
9. Editing one recurring occurrence leaves other occurrences unchanged unless the user selects a broader scope.
10. Multiple sessions can be selected using Ctrl/Cmd-click or a drag rectangle in selection mode and bulk edited with preview and Undo.
11. On mobile, a seven-day strip controls a readable single-day hourly timeline.
12. An unauthorized request to planner APIs is rejected; paid API keys are never exposed to the client.
13. Failed multi-record updates leave persisted calendar data consistent and display a clear error.

## 8. Implementation boundaries

**Phase 1:** manual CRUD, task/session linking, recurrence, calendar interactions, completion, goals/time tracking as defined by the wider SRS, authentication, persistence, responsive UX, and essential reliability.

**Phase 2:** deterministic automatic allocation, finalization, goal-based planning, and scheduling engine. Must reuse Phase 1 session and event models.

**Phase 3:** AI chat/agent, conversational editing, memory, usage limits and cost controls. Must invoke the same validated backend operations.

## 9. Design review checklist

- [ ] Approve desktop and mobile wireframes
- [ ] Walk through F-01 through F-09 as clickable prototypes
- [ ] Check accessibility, keyboard interactions and touch targets
- [ ] Verify recurrence and conflicts are understandable without clutter
- [ ] Reconcile any Phase 1 vs future-phase boundaries in the PRD/SRS
- [ ] Baseline this document and create user stories before coding
