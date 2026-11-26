import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCalendar } from '../state/CalendarContext.ts';
import Icon from '../components/ui/Icon.tsx';
import TaskRecord from '../components/scheduler/TaskRecord.tsx';
import TaskDialog from '../components/scheduler/TaskDialog.tsx';

export default function TasksPage() {
  const { records, warning, addTask } = useCalendar();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(records.categories[0].id);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTask = records.tasks.find(task => task.id === editingId);
  const visibleTasks = records.tasks.filter(task => (statusFilter === 'all' || task.status === statusFilter) && (filter === 'all' || task.categoryId === filter) && task.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
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
    {records.tasks.length > 0 && <div className="task-list-toolbar"><label className="task-search"><Icon name="search" /><span className="sr-only">Search tasks</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tasks…" /></label><label><span className="sr-only">Filter by category</span><select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All categories</option>{records.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span className="sr-only">Filter by task status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="completed">Completed</option></select></label><span className="task-result-count" role="status">{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</span></div>}
    {!records.tasks.length && <div className="empty-state"><Icon name="tasks" /><h2>Start with what matters</h2><p>Add a task above, then schedule one or more sessions in Planner. Completing a session keeps the task available.</p></div>}
    {records.tasks.length > 0 && !visibleTasks.length && <div className="empty-state"><Icon name="search" /><h2>No matching tasks</h2><p>Try another title, category, or status.</p><button onClick={() => { setSearch(''); setFilter('all'); setStatusFilter('all'); }}>Clear filters</button></div>}
    <div className="task-list">{visibleTasks.map(task => <TaskRecord key={task.id} task={task} onEdit={() => setEditingId(task.id)} />)}</div>
    {editingTask && <TaskDialog key={editingTask.id} task={editingTask} onClose={() => setEditingId(null)} />}
  </div>;
}
