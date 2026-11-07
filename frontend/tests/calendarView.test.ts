import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activitiesForDate, canShareTimeAxis, categoryColor, getTimedActivities, layoutDay, unscheduledTasks } from '../src/utils/calendarView.ts';
import type { CalendarRecords, TimedActivity } from '../src/utils/calendarView.ts';
import { mockCategories, mockEvents, mockSessions, mockTasks } from '../src/mocks/calendar.ts';
import { getDayWindow, getSessionPosition, formatCalendarDate } from '../src/utils/calendarDate.ts';

const records: CalendarRecords = { tasks: mockTasks, sessions: mockSessions, events: mockEvents, categories: mockCategories };

test('shared hour labels require identical local labels and geometry', () => {
  assert.equal(canShareTimeAxis([]), false);
  assert.equal(canShareTimeAxis(['2026-10-19', '2026-10-20'].map(date => getDayWindow(date, 6, 23))), true);
  assert.equal(canShareTimeAxis([getDayWindow('2026-10-19', 6, 23), getDayWindow('2026-10-20', 7, 23)]), false);
  const spring = process.env.TZ === 'America/Toronto' ? '2026-03-08' : '2026-03-29';
  if (process.env.TZ !== 'UTC') {
    assert.equal(canShareTimeAxis([getDayWindow('2026-03-02', 0, 24), getDayWindow(spring, 0, 24)]), false);
    // Equal height alone is insufficient when a week crosses an offset change.
    assert.equal(canShareTimeAxis([getDayWindow('2026-03-02', 6, 23), getDayWindow(spring, 6, 23)]), false);
  }
});
function activity(id: string, startHour: number, endHour: number): TimedActivity {
  return { id, title: id, kind: 'timed', startAt: new Date(2026, 9, 22, startHour).toISOString(),
    endAt: new Date(2026, 9, 22, endHour).toISOString(), commitment: 'fixed' };
}

test('all-day exclusive bounds and untimed date assignments stay separate', () => {
  assert.deepEqual(activitiesForDate(records, '2026-10-23').allDay.map(item => item.id), ['day-off']);
  assert.equal(activitiesForDate(records, '2026-10-24').allDay.length, 0);
  assert.deepEqual(activitiesForDate(records, '2026-10-22').untimed.map(item => item.id), ['groceries-thu']);
  assert.equal(activitiesForDate(records, '2026-10-21').untimed.length, 0);
  assert.equal(getTimedActivities(records).length, 8);
  assert.ok(formatCalendarDate('2026-10-22', { day: 'numeric' }).includes('22'));
});

test('weekly unscheduled tasks consider all assignments and preserve canonical records', () => {
  const before = JSON.stringify(records);
  assert.deepEqual(unscheduledTasks(records, '2026-10-19').map(task => task.id), ['read']);
  assert.equal(unscheduledTasks(records, '2026-11-09').length, 5);
  const task = mockTasks.find(item => item.id === 'read')!;
  const custom: CalendarRecords = { ...records, tasks: [task, { ...task, id: 'done', status: 'completed' }],
    sessions: [{ id: 'overnight', title: 'Overnight', kind: 'timed', taskId: 'read', status: 'planned',
      placement: 'flexible', finalized: false, startAt: new Date(2026, 9, 18, 23).toISOString(), endAt: new Date(2026, 9, 19, 1).toISOString() }] };
  assert.equal(unscheduledTasks(custom, '2026-10-19').length, 0);
  assert.equal(JSON.stringify(records), before);
});

test('category resolution uses record, then task, then neutral fallback', () => {
  assert.equal(categoryColor({ categoryId: 'personal', taskId: 'scheduler' }, records), '#16a34a');
  assert.equal(categoryColor({ taskId: 'scheduler' }, records), '#2563eb');
  assert.equal(categoryColor({}, records), '#64748b');
});

