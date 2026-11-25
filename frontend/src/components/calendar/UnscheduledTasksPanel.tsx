import type { Task } from '../../types/calendar.ts';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.tsx';
import { useEffect, useRef } from 'react';

export default function UnscheduledTasksPanel({ tasks, onClose }: { tasks: readonly Task[]; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const trigger = document.activeElement;
    closeButton.current?.focus();
    return () => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, []);
  return <aside id="unscheduled-tasks" className="unscheduled-panel" aria-label="Unscheduled tasks" onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
  }}>
    <div className="panel-heading"><h2>Unscheduled <span className="task-count">{tasks.length}</span></h2><button ref={closeButton} className="icon-button quiet-button" onClick={onClose} aria-label="Close unscheduled tasks"><Icon name="close" /></button></div>
    <p className="calendar-muted">Tasks still waiting for a place this week.</p>
    {tasks.length ? <ul>{tasks.map(task => <li key={task.id}><Icon name="tasks" /><span>{task.title}</span></li>)}</ul> : <div className="panel-empty"><Icon name="calendar" /><h3>Room for what’s next</h3><p>New tasks without a session this week will appear here.</p></div>}
    <Link className="panel-link" to="/tasks">Manage tasks <Icon name="right" /></Link>
  </aside>;
}
