import type { LocalDate } from '../../types/calendar.ts';
import { activitiesForDate, categoryColor } from '../../utils/calendarView.ts';
import type { CalendarRecords } from '../../utils/calendarView.ts';
import { useId, useState } from 'react';
import type { CSSProperties } from 'react';

export default function CalendarDateRows({ dates, records, kind }: {
  dates: LocalDate[]; records: CalendarRecords; kind: 'allDay' | 'untimed';
}) {
  const [expanded, setExpanded] = useState(false);
  const rowId = useId();
  const perDay = dates.map(date => activitiesForDate(records, date)[kind]);
  const populated = perDay.some(items => items.length > 0);
  const expandable = perDay.some(items => items.length > 1);
  const label = kind === 'allDay' ? 'All-day' : 'Untimed';
  return <section className={`calendar-date-section ${populated ? 'is-populated' : 'is-empty'}`} aria-label={kind === 'allDay' ? 'All-day events' : 'Untimed daily tasks'}>
    <h2 className="calendar-row-label">{expandable ? <button className="row-expand" aria-expanded={expanded} aria-controls={rowId} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label.toLowerCase()} row`} onClick={() => setExpanded(value => !value)}>{label}<span aria-hidden="true">{expanded ? '−' : '+'}</span></button> : label}</h2>
    <div id={rowId} className="calendar-seven-columns calendar-date-row">
      {dates.map(date => {
        const items = activitiesForDate(records, date)[kind];
        return <div key={date} aria-label={date}>{items.length ? (expanded ? items : items.slice(0, 1)).map(item => <div className={`date-row-card ${'status' in item && item.status === 'completed' ? 'is-completed' : ''}`} key={item.id}
          style={{ '--category-color': categoryColor(item, records) } as CSSProperties}>
          <span>{'status' in item && item.status === 'completed' && <><span className="completion-mark" aria-hidden="true">✓ </span><span className="sr-only">Completed: </span></>}{item.title}</span>
        </div>) : <span className="sr-only">No {label.toLowerCase()} items</span>}
        {!expanded && items.length > 1 && <button className="row-more" aria-controls={rowId} aria-expanded={expanded} onClick={() => setExpanded(true)}>+{items.length - 1} more<span className="sr-only"> on {date}</span></button>}</div>;
      })}
    </div>
  </section>;
}
