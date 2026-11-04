import type { LocalDate } from '../../types/calendar.ts';
import { categoryColor } from '../../utils/calendarView.ts';
import type { CalendarRecords, layoutDay } from '../../utils/calendarView.ts';
import ActivityCard from './ActivityCard.tsx';

export default function DayColumn({ date, layout, records }: {
  date: LocalDate; layout: ReturnType<typeof layoutDay>; records: CalendarRecords;
}) {
  return <section className="day-column" aria-label={`Hourly activities for ${date}`} style={{ height: layout.window.height || 48 }}>
    {layout.window.height === 0 && <p className="calendar-muted">This local hour is skipped by a clock change.</p>}
    {layout.window.ticks.map(tick => <div key={tick.timestamp} className="hour-tick" style={{ top: tick.top }}>
      <time dateTime={tick.timestamp}>{tick.label}</time>
    </div>)}
    <div className="day-activities">
      {layout.items.map(item => <ActivityCard key={`${'status' in item.activity ? 'session' : 'event'}-${item.activity.id}`} activity={item.activity}
        instanceKey={`activity-${date}-${'status' in item.activity ? 'session' : 'event'}-${item.activity.id}`}
        color={categoryColor(item.activity, records)} height={item.height}
        style={{ top: item.top, height: item.height, left: `${item.lane / item.laneCount * 100}%`, width: `${100 / item.laneCount}%` }} />)}
    </div>
  </section>;
}
