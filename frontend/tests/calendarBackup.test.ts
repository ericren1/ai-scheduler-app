import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyCalendar } from '../src/data/calendarDefaults.ts';
import { createTask, createSession } from '../src/utils/manualScheduler.ts';
import { createCalendarBackup, MAX_BACKUP_BYTES, parseCalendarBackup, restoreCalendarBackup } from '../src/utils/calendarBackup.ts';
import { CALENDAR_STORAGE_KEY, SCHEDULE_STORAGE_KEY, RESTORE_JOURNAL_KEY, recoverBackupRestore } from '../src/utils/backupStorage.ts';
import { initialSchedulingPreferences } from '../src/utils/schedulingPreferences.ts';
import { decodeCalendar } from '../src/utils/calendarStorage.ts';
import { decodeSchedule } from '../src/utils/dailySchedule.ts';

function fixture() {
  const records = emptyCalendar();
  records.tasks = [createTask(records, 'task-1', 'Study COE 768', 'study')];
  const timed = createSession(records, 'timed-1', { taskId: 'task-1', kind: 'timed', date: '2026-11-25', placement: 'fixed',
    startAt: '2026-11-25T18:07:00.000Z', endAt: '2026-11-25T19:37:00.000Z' });
  const untimed = createSession(records, 'untimed-1', { taskId: 'task-1', kind: 'untimed', date: '2026-11-26', placement: 'flexible' });
  records.sessions = [{ ...timed, status: 'completed', notes: 'Keep this note', actualTrackedMinutes: 42 }, untimed];
  const preferences = { ...initialSchedulingPreferences, weekdayOverrides: { 4: { bedtime: '21:00' } }, dateOverrides: { '2026-11-26': { workHours: null } } };
  return createCalendarBackup(records, preferences, 'America/Toronto', new Date('2026-11-25T18:00:00.000Z'));
}