test('adjacent lanes handle overlap chains, reuse lanes and reset after groups', () => {
  const activities = [activity('a', 9, 11), activity('b', 10, 12), activity('c', 11, 13), activity('d', 13, 14)];
  const before = JSON.stringify(activities);
  const { items } = layoutDay(activities, '2026-10-22', 6, 23, 60);
  assert.deepEqual(items.map(item => [item.activity.id, item.lane, item.laneCount]), [
    ['a', 0, 2], ['b', 1, 2], ['c', 0, 2], ['d', 0, 1],
  ]);
  assert.equal(JSON.stringify(activities), before);
  const triple = layoutDay([activity('a', 9, 12), activity('b', 9, 11), activity('c', 10, 12)], '2026-10-22', 6, 23, 60);
  assert.ok(triple.items.every(item => item.laneCount === 3));
});

test('visible window clips edges, flags outside records and scales without snapping', () => {
  const result = layoutDay([activity('early', 5, 7), activity('late', 22, 24), activity('hidden', 2, 3)], '2026-10-22', 6, 23, 120);
  assert.deepEqual(result.items.map(item => [item.activity.id, item.top, item.height]), [['early', 0, 120], ['late', 1920, 120]]);
  assert.equal(result.outside.length, 3);
  assert.equal(layoutDay([], '2026-10-22', 6, 23, 60).items.length, 0);
});

test('overnight segments do not claim to be outside a full-day window', () => {
  const overnight = activity('overnight', 23, 25);
  const first = layoutDay([overnight], '2026-10-22', 0, 24, 60);
  const second = layoutDay([overnight], '2026-10-23', 0, 24, 60);
  assert.equal(first.outside.length, 0);
  assert.equal(second.outside.length, 0);
  assert.equal(first.items[0].height, 60);
  assert.equal(second.items[0].height, 60);
  assert.equal(layoutDay([overnight], '2026-10-23', 6, 23, 60).outside.length, 1);
});

test('visible-hour inputs reject invalid ranges and scales', () => {
  for (const [start, end] of [[6, 6], [23, 6], [-1, 23], [0, 25], [6.5, 23]]) {
    assert.throws(() => getDayWindow('2026-10-22', start, end), RangeError);
  }
  assert.throws(() => getDayWindow('2026-10-22', 6, 23, 0), RangeError);
});

test('DST ticks and cards use the same axis; local 6 AM is not a fixed elapsed offset', () => {
  const zone = process.env.TZ;
  if (zone === 'UTC') {
    assert.equal(getDayWindow('2026-03-08', 0, 24).height, 1440);
    return;
  }
  const spring = zone === 'America/Toronto' ? '2026-03-08' : '2026-03-29';
  const fall = zone === 'America/Toronto' ? '2026-11-01' : '2026-10-25';
  const springDay = getDayWindow(spring, 0, 24);
  const fallDay = getDayWindow(fall, 0, 24);
  assert.equal(springDay.height, 1380);
  assert.equal(fallDay.height, 1500);
  assert.equal(springDay.ticks.length, 24);
  assert.equal(fallDay.ticks.length, 26);
  const skipped = getDayWindow(spring, 2, 3);
  assert.equal(skipped.height, 0);
  assert.equal(skipped.ticks.length, 0);
  assert.equal(getDayWindow(spring, 6, 23).visibleStartMinutes, 300);
  assert.equal(getDayWindow(fall, 6, 23).visibleStartMinutes, 420);
  for (const date of [spring, fall]) {
    const window = getDayWindow(date, 6, 23);
    assert.equal(window.height, 1020);
    for (const tick of window.ticks.slice(0, -1)) {
      const session = { startAt: tick.timestamp, endAt: new Date(Date.parse(tick.timestamp) + 30 * 60000).toISOString() };
      assert.equal(getSessionPosition(session, date, { visibleStartMinutes: window.visibleStartMinutes })?.top, tick.top);
    }
  }
  const hour = zone === 'America/Toronto' ? 1 : 2;
  const repeated = fallDay.ticks.filter(tick => new Date(tick.timestamp).getHours() === hour);
  assert.equal(repeated.length, 2);
  assert.notEqual(repeated[0].label, repeated[1].label);
  assert.equal(repeated[1].top - repeated[0].top, 60);
  for (const date of [spring, fall]) {
    const full = getDayWindow(date, 0, 24);
    for (const tick of full.ticks.slice(0, -1)) {
      const session = { startAt: tick.timestamp, endAt: new Date(Date.parse(tick.timestamp) + 30 * 60000).toISOString() };
      assert.equal(getSessionPosition(session, date)?.top, tick.top);
    }
  }
});
