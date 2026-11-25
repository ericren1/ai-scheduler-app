import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyCalendar } from '../src/data/calendarDefaults.ts';
import { createSession, createTask, editSession, localTimeChoices, sessionEndAfterMove, setSessionCompleted } from '../src/utils/manualScheduler.ts';
import { CALENDAR_STORAGE_KEY, decodeCalendar, loadCalendar, saveCalendar } from '../src/utils/calendarStorage.ts';

function setup() {
  const records = emptyCalendar();
  return { ...records, tasks: [createTask(records, 'task', 'Study', 'study')] };
}

test('tasks and multiple linked sessions are independent, immutable records', () => {
  const records = setup(), before = JSON.stringify(records);
  const one = createSession(records, 'one', { taskId: 'task', kind: 'untimed', date: '2026-11-07', placement: 'flexible' });
  const two = createSession(records, 'two', { taskId: 'task', kind: 'untimed', date: '2026-11-08', placement: 'fixed' });
  const result = setSessionCompleted({ ...records, sessions: [one, two] }, 'one', true);
  assert.equal(result.tasks[0].status, 'active');
  assert.equal(result.sessions[0].status, 'completed');
  assert.equal(result.sessions[0].actualTrackedMinutes, undefined);
  assert.equal(result.sessions[1].status, 'planned');
  assert.equal(JSON.stringify(records), before);
  assert.equal(setSessionCompleted(result, 'one', false).sessions[0].status, 'planned');
});

test('manual creation validates task identity, title, dates, times and overlaps', () => {
  const records = setup();
  assert.throws(() => createTask(records, 'x', ' ', 'study'));
  assert.throws(() => createTask(records, 'x', 'Study', 'missing'));
  assert.throws(() => createSession(records, 'x', { taskId: 'missing', kind: 'untimed', date: '2026-11-07', placement: 'flexible' }));
  const input = { taskId: 'task', kind: 'timed' as const, date: '2026-11-07', placement: 'fixed' as const,
    startAt: localTimeChoices('2026-11-07', '09:07')[0], endAt: localTimeChoices('2026-11-07', '10:37')[0] };
  const first = createSession(records, 'one', input);
  assert.equal(first.placement, 'fixed');
  assert.ok(first.kind === 'timed');
  assert.equal((Date.parse(first.endAt) - Date.parse(first.startAt)) / 60000, 90);
  const occupied = { ...records, sessions: [first] };
  assert.throws(() => createSession(occupied, 'two', input), /Overlaps/);
  assert.equal(createSession(occupied, 'two', { ...input, keepOverlap: true }).taskId, 'task');
  assert.throws(() => createSession(records, 'bad', { ...input, endAt: input.startAt }));
  assert.throws(() => createSession(records, 'bad', { ...input, startAt: '2026-11-07T09:00:00' }));
});

test('DST input rejects missing hours and exposes both repeated instants', () => {
  const zone = process.env.TZ;
  if (zone === 'UTC') { assert.equal(localTimeChoices('2026-03-08', '02:30').length, 1); return; }
  const spring = zone === 'America/Toronto' ? '2026-03-08' : '2026-03-29';
  const fall = zone === 'America/Toronto' ? '2026-11-01' : '2026-10-25';
  assert.equal(localTimeChoices(spring, '02:30').length, 0);
  const options = localTimeChoices(fall, zone === 'America/Toronto' ? '01:30' : '02:30');
  assert.equal(options.length, 2);
  assert.equal(Date.parse(options[1]) - Date.parse(options[0]), 3600000);
  assert.throws(() => localTimeChoices('2026-02-30', '09:00'));
});

