import type { SchedulingPreferences } from '../types/preferences.ts';

export const initialSchedulingPreferences: Readonly<SchedulingPreferences> = {
  wakeTime: '04:00', bedtime: '20:30', stopWorkMinutesBeforeBed: 60, appliesTo: 'every-day',
};

function minutes(time: string): number {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new RangeError('Expected local HH:mm');
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function isAllowedBedtime(time: string): boolean {
  try {
    const value = minutes(time);
    return value >= 20 * 60 && value <= 21 * 60;
  } catch { return false; }
}

/** Derived guidance only: this never modifies or validates scheduling records. */
export function workCutoffTime(preferences: SchedulingPreferences): string {
  const offset = preferences.stopWorkMinutesBeforeBed;
  if (!Number.isInteger(offset) || offset < 0) throw new RangeError('Expected nonnegative whole minutes');
  const value = ((minutes(preferences.bedtime) - offset) % 1440 + 1440) % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function displayPreferenceTime(time: string): string {
  const value = minutes(time);
  const hour = Math.floor(value / 60);
  return `${hour % 12 || 12}:${String(value % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
