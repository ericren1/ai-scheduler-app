import type { LocalDate } from '../../types/calendar.ts';
import { formatCalendarDate, getWeekDates, isToday } from '../../utils/calendarDate.ts';
import { getTimedActivities, layoutDay } from '../../utils/calendarView.ts';
import type { CalendarRecords } from '../../utils/calendarView.ts';
import CalendarDateRows from './CalendarDateRows.tsx';
import DayColumn from './DayColumn.tsx';

export default function WeekCalendar({ week, records, startHour, endHour, pixelsPerHour = 60 }: {
  week: LocalDate; records: CalendarRecords; startHour: number; endHour: number; pixelsPerHour?: number;
}) {
  const dates = getWeekDates(week);
  const timed = getTimedActivities(records);
  const layouts = dates.map(date => layoutDay(timed, date, startHour, endHour, pixelsPerHour));
  return <div className="calendar-scroll" tabIndex={0} role="region" aria-label="Weekly calendar, scroll for more days and hours">
    <div className="calendar-sheet">
      <div className="calendar-seven-columns calendar-day-headers">
        {dates.map(date => <div key={date} className={isToday(date) ? 'calendar-today' : ''}>
          <time dateTime={date}>{formatCalendarDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}</time>
          {isToday(date) && <span>Today</span>}
        </div>)}
      </div>
      <CalendarDateRows dates={dates} records={records} kind="allDay" />
      <CalendarDateRows dates={dates} records={records} kind="untimed" />
      <div className="calendar-seven-columns outside-hours">
        {layouts.map((layout, index) => <div key={dates[index]}>
          {layout.outside.length > 0 && <details><summary>{layout.outside.length} outside visible hours</summary>
            <ul>{layout.outside.map(activity => <li key={activity.id}>{activity.title}</li>)}</ul>
            <p>Choose “Show full day” to inspect their times.</p>
          </details>}
        </div>)}
      </div>
      <div className="calendar-seven-columns calendar-timeline" style={{ minHeight: Math.max(...layouts.map(layout => layout.window.height)) }}>
        {dates.map((date, index) => <DayColumn key={date} date={date} layout={layouts[index]} records={records} />)}
      </div>
    </div>
  </div>;
}
