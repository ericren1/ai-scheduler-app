# Frontend calendar model (Sprint 1)

Based on the PRD, SRS TASK-03/07, CAL-08, TRACK-01/03/04, and Planner UI sections 3, 4.3, and 6. This establishes frontend contracts; it does not implement persistence, recurrence expansion, scheduling, or UI.

## Files and responsibilities

- `frontend/src/types/calendar.ts`: serializable domain types, without React dependencies.
- `frontend/src/utils/calendarDate.ts`: calendar arithmetic and per-day positioning.
- `frontend/src/mocks/calendar.ts`: deterministic fixtures for October 19–25, 2026.
- `frontend/tests/calendarDate.test.ts`: behavior tests; also type-checked by the build.

Tasks describe canonical work. Sessions optionally reference a task by ID; many sessions can reference the same task. Task status and session status are independent. Untimed daily tasks are session assignments with a date and required task reference, not duplicate tasks or all-day events. Discriminated unions (`kind`) keep timed, untimed, and all-day records distinct; callers narrow the kind before reading time fields.

Planned duration is derived from timed endpoints using `plannedDurationMinutes`, avoiding a duplicated value that could become stale after resizing. `actualTrackedMinutes` is independently recorded: absent means unknown, zero means explicitly zero. Neither elapsed time nor completion fills it automatically. Skipped and missed remain distinct statuses, though future adherence analytics should count both as missed.

Session `placement` distinguishes fixed from flexible. Event `commitment` distinguishes fixed from movable; movable does not authorize automatic movement. Compatible overlap is explicitly linked by session IDs, not assumed from visual overlap. Fixtures make this pairing symmetric. Server validation and conflict detection remain future work.

## Date and timezone contract

- `LocalDate` is a Gregorian `YYYY-MM-DD` string. It is a civil date, not midnight UTC. Use it for all-day boundaries and untimed assignments. All-day end dates are exclusive.
- `Timestamp` is an ISO 8601 datetime including seconds and `Z` or an explicit offset. Writers should use `Date.toISOString()` to normalize to UTC. Endpoint differences measure elapsed minutes, including across DST.
- These aliases document representation; they do not provide runtime validation for whole records. Date utilities validate their inputs. Runtime record validation belongs at future input/API boundaries.
- Local `HH:mm` recurrence/preferences fields express wall-clock intent. Recurrence stores an IANA timezone, start date, and rule ID so future expansion can retain that intent. Exception dates and original occurrence dates reserve identity for later occurrence editing; full override/scope behavior is not implemented.
- Display uses the browser/device timezone through local `Date` getters. No timezone is hardcoded in production utilities. Changing device timezone changes the displayed dates/times of instants, while date-only assignments stay on their recorded dates.
- Never parse a date-only string with `new Date(date)` for display: JavaScript treats that form as UTC. Calendar arithmetic uses an internal UTC anchor solely to add civil days safely, then returns date strings. It never adds fixed 24-hour milliseconds to local dates.
- `previousWeek` and `nextWeek` return the Monday of the adjacent week. `isToday` accepts an optional clock for deterministic tests.

## Positioning and DST

`getSessionPosition(session, date, options)` returns pixel `top`, `height`, and full `dayHeight`, or `null` if the interval does not intersect that local day. It clips cross-midnight sessions at local day boundaries. The default scale is 60 pixels/hour. `visibleStartMinutes` offsets the origin without clipping or hiding early events; negative positions are intentional. No timestamps are modified or snapped.

The vertical axis measures elapsed minutes from local midnight. Normal days have 24 hours, spring-forward days 23, and fall-back days 25. This preserves positive duration and distinct positions during repeated hours. The future grid must generate labels from instants on this same axis, skipping nonexistent local hours and distinguishing repeated ones with offsets. Days with different lengths need coordinated scrolling/alignment in the future weekly UI; blindly assuming 1440 minutes will be incorrect. A midnight skipped by a timezone transition uses the first representable time of that day; entirely skipped dates are rejected for geometry.

Local form-time input is not implemented. Before creating timestamps from user-entered wall times, a future editor must explicitly handle nonexistent or repeated DST times rather than silently accepting JavaScript normalization. Recurrence expansion, arbitrary user-selected display timezones, and conflict validation are deferred. Visible-end clipping and simple overlap lanes are implemented in Part 2 below.

## Verification

From `frontend`, run `npm test`, `npm run lint`, and `npm run build`. Tests use Node's built-in test runner and TypeScript stripping (Node 22.18+ recommended), with no added dependencies. Separate test processes use UTC, America/Toronto, and Europe/Berlin to verify local display and both DST transitions independently of the developer's timezone. Production browser code never reads `process.env.TZ`.

