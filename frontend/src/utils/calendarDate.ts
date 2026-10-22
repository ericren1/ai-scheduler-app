import type { LocalDate, Timestamp } from '../types/calendar.ts';

const MINUTE_MS = 60_000;

/** Parse a civil date as a UTC arithmetic anchor, never as a display instant. */
function dateAnchor(date: LocalDate): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError('Expected YYYY-MM-DD');
  const anchor = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(anchor.getTime()) || anchor.toISOString().slice(0, 10) !== date) {
    throw new RangeError('Invalid calendar date');
  }
  return anchor;
}

export function toLocalDate(date: Date): LocalDate {
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid Date');
  const year = date.getFullYear();
  if (year < 0 || year > 9999) throw new RangeError('Year must be between 0000 and 9999');
  return `${String(year).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addCalendarDays(date: LocalDate, days: number): LocalDate {
  if (!Number.isInteger(days)) throw new RangeError('Days must be an integer');
  const anchor = dateAnchor(date);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  const result = anchor.toISOString().slice(0, 10);
  dateAnchor(result);
  return result;
}

export function startOfWeek(date: LocalDate): LocalDate {
  const weekday = dateAnchor(date).getUTCDay();
  return addCalendarDays(date, -((weekday + 6) % 7));
}

export function getWeekDates(date: LocalDate): LocalDate[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(monday, index));
}

/** Return Monday of the adjacent week, regardless of input weekday. */
export function previousWeek(date: LocalDate): LocalDate {
  return addCalendarDays(startOfWeek(date), -7);
}

export function nextWeek(date: LocalDate): LocalDate {
  return addCalendarDays(startOfWeek(date), 7);
}

export function isToday(date: LocalDate, now = new Date()): boolean {
  dateAnchor(date);
  return date === toLocalDate(now);
}

function instant(timestamp: Timestamp): number {
  // Reject timezone-less values: their interpretation varies by machine.
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(timestamp)) {
    throw new RangeError('Expected an ISO timestamp with explicit timezone');
  }
  dateAnchor(timestamp.slice(0, 10));
  const value = Date.parse(timestamp);
  if (!Number.isFinite(value)) throw new RangeError('Invalid timestamp');
  return value;
}

function localMidnight(date: LocalDate): number {
  const anchor = dateAnchor(date);
  const local = new Date(0);
  local.setFullYear(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
  local.setHours(0, 0, 0, 0);
  if (toLocalDate(local) !== date) throw new RangeError('Date does not exist in local timezone');
  return local.getTime();
}

export function plannedDurationMinutes(startAt: Timestamp, endAt: Timestamp): number {
  const duration = (instant(endAt) - instant(startAt)) / MINUTE_MS;
  if (duration <= 0) throw new RangeError('End must be after start');
  return duration;
}

export interface CalendarPositionOptions {
  pixelsPerHour?: number;
  /** Elapsed minutes from local midnight, using the same axis as the grid. */
  visibleStartMinutes?: number;
}

/**
 * Position the portion intersecting a local day; null means outside that day.
 * The elapsed-time axis has 23/25 hours on DST days. No snapping or mutation.
 * Negative top values remain available for scrolling/out-of-range indicators.
 */
export function getSessionPosition(
  session: { startAt: Timestamp; endAt: Timestamp },
  date: LocalDate,
  { pixelsPerHour = 60, visibleStartMinutes = 0 }: CalendarPositionOptions = {},
): { top: number; height: number; dayHeight: number } | null {
  if (!Number.isFinite(pixelsPerHour) || pixelsPerHour <= 0 || !Number.isFinite(visibleStartMinutes)) {
    throw new RangeError('Expected positive scale and finite visible start');
  }
  const start = instant(session.startAt);
  const end = instant(session.endAt);
  if (end <= start) throw new RangeError('End must be after start');
  const dayStart = localMidnight(date);
  const dayEnd = localMidnight(addCalendarDays(date, 1));
  const clippedStart = Math.max(start, dayStart);
  const clippedEnd = Math.min(end, dayEnd);
  if (clippedEnd <= clippedStart) return null;
  const scale = pixelsPerHour / 60;
  return {
    top: ((clippedStart - dayStart) / MINUTE_MS - visibleStartMinutes) * scale,
    height: (clippedEnd - clippedStart) / MINUTE_MS * scale,
    dayHeight: (dayEnd - dayStart) / MINUTE_MS * scale,
  };
}
