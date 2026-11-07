# Daily preferences and realistic development sample

This frontend-only increment follows the PRD's separation between planned work and tracked outcomes, the SRS's explicit completion rules, and the Planner UI's distinction between timed activities, all-day events, and untimed daily tasks.

## Preferences

`SchedulingPreferences` lives in `frontend/src/types/preferences.ts`, separately from calendar entities. Its initial values are local wake time `04:00`, local bedtime `20:30`, a 60-minute work cutoff offset, and applicability `every-day` (all seven days). Bedtime can be adjusted inclusively between `20:00` and `21:00`, with minute precision. Both the input and state setter validate that range.

The Settings page edits an in-memory React context mounted above the routes. Preferences survive route navigation and reset on reload. Daily rhythm is displayed only in Settings so the Planner can prioritize the schedule. Work cutoff is derived from bedtime: 20:30 minus 60 minutes is 19:30. Local wall times are represented as `HH:mm`; they are not timestamps and have no date or UTC offset.

Preferences are soft guidance. They do not change visible hours, reject activities, generate sessions, move records, or infer completion. There is no persistence, backend, AI scheduling, or workout tracking. Any future automatic planner must consume these preferences through an explicitly designed scheduling policy.

## Development data

`frontend/src/mocks/realisticCalendar.ts` contains a separate dataset for November 2–8, 2026, using existing calendar types. The chosen sample week and timezone are explicit assumptions: current client week, America/Toronto. The user supplied Thursday's Romaeris meeting from 13:00–14:00. On November 5 this corresponds to `18:00Z–19:00Z`. The record is a fixed timed event. Other display timezones show the same instants at their corresponding local times.

Gym/upper-body training, pre-workout meals, COE 768, LeetCode, applications, capstone, Romaeris work, laundry, vacuuming, and trash have no supplied clock times, so they are flexible untimed assignments. Their days and completed/partial/planned statuses are illustrative sample data, not assertions about personal history. Actual tracked time remains unknown. Repeated assignments reference the same canonical task; completed sessions do not complete their task. The meeting is the only timed activity in this sample until additional exact times are supplied.

`DevelopmentSamples.tsx` provides a selector in the compact **Dev** toolbar menu between the original synthetic week (October 19–25) and this realistic week. Selecting or reopening a sample changes the displayed records and jumps to that sample's week. Today always navigates to the actual device-local current week without shifting fixture timestamps. Preferences are not changed by sample switching.

The selector is lazy-loaded behind `import.meta.env.DEV`. Production builds omit both this control and the realistic fixtures. The existing synthetic frontend mocks remain the production prototype's data source until a separately scoped persistence increment.

## Manual verification

1. Run `npm run dev` in `frontend` and open the local URL. In Planner, open **Dev** and choose **Realistic · Nov 2–8** under Development sample. Use **Open sample week** to return after navigating away. Dismiss the menu by clicking outside it or pressing Escape.
2. In America/Toronto, verify Thursday's Romaeris meeting occupies 13:00–14:00. All other realistic activities should be in Untimed, not assigned invented time slots. COE 768 appears repeatedly with the same underlying task ID.
3. Switch to Synthetic and verify all-day and timed cards from October 19–25. Switch back; neither dataset nor the preferences should change.
4. In Settings, confirm wake time 04:00, bedtime 20:30, and cutoff 19:30. Set bedtime to 21:00; cutoff becomes 20:00. Navigate to Planner, then return to Settings to confirm the value survives navigation. Try an invalid time outside 20:00–21:00: state must remain valid and a clear error appears. No preference summary should occupy space above the calendar.
5. Refresh: preferences return to defaults. This is intentional session-only state, not saved settings. Scheduled records must remain unchanged throughout.
6. Run tests, lint, and build. Production preview must not contain the development selector or realistic activities.

## Development status

This increment is part of `refactor/planner-visual-redesign`, which depends on the calendar foundation in `feature/weekly-calendar` (PR #1). The user approved checkpointing and publishing these changes for review. Preferences/sample data, theme infrastructure, visual refinement, documentation, and CI are organized into separate logical commits. Merge the prerequisite PR first, then retarget the follow-up to updated `main` and verify its diff. No automatic merge is authorized.
