import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialSchedulingPreferences } from '../src/utils/schedulingPreferences.ts';
import { decodeSchedule, loadSchedule, positionScheduleBands, resolveDailySchedule, saveSchedule, scheduleBandsForDay, SCHEDULE_STORAGE_KEY, validateSchedulePreferences, weekdayOf } from '../src/utils/dailySchedule.ts';
import { getDayWindow } from '../src/utils/calendarDate.ts';
import type { SchedulingPreferences } from '../src/types/preferences.ts';
import { emptyCalendar } from '../src/data/calendarDefaults.ts';
import { createSession, createTask, localTimeChoices } from '../src/utils/manualScheduler.ts';

const defaults = { ...initialSchedulingPreferences };

test('daily defaults apply seven days, without invented work hours', () => {
  for (const date of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']) {
    const plan = resolveDailySchedule(defaults, date);
    assert.equal(plan.bedtime, '20:30'); assert.equal(plan.wakeTime, '04:00');
    assert.equal(plan.cutoff, '19:30'); assert.equal(plan.workHours, null);
  }
  assert.equal(weekdayOf('2027-01-03'), 7);
  assert.equal(weekdayOf('2027-01-04'), 1);
});

test('date exceptions override specified fields while inheriting weekday and default fields', () => {
  const preferences: SchedulingPreferences = { ...defaults, workHours: { start: '09:00', end: '17:00' },
    weekdayOverrides: { 1: { bedtime: '20:00', workHours: { start: '10:00', end: '16:00' } } },
    dateOverrides: { '2026-11-09': { bedtime: '21:00' }, '2026-11-16': { workHours: null } } };
  const before = JSON.stringify(preferences);
  validateSchedulePreferences(preferences);
  assert.equal(resolveDailySchedule(preferences, '2026-11-02').bedtime, '20:00');
  const exception = resolveDailySchedule(preferences, '2026-11-09');
  assert.equal(exception.bedtime, '21:00'); assert.equal(exception.cutoff, '20:00');
  assert.deepEqual(exception.workHours, { start: '10:00', end: '16:00' });
  assert.equal(exception.wakeTime, '04:00');
  assert.equal(resolveDailySchedule(preferences, '2026-11-16').workHours, null);
  assert.equal(resolveDailySchedule(preferences, '2026-11-16').bedtime, '20:00');
  assert.equal(JSON.stringify(preferences), before);
});

test('each sleep period belongs to its starting night, including Sunday into Monday', () => {
  const preferences: SchedulingPreferences = { ...defaults, weekdayOverrides: { 7: { bedtime: '21:00', wakeTime: '05:00' } } };
  const monday = scheduleBandsForDay(preferences, '2026-11-09');
  const morning = monday.find(band => band.id === 'sleep-2026-11-08')!;
  assert.ok(morning); assert.equal(new Date(morning.endAt).getHours(), 5);
  assert.equal(new Date(morning.startAt).getDate(), 8);
  assert.equal(new Date(morning.startAt).getHours(), 21);
  assert.equal(new Date(monday.find(band => band.id === 'sleep-2026-11-09')!.startAt).getHours(), 20);
});

test('overnight work uses the starting day and does not create actual tracking records', () => {
  const preferences: SchedulingPreferences = { ...defaults, workHours: { start: '22:00', end: '06:00' } };
  const bands = scheduleBandsForDay(preferences, '2026-11-07');
  const previous = bands.find(band => band.id === 'work-2026-11-06')!;
  assert.equal(new Date(previous.endAt).getDate(), 7); assert.equal(new Date(previous.endAt).getHours(), 6);
  assert.ok(bands.some(band => band.id === 'work-2026-11-07'));
  const base = emptyCalendar();
  const records = { ...base, tasks: [createTask(base, 'task', 'Manual late work', 'work')] };
  const session = createSession(records, 'one', { taskId: 'task', date: '2026-11-07', kind: 'timed', placement: 'flexible',
    startAt: localTimeChoices('2026-11-07', '21:00')[0], endAt: localTimeChoices('2026-11-07', '22:00')[0] });
  assert.equal(session.status, 'planned'); assert.equal(session.actualTrackedMinutes, undefined);
  assert.equal(records.sessions.length, 0);
});

