import type { ScheduledSession, Task } from '../types/calendar.ts';
import type { CalendarRecords } from './calendarView.ts';
import { addCalendarDays, plannedDurationMinutes, toLocalDate } from './calendarDate.ts';
import { getTimedActivities } from './calendarView.ts';

/** Returns every valid instant for a local input, including both fall-back occurrences. */
export function localTimeChoices(date: string, time: string): string[] {
  addCalendarDays(date, 0);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Enter a valid local time.');
  const wall = Date.parse(`${date}T${time}:00Z`);
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) offsets.add(new Date(wall + hours * 3600000).getTimezoneOffset());
  return [...offsets].map(offset => new Date(wall + offset * 60000)).filter(value =>
    toLocalDate(value) === date && `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` === time,
  ).map(value => value.toISOString()).sort();
}

export function createTask(records: CalendarRecords, id: string, title: string, categoryId: string): Task {
  if (!title.trim()) throw new Error('Enter a task title.');
  if (title.trim().length > 160) throw new Error('Task titles must be at most 160 characters.');
  if (!records.categories.some(category => category.id === categoryId)) throw new Error('Choose a category.');
  if (records.tasks.some(task => task.id === id)) throw new Error('Task ID already exists.');
  return { id, title: title.trim(), categoryId, tags: [], priorityRank: Math.max(0, ...records.tasks.map(task => task.priorityRank)) + 1,
    status: 'active', completionType: 'one-time', schedulingMode: 'on-demand', allowedWeekdays: [1, 2, 3, 4, 5, 6, 7] };
}

export interface SessionInput {
  taskId: string; date: string; kind: 'timed' | 'untimed'; placement: 'fixed' | 'flexible';
  startAt?: string; endAt?: string; keepOverlap?: boolean;
}

export function createSession(records: CalendarRecords, id: string, input: SessionInput): ScheduledSession {
  const task = records.tasks.find(item => item.id === input.taskId && item.status === 'active');
  if (!task) throw new Error('Choose an active task.');
  addCalendarDays(input.date, 0);
  if (records.sessions.some(session => session.id === id)) throw new Error('Session ID already exists.');
  if (!['fixed', 'flexible'].includes(input.placement)) throw new Error('Choose fixed or flexible placement.');
  const base = { id, taskId: task.id, title: task.title, categoryId: task.categoryId, placement: input.placement, status: 'planned' as const, finalized: false };
  if (input.kind === 'untimed') return { ...base, kind: 'untimed', date: input.date };
  if (input.kind !== 'timed' || !input.startAt || !input.endAt) throw new Error('Choose start and end times.');
  plannedDurationMinutes(input.startAt, input.endAt);
  const start = Date.parse(input.startAt), end = Date.parse(input.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('End must be after start.');
  if (toLocalDate(new Date(start)) !== input.date) throw new Error('Start time must match the selected date.');
  const overlaps = getTimedActivities(records).filter(item => Date.parse(item.startAt) < end && Date.parse(item.endAt) > start);
  if (overlaps.length && !input.keepOverlap) throw new Error(`Overlaps ${overlaps.map(item => item.title).join(', ')}. Change the times or explicitly keep the overlap.`);
  return { ...base, kind: 'timed', startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString() };
}

export function setSessionCompleted(records: CalendarRecords, id: string, completed: boolean): CalendarRecords {
  if (!records.sessions.some(session => session.id === id)) throw new Error('Session not found.');
  return { ...records, sessions: records.sessions.map(session => session.id === id ? { ...session, status: completed ? 'completed' : 'planned' } : session) };
}

/** Task details apply to future sessions; existing sessions keep their saved snapshots. */
export function editTask(records: CalendarRecords, id: string, title: string, categoryId: string): CalendarRecords {
  if (!records.tasks.some(task => task.id === id)) throw new Error('Task not found.');
  const validated = createTask({ ...records, tasks: records.tasks.filter(task => task.id !== id) }, id, title, categoryId);
  return { ...records, tasks: records.tasks.map(task => task.id === id ? { ...task, title: validated.title, categoryId } : task) };
}

/** Explicit task completion never changes session completion, timing, or tracked time. */
export function setTaskCompleted(records: CalendarRecords, id: string, completed: boolean): CalendarRecords {
  const task = records.tasks.find(task => task.id === id);
  if (!task) throw new Error('Task not found.');
  if (task.status === 'archived') throw new Error('Archived tasks cannot be changed here.');
  return { ...records, tasks: records.tasks.map(task => task.id === id ? { ...task, status: completed ? 'completed' : 'active' } : task) };
}

/** Removes one session, leaving the task and all sibling sessions unchanged. */
export function deleteSession(records: CalendarRecords, id: string): CalendarRecords {
  if (!records.sessions.some(session => session.id === id)) throw new Error('Session not found.');
  return { ...records, sessions: records.sessions.filter(session => session.id !== id) };
}

/** Moving is measured in elapsed minutes, including overnight and DST intervals. */
export function sessionEndAfterMove(session: ScheduledSession, startAt: string): string {
  if (session.kind !== 'timed') throw new Error('Untimed sessions have no duration to preserve.');
  const duration = plannedDurationMinutes(session.startAt, session.endAt);
  const start = Date.parse(startAt);
  if (!Number.isFinite(start)) throw new Error('Choose a valid start time.');
  return new Date(start + duration * 60000).toISOString();
}

export function editSession(records: CalendarRecords, id: string, input: SessionInput): CalendarRecords {
  const original = records.sessions.find(session => session.id === id);
  if (!original) throw new Error('Session not found.');
  if (original.taskId !== input.taskId) throw new Error('Editing a session cannot change its linked task.');
  // Validate against every OTHER activity. The old interval cannot conflict with itself.
  // Existing sessions remain editable after their task is completed. This local
  // validation copy permits that edit without reopening the canonical task.
  const validated = createSession({ ...records, tasks: records.tasks.map(task => task.id === original.taskId && task.status === 'completed' ? { ...task, status: 'active' } : task),
    sessions: records.sessions.filter(session => session.id !== id) }, id, input);
  function metadata(session: ScheduledSession) {
    if (session.kind === 'timed') {
      const { kind: _kind, startAt: _start, endAt: _end, ...rest } = session;
      return rest;
    }
    const { kind: _kind, date: _date, ...rest } = session;
    return rest;
  }
  // Retain tracking, completion, notes, finalization, and occurrence identity.
  const replacement: ScheduledSession = { ...validated, ...metadata(original), placement: input.placement };
  return { ...records, sessions: records.sessions.map(session => session.id === id ? replacement : session) };
}
