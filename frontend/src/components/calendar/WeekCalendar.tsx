import type { LocalDate } from '../../types/calendar.ts';
import { formatCalendarDate, formatTime, getWeekDates, isToday } from '../../utils/calendarDate.ts';
import { canShareTimeAxis, getTimedActivities, layoutDay } from '../../utils/calendarView.ts';
import type { CalendarRecords } from '../../utils/calendarView.ts';
import CalendarDateRows from './CalendarDateRows.tsx';
import DayColumn from './DayColumn.tsx';

export default function WeekCalendar({ week, records, startHour, endHour, pixelsPerHour = 60 }: {
  week: LocalDate; records: CalendarRecords; startHour: number; endHour: number; pixelsPerHour?: number;
}) {
  const dates = getWeekDates(week);
  const timed = getTimedActivities(records);
  const layouts = dates.map(date => layoutDay(timed, date, startHour, endHour, pixelsPerHour));
  const sharedAxis = canShareTimeAxis(layouts.map(layout => layout.window));
  const timelineHeight = Math.max(...layouts.map(layout => layout.window.height), 48);
  return <div className="calendar-scroll" tabIndex={0} role="region" aria-label="Weekly calendar, scroll for more days and hours">
    <div className={`calendar-sheet ${sharedAxis ? '' : 'calendar-local-axes'}`}>
      <div className="calendar-header-row"><div className="calendar-corner" aria-hidden="true">Week</div>
      <div className="calendar-seven-columns calendar-day-headers">
        {dates.map(date => <div key={date} className={isToday(date) ? 'calendar-today' : ''}>
          <span className="day-name">{formatCalendarDate(date, { weekday: 'short' })}</span>
          <time dateTime={date} aria-label={formatCalendarDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}>{formatCalendarDate(date, { day: 'numeric' })}</time>
          {isToday(date) && <span className="today-label">Today</span>}
        </div>)}
      </div></div>
      <CalendarDateRows dates={dates} records={records} kind="allDay" />
      <CalendarDateRows dates={dates} records={records} kind="untimed" />
      {layouts.some(layout => layout.outside.length > 0) && <div className="calendar-seven-columns outside-hours">
        {layouts.map((layout, index) => <div key={dates[index]}>
          {layout.outside.length > 0 && <details><summary>{layout.outside.length} outside visible hours</summary>
            <ul>{layout.outside.map(activity => <li key={activity.id}>{activity.title}</li>)}</ul>
            <p>Choose “Full day” to inspect their times.</p>
          </details>}
        </div>)}
      </div>}
      <div className="calendar-time-layout">
        <div className="shared-time-gutter" aria-label={sharedAxis ? 'Local hour labels' : 'Time labels shown in each day'} style={{ height: timelineHeight }}>
          {sharedAxis ? layouts[0].window.ticks.map(tick => <time key={tick.timestamp} style={{ top: tick.top }} dateTime={tick.timestamp}>{formatTime(tick.timestamp)}</time>)
            : <span className="local-axis-note">Local<br />times</span>}
        </div>
      <div className="calendar-seven-columns calendar-timeline" style={{ minHeight: timelineHeight }}>
        {dates.map((date, index) => <DayColumn key={date} date={date} layout={layouts[index]} records={records} showLabels={!sharedAxis} />)}
      </div>
      </div>
    </div>
  </div>;
}
