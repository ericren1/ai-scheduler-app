import type { CalendarRecords } from '../utils/calendarView.ts';
import type { Task, UntimedSession } from '../types/calendar.ts';

export const realisticSampleWeek = '2026-11-02';
const taskDefinitions = [
  ['training', 'Upper-body / gym training', 'health'],
  ['coe768', 'Study COE 768', 'study'],
  ['leetcode', 'LeetCode practice', 'study'],
  ['applications', 'Job applications', 'career'],
  ['capstone', 'Capstone / project development', 'projects'],
  ['romaeris', 'Romaeris work', 'work'],
  ['laundry', 'Laundry', 'home'],
  ['vacuum', 'Vacuuming', 'home'],
  ['trash', 'Take out trash', 'home'],
  ['meal', 'Pre-workout meal', 'health'],
] as const;
const tasks: Task[] = taskDefinitions.map(([id, title, categoryId], index) => ({
  id, title, categoryId, priorityRank: index + 1, tags: [], status: 'active',
  completionType: ['laundry', 'vacuum', 'trash'].includes(id) ? 'one-time' : 'recurring',
  schedulingMode: 'flexible', allowedWeekdays: [1, 2, 3, 4, 5, 6, 7],
}));

// Illustrative day assignments and outcomes, not claimed personal history.
// No clock times or actual tracked durations are inferred for these tasks.
const assignments = [
  ['2026-11-02', 'training', 'completed'], ['2026-11-02', 'meal', 'completed'],
  ['2026-11-02', 'coe768', 'partial'], ['2026-11-02', 'romaeris', 'completed'],
  ['2026-11-03', 'leetcode', 'completed'], ['2026-11-03', 'applications', 'completed'],
  ['2026-11-03', 'capstone', 'partial'], ['2026-11-03', 'laundry', 'completed'],
  ['2026-11-04', 'coe768', 'planned'], ['2026-11-04', 'romaeris', 'planned'],
  ['2026-11-04', 'training', 'planned'], ['2026-11-04', 'meal', 'planned'],
  ['2026-11-05', 'romaeris', 'planned'], ['2026-11-05', 'leetcode', 'planned'],
  ['2026-11-05', 'trash', 'planned'], ['2026-11-06', 'coe768', 'planned'],
  ['2026-11-06', 'applications', 'planned'], ['2026-11-06', 'capstone', 'planned'],
  ['2026-11-07', 'training', 'planned'], ['2026-11-07', 'meal', 'planned'],
  ['2026-11-07', 'vacuum', 'planned'], ['2026-11-08', 'coe768', 'planned'],
  ['2026-11-08', 'capstone', 'planned'],
] as const;

const sessions: UntimedSession[] = assignments.map(([date, taskId, status]) => {
  const task = tasks.find(item => item.id === taskId)!;
  return { id: `${date}-${taskId}`, taskId, title: task.title, categoryId: task.categoryId,
    kind: 'untimed', date, status, placement: 'flexible', finalized: false };
});

/** Loaded only through the development sample controls, never by production. */
export const realisticCalendar: CalendarRecords = {
  tasks, sessions,
  categories: [
    { id: 'health', name: 'Health & routines', color: '#6d8567' },
    { id: 'study', name: 'Learning', color: '#667cab' },
    { id: 'career', name: 'Career', color: '#aa8761' },
    { id: 'projects', name: 'Projects', color: '#8b78a0' },
    { id: 'work', name: 'Romaeris', color: '#658a8b' },
    { id: 'home', name: 'Home', color: '#8c8d7d' },
  ],
  events: [{ id: 'romaeris-thursday-meeting', title: 'Romaeris meeting', kind: 'timed', commitment: 'fixed',
    categoryId: 'work', startAt: '2026-11-05T18:00:00Z', endAt: '2026-11-05T19:00:00Z',
    notes: 'Thursday 1–2 PM America/Toronto, supplied by the user. Sample date: November 5, 2026.' }],
};