test('calendar records round-trip without changing the theme key', () => {
  const values = new Map([['personal-hub.theme', 'dark']]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const records = setup();
  assert.equal(loadCalendar(storage).records.tasks.length, 0);
  assert.equal(saveCalendar(storage, records), true);
  assert.deepEqual(loadCalendar(storage).records, records);
  assert.equal(values.get('personal-hub.theme'), 'dark');
  assert.ok(values.has(CALENDAR_STORAGE_KEY));
});

test('corrupt, dangling or unsupported saved records stay protected from overwrites', () => {
  const result = loadCalendar({ getItem: () => '{invalid' });
  assert.equal(result.writable, false);
  assert.equal(result.records.tasks.length, 0);
  assert.ok(result.warning);
  assert.throws(() => decodeCalendar(JSON.stringify({ version: 99, tasks: [], sessions: [] })));
  assert.throws(() => decodeCalendar(JSON.stringify({ version: 1, tasks: [], sessions: [{ id: 'x', taskId: 'missing' }] })));
  assert.equal(saveCalendar({ setItem() { throw new Error('Quota exceeded'); } }, setup()), false);
});

test('editing excludes the original interval and preserves session identity and outcomes', () => {
  const records = setup();
  const input = { taskId: 'task', date: '2026-11-07', kind: 'timed' as const, placement: 'fixed' as const,
    startAt: localTimeChoices('2026-11-07', '09:07')[0], endAt: localTimeChoices('2026-11-07', '10:37')[0] };
  const original = { ...createSession(records, 'one', input), status: 'completed' as const, actualTrackedMinutes: 42, notes: 'Keep this history', finalized: true };
  const withSession = { ...records, sessions: [original] };
  const before = JSON.stringify(withSession);
  const unchanged = editSession(withSession, 'one', input);
  assert.deepEqual(unchanged.sessions[0], original);
  const moved = editSession(withSession, 'one', { ...input, date: '2026-11-16',
    startAt: localTimeChoices('2026-11-16', '13:11')[0], endAt: localTimeChoices('2026-11-16', '14:41')[0] });
  assert.equal(moved.sessions.length, 1);
  assert.equal(moved.sessions[0].id, 'one');
  assert.equal(moved.sessions[0].taskId, 'task');
  assert.equal(moved.sessions[0].status, 'completed');
  assert.equal(moved.sessions[0].actualTrackedMinutes, 42);
  assert.equal(moved.sessions[0].notes, 'Keep this history');
  assert.equal(moved.sessions[0].finalized, true);
  assert.equal(moved.tasks, withSession.tasks);
  assert.equal(JSON.stringify(withSession), before);
  assert.deepEqual(decodeCalendar(JSON.stringify({ version: 1, tasks: moved.tasks, sessions: moved.sessions })).sessions, moved.sessions);
});

test('rejected overlapping edits leave all records unchanged; approved overlaps affect one record', () => {
  const records = setup();
  const a = { taskId: 'task', date: '2026-11-07', kind: 'timed' as const, placement: 'flexible' as const,
    startAt: localTimeChoices('2026-11-07', '09:00')[0], endAt: localTimeChoices('2026-11-07', '10:00')[0] };
  const b = { ...a, startAt: localTimeChoices(a.date, '11:00')[0], endAt: localTimeChoices(a.date, '12:00')[0] };
  const sessions = [createSession(records, 'a', a), createSession(records, 'b', b)];
  const source = { ...records, sessions }, before = JSON.stringify(source);
  assert.throws(() => editSession(source, 'a', b), /Overlaps/);
  assert.equal(JSON.stringify(source), before);
  const result = editSession(source, 'a', { ...b, keepOverlap: true });
  assert.equal(result.sessions[1], sessions[1]);
  assert.equal(result.sessions[0].id, 'a');
  assert.throws(() => editSession(source, 'missing', a), /not found/);
  assert.throws(() => editSession(source, 'a', { ...a, taskId: 'different' }), /linked task/);
});

test('converting timed and untimed sessions removes obsolete timing fields without duplicating tasks', () => {
  const records = setup();
  const untimed = createSession(records, 'one', { taskId: 'task', date: '2026-11-07', kind: 'untimed', placement: 'flexible' });
  const timed = editSession({ ...records, sessions: [untimed] }, 'one', {
    taskId: 'task', date: '2026-11-07', kind: 'timed', placement: 'fixed',
    startAt: localTimeChoices('2026-11-07', '23:30')[0], endAt: localTimeChoices('2026-11-08', '01:00')[0],
  });
  assert.equal(timed.sessions[0].kind, 'timed');
  assert.equal('date' in timed.sessions[0], false);
  const result = editSession(timed, 'one', { taskId: 'task', date: '2026-11-10', kind: 'untimed', placement: 'flexible' });
  assert.equal(result.sessions[0].kind, 'untimed');
  assert.equal('startAt' in result.sessions[0], false);
  assert.equal('endAt' in result.sessions[0], false);
  assert.equal(result.tasks.length, 1);
  assert.equal(result.sessions.length, 1);
});

test('duration-preserving moves retain elapsed minutes across overnight and DST changes', () => {
  const records = setup();
  const source = createSession(records, 'one', { taskId: 'task', date: '2026-03-01', kind: 'timed', placement: 'flexible',
    startAt: localTimeChoices('2026-03-01', '01:30')[0], endAt: localTimeChoices('2026-03-01', '03:00')[0] });
  const spring = process.env.TZ === 'Europe/Berlin' ? '2026-03-29' : '2026-03-08';
  const movedStart = localTimeChoices(spring, '01:30')[0];
  assert.equal(Date.parse(sessionEndAfterMove(source, movedStart)) - Date.parse(movedStart), 90 * 60000);
  const overnightStart = localTimeChoices('2026-11-07', '23:30')[0];
  const overnightEnd = sessionEndAfterMove(source, overnightStart);
  assert.equal(Date.parse(overnightEnd) - Date.parse(overnightStart), 90 * 60000);
  assert.equal(new Date(overnightEnd).getDate(), 8);
});
