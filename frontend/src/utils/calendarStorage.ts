import { emptyCalendar } from '../data/calendarDefaults.ts';
import type { CalendarRecords } from './calendarView.ts';
import type { ThemeStorage } from './theme.ts';
import type { ScheduledSession, Task } from '../types/calendar.ts';
import { plannedDurationMinutes } from './calendarDate.ts';
import { CALENDAR_STORAGE_KEY } from './backupStorage.ts';
export { CALENDAR_STORAGE_KEY } from './backupStorage.ts';

/** Only this increment's user-created fields are accepted. Invalid data stays untouched. */
export function decodeCalendar(raw: string): CalendarRecords {
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Array.isArray(value.tasks) || !Array.isArray(value.sessions)) throw new Error('Unsupported calendar data.');
  const defaults = emptyCalendar();
  const taskIds = new Set<string>();
  for (const task of value.tasks) {
    if (!task || typeof task.id !== 'string' || !task.id || taskIds.has(task.id) || typeof task.title !== 'string' || !task.title.trim()
      || !defaults.categories.some(category => category.id === task.categoryId) || !['active', 'completed'].includes(task.status)
      || task.completionType !== 'one-time' || task.schedulingMode !== 'on-demand' || !Number.isFinite(task.priorityRank)
      || !Array.isArray(task.tags) || !task.tags.every((tag: unknown) => typeof tag === 'string')
      || !Array.isArray(task.allowedWeekdays) || !task.allowedWeekdays.every((day: unknown) => Number.isInteger(day) && Number(day) >= 1 && Number(day) <= 7)) throw new Error('Invalid saved task.');
    taskIds.add(task.id);
  }
  const sessionIds = new Set<string>();
  for (const session of value.sessions) {
    if (!session || typeof session.id !== 'string' || !session.id || sessionIds.has(session.id) || !taskIds.has(session.taskId)
      || typeof session.title !== 'string' || !session.title.trim() || !['fixed', 'flexible'].includes(session.placement)
      || !['planned', 'in-progress', 'completed', 'partial', 'missed', 'skipped'].includes(session.status) || typeof session.finalized !== 'boolean'
      || (session.notes !== undefined && typeof session.notes !== 'string')
      || (session.categoryId !== undefined && !defaults.categories.some(category => category.id === session.categoryId))
      || (session.actualTrackedMinutes !== undefined && (!Number.isFinite(session.actualTrackedMinutes) || session.actualTrackedMinutes < 0))) throw new Error('Invalid saved session.');
    if (session.kind === 'untimed') {
      if (typeof session.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)
        || new Date(`${session.date}T00:00:00Z`).toISOString().slice(0, 10) !== session.date) throw new Error('Invalid saved date.');
    } else if (session.kind === 'timed') {
      if (typeof session.startAt !== 'string' || typeof session.endAt !== 'string'
        || !session.startAt.endsWith('Z') || !session.endAt.endsWith('Z')
        || !Number.isFinite(Date.parse(session.startAt)) || !(Date.parse(session.endAt) > Date.parse(session.startAt))) throw new Error('Invalid saved interval.');
      plannedDurationMinutes(session.startAt, session.endAt);
    } else throw new Error('Invalid session kind.');
    sessionIds.add(session.id);
  }
  // Whitelist fields rather than spreading untrusted saved objects into React.
  const tasks: Task[] = value.tasks.map((task: Task) => ({ id: task.id, title: task.title, categoryId: task.categoryId,
    tags: [...task.tags], priorityRank: task.priorityRank, status: task.status, completionType: 'one-time',
    schedulingMode: 'on-demand', allowedWeekdays: [...task.allowedWeekdays] }));
  const sessions: ScheduledSession[] = value.sessions.map((session: ScheduledSession) => {
    const task = tasks.find(item => item.id === session.taskId)!;
    const base = { id: session.id, taskId: task.id, title: session.title, categoryId: session.categoryId ?? task.categoryId,
      status: session.status, placement: session.placement, finalized: session.finalized };
    const metadata = { ...base, ...(session.notes === undefined ? {} : { notes: session.notes }),
      ...(session.actualTrackedMinutes === undefined ? {} : { actualTrackedMinutes: session.actualTrackedMinutes }) };
    return session.kind === 'timed' ? { ...metadata, kind: 'timed', startAt: session.startAt, endAt: session.endAt }
      : { ...metadata, kind: 'untimed', date: session.date };
  });
  return { ...defaults, tasks, sessions };
}

export function loadCalendar(storage: Pick<ThemeStorage, 'getItem'>): { records: CalendarRecords; writable: boolean; warning: string } {
  try {
    const raw = storage.getItem(CALENDAR_STORAGE_KEY);
    return { records: raw ? decodeCalendar(raw) : emptyCalendar(), writable: true, warning: '' };
  } catch {
    return { records: emptyCalendar(), writable: false, warning: 'Saved calendar could not be loaded. Changes will stay in memory; existing saved data will not be overwritten.' };
  }
}

export function saveCalendar(storage: Pick<ThemeStorage, 'setItem'>, records: CalendarRecords): boolean {
  try { storage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify({ version: 1, tasks: records.tasks, sessions: records.sessions })); return true; }
  catch { return false; }
}
