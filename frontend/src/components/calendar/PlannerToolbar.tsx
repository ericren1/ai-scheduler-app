import type { LocalDate } from '../../types/calendar.ts';
import { formatCalendarDate, getWeekDates, nextWeek, previousWeek, startOfWeek, toLocalDate } from '../../utils/calendarDate.ts';

interface Props {
  week: LocalDate;
  onWeekChange: (date: LocalDate) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  startHour: number;
  endHour: number;
  onHoursChange: (start: number, end: number) => void;
}

export default function PlannerToolbar(props: Props) {
  const { week, onWeekChange, startHour, endHour, onHoursChange } = props;
  const dates = getWeekDates(week);
  const format = (date: LocalDate) => formatCalendarDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
  return <header className="planner-toolbar">
    <div><h1>Planner</h1><p aria-live="polite">{format(dates[0])} – {format(dates[6])}</p></div>
    <div className="planner-controls">
      <button onClick={() => onWeekChange(previousWeek(week))} aria-label="Previous week">←</button>
      <button onClick={() => onWeekChange(startOfWeek(toLocalDate(new Date())))}>Today</button>
      <button onClick={() => onWeekChange(nextWeek(week))} aria-label="Next week">→</button>
      {import.meta.env.DEV && <button onClick={() => onWeekChange('2026-10-19')}>Sample week</button>}
      <label>From <select value={startHour} onChange={e => onHoursChange(Number(e.target.value), endHour)}>
        {Array.from({ length: endHour }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}
      </select></label>
      <label>To <select value={endHour} onChange={e => onHoursChange(startHour, Number(e.target.value))}>
        {Array.from({ length: 24 - startHour }, (_, i) => startHour + i + 1).map(hour => <option key={hour} value={hour}>{hour === 24 ? '24:00' : `${String(hour).padStart(2, '0')}:00`}</option>)}
      </select></label>
      <button onClick={() => onHoursChange(0, 24)}>Show full day</button>
      <button aria-expanded={props.panelOpen} aria-controls="unscheduled-tasks" onClick={props.onTogglePanel}>Tasks</button>
    </div>
  </header>;
}
