import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCalendar } from '../state/CalendarContext.ts';
import { formatCalendarDate, formatTime, toLocalDate } from '../utils/calendarDate.ts';
import Icon from '../components/ui/Icon.tsx';
import type { CSSProperties } from 'react';

export default function TasksPage() {
  const { records, warning, addTask, completeSession, requestSessionEdit } = useCalendar();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(records.categories[0].id);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const visibleTasks = records.tasks.filter(task => (filter === 'all' || task.categoryId === filter) && task.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <div className="tasks-page"><div className="tasks-heading"><div><h1>Tasks</h1><p>A place for your work. Give it time in Planner.</p></div><Link className="text-action" to="/">Open Planner <Icon name="right" /></Link></div>
    {warning && <p className="storage-warning" role="status">{warning}</p>}
    <form className="task-create-form" onSubmit={event => {
      event.preventDefault();
      try { addTask(title, categoryId); setTitle(''); setError(''); }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not create task.'); }
    }}><label>Task title<input required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="What do you want to work on?" /></label>
      <label>Category<select value={categoryId} onChange={event => setCategoryId(event.target.value)}>{records.categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <button type="submit" className="primary-button"><Icon name="plus" /> Add task</button>{error && <p className="form-error" role="alert">{error}</p>}
    </form>
    {records.tasks.length > 0 && <div className="task-list-toolbar"><label className="task-search"><Icon name="search" /><span className="sr-only">Search tasks</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tasks…" /></label><label><span className="sr-only">Filter by category</span><select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All categories</option>{records.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><span className="task-result-count" role="status">{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</span></div>}
    {!records.tasks.length && <div className="empty-state"><Icon name="tasks" /><h2>Start with what matters</h2><p>Add a task above, then schedule one or more sessions in Planner. Completing a session keeps the task available.</p></div>}
    {records.tasks.length > 0 && !visibleTasks.length && <div className="empty-state"><Icon name="search" /><h2>No matching tasks</h2><p>Try another title or category.</p><button onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button></div>}
    <div className="task-list">{visibleTasks.map(task => {
      const sessions = records.sessions.filter(session => session.taskId === task.id);
      const category = records.categories.find(category => category.id === task.categoryId);
      return <article key={task.id} className="task-record" style={{ '--task-color': category?.color ?? 'var(--accent)' } as CSSProperties}><div className="task-record-heading"><h2>{task.title}</h2><span className="category-label"><i aria-hidden="true" />{category?.name}</span></div><p>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}<span className="task-status">{task.status}</span></p>
        {sessions.length > 0 && <ul>{sessions.map(session => <li key={session.id}><label className="checkbox-field"><input type="checkbox" checked={session.status === 'completed'} onChange={event => completeSession(session.id, event.target.checked)} aria-label={`Complete session: ${session.title} ${session.kind === 'untimed' ? session.date : toLocalDate(new Date(session.startAt))}`} />
          {formatCalendarDate(session.kind === 'untimed' ? session.date : toLocalDate(new Date(session.startAt)), { weekday: 'short', month: 'short', day: 'numeric' })} · {session.kind === 'untimed' ? 'Untimed' : `${formatTime(session.startAt)}–${formatTime(session.endAt)}`} · {session.status}</label>
          <button type="button" className="session-edit-button" aria-label={`Edit session: ${session.title}`} onClick={() => requestSessionEdit(session.id)}>Edit</button></li>)}</ul>}
      </article>;
    })}</div>
  </div>;
}
