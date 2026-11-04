import type { CalendarEvent, Category, RecurrenceRule, ScheduledSession, Task } from '../types/calendar.ts';

export const mockCategories: Category[] = [
  { id: 'engineering', name: 'Engineering', color: '#2563eb' },
  { id: 'personal', name: 'Personal', color: '#16a34a' },
];

export const mockRecurrenceRules: RecurrenceRule[] = [{
  id: 'weekly-review', frequency: 'weekly', interval: 1,
  startDate: '2026-10-19', timeZone: 'America/Toronto', weekdays: [1],
  localStartTime: '09:00', placement: 'fixed',
}];

export const mockTasks: Task[] = [
  {
    id: 'read', title: 'Read about accessible calendars', categoryId: 'engineering',
    tags: ['learning'], priorityRank: 5, status: 'active', completionType: 'one-time',
    schedulingMode: 'on-demand', allowedWeekdays: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    id: 'scheduler', title: 'Build AI Scheduler', categoryId: 'engineering',
    tags: ['learning'], priorityRank: 1, status: 'active', completionType: 'one-time',
    schedulingMode: 'flexible', allowedWeekdays: [1, 2, 3, 4, 5],
    dailyGoalMinutes: 60, weeklyTargetMinutes: 300,
  },
  {
    id: 'walk', title: 'Walk', categoryId: 'personal', tags: [], priorityRank: 2,
    status: 'active', completionType: 'recurring', schedulingMode: 'flexible',
    allowedWeekdays: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    id: 'podcast', title: 'Listen to podcast', categoryId: 'personal', tags: [],
    priorityRank: 3, status: 'active', completionType: 'one-time',
    schedulingMode: 'on-demand', allowedWeekdays: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    id: 'groceries', title: 'Buy groceries', categoryId: 'personal', tags: [],
    priorityRank: 4, status: 'active', completionType: 'one-time',
    schedulingMode: 'on-demand', allowedWeekdays: [1, 2, 3, 4, 5, 6, 7],
  },
];

// Fixture instants represent Toronto wall times in the week of October 19, 2026.
// Other user timezones intentionally display these same instants differently.
export const mockSessions: ScheduledSession[] = [
  {
    id: 'coding-mon', title: 'Model calendar data', taskId: 'scheduler', categoryId: 'engineering',
    kind: 'timed', startAt: '2026-10-19T14:00:00Z', endAt: '2026-10-19T15:30:00Z',
    placement: 'flexible', status: 'completed', actualTrackedMinutes: 75, finalized: true,
  },
  {
    id: 'coding-tue', title: 'Write date utilities', taskId: 'scheduler', categoryId: 'engineering',
    kind: 'timed', startAt: '2026-10-20T14:00:00Z', endAt: '2026-10-20T15:00:00Z',
    placement: 'flexible', status: 'partial', actualTrackedMinutes: 20, finalized: true,
  },
  {
    id: 'coding-thu', title: 'Test weekly boundaries', taskId: 'scheduler', categoryId: 'engineering',
    kind: 'timed', startAt: '2026-10-22T14:00:00Z', endAt: '2026-10-22T15:00:00Z',
    placement: 'flexible', status: 'planned', finalized: false,
  },
  {
    id: 'review', title: 'Weekly review', kind: 'timed',
    startAt: '2026-10-19T13:00:00Z', endAt: '2026-10-19T13:30:00Z',
    placement: 'fixed', status: 'completed', finalized: true,
    recurrenceRuleId: 'weekly-review', originalOccurrenceDate: '2026-10-19',
    // Completion is explicit, but actual tracked time remains unknown.
  },
  {
    id: 'walk-thu', title: 'Lunch walk', taskId: 'walk', categoryId: 'personal', kind: 'timed',
    startAt: '2026-10-22T16:00:00Z', endAt: '2026-10-22T16:45:00Z',
    placement: 'flexible', status: 'planned', finalized: false, compatibleSessionIds: ['podcast-thu'],
  },
  {
    id: 'podcast-thu', title: 'Podcast while walking', taskId: 'podcast', categoryId: 'personal', kind: 'timed',
    startAt: '2026-10-22T16:00:00Z', endAt: '2026-10-22T16:30:00Z',
    placement: 'flexible', status: 'planned', finalized: false, compatibleSessionIds: ['walk-thu'],
  },
  {
    id: 'groceries-thu', title: 'Buy groceries', taskId: 'groceries', categoryId: 'personal',
    kind: 'untimed', date: '2026-10-22', placement: 'flexible', status: 'planned', finalized: false,
  },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: 'appointment', title: 'Dentist', kind: 'timed', commitment: 'fixed',
    startAt: '2026-10-21T19:00:00Z', endAt: '2026-10-21T20:00:00Z', reminderMinutesBefore: [30],
  },
  {
    id: 'day-off', title: 'Day off', kind: 'all-day', commitment: 'fixed',
    startDate: '2026-10-23', endDateExclusive: '2026-10-24',
  },
  {
    id: 'coffee', title: 'Coffee with a friend', kind: 'timed', commitment: 'movable',
    startAt: '2026-10-24T14:00:00Z', endAt: '2026-10-24T15:00:00Z',
  },
];
