import type { CalendarEvent, Category, LocalDate, ScheduledSession, Task, TimedSession } from '../types/calendar.ts';
import { addCalendarDays, getDayWindow, getSessionPosition, localMidnight } from './calendarDate.ts';

export type TimedActivity = TimedSession | Extract<CalendarEvent, { kind: 'timed' }>;
export interface CalendarRecords {
  tasks: readonly Task[];
  sessions: readonly ScheduledSession[];
  events: readonly CalendarEvent[];
  categories: readonly Category[];
}

export function getTimedActivities(records: CalendarRecords): TimedActivity[] {
  return [...records.sessions.filter((s): s is TimedSession => s.kind === 'timed'),
    ...records.events.filter((e): e is Extract<CalendarEvent, { kind: 'timed' }> => e.kind === 'timed')];
}

export function activitiesForDate(records: CalendarRecords, date: LocalDate) {
  return {
    allDay: records.events.filter(event => event.kind === 'all-day'
      && event.startDate <= date && date < event.endDateExclusive),
    untimed: records.sessions.filter(session => session.kind === 'untimed' && session.date === date),
  };
}

export function unscheduledTasks(records: CalendarRecords, monday: LocalDate): Task[] {
  const start = localMidnight(monday);
  const endDate = addCalendarDays(monday, 7);
  const end = localMidnight(endDate);
  const assigned = new Set(records.sessions.filter(session => session.kind === 'untimed'
    ? session.date >= monday && session.date < endDate
    : Date.parse(session.startAt) < end && Date.parse(session.endAt) > start).map(session => session.taskId));
  return records.tasks.filter(task => task.status === 'active' && !assigned.has(task.id))
    .sort((a, b) => a.priorityRank - b.priorityRank);
}

export function categoryColor(record: { categoryId?: string; taskId?: string }, records: CalendarRecords): string {
  const categoryId = record.categoryId ?? records.tasks.find(task => task.id === record.taskId)?.categoryId;
  return records.categories.find(category => category.id === categoryId)?.color ?? '#64748b';
}

/** Greedy adjacent lanes per connected overlap group. No conflict decisions. */
export function layoutDay(activities: readonly TimedActivity[], date: LocalDate, startHour: number, endHour: number, pixelsPerHour: number) {
  const window = getDayWindow(date, startHour, endHour, pixelsPerHour);
  const items = activities.flatMap(activity => {
    const position = getSessionPosition(activity, date, { pixelsPerHour, visibleStartMinutes: window.visibleStartMinutes });
    if (!position) return [];
    const top = Math.max(0, position.top);
    const bottom = Math.min(window.height, position.top + position.height);
    return bottom > top ? [{ activity, top, height: bottom - top, lane: 0, laneCount: 1 }] : [];
  }).sort((a, b) => a.top - b.top || b.height - a.height || a.activity.id.localeCompare(b.activity.id));
  let group: typeof items = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;
  function finishGroup() {
    for (const item of group) item.laneCount = laneEnds.length;
    group = [];
    laneEnds = [];
  }
  for (const item of items) {
    if (item.top >= groupEnd) finishGroup();
    let lane = laneEnds.findIndex(end => end <= item.top);
    if (lane === -1) lane = laneEnds.length;
    item.lane = lane;
    laneEnds[lane] = item.top + item.height;
    group.push(item);
    groupEnd = Math.max(groupEnd, item.top + item.height);
  }
  finishGroup();
  const outside = activities.filter(activity => {
    const position = getSessionPosition(activity, date, { pixelsPerHour, visibleStartMinutes: window.visibleStartMinutes });
    return position !== null && (position.top < 0 || position.top + position.height > window.height);
  });
  return { items, window, outside };
}