function memoryStorage() {
  const values = new Map<string, string>([['personal-hub.theme', 'light'], [CALENDAR_STORAGE_KEY, 'old calendar'], [SCHEDULE_STORAGE_KEY, 'old schedule']]);
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

test('backup round-trip preserves identities, UTC instants, untimed dates and independent completion', () => {
  const backup = fixture();
  const parsed = parseCalendarBackup(JSON.stringify(backup));
  assert.equal(parsed.records.tasks[0].status, 'active');
  assert.equal(parsed.records.sessions.length, 2);
  assert.equal(parsed.records.sessions[0].status, 'completed');
  assert.equal(parsed.records.sessions[0].actualTrackedMinutes, 42);
  assert.equal(parsed.records.sessions[0].notes, 'Keep this note');
  assert.equal(parsed.records.sessions[0].taskId, parsed.records.sessions[1].taskId);
  assert.ok(parsed.records.sessions[0].kind === 'timed');
  assert.equal(parsed.records.sessions[0].startAt, '2026-11-25T18:07:00.000Z');
  assert.ok(parsed.records.sessions[1].kind === 'untimed');
  assert.equal(parsed.records.sessions[1].date, '2026-11-26');
  assert.equal(parsed.preferences.weekdayOverrides?.[4]?.bedtime, '21:00');
  assert.equal(parsed.preferences.dateOverrides?.['2026-11-26']?.workHours, null);
});

test('different backup timezone does not reinterpret instants, dates, or preference clocks', () => {
  const backup = fixture(); backup.timeZone = 'Europe/Berlin';
  const parsed = parseCalendarBackup(JSON.stringify(backup));
  assert.deepEqual(parsed.backup.calendar, backup.calendar);
  assert.deepEqual(parsed.backup.schedule, backup.schedule);
  assert.equal(parsed.preferences.wakeTime, '04:00');
});

test('invalid JSON, versions, metadata, oversized files, dangling sessions and invalid preferences are rejected', () => {
  const backup = fixture();
  assert.throws(() => parseCalendarBackup('{'), /valid JSON/);
  assert.throws(() => parseCalendarBackup('x'.repeat(MAX_BACKUP_BYTES + 1)), /5 MB/);
  for (const change of [{ app: 'other-app' }, { version: 2 }, { exportedAt: 'not a date' }, { timeZone: '' }, { timeZone: 'Invalid/Zone' },
    { calendar: { ...backup.calendar, tasks: [] } }, { schedule: { version: 1, preferences: { ...backup.schedule.preferences, bedtime: '23:00' } } }]) {
    assert.throws(() => parseCalendarBackup(JSON.stringify({ ...backup, ...change })));
  }
});

test('unknown fields are stripped and development samples/appearance are not exported', () => {
  const raw = JSON.parse(JSON.stringify(fixture()));
  raw.theme = 'light'; raw.calendar.events = [{ id: 'sample' }]; raw.calendar.tasks[0].unknown = 'untrusted';
  const parsed = parseCalendarBackup(JSON.stringify(raw));
  assert.equal('theme' in parsed.backup, false);
  assert.equal('events' in parsed.backup.calendar, false);
  assert.equal('unknown' in parsed.records.tasks[0], false);
  assert.deepEqual(parsed.records.events, []);
});

test('restore replaces both personal stores without changing theme or leaving a journal', () => {
  const storage = memoryStorage(), backup = fixture();
  const restored = restoreCalendarBackup(storage, backup);
  assert.deepEqual(decodeCalendar(storage.getItem(CALENDAR_STORAGE_KEY)!), restored.records);
  assert.deepEqual(decodeSchedule(storage.getItem(SCHEDULE_STORAGE_KEY)!), restored.preferences);
  assert.equal(storage.getItem('personal-hub.theme'), 'light');
  assert.equal(storage.getItem(RESTORE_JOURNAL_KEY), null);
});

test('failed second write rolls both stores back exactly and invalid imports never write', () => {
  const storage = memoryStorage(), before = new Map(storage.values);
  let writes = 0;
  const failing = { ...storage, setItem(key: string, value: string) { writes++; if (writes === 3) throw Error('quota'); storage.setItem(key, value); } };
  assert.throws(() => restoreCalendarBackup(failing, fixture()), /previous saved data was restored/);
  assert.deepEqual(storage.values, before);
  const invalid = fixture(); invalid.calendar.tasks = [];
  assert.throws(() => restoreCalendarBackup(storage, invalid));
  assert.deepEqual(storage.values, before);
});

test('failure to create journal does not change either store', () => {
  const storage = memoryStorage(), before = new Map(storage.values);
  assert.throws(() => restoreCalendarBackup({ ...storage, setItem() { throw Error('blocked'); } }, fixture()));
  assert.deepEqual(storage.values, before);
});

test('failure at the final journal removal rolls back instead of reporting success', () => {
  const storage = memoryStorage(), before = new Map(storage.values);
  let failOnce = true;
  const failing = { ...storage, removeItem(key: string) {
    if (key === RESTORE_JOURNAL_KEY && failOnce) { failOnce = false; throw Error('blocked'); }
    storage.removeItem(key);
  } };
  assert.throws(() => restoreCalendarBackup(failing, fixture()), /previous saved data was restored/);
  assert.deepEqual(storage.values, before);
});

test('interrupted restore recovers original raw values, including absent and unreadable data', () => {
  const storage = memoryStorage();
  storage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify({ version: 1, calendar: '{invalid original data', schedule: null }));
  storage.setItem(CALENDAR_STORAGE_KEY, 'partially imported calendar');
  recoverBackupRestore(storage);
  assert.equal(storage.getItem(CALENDAR_STORAGE_KEY), '{invalid original data');
  assert.equal(storage.getItem(SCHEDULE_STORAGE_KEY), null);
  assert.equal(storage.getItem(RESTORE_JOURNAL_KEY), null);
});

test('failed rollback retains journal so recovery can retry later', () => {
  const storage = memoryStorage();
  let writes = 0;
  const failing = { ...storage, setItem(key: string, value: string) { writes++; if (writes >= 3) throw Error('blocked'); storage.setItem(key, value); } };
  assert.throws(() => restoreCalendarBackup(failing, fixture()), /could not finish or roll back/);
  assert.notEqual(storage.getItem(RESTORE_JOURNAL_KEY), null);
  recoverBackupRestore(storage);
  assert.equal(storage.getItem(CALENDAR_STORAGE_KEY), 'old calendar');
  assert.equal(storage.getItem(SCHEDULE_STORAGE_KEY), 'old schedule');
});

test('malformed recovery journal is protected rather than overwritten by a new restore', () => {
  const storage = memoryStorage(); storage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify({ version: 1, calendar: 99, schedule: null }));
  const before = new Map(storage.values);
  assert.throws(() => restoreCalendarBackup(storage, fixture()), /protected/);
  assert.deepEqual(storage.values, before);
});
