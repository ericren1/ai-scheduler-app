import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Task } from '../../types/calendar.ts';
import { useCalendar } from '../../state/CalendarContext.ts';
import { formatCalendarDate, formatTime, toLocalDate } from '../../utils/calendarDate.ts';

export default function TaskRecord({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { records, completeTask, completeSession, requestSessionEdit, requestSessionDelete } = useCalendar();
  const [error, setError] = useState('');
  const sessions = records.sessions.filter(session => session.taskId === task.id);
  const category = records.categories.find(category => category.id === task.categoryId);
  return <article className={`task-record ${task.status === 'completed' ? 'task-completed' : ''}`} style={{ '--task-color': category?.color ?? 'var(--accent)' } as CSSProperties}>
    <div className="task-record-heading"><h2>{task.title}</h2><span className="category-label"><i aria-hidden="true" />{category?.name}</span></div>
    <div className="task-record-meta"><p>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}<span className="task-status">{task.status}</span></p>
      <div className="task-actions"><button type="button" className="session-edit-button" aria-label={`Edit task: ${task.title}`} onClick={onEdit}>Edit task</button>
        <button type="button" className="session-edit-button" aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} task: ${task.title}`} onClick={() => {
          try { completeTask(task.id, task.status !== 'completed'); setError(''); }
          catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not change task status.'); }
        }}>{task.status === 'completed' ? 'Reopen task' : 'Complete task'}</button></div>
    </div>
    {task.status === 'completed' && <p className="task-completion-note">Task completed. Existing sessions are unchanged; reopen to schedule more.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {sessions.length > 0 && <ul>{sessions.map(session => {
      const date = session.kind === 'untimed' ? session.date : toLocalDate(new Date(session.startAt));
      return <li key={session.id}><label className="checkbox-field"><input type="checkbox" checked={session.status === 'completed'} onChange={event => completeSession(session.id, event.target.checked)} aria-label={`Complete session: ${session.title} ${date}`} />
        <span>{session.title !== task.title && <strong className="session-snapshot-title">{session.title}</strong>}{formatCalendarDate(date, { weekday: 'short', month: 'short', day: 'numeric' })} · {session.kind === 'untimed' ? 'Untimed' : `${formatTime(session.startAt)}–${formatTime(session.endAt)}`} · {session.status}</span></label>
        <div className="session-list-actions"><button type="button" className="session-edit-button" aria-label={`Edit session: ${session.title}`} onClick={() => requestSessionEdit(session.id)}>Edit</button>
          <button type="button" className="session-edit-button danger-text" aria-label={`Delete session: ${session.title} on ${date}`} onClick={() => requestSessionDelete(session.id)}>Delete</button></div></li>;
    })}</ul>}
  </article>;
}
