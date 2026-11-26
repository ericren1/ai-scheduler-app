# Basic manual scheduler

Development is currently on local `main` at the user's request. Existing validated feature history was fast-forwarded into it; GitHub main and the open PRs were not changed. Feature branches resume for additions such as AI after the basic scheduler works.

## Available flow

1. In Tasks, add a title and category. No estimate of total work is required.
2. In Planner, select New session, choose a task, and assign a date. Choose exact-minute start/end times or assign the task to the day without a time. Fixed/flexible placement is explicit; overnight sessions have a separate end date.
3. Schedule the same task multiple times. Each session links to the canonical task ID.
4. Mark a timed session complete in its details, or use the per-session checkboxes in Tasks for timed and untimed sessions. This never completes the task or invents actual tracked minutes. A completion can be changed back to planned.
5. Open **Edit session** from a timed card's details, **Edit** on an untimed assignment, or **Edit** next to a session in Tasks. Change its date, time, or fixed/flexible placement, or convert it between timed and untimed. Its task association cannot be changed through this editor.
6. Moves preserve the original elapsed duration by default, including overnight and DST intervals. Disable **Keep duration when moving** to edit the end date/time. When editing from Planner, saving follows the session to its destination week. Editing from Tasks stays on Tasks. Cancel or Escape leaves all records unchanged.
7. In Tasks, choose **Edit task** to change its title/category. These become defaults for new sessions; existing sessions keep their saved title/category snapshots and history. When a session's title differs from its task's current title, Tasks shows the saved session title alongside its date/time.
8. Choose **Complete task** or **Reopen task** explicitly. This never changes linked sessions or their completion/tracked time, including future sessions already placed manually. Completed tasks disappear from the unscheduled panel and cannot receive new sessions until reopened. Their existing sessions remain editable, completable, and deletable. Use the status filter to find active/completed tasks; filters combine with search and category.
9. Choose **Delete** beside a session in Tasks, **Delete session** in a timed card's details/editor, or **Delete** on an untimed calendar assignment. A native confirmation dialog describes the exact session and any recorded time. **Keep session** is focused first. Keep or Escape changes nothing; **Delete session** removes only that session, leaving the task and sibling sessions intact. This removes its notes, completion, and tracked minutes as well. There is no undo; a previously downloaded backup can restore the earlier whole calendar. Deleting a fixed/finalized session is an explicit manual action and requires this same confirmation. No series expansion or bulk deletion occurs.

The Planner opens your personal calendar, initially empty, instead of synthetic records. Existing synthetic and realistic weeks remain in the development-only Dev menu. They are isolated previews: no creation or completion controls mutate those fixtures. My calendar returns to personal records. Sample switches and theme changes do not modify saved tasks/sessions. Synthetic fixtures are now lazy-loaded with development controls instead of being imported by the production Planner.

## Architecture and storage

`CalendarProvider` owns the personal records above the routes. Tasks, Planner, and card details share this single source of truth. Pure functions in `manualScheduler.ts` validate task/session creation and update completion immutably. Domain types and calendar positioning remain unchanged.

Creation and editing share `SessionDialog.tsx`. The provider hosts one editor outside calendar cards, so moving a card out of its current day/week does not unmount its editor mid-save. An optional save callback lets Planner navigate to the destination week without coupling pure data updates to routing. The provider sits inside the router so dialog links keep their navigation context.

`editSession` validates a candidate while excluding the original interval from overlap checks. It replaces the selected record under the same ID, preserves its completion/tracking/notes/finalization metadata, removes obsolete timing fields when converting between timed and untimed, and leaves other sessions and the task unchanged. Snapshot loading also preserves validated notes, actual tracked minutes, and session status across refreshes. There is no inferred completion or actual work time after a move.

Task editing, task completion/reopening, and session deletion use separate immutable helpers in `manualScheduler.ts`. Editing an existing session on a completed task validates through a temporary active-task copy without reopening the actual task. Creating a new session still requires an active task. Task editing and session deletion do not infer any status changes.

