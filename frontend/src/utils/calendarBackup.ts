import type { CalendarRecords } from './calendarView.ts';
import type { SchedulingPreferences } from '../types/preferences.ts';
import { decodeCalendar } from './calendarStorage.ts';
import { decodeSchedule } from './dailySchedule.ts';
import { persistBackupRestore } from './backupStorage.ts';
import type { BackupStorage } from './backupStorage.ts';

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export interface CalendarBackup {
  app: 'personal-hub'; version: 1; exportedAt: string; timeZone: string;
  calendar: { version: 1; tasks: CalendarRecords['tasks']; sessions: CalendarRecords['sessions'] };
  schedule: { version: 1; preferences: SchedulingPreferences };
}
export interface BackupPreview {
  backup: CalendarBackup; records: CalendarRecords; preferences: SchedulingPreferences;
}

/** UTC instants remain instants; civil dates and local preference clocks remain unchanged. */
export function parseCalendarBackup(raw: string): BackupPreview {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) throw new Error('Choose a backup smaller than 5 MB.');
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Choose a Personal Hub backup.'); }
  if (value?.app !== 'personal-hub' || value.version !== 1) throw new Error('Unsupported backup. Choose a version 1 Personal Hub backup.');
  if (typeof value.exportedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.exportedAt)
    || !value.exportedAt.endsWith('Z') || !Number.isFinite(Date.parse(value.exportedAt))) throw new Error('The backup creation timestamp is invalid.');
  if (typeof value.timeZone !== 'string' || !value.timeZone) throw new Error('The backup timezone is missing.');
  try { new Intl.DateTimeFormat('en', { timeZone: value.timeZone }); }
  catch { throw new Error('The backup timezone is invalid.'); }
  const records = decodeCalendar(JSON.stringify(value.calendar));
  const preferences = decodeSchedule(JSON.stringify(value.schedule));
  // Rebuild from validated fields. Unknown properties never enter application state.
  const backup: CalendarBackup = { app: 'personal-hub', version: 1, exportedAt: value.exportedAt, timeZone: value.timeZone,
    calendar: { version: 1, tasks: records.tasks, sessions: records.sessions }, schedule: { version: 1, preferences } };
  return { backup, records, preferences };
}

export function createCalendarBackup(records: CalendarRecords, preferences: SchedulingPreferences, timeZone: string, now = new Date()): CalendarBackup {
  return parseCalendarBackup(JSON.stringify({ app: 'personal-hub', version: 1, exportedAt: now.toISOString(), timeZone,
    calendar: { version: 1, tasks: records.tasks, sessions: records.sessions }, schedule: { version: 1, preferences } })).backup;
}

/** Revalidate immediately before writing, including callers outside the file-picker UI. */
export function restoreCalendarBackup(storage: BackupStorage, backup: CalendarBackup): BackupPreview {
  const preview = parseCalendarBackup(JSON.stringify(backup));
  persistBackupRestore(storage, JSON.stringify(preview.backup.calendar), JSON.stringify(preview.backup.schedule));
  return preview;
}
