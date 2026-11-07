import type { Task } from '../../types/calendar.ts';

export default function UnscheduledTasksPanel({ tasks }: { tasks: readonly Task[] }) {
  return <aside id="unscheduled-tasks" className="unscheduled-panel" aria-label="Unscheduled tasks">
    <h2>Unscheduled <span className="task-count">{tasks.length}</span></h2>
    <p className="calendar-muted">Active tasks without a timed or untimed assignment this week.</p>
    {tasks.length ? <ul>{tasks.map(task => <li key={task.id}>{task.title}</li>)}</ul> : <p>No unscheduled tasks.</p>}
  </aside>;
}
