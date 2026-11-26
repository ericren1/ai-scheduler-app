import type { DailyScheduleOverride, SchedulingPreferences, WorkHours } from '../types/preferences.ts';
import type { Weekday } from '../types/calendar.ts';
import type { ThemeStorage } from './theme.ts';
import { addCalendarDays, getDayWindow, getSessionPosition, localMidnight } from './calendarDate.ts';
import { initialSchedulingPreferences, isAllowedBedtime, workCutoffTime } from './schedulingPreferences.ts';
import { localTimeChoices } from './manualScheduler.ts';
import { SCHEDULE_STORAGE_KEY } from './backupStorage.ts';
export { SCHEDULE_STORAGE_KEY } from './backupStorage.ts';

export function isClock(value: unknown): value is string {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function weekdayOf(date: string): Weekday {
  addCalendarDays(date, 0);
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

export function resolveDailySchedule(preferences: SchedulingPreferences, date: string) {
  const weekly = preferences.weekdayOverrides?.[weekdayOf(date)] ?? {};
  const specific = preferences.dateOverrides?.[date] ?? {};
  const bedtime = specific.bedtime ?? weekly.bedtime ?? preferences.bedtime;
  const wakeTime = specific.wakeTime ?? weekly.wakeTime ?? preferences.wakeTime;
  const workHours = specific.workHours !== undefined ? specific.workHours
    : weekly.workHours !== undefined ? weekly.workHours : preferences.workHours ?? null;
  return { date, bedtime, wakeTime, workHours, cutoff: workCutoffTime({ ...preferences, bedtime }),
    source: preferences.dateOverrides?.[date] ? 'date exception' : preferences.weekdayOverrides?.[weekdayOf(date)] ? 'weekday pattern' : 'default' };
}

function validateWork(work: WorkHours | null | undefined) {
  if (work === undefined || work === null) return;
  if (!isClock(work.start) || !isClock(work.end) || work.start === work.end) throw new Error('Enter different valid work start and end times. Earlier end times mean next day.');
}

function validateOverride(rule: DailyScheduleOverride) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) throw new Error('Invalid schedule override.');
  if (rule.bedtime !== undefined && !isAllowedBedtime(rule.bedtime)) throw new Error('Choose a bedtime between 8:00 PM and 9:00 PM.');
  if (rule.wakeTime !== undefined && !isClock(rule.wakeTime)) throw new Error('Choose a valid wake-up time.');
  validateWork(rule.workHours);
}

function validateResolved(preferences: SchedulingPreferences, date: string) {
  const resolved = resolveDailySchedule(preferences, date);
  if (resolved.wakeTime >= resolved.bedtime) throw new Error('For this overnight sleep plan, wake-up time must be earlier on the clock than bedtime.');
}

export function validateSchedulePreferences(preferences: SchedulingPreferences): void {
  if (!preferences || !isClock(preferences.wakeTime) || !isAllowedBedtime(preferences.bedtime)
    || preferences.appliesTo !== 'every-day') throw new Error('Choose valid daily sleep defaults; bedtime must be between 8:00 PM and 9:00 PM.');
  if (!Number.isInteger(preferences.stopWorkMinutesBeforeBed) || preferences.stopWorkMinutesBeforeBed < 0 || preferences.stopWorkMinutesBeforeBed > 180) throw new Error('Choose a work cutoff between 0 and 180 minutes before bed.');
  validateWork(preferences.workHours);
  for (const overrides of [preferences.weekdayOverrides, preferences.dateOverrides]) {
    if (overrides !== undefined && (!overrides || typeof overrides !== 'object' || Array.isArray(overrides))) throw new Error('Invalid schedule overrides.');
  }
  for (const [day, rule] of Object.entries(preferences.weekdayOverrides ?? {})) {
    if (!/^[1-7]$/.test(day)) throw new Error('Invalid weekday override.');
    validateOverride(rule);
  }
  for (const [date, rule] of Object.entries(preferences.dateOverrides ?? {})) {
    addCalendarDays(date, 0); validateOverride(rule); validateResolved(preferences, date);
  }
  for (let day = 0; day < 7; day++) validateResolved({ ...preferences, dateOverrides: {} }, addCalendarDays('2026-11-02', day));
}

function cleanWork(work: WorkHours | null | undefined): WorkHours | null | undefined {
  return work == null ? work : { start: work.start, end: work.end };
}

function cleanRule(rule: DailyScheduleOverride): DailyScheduleOverride {
  return { ...(rule.bedtime === undefined ? {} : { bedtime: rule.bedtime }),
    ...(rule.wakeTime === undefined ? {} : { wakeTime: rule.wakeTime }),
    ...(rule.workHours === undefined ? {} : { workHours: cleanWork(rule.workHours) }) };
}

