/** Calendar-only date (YYYY-MM-DD), without timezone conversion. */
export type LocalDate = string;
/** ISO 8601 instant with Z or explicit offset; writers should normalize to UTC. */
export type Timestamp = string;
/** ISO weekday: Monday = 1, Sunday = 7. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SessionStatus = 'planned' | 'in-progress' | 'completed' | 'partial' | 'missed' | 'skipped';

/** Declarative recurrence only; expansion and exception editing are future work. */
export interface RecurrenceRule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  startDate: LocalDate;
  /** IANA timezone preserves wall-clock intent across DST. */
  timeZone: string;
  weekdays?: Weekday[];
  localStartTime?: string; // HH:mm, not an instant
  placement: 'fixed' | 'flexible';
  end?: { kind: 'until'; date: LocalDate } | { kind: 'count'; count: number };
  excludedDates?: LocalDate[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  parentId?: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  categoryId?: string;
  tags: string[];
  /** Strict user ordering; smaller numbers rank first. */
  priorityRank: number;
  status: 'active' | 'completed' | 'archived';
  completionType: 'one-time' | 'recurring';
  schedulingMode: 'recurring' | 'flexible' | 'on-demand';
  deadline?: Timestamp;
  allowedWeekdays: Weekday[];
  preferredTimeWindows?: { start: string; end: string }[]; // local HH:mm
  dailyGoalMinutes?: number;
  weeklyTargetMinutes?: number;
  recurrenceRuleId?: string;
  prerequisiteTaskIds?: string[];
}

interface SessionBase {
  id: string;
  title: string;
  /** Many sessions may reference one task. Updating this session never completes it. */
  taskId?: string;
  categoryId?: string;
  status: SessionStatus;
  placement: 'fixed' | 'flexible';
  notes?: string;
  /** Unknown until tracked/entered; zero means explicitly recorded zero. */
  actualTrackedMinutes?: number;
  objectiveProgress?: { completed: number; target?: number; unit: string };
  finalized: boolean;
  recurrenceRuleId?: string;
  /** Original local occurrence date remains stable when an occurrence is moved. */
  originalOccurrenceDate?: LocalDate;
  /** Explicit compatible session IDs; absence does not imply overlap permission. */
  compatibleSessionIds?: string[];
}

export interface TimedSession extends SessionBase {
  kind: 'timed';
  startAt: Timestamp;
  endAt: Timestamp;
}

export interface UntimedSession extends SessionBase {
  kind: 'untimed';
  date: LocalDate;
  taskId: string;
}

export type ScheduledSession = TimedSession | UntimedSession;

interface EventBase {
  id: string;
  title: string;
  categoryId?: string;
  notes?: string;
  /** Movable events still require an explicit request before automatic movement. */
  commitment: 'fixed' | 'movable';
  recurrenceRuleId?: string;
  originalOccurrenceDate?: LocalDate;
  reminderMinutesBefore?: number[];
}

export type CalendarEvent = EventBase & (
  | { kind: 'timed'; startAt: Timestamp; endAt: Timestamp }
  | { kind: 'all-day'; startDate: LocalDate; endDateExclusive: LocalDate }
);
