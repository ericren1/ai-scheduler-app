import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addCalendarDays, getSessionPosition, getWeekDates, isToday, nextWeek,
  plannedDurationMinutes, previousWeek, startOfWeek, toLocalDate,
} from '../src/utils/calendarDate.ts';
import { mockEvents, mockSessions, mockTasks } from '../src/mocks/calendar.ts';

test('Monday-start weeks cross year, month and leap-day boundaries', () => {
  assert.equal(startOfWeek('2027-01-03'), '2026-12-28');
  assert.equal(startOfWeek('2026-10-19'), '2026-10-19');
  assert.deepEqual(getWeekDates('2024-03-03'), [
    '2024-02-26', '2024-02-27', '2024-02-28', '2024-02-29',
    '2024-03-01', '2024-03-02', '2024-03-03',
  ]);
  assert.equal(previousWeek('2027-01-03'), '2026-12-21');
  assert.equal(nextWeek('2027-01-03'), '2027-01-04');
  assert.equal(addCalendarDays('2024-02-28', 1), '2024-02-29');
});

test('today uses local fields and accepts an injectable clock without mutation', () => {
  const now = new Date(2026, 9, 22, 23, 59);
  const before = now.getTime();
  assert.equal(toLocalDate(now), '2026-10-22');
  assert.equal(isToday('2026-10-22', now), true);
  assert.equal(isToday('2026-10-23', now), false);
  assert.equal(now.getTime(), before);
  const utcMidnight = new Date('2026-10-22T00:30:00Z');
  assert.equal(toLocalDate(utcMidnight), process.env.TZ === 'America/Toronto' ? '2026-10-21' : '2026-10-22');
});

test('positions preserve exact minutes, scale with zoom and support visible-hour offsets', () => {
  const session = {
    startAt: new Date(2026, 9, 22, 9, 7).toISOString(),
    endAt: new Date(2026, 9, 22, 10, 37).toISOString(),
  };
  const before = { ...session };
  assert.deepEqual(getSessionPosition(session, '2026-10-22'), { top: 547, height: 90, dayHeight: 1440 });
  assert.deepEqual(getSessionPosition(session, '2026-10-22', { pixelsPerHour: 120, visibleStartMinutes: 480 }),
    { top: 134, height: 180, dayHeight: 2880 });
  assert.equal(getSessionPosition(session, '2026-10-23'), null);
  assert.equal(getSessionPosition(session, '2026-10-22', { visibleStartMinutes: 600 })?.top, -53);
  assert.deepEqual(session, before);
  assert.equal(plannedDurationMinutes(session.startAt, session.endAt), 90);
});

test('overnight sessions are clipped per day with exclusive end boundaries', () => {
  const session = {
    startAt: new Date(2026, 9, 22, 23, 30).toISOString(),
    endAt: new Date(2026, 9, 23, 0, 30).toISOString(),
  };
  assert.deepEqual(getSessionPosition(session, '2026-10-22'), { top: 1410, height: 30, dayHeight: 1440 });
  assert.deepEqual(getSessionPosition(session, '2026-10-23'), { top: 0, height: 30, dayHeight: 1440 });
  assert.equal(getSessionPosition({ ...session, endAt: new Date(2026, 9, 23).toISOString() }, '2026-10-23'), null);
});