`TaskRecord.tsx` renders task/session actions, while `TaskDialog.tsx` edits task defaults. `DeleteSessionDialog.tsx` is hosted by the calendar provider outside the individual calendar card, so the confirmation survives card removal. Native dialogs preserve keyboard modality and cancellation; deletion returns focus to the invoking control when it remains, otherwise to main content.

The personal storage version remains 1 and accepts both active and completed tasks. Previously saved active-only data requires no migration. Session category snapshots are validated and preserved independently of the current task category; older sessions without a category use their task's category as a fallback. This also applies to JSON backups. Archived-task controls are not part of this increment.

`calendarDefaults.ts` supplies a clean personal calendar and category colors. Actual tasks and sessions are written under `personal-hub.calendar.v1` in browser localStorage after manual changes. The versioned snapshot excludes demo data, themes, preferences, generated artifacts, and backend secrets. `calendarStorage.ts` validates the saved snapshot and whitelists fields on load. Invalid/unsupported/dangling records prevent loading and automatic overwrites; a warning explains that new changes are in-memory only. Failed writes also produce a warning rather than claiming a successful save.

This is browser-local persistence only. It is scoped to the browser profile and origin; clearing site data or changing hosts/ports can make records unavailable. Settings now supports explicit JSON export and validated replacement restore for personal records and schedule preferences; see [Backup and restore](Backup_Restore.md). There is no cloud sync, authentication, automatic backup service, or multiple-tab coordination. Keep downloaded backups separately and close other tabs before restoring.

## Dates and overlaps

The form resolves local date/time input to UTC timestamps without rounding. Nonexistent spring-forward times are rejected. Repeated fall-back hours require choosing the specific occurrence, labeled with its offset. Date-only assignments retain their local civil date. The elapsed-time geometry and per-day DST label fallback remain intact.

Existing timed records are checked for half-open interval intersection. A conflicting creation is rejected unless the user explicitly selects Intentionally keep overlapping activities. Keeping an overlap does not classify it as compatible or move any other record. Daily rhythm preferences do not prohibit manually chosen times.

## Validation and limits

Automated tests cover independent task/session identity and completion, input validation, overlap consent, minute precision, DST missing/repeated hours in Toronto/Berlin, persistence round-trips, and invalid/blocked storage handling. Existing calendar, preferences, and theme tests remain in place. Run tests, lint, and build from `frontend`.

Browser verification uses an isolated profile to create a task, schedule a 09:07–10:37 session, complete it without completing its task, add an untimed assignment, navigate between routes, and refresh to confirm persistence. These test records do not enter the user's browser profile.

Editing tests cover self-overlap exclusion, cross-week movement with duration retained, explicit overlap consent, failed validation/cancellation without writes, timed/untimed conversion, independent identity/outcome preservation, and storage round-trips. Browser checks confirm the editor is prefilled, task relinking is disabled, Planner follows the moved session, demo records remain read-only, and history survives refresh. To inspect manually, create a task/session, move it to another week from card details, then change an untimed assignment into a timed one. Uncheck the duration option to try resizing; try an occupied interval and Cancel before explicitly keeping an overlap.

Task lifecycle tests cover edit validation, future defaults versus saved session history, independent completion/reopening, completed-task session edits, targeted timed/untimed deletion, and storage/backup round-trips. Browser checks verify task status filtering, cancel/Escape/focus behavior, explicit deletion from timed and untimed calendar entries, narrow dialog sizing, and persistence after refresh. Storage-write failures retain the existing memory-only warning behavior; a deletion that could not be saved may reappear on reload.

Current limits: task archiving/permanent task deletion, event creation, undo/history, recurrence expansion, drag-and-drop, automatic allocation, AI, backend, and cloud storage are not implemented. Editing is manual through the form; keeping an overlap must be explicitly selected again when saving an overlapping interval. These remain follow-up increments for the working manual scheduler. No new changes have been committed or pushed automatically.
