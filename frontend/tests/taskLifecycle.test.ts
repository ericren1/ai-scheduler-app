import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyCalendar } from '../src/data/calendarDefaults.ts';
import { createTask, createSession, editTask, setTaskCompleted, deleteSession, editSession } from '../src/utils/manualScheduler.ts';
import { decodeCalendar } from '../src/utils/calendarStorage.ts';
import { createCalendarBackup, parseCalendarBackup } from '../src/utils/calendarBackup.ts';
import { initialSchedulingPreferences } from '../src/utils/schedulingPreferences.ts';
import { unscheduledTasks } from '../src/utils/calendarView.ts';

function fixture() {
  const records = emptyCalendar();
  records.tasks = [createTask(records, 'task', 'Original study', 'study'), createTask(records, 'other-task', 'Other work', 'work')];
  const timed = createSession(records, 'timed', { taskId: 'task', kind: 'timed', date: '2026-11-25', placement: 'fixed',
    startAt: '2026-11-25T14:00:00Z', endAt: '2026-11-25T15:00:00Z' });
  records.sessions = [{ ...timed, status: 'completed', notes: 'Keep history', actualTrackedMinutes: 42, finalized: true },
    createSession(records, 'untimed', { taskId: 'task', kind: 'untimed', date: '2026-11-26', placement: 'flexible' })];
  return records;
}

test('task editing changes future defaults while preserving identity and every existing session', () => {
  const records = fixture(), before = JSON.stringify(records);
  const next = editTask(records, 'task', '  New project  ', 'projects');
  assert.equal(JSON.stringify(records), before);
  assert.equal(next.tasks[0].id, 'task');
  assert.equal(next.tasks[0].title, 'New project');
  assert.equal(next.tasks[0].categoryId, 'projects');
  assert.equal(next.tasks[0].priorityRank, records.tasks[0].priorityRank);
  assert.deepEqual(next.sessions, records.sessions);
  assert.strictEqual(next.tasks[1], records.tasks[1]);
  const future = createSession(next, 'new', { taskId: 'task', kind: 'untimed', date: '2026-11-27', placement: 'flexible' });
  assert.equal(future.title, 'New project'); assert.equal(future.categoryId, 'projects');
  assert.throws(() => editTask(records, 'task', ' ', 'projects'));
  assert.throws(() => editTask(records, 'task', 'x'.repeat(161), 'projects'));
  assert.throws(() => editTask(records, 'task', 'Title', 'unknown'));
  assert.throws(() => editTask(records, 'missing', 'Title', 'projects'));
});

test('task completion/reopening is independent, preserves scheduled history, and controls new sessions', () => {
  const records = fixture(), before = JSON.stringify(records);
  const completed = setTaskCompleted(records, 'task', true);
  assert.equal(completed.tasks[0].status, 'completed');
  assert.deepEqual(completed.sessions, records.sessions);
  assert.equal(JSON.stringify(records), before);
  assert.throws(() => createSession(completed, 'new', { taskId: 'task', kind: 'untimed', date: '2026-11-27', placement: 'flexible' }), /active task/);
  assert.ok(!unscheduledTasks(completed, '2026-12-07').some(task => task.id === 'task'));
  const reopened = setTaskCompleted(completed, 'task', false);
  assert.equal(reopened.tasks[0].status, 'active');
  assert.deepEqual(reopened.sessions, records.sessions);
  assert.equal(createSession(reopened, 'new', { taskId: 'task', kind: 'untimed', date: '2026-11-27', placement: 'flexible' }).taskId, 'task');
  assert.throws(() => setTaskCompleted(records, 'missing', true));
});

test('existing sessions remain editable on completed tasks without reopening the task', () => {
  const records = setTaskCompleted(editTask(fixture(), 'task', 'Updated title', 'projects'), 'task', true);
  const edited = editSession(records, 'timed', { taskId: 'task', kind: 'untimed', date: '2026-11-27', placement: 'flexible' });
  assert.equal(edited.tasks[0].status, 'completed');
  assert.equal(edited.sessions[0].title, 'Original study');
  assert.equal(edited.sessions[0].categoryId, 'study');
  assert.equal(edited.sessions[0].actualTrackedMinutes, 42);
  assert.equal(edited.sessions[0].status, 'completed');
  assert.equal(edited.sessions[0].notes, 'Keep history');
  assert.equal(edited.sessions[0].kind, 'untimed');
});

test('deleting a timed or untimed session targets exactly one record, never the task or siblings', () => {
  for (const id of ['timed', 'untimed']) {
    const records = fixture(), before = JSON.stringify(records);
    const next = deleteSession(records, id);
    assert.equal(JSON.stringify(records), before);
    assert.strictEqual(next.tasks, records.tasks);
    assert.equal(next.sessions.length, 1);
    assert.strictEqual(next.sessions[0], records.sessions.find(session => session.id !== id));
    assert.equal(records.tasks[0].status, 'active');
  }
  const completed = setTaskCompleted(fixture(), 'task', true);
  assert.equal(deleteSession(completed, 'timed').tasks[0].status, 'completed');
  assert.throws(() => deleteSession(fixture(), 'unknown'), /not found/);
});

test('completed tasks and historical categories survive storage and backup round-trips', () => {
  const records = setTaskCompleted(editTask(fixture(), 'task', 'New project', 'projects'), 'task', true);
  const reloaded = decodeCalendar(JSON.stringify({ version: 1, tasks: records.tasks, sessions: records.sessions }));
  assert.equal(reloaded.tasks[0].status, 'completed'); assert.equal(reloaded.tasks[0].categoryId, 'projects');
  assert.equal(reloaded.sessions[0].categoryId, 'study');
  assert.equal(reloaded.sessions[0].title, 'Original study');
  const backup = createCalendarBackup(records, initialSchedulingPreferences, 'America/Toronto');
  assert.deepEqual(parseCalendarBackup(JSON.stringify(backup)).records, reloaded);
  const legacy = JSON.parse(JSON.stringify(backup.calendar)); delete legacy.sessions[0].categoryId;
  assert.equal(decodeCalendar(JSON.stringify(legacy)).sessions[0].categoryId, 'projects');
  legacy.sessions[0].categoryId = 'unknown';
  assert.throws(() => decodeCalendar(JSON.stringify(legacy)));
});