test('reject invalid dates, ambiguous timestamps, ranges and scales', () => {
  for (const date of ['2026-02-29', '2026-13-01', '10/22/2026', 'invalid']) {
    assert.throws(() => getWeekDates(date), RangeError);
  }
  assert.throws(() => addCalendarDays('2026-10-22', 0.5), RangeError);
  assert.throws(() => toLocalDate(new Date(NaN)), RangeError);
  assert.throws(() => plannedDurationMinutes('2026-10-22T09:00:00', '2026-10-22T10:00:00Z'), RangeError);
  assert.throws(() => plannedDurationMinutes('2026-02-30T09:00:00Z', '2026-03-01T10:00:00Z'), RangeError);
  assert.throws(() => plannedDurationMinutes('2026-10-22T24:00:00Z', '2026-10-23T01:00:00Z'), RangeError);
  const session = { startAt: '2026-10-22T09:00:00Z', endAt: '2026-10-22T10:00:00Z' };
  assert.throws(() => getSessionPosition({ ...session, endAt: session.startAt }, '2026-10-22'), RangeError);
  for (const pixelsPerHour of [0, -1, NaN, Infinity]) {
    assert.throws(() => getSessionPosition(session, '2026-10-22', { pixelsPerHour }), RangeError);
  }
});

test('calendar dates and adjacent weeks stay stable across both DST transitions', () => {
  for (const sunday of ['2026-03-08', '2026-11-01', '2026-03-29', '2026-10-25']) {
    const dates = getWeekDates(sunday);
    assert.equal(dates.length, 7);
    assert.equal(dates[6], sunday);
    assert.equal(nextWeek(sunday), addCalendarDays(sunday, 1));
    assert.equal(previousWeek(nextWeek(sunday)), dates[0]);
  }
});

test('DST geometry preserves real duration and distinguishes repeated wall-clock hours', () => {
  const zone = process.env.TZ;
  const fixtures = zone === 'America/Toronto'
    ? { spring: '2026-03-08', fall: '2026-11-01', before: '-05:00', after: '-04:00' }
    : zone === 'Europe/Berlin'
      ? { spring: '2026-03-29', fall: '2026-10-25', before: '+01:00', after: '+02:00' }
      : null;
  if (!fixtures) {
    const session = { startAt: '2026-03-08T01:30:00Z', endAt: '2026-03-08T03:30:00Z' };
    assert.equal(getSessionPosition(session, '2026-03-08')?.dayHeight, 1440);
    return;
  }
  const { spring, fall, before, after } = fixtures;
  const springSession = { startAt: `${spring}T01:30:00${before}`, endAt: `${spring}T04:30:00${after}` };
  assert.equal(plannedDurationMinutes(springSession.startAt, springSession.endAt), 120);
  assert.deepEqual(getSessionPosition(springSession, spring), { top: 90, height: 120, dayHeight: 1380 });
  const hour = zone === 'America/Toronto' ? '01' : '02';
  const repeatedHour = { startAt: `${fall}T${hour}:30:00${after}`, endAt: `${fall}T${hour}:30:00${before}` };
  assert.equal(plannedDurationMinutes(repeatedHour.startAt, repeatedHour.endAt), 60);
  assert.deepEqual(getSessionPosition(repeatedHour, fall), {
    top: zone === 'America/Toronto' ? 90 : 150, height: 60, dayHeight: 1500,
  });
});

test('fixtures preserve task identity, unknown tracking and explicit overlap compatibility', () => {
  const linked = mockSessions.filter(session => session.taskId === 'scheduler');
  assert.equal(linked.length, 3);
  assert.ok(linked.some(session => session.status === 'completed'));
  assert.equal(mockTasks.find(task => task.id === 'scheduler')?.status, 'active');
  assert.equal(mockSessions.find(session => session.id === 'review')?.actualTrackedMinutes, undefined);
  assert.ok(mockSessions.some(session => session.kind === 'untimed' && session.taskId === 'groceries'));
  assert.ok(mockEvents.some(event => event.kind === 'all-day'));
  const walk = mockSessions.find(session => session.id === 'walk-thu');
  const podcast = mockSessions.find(session => session.id === 'podcast-thu');
  assert.ok(walk?.kind === 'timed' && podcast?.kind === 'timed');
  assert.ok(walk.startAt < podcast.endAt && podcast.startAt < walk.endAt);
  assert.ok(walk.compatibleSessionIds?.includes(podcast.id));
  assert.ok(podcast.compatibleSessionIds?.includes(walk.id));
});
