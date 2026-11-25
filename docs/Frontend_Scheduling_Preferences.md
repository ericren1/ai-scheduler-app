# Daily preferences and realistic development sample

This frontend-only increment follows the PRD's separation between planned work and tracked outcomes, the SRS's explicit completion rules, and the Planner UI's distinction between timed activities, all-day events, and untimed daily tasks.

## Preferences

`SchedulingPreferences` lives in `frontend/src/types/preferences.ts`, separately from calendar entities. Its initial values are local wake time `04:00`, local bedtime `20:30`, a 60-minute work cutoff offset, and applicability `every-day` (all seven days). Bedtime can be adjusted inclusively between `20:00` and `21:00`, with minute precision. Both the input and state setter validate that range.

The Settings page edits shared React state above the routes. Preferences now persist in the dedicated browser-local key `personal-hub.schedule.v1`, separately from personal calendar records and themes. Sleep/work defaults and overrides are configured in Settings; the Planner only shows subtle guidance shading that can be hidden in Hours. Work cutoff is derived from each night's effective bedtime: 20:30 minus 60 minutes is 19:30. Local wall times are represented as `HH:mm`; they are not timestamps and have no date or UTC offset.

Preferences are soft guidance. They do not change visible hours, reject activities, generate sessions, move records, or infer completion. Persistence is browser-local only; there is no backend, cloud sync, AI scheduling, or workout tracking. Any future automatic planner must consume these preferences through an explicitly designed scheduling policy.

## Daily defaults, weekday patterns, and date exceptions

`SchedulingPreferences` now includes optional default `workHours`, ISO-weekday overrides, and date-keyed overrides. Calendar entity types are unchanged. Resolution is field-by-field: daily defaults, then the day's weekday rule, then the specific date. Omitted fields inherit; `workHours: null` explicitly means no work/day off. Removing a rule restores inherited behavior. Defaults apply seven days per week. Work hours start unset because none were supplied by the user.

Sleep is assigned to the night it starts: a Monday rule describes Monday bedtime through Tuesday wake-up. Wake time must be earlier on the clock than bedtime for this overnight model; bedtime remains configurable within the existing 20:00–21:00 range. Work hours belong to the day they start; an earlier end time means an overnight shift, while equal times are rejected. Work cutoff is 0–180 minutes before bedtime, initially 60. The effective-date preview explains each resolved plan. These are planned hours, not actual sleep/work measurements.

`dailySchedule.ts` validates preferences, resolves inheritance, persists a versioned snapshot, and derives guidance bands using the existing calendar positioning utilities. Morning sleep/overnight work can originate on the preceding date, including outside the displayed week. Soft recurring boundary policy uses the earlier instant in a repeated hour and shifts nonexistent local times forward, labeling adjusted boundaries. Sleep's elapsed duration therefore follows DST instead of assuming a fixed number of milliseconds per civil day. Manual session entry keeps its stricter explicit DST-selection rules.

Guidance is a separate view layer behind activity cards, with distinct sleep, work, and wind-down styling. It is displayed only on the personal calendar; sample previews remain unchanged. Hours → Show sleep/work plan toggles the layer. It does not participate in session conflict checks and never creates tracking records. Overlapping sleep/work preferences remain visual guidance, rather than silently changing manual activities.

Malformed or unsupported saved preferences load safe defaults and block automatic overwrites of the original saved value. Storage failures show a warning while allowing in-session changes. The local preference store is not a cloud backup; export/import and cross-device sync remain future work.

## Development data

`frontend/src/mocks/realisticCalendar.ts` contains a separate dataset for November 2–8, 2026, using existing calendar types. The chosen sample week and timezone are explicit assumptions: current client week, America/Toronto. The user supplied Thursday's Romaeris meeting from 13:00–14:00. On November 5 this corresponds to `18:00Z–19:00Z`. The record is a fixed timed event. Other display timezones show the same instants at their corresponding local times.

Gym/upper-body training, pre-workout meals, COE 768, LeetCode, applications, capstone, Romaeris work, laundry, vacuuming, and trash have no supplied clock times, so they are flexible untimed assignments. Their days and completed/partial/planned statuses are illustrative sample data, not assertions about personal history. Actual tracked time remains unknown. Repeated assignments reference the same canonical task; completed sessions do not complete their task. The meeting is the only timed activity in this sample until additional exact times are supplied.

`DevelopmentSamples.tsx` provides a selector in the compact **Dev** toolbar menu between the original synthetic week (October 19–25) and this realistic week. Selecting or reopening a sample changes the displayed records and jumps to that sample's week. Today always navigates to the actual device-local current week without shifting fixture timestamps. Preferences are not changed by sample switching.

The selector is lazy-loaded behind `import.meta.env.DEV`. Production builds omit both this control and sample datasets. The default Planner now shows the user's own browser-local calendar, initially empty.

## Manual verification

1. Run `npm run dev` in `frontend` and open the local URL. In Planner, open **Dev** and choose **Realistic · Nov 2–8** under Development sample. Use **Open sample week** to return after navigating away. Dismiss the menu by clicking outside it or pressing Escape.
2. In America/Toronto, verify Thursday's Romaeris meeting occupies 13:00–14:00. All other realistic activities should be in Untimed, not assigned invented time slots. COE 768 appears repeatedly with the same underlying task ID.
3. Switch to Synthetic and verify all-day and timed cards from October 19–25. Switch back; neither dataset nor the preferences should change.
4. In Settings, confirm wake time 04:00, bedtime 20:30, and cutoff 19:30. Set bedtime to 21:00; cutoff becomes 20:00. Navigate to Planner, then return to Settings to confirm the value survives navigation. Try an invalid time outside 20:00–21:00: state must remain valid and a clear error appears. No preference summary should occupy space above the calendar.
5. Refresh: schedule preferences should remain saved in this browser. Set a Monday sleep pattern to 20:00–04:00, then a date exception for one Monday at 21:00 with no work. Check a day should show a 20:00 cutoff on that date, a 19:00 cutoff on other Mondays, and inherited values on other days. Remove the date rule to restore the weekly pattern.
6. Run tests, lint, and build. Production preview must not contain the development selector or realistic activities.
7. In My calendar, use Full day and inspect guidance overnight. An override for the preceding night's wake-up should appear in the next morning's column. Hide the plan in Hours and verify manually scheduled sessions remain unchanged. Configure an overnight work shift and inspect both date segments.

## Development status

This increment is part of `refactor/planner-visual-redesign`, which depends on the calendar foundation in `feature/weekly-calendar` (PR #1). The user approved checkpointing and publishing these changes for review. Preferences/sample data, theme infrastructure, visual refinement, documentation, and CI are organized into separate logical commits. Merge the prerequisite PR first, then retarget the follow-up to updated `main` and verify its diff. No automatic merge is authorized.
