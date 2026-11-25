import type { LocalDate, Weekday } from './calendar.ts';

export interface WorkHours {
  start: string; // local HH:mm; end before start means an overnight shift
  end: string;
}

/** Sleep belongs to the night starting on this weekday/date. Null work means off. */
export interface DailyScheduleOverride {
  bedtime?: string;
  wakeTime?: string;
  workHours?: WorkHours | null;
}

/** Soft planning preferences, independent of actual calendar records and tracking. */
export interface SchedulingPreferences {
  wakeTime: string; // local HH:mm
  bedtime: string; // local HH:mm, initially constrained to 20:00–21:00
  stopWorkMinutesBeforeBed: number;
  appliesTo: 'every-day';
  workHours?: WorkHours | null;
  weekdayOverrides?: Partial<Record<Weekday, DailyScheduleOverride>>;
  dateOverrides?: Record<LocalDate, DailyScheduleOverride>;
}
