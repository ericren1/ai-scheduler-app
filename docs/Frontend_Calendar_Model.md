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

Local form-time input is not implemented. Before creating timestamps from user-entered wall times, a future editor must explicitly handle nonexistent or repeated DST times rather than silently accepting JavaScript normalization. Recurrence expansion, arbitrary user-selected display timezones, visible-end clipping, overlap layout, and conflict validation are also deferred.

## Verification

From `frontend`, run `npm test`, `npm run lint`, and `npm run build`. Tests use Node's built-in test runner and TypeScript stripping (Node 22.18+ recommended), with no added dependencies. Separate test processes use UTC, America/Toronto, and Europe/Berlin to verify local display and both DST transitions independently of the developer's timezone. Production browser code never reads `process.env.TZ`.
