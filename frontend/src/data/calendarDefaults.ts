import type { CalendarRecords } from '../utils/calendarView.ts';

export function emptyCalendar(): CalendarRecords {
  return { tasks: [], sessions: [], events: [], categories: [
    { id: 'training', name: 'Training', color: '#3ccda5' },
    { id: 'study', name: 'Study', color: '#668de5' },
    { id: 'projects', name: 'Projects', color: '#9585f2' },
    { id: 'work', name: 'Work', color: '#d8a458' },
    { id: 'career', name: 'Job applications', color: '#df897c' },
    { id: 'home', name: 'Home', color: '#8da486' },
  ] };
}