export function decodeSchedule(raw: string): SchedulingPreferences {
  const parsed = JSON.parse(raw);
  if (parsed?.version !== 1) throw new Error('Unsupported schedule preferences.');
  validateSchedulePreferences(parsed.preferences);
  const value: SchedulingPreferences = parsed.preferences;
  return { wakeTime: value.wakeTime, bedtime: value.bedtime, stopWorkMinutesBeforeBed: value.stopWorkMinutesBeforeBed,
    appliesTo: 'every-day', workHours: cleanWork(value.workHours),
    weekdayOverrides: Object.fromEntries(Object.entries(value.weekdayOverrides ?? {}).map(([key, rule]) => [key, cleanRule(rule)])),
    dateOverrides: Object.fromEntries(Object.entries(value.dateOverrides ?? {}).map(([key, rule]) => [key, cleanRule(rule)])) };
}

export function loadSchedule(storage: Pick<ThemeStorage, 'getItem'>) {
  try {
    const raw = storage.getItem(SCHEDULE_STORAGE_KEY);
    return { preferences: raw ? decodeSchedule(raw) : { ...initialSchedulingPreferences }, writable: true, warning: '' };
  } catch {
    return { preferences: { ...initialSchedulingPreferences }, writable: false,
      warning: 'Saved schedule preferences could not be loaded. Defaults are shown; changes stay in memory and existing saved data is protected.' };
  }
}

export function saveSchedule(storage: Pick<ThemeStorage, 'setItem'>, preferences: SchedulingPreferences): boolean {
  validateSchedulePreferences(preferences);
  try { storage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ version: 1, preferences })); return true; }
  catch { return false; }
}

export interface ScheduleBand {
  id: string; kind: 'sleep' | 'work' | 'wind-down'; label: string; startAt: string; endAt: string;
}

/** Soft recurring boundaries use the earlier repeated hour and shift gaps forward. */
function plannedInstant(date: string, time: string): { timestamp: string; adjusted: boolean } {
  const options = localTimeChoices(date, time);
  if (options.length) return { timestamp: options[0], adjusted: options.length > 1 };
  return { timestamp: new Date(`${date}T${time}:00`).toISOString(), adjusted: true };
}

export function scheduleBandsForDay(preferences: SchedulingPreferences, date: string): ScheduleBand[] {
  const bands: ScheduleBand[] = [];
  for (const night of [addCalendarDays(date, -1), date]) {
    const plan = resolveDailySchedule(preferences, night);
    const bedtime = plannedInstant(night, plan.bedtime);
    const wake = plannedInstant(addCalendarDays(night, 1), plan.wakeTime);
    const cutoff = new Date(Date.parse(bedtime.timestamp) - preferences.stopWorkMinutesBeforeBed * 60000).toISOString();
    const dst = bedtime.adjusted || wake.adjusted ? ' · DST boundary adjusted' : '';
    bands.push({ id: `sleep-${night}`, kind: 'sleep', label: `Planned sleep${dst}`, startAt: bedtime.timestamp, endAt: wake.timestamp });
    if (cutoff !== bedtime.timestamp) bands.push({ id: `wind-down-${night}`, kind: 'wind-down', label: 'Wind-down preference', startAt: cutoff, endAt: bedtime.timestamp });
    if (plan.workHours) {
      const start = plannedInstant(night, plan.workHours.start);
      const end = plannedInstant(plan.workHours.end < plan.workHours.start ? addCalendarDays(night, 1) : night, plan.workHours.end);
      bands.push({ id: `work-${night}`, kind: 'work', label: `Planned work${start.adjusted || end.adjusted ? ' · DST boundary adjusted' : ''}`, startAt: start.timestamp, endAt: end.timestamp });
    }
  }
  const start = localMidnight(date), end = localMidnight(addCalendarDays(date, 1));
  return bands.filter(band => Date.parse(band.startAt) < end && Date.parse(band.endAt) > start && Date.parse(band.endAt) > Date.parse(band.startAt));
}

export function positionScheduleBands(preferences: SchedulingPreferences, date: string, window: ReturnType<typeof getDayWindow>, pixelsPerHour: number) {
  return scheduleBandsForDay(preferences, date).flatMap(band => {
    const position = getSessionPosition(band, date, { pixelsPerHour, visibleStartMinutes: window.visibleStartMinutes });
    if (!position) return [];
    const top = Math.max(0, position.top), bottom = Math.min(window.height, position.top + position.height);
    return bottom > top ? [{ ...band, top, height: bottom - top }] : [];
  });
}