## Sprint 1 Part 2: read-only weekly view

`PlannerPage` owns only the displayed Monday, task-panel visibility, and local visible-hour preferences (initially 06:00–23:00). Canonical mock collections are imported once and passed as read-only props. Derived daily lists, weekly unscheduled tasks, category lookup, and lane positions live in pure helpers in `calendarView.ts`. There are no mutations or persistence. Changing routes remounts Planner and resets its view preferences.

`PlannerToolbar`, `UnscheduledTasksPanel`, `WeekCalendar`, `CalendarDateRows`, `DayColumn`, and `ActivityCard` separate view concerns. Each day owns its hour labels, avoiding a misleading shared gutter on transition days. The calendar scrolls within its own region, with sticky date headers and a minimum column width. On narrower screens the open task panel appears above the calendar. The application navigation remains independent. Native HTML popovers provide keyboard-accessible read-only details for truncated timed cards; they require a modern browser with Popover API support.

`getDayWindow` resolves local hour boundaries into instants, then produces elapsed offsets and hourly ticks. Both the ticks and `getSessionPosition` use the same midnight origin and pixels-per-hour scale. A nonexistent boundary advances according to JavaScript Date's compatible policy; ambiguous boundaries use the earlier occurrence. An entirely skipped visible window has no ticks or cards and displays a clock-change message. Full-day windows use the next local midnight, so DST days retain 23/25 hours. Labels include timezone offsets, distinguishing repeated hours. Shorter columns leave unused space underneath, rather than stretching cards. Exotic historical fractional-hour transitions may produce fractional final intervals; precise wall-time input remains out of scope.

Visible clipping is applied after day clipping. Records partially or wholly outside visible hours remain listed above their day, with a full-day control available. Overnight records can have a separate card segment on each day, with unique detail IDs. All-day spans are repeated in each included date cell with an exclusive end date; continuous spanning bars are deferred.

Simple greedy lanes share width within each connected overlap group, reusing a lane once its previous interval ends. This is visual interval layout, not conflict detection or authorization. Compatible-session metadata remains untouched; no warning or permission workflow is introduced.

Unscheduled means an active task without any timed or untimed assignment intersecting the displayed week. It does not imply a task with existing sessions cannot be scheduled again. Tasks are sorted by priority without changing the canonical array. The sample includes an unassigned reading task to demonstrate this panel.

Development builds expose a Sample week shortcut to October 19–25, 2026 through `import.meta.env.DEV`. Production builds omit it. Initial load and Today always use the device's actual local date; fixture instants never move automatically to match it. Recurrence expansion, editing, drag-and-drop, conflict resolution, full mobile daily views, backend, AI, and record persistence remain unimplemented. Today highlighting refreshes when the view renders; there is no midnight timer in this increment.

### Manual browser checks

1. Run `npm run dev` from `frontend`, open the printed local URL, and select Planner. Confirm the current local Monday–Sunday range and 06:00–23:00 defaults.
2. Choose Sample week. In America/Toronto, verify Monday's fixed review at 09:00, coding at 10:00–11:30, Thursday's adjacent walk/podcast cards at 12:00, Friday's all-day event, and Thursday's untimed groceries. Other timezones intentionally shift timed records.
3. Open a card using mouse or keyboard; confirm complete read-only title, time, status, and notes. Close with Escape or Close. Completed sessions remain in place and their parent task stays active.
4. Toggle Tasks and the application sidebar independently. Confirm the reading task appears as unscheduled in the sample week. Check the other routes and return to Planner.
5. Navigate previous/next weeks and Today. Empty weeks retain all seven columns. Cross December/January to check range labels.
6. Narrow visible hours to exclude an activity. Check its outside-hours notice, then Show full day. Confirm record times and durations do not change.
7. With browser timezone emulation set to America/Toronto, navigate to November 1, 2026 and Show full day. Sunday has both 01:00 labels with distinct GMT offsets and a 25-hour column. March 8 skips 02:00 and has 23 hours. With a 02:00–03:00 window on spring-forward Sunday, confirm a skipped-hour message instead of a crash.
8. Resize to tablet/phone widths, open Tasks, and scroll horizontally/vertically inside the calendar. Check sticky date headers, visible keyboard focus, readable details, and the preserved app navigation.
9. Run `npm run build` then `npm run preview`; verify the Sample week shortcut is absent in the production preview.
