/** Soft daily preferences, independent of all calendar records and view hours. */
export interface SchedulingPreferences {
  wakeTime: string; // local HH:mm
  bedtime: string; // local HH:mm, initially constrained to 20:00–21:00
  stopWorkMinutesBeforeBed: number;
  appliesTo: 'every-day';
}
