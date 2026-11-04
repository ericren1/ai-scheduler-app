import type { LocalDate } from '../../types/calendar.ts';
import { activitiesForDate, categoryColor } from '../../utils/calendarView.ts';
import type { CalendarRecords } from '../../utils/calendarView.ts';

export default function CalendarDateRows({ dates, records, kind }: {
  dates: LocalDate[]; records: CalendarRecords; kind: 'allDay' | 'untimed';
}) {
  return <section aria-label={kind === 'allDay' ? 'All-day events' : 'Untimed daily tasks'}>
    <h2 className="calendar-row-label">{kind === 'allDay' ? 'All-day events' : 'Untimed daily tasks'}</h2>
    <div className="calendar-seven-columns calendar-date-row">
      {dates.map(date => {
        const items = activitiesForDate(records, date)[kind];
        return <div key={date} aria-label={date}>{items.length ? items.map(item => <div className="date-row-card" key={item.id}
          style={{ borderInlineStartColor: categoryColor(item, records) }}>
          <span>{'status' in item && item.status === 'completed' ? '✓ ' : ''}{item.title}</span>
        </div>) : <span className="calendar-muted">—</span>}</div>;
      })}
    </div>
  </section>;
}
