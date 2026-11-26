/** Versioned personal stores; appearance and development fixtures stay separate. */
export const CALENDAR_STORAGE_KEY = 'personal-hub.calendar.v1';
export const SCHEDULE_STORAGE_KEY = 'personal-hub.schedule.v1';
export const RESTORE_JOURNAL_KEY = 'personal-hub.restore-journal.v1';

export type BackupStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
interface Journal { version: 1; calendar: string | null; schedule: string | null }

function restorePrevious(storage: BackupStorage, journal: Journal) {
  for (const [key, raw] of [[CALENDAR_STORAGE_KEY, journal.calendar], [SCHEDULE_STORAGE_KEY, journal.schedule]] as const) {
    if (raw === null) storage.removeItem(key); else storage.setItem(key, raw);
  }
  storage.removeItem(RESTORE_JOURNAL_KEY);
}

/** A journal left by an interrupted import restores both original values before loading. */
export function recoverBackupRestore(storage: BackupStorage): void {
  const raw = storage.getItem(RESTORE_JOURNAL_KEY);
  if (raw === null) return;
  const journal = JSON.parse(raw);
  if (journal?.version !== 1 || ![journal.calendar, journal.schedule].every(value => value === null || typeof value === 'string')) {
    throw new Error('An unreadable restore recovery record needs attention. Existing data has been protected.');
  }
  restorePrevious(storage, journal);
}

/** localStorage has no multi-key transactions. Retain old values until both writes succeed. */
export function persistBackupRestore(storage: BackupStorage, calendar: string, schedule: string): void {
  recoverBackupRestore(storage);
  const journal: Journal = { version: 1, calendar: storage.getItem(CALENDAR_STORAGE_KEY), schedule: storage.getItem(SCHEDULE_STORAGE_KEY) };
  try { storage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(journal)); }
  catch { throw new Error('Could not prepare a safe restore. Browser storage may be blocked or full. No data was replaced.'); }
  try {
    storage.setItem(CALENDAR_STORAGE_KEY, calendar);
    storage.setItem(SCHEDULE_STORAGE_KEY, schedule);
    storage.removeItem(RESTORE_JOURNAL_KEY);
  } catch {
    try { restorePrevious(storage, journal); }
    catch { throw new Error('Restore could not finish or roll back. Keep this page open and export your current data. Recovery will retry on reload; do not edit in other tabs.'); }
    throw new Error('Restore could not be saved. Your previous saved data was restored; check browser storage and try again.');
  }
}
