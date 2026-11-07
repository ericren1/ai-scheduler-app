import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialSchedulingPreferences, isAllowedBedtime, workCutoffTime } from '../src/utils/schedulingPreferences.ts';
import { realisticCalendar } from '../src/mocks/realisticCalendar.ts';

test('daily preferences default to 4 AM wake, 8:30 PM bed and 7:30 PM work cutoff', () => {
  assert.equal(initialSchedulingPreferences.wakeTime, '04:00');
  assert.equal(initialSchedulingPreferences.bedtime, '20:30');
  assert.equal(initialSchedulingPreferences.appliesTo, 'every-day');
  assert.equal(workCutoffTime(initialSchedulingPreferences), '19:30');
});

test('bedtime accepts the inclusive 8–9 PM range and rejects malformed input', () => {
  for (const time of ['20:00', '20:30', '20:59', '21:00']) assert.equal(isAllowedBedtime(time), true);
  for (const time of ['19:59', '21:01', '20:60', '8:30', '', 'invalid']) assert.equal(isAllowedBedtime(time), false);
  assert.equal(workCutoffTime({ ...initialSchedulingPreferences, bedtime: '20:00' }), '19:00');
  assert.equal(workCutoffTime({ ...initialSchedulingPreferences, bedtime: '21:00' }), '20:00');
  assert.throws(() => workCutoffTime({ ...initialSchedulingPreferences, stopWorkMinutesBeforeBed: -1 }), RangeError);
});

test('realistic sample uses supplied meeting time, canonical tasks and illustrative untimed outcomes', () => {
  const before = JSON.stringify(realisticCalendar);
  const meeting = realisticCalendar.events[0];
  assert.ok(meeting.kind === 'timed');
  assert.equal(meeting.startAt, '2026-11-05T18:00:00Z');
  assert.equal(meeting.endAt, '2026-11-05T19:00:00Z');
  assert.equal(meeting.commitment, 'fixed');
  assert.equal(realisticCalendar.sessions.filter(session => session.taskId === 'coe768').length, 4);
  for (const session of realisticCalendar.sessions) {
    assert.equal(session.kind, 'untimed');
    assert.ok(realisticCalendar.tasks.some(task => task.id === session.taskId));
    assert.equal(session.actualTrackedMinutes, undefined);
  }
  assert.ok(realisticCalendar.sessions.some(session => session.status === 'completed'));
  assert.ok(realisticCalendar.sessions.some(session => session.status === 'planned'));
  assert.ok(realisticCalendar.tasks.every(task => task.status === 'active'));
  workCutoffTime({ ...initialSchedulingPreferences, bedtime: '21:00' });
  assert.equal(JSON.stringify(realisticCalendar), before);
});