test('sleep boundaries retain local intent while elapsed duration follows DST', () => {
  const zone = process.env.TZ;
  const spring = zone === 'Europe/Berlin' ? '2026-03-29' : '2026-03-08';
  const fall = zone === 'Europe/Berlin' ? '2026-10-25' : '2026-11-01';
  const springBand = scheduleBandsForDay(defaults, spring).find(band => band.kind === 'sleep' && new Date(band.endAt).getHours() === 4)!;
  const fallBand = scheduleBandsForDay(defaults, fall).find(band => band.kind === 'sleep' && new Date(band.endAt).getHours() === 4)!;
  assert.equal((Date.parse(springBand.endAt) - Date.parse(springBand.startAt)) / 3600000, zone === 'UTC' ? 7.5 : 6.5);
  assert.equal((Date.parse(fallBand.endAt) - Date.parse(fallBand.startAt)) / 3600000, zone === 'UTC' ? 7.5 : 8.5);
  if (zone !== 'UTC') {
    const adjusted = scheduleBandsForDay({ ...defaults, wakeTime: '02:30' }, spring).find(band => band.kind === 'sleep' && new Date(band.endAt).getHours() === 3)!;
    assert.ok(adjusted.label.includes('DST')); assert.equal(new Date(adjusted.endAt).getMinutes(), 30);
  }
});

test('guidance uses the same elapsed-time geometry and clips to visible hours', () => {
  const bands = positionScheduleBands(defaults, '2026-11-07', getDayWindow('2026-11-07', 18, 23, 60), 60);
  const wind = bands.find(band => band.kind === 'wind-down')!;
  const sleep = bands.find(band => band.kind === 'sleep')!;
  assert.deepEqual([wind.top, wind.height], [90, 60]);
  assert.deepEqual([sleep.top, sleep.height], [150, 150]);
});

test('invalid settings and masked invalid weekday rules are rejected', () => {
  for (const preferences of [
    { ...defaults, bedtime: '19:00' }, { ...defaults, wakeTime: '25:00' },
    { ...defaults, stopWorkMinutesBeforeBed: -1 }, { ...defaults, stopWorkMinutesBeforeBed: 181 },
    { ...defaults, workHours: { start: '09:00', end: '09:00' } },
    { ...defaults, dateOverrides: { '2026-02-30': { workHours: null } } },
    { ...defaults, weekdayOverrides: { 1: { wakeTime: '22:00' } }, dateOverrides: { '2026-11-02': { wakeTime: '04:00' } } },
  ]) assert.throws(() => validateSchedulePreferences(preferences));
});

test('schedule preferences persist separately with protected malformed storage', () => {
  const values = new Map([['personal-hub.calendar.v1', 'unchanged'], ['personal-hub.theme', 'dark']]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const preferences = { ...defaults, dateOverrides: { '2026-11-07': { bedtime: '21:00', workHours: null } } };
  assert.equal(saveSchedule(storage, preferences), true);
  assert.equal(loadSchedule(storage).preferences.dateOverrides?.['2026-11-07'].bedtime, '21:00');
  assert.equal(values.get('personal-hub.calendar.v1'), 'unchanged'); assert.equal(values.get('personal-hub.theme'), 'dark');
  values.set(SCHEDULE_STORAGE_KEY, '{invalid');
  assert.equal(loadSchedule(storage).writable, false);
  assert.equal(values.get(SCHEDULE_STORAGE_KEY), '{invalid');
  assert.throws(() => decodeSchedule('{"version":99}'));
  assert.equal(saveSchedule({ setItem() { throw new Error('Storage blocked'); } }, defaults), false);
});
