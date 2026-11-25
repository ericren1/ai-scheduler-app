import type { LocalDate } from '../../types/calendar.ts';
import { categoryColor } from '../../utils/calendarView.ts';
import type { CalendarRecords, layoutDay } from '../../utils/calendarView.ts';
import ActivityCard from './ActivityCard.tsx';
import type { positionScheduleBands } from '../../utils/dailySchedule.ts';

export default function DayColumn({ date, layout, records, showLabels = false, onSessionEdited, guidance = [] }: {
  date: LocalDate; layout: ReturnType<typeof layoutDay>; records: CalendarRecords; showLabels?: boolean; onSessionEdited?: (date: string) => void;
  guidance?: ReturnType<typeof positionScheduleBands>;
}) {
  return <section className={`day-column ${showLabels ? 'has-local-labels' : ''}`} aria-label={`Hourly activities for ${date}`} style={{ height: layout.window.height || 48 }}>
    {layout.window.height === 0 && <p className="calendar-muted">This local hour is skipped by a clock change.</p>}
    {guidance.map(band => <div key={band.id} className={`schedule-band schedule-band-${band.kind}`} style={{ top: band.top, height: band.height }} role="note" aria-label={`${band.label}, guidance only`}>
      {band.height >= 20 && <span>{band.label}</span>}
    </div>)}
    {layout.window.ticks.map(tick => <div key={tick.timestamp} className="hour-tick" style={{ top: tick.top }}>
      {showLabels && <time dateTime={tick.timestamp}>{tick.label}</time>}
    </div>)}
    <div className="day-activities">
      {layout.items.map(item => <ActivityCard key={`${'status' in item.activity ? 'session' : 'event'}-${item.activity.id}`} activity={item.activity}
        onSessionEdited={onSessionEdited}
        instanceKey={`activity-${date}-${'status' in item.activity ? 'session' : 'event'}-${item.activity.id}`}
        color={categoryColor(item.activity, records)} height={item.height}
        style={{ top: item.top, height: item.height, left: `${item.lane / item.laneCount * 100}%`, width: `${100 / item.laneCount}%` }} />)}
    </div>
  </section>;
}
