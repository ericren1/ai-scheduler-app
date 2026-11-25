import { createContext, useContext } from 'react';
import type { CalendarRecords } from '../utils/calendarView.ts';
import type { SessionInput } from '../utils/manualScheduler.ts';

export const CalendarContext = createContext<{
  records: CalendarRecords; warning: string;
  addTask: (title: string, categoryId: string) => void;
  addSession: (input: SessionInput) => void;
  completeSession: (id: string, completed: boolean) => void;
  editSession: (id: string, input: SessionInput) => void;
  requestSessionEdit: (id: string, onSaved?: (date: string) => void) => void;
} | null>(null);

export function useCalendar() {
  const value = useContext(CalendarContext);
  if (!value) throw new Error('CalendarProvider is required');
  return value;
}
