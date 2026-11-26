# Personal Hub backup and restore

## Use

In **Settings → Backup**, choose **Download JSON backup**. Keep the downloaded file somewhere you control. The app requests a download; verify the file exists in your browser's downloads. No backup is uploaded or scheduled automatically.

To restore, choose a Personal Hub JSON backup (maximum 5 MB). The app validates the complete file, then shows its creation time, timezone, and current/replacement task and session counts. Nothing changes until you check the replacement confirmation and choose **Replace with backup**. Cancel leaves saved data unchanged. Restoring replaces the personal calendar and schedule preferences; it does not merge them or preserve records added after the backup. Download your current data first and close other Personal Hub tabs.

The file contains the currently loaded personal tasks, their timed and untimed sessions, completion status, optional notes and actual tracked minutes, and sleep/work preferences including weekday and date overrides. If loading or saving previously failed, export includes the currently loaded in-memory state; it cannot reconstruct unreadable saved data. Settings warns about this case.

Both active and completed tasks are supported. A session's saved title and category remain independent of later task edits; backup/restore retains those snapshots. Legacy sessions without their own category fall back to the linked task's category. Deleting a session removes it from later backups; only an earlier backup can restore it, by replacing the whole personal calendar and preferences. Previously downloaded backup files are not changed or deleted by app actions.

Development fixtures, appearance, navigation/view state, and the category definitions supplied by the app are excluded. User-created events, editable categories, recurrence, archived tasks, and other unsupported features are not part of this version. Export is independent of whichever development sample was most recently viewed.

## Version 1 format

The top-level object contains:

| Field | Representation |
| --- | --- |
| `app` | Exactly `personal-hub` |
| `version` | `1` |
| `exportedAt` | ISO timestamp with explicit UTC `Z` |
| `timeZone` | Exporting browser's IANA timezone, such as `America/Toronto` |
| `calendar` | `{ version: 1, tasks: [...], sessions: [...] }`, matching the supported personal storage contract |
| `schedule` | `{ version: 1, preferences: {...} }`, matching the schedule preference contract |

Timed session start/end values remain UTC instants, displayed in the restoring browser's local timezone. Untimed `YYYY-MM-DD` assignments remain civil dates. Preference `HH:mm` values remain local clock times; they are not converted to the backup timezone. A different source timezone produces a preview notice. The source timezone is metadata, not an instruction to change the app's display timezone. Local dates and DST positioning continue to use the existing utilities.

`calendarBackup.ts` handles parsing, export construction, and restore orchestration. It reuses the calendar and schedule decoders: dangling task links, duplicates, invalid intervals/dates, unsupported versions, and invalid preferences are rejected. Objects are reconstructed from supported fields; unknown fields are dropped. The file-size check happens before file reading and again when parsing text. Invalid imports never write storage.

## Safe replacement and recovery

`backupStorage.ts` owns the two existing storage key constants and a temporary `personal-hub.restore-journal.v1` key. A replacement proceeds synchronously:

1. Recover any pending earlier restore before starting another.
2. Read both previous raw storage values, preserving absent or unreadable values exactly.
3. Save a recovery journal containing those values. If this fails, do not replace either store.
4. Write the validated calendar and schedule snapshots.
5. Remove the journal to finish. Only then publish both restored values to React state and clear storage warnings.

Any failure after step 3 attempts to restore both previous values and remove the journal. If rollback also fails, retain the journal and show an actionable error. Provider initialization and later storage writes attempt journal recovery before reading/writing personal data. Failed recovery protects storage and keeps changes in memory. In-memory records are not replaced by a failed import. A successful explicit restore can replace a protected malformed store, after validation and confirmation.

`localStorage` has no true transaction spanning keys. This journal protects against partial writes and interrupted reloads within one browser workflow; it does not provide cross-tab locking, synchronization, or a database transaction. Multiple active tabs can overwrite stale state, so close them before restoring. Quota limits can prevent creating the temporary journal, especially when storage is nearly full. Keep downloaded backups separately; clearing all site storage also clears the recovery journal.

The providers expose methods for accepting an already-persisted restored snapshot. These are used after the restore utility succeeds, rather than triggering two independent ordinary save operations. Settings remounts the schedule forms after restoration so local form drafts cannot keep the previous preferences visible or accidentally save stale work hours.

## Verification

Run `npm test`, `npm run lint`, and `npm run build` in `frontend`. Backup tests run alongside existing tests in UTC, Toronto, and Berlin. They cover identity/history round-trips, timezone interpretation, invalid input, excluded fields, independent storage keys, partial-write rollback, journal preparation failure, interrupted recovery, and malformed journal protection.

Manual checks:

1. Create a task with two sessions (one untimed), complete one, and configure a weekday/date schedule exception.
2. Download a backup and inspect its counts and version. Select a development sample, return to Settings, and verify another export still contains only personal records.
3. Choose the backup. Verify the preview, disabled replacement button before confirmation, and unchanged records after Cancel.
4. Make a small calendar/settings change, then confirm replacement from the backup. Verify both records and preferences return to the exported state, including linked task IDs and completion. Refresh and verify again.
5. Try malformed JSON, unsupported versions, or a file over 5 MB. Expect an error and no writes.
6. In an isolated test browser, simulate quota/write failure and interrupted recovery. Verify rollback and no false success. Never corrupt the user's real browser storage for testing.
7. Check the backup section in dark/light themes, keyboard focus/confirmation, and a narrow viewport. No horizontal form scrolling should be needed.

Browser verification for this increment used an isolated Chrome profile and checked the actual downloaded JSON, invalid-input protection, preview/cancel, explicit confirmation, simulated second-write failure, restored form values, refresh persistence, interrupted journal recovery, and narrow-screen layout. This is manual backup/restore only; cloud backups, automatic retention, cross-device sync, and authentication remain future work.
