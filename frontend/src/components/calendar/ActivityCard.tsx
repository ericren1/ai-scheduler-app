import type { CSSProperties } from 'react';
import type { TimedActivity } from '../../utils/calendarView.ts';
import { formatTime } from '../../utils/calendarDate.ts';

export default function ActivityCard({ activity, color, style, height, instanceKey }: {
  activity: TimedActivity; color: string; style: CSSProperties; height: number; instanceKey: string;
}) {
  const status = 'status' in activity ? activity.status : activity.commitment;
  const completed = status === 'completed';
  const time = `${formatTime(activity.startAt)} – ${formatTime(activity.endAt)}`;
  const placement = 'placement' in activity ? activity.placement : activity.commitment;
  const description = `${activity.title}. ${time}. ${status}. ${placement}.${activity.notes ? ` ${activity.notes}` : ''}`;
  return <article className={`activity-card ${completed ? 'is-completed' : ''}`}
    style={{ ...style, borderInlineStartColor: color, backgroundColor: `color-mix(in srgb, ${color} 12%, white)` }}>
    <strong>{completed ? '✓ ' : ''}{activity.title}</strong>
    {height >= 48 && <span>{time}</span>}
    {height >= 78 && <span>{status} · {placement}</span>}
    <button className="activity-inspect" aria-label={description} title={description} popoverTarget={instanceKey}>
      <span className="sr-only">View activity details</span>
    </button>
    <div id={instanceKey} popover="auto" className="activity-details" role="dialog" aria-label={activity.title}>
      <h3>{activity.title}</h3><p>{time}</p><p>{status} · {placement}</p>
      {'actualTrackedMinutes' in activity && <p>Actual tracked: {activity.actualTrackedMinutes} minutes</p>}
      <p>{activity.notes}</p>
      <button popoverTarget={instanceKey} popoverTargetAction="hide">Close</button>
    </div>
  </article>;
}
