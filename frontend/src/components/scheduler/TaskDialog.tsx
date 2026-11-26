import { useEffect, useId, useRef, useState } from 'react';
import { useCalendar } from '../../state/CalendarContext.ts';
import type { Task } from '../../types/calendar.ts';

export default function TaskDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const { records, editTask } = useCalendar();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [title, setTitle] = useState(task.title);
  const [categoryId, setCategoryId] = useState(task.categoryId ?? records.categories[0].id);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      requestAnimationFrame(() => {
        if (element?.open) return;
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
        else document.getElementById('main-content')?.focus();
      });
    };
  }, []);
  return <dialog ref={dialog} className="session-dialog task-dialog" aria-labelledby={titleId} onCancel={onClose}>
    <form onSubmit={event => {
      event.preventDefault();
      try { editTask(task.id, title, categoryId); onClose(); }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not update this task.'); }
    }}>
      <h2 id={titleId}>Edit task</h2>
      <p>New sessions use these details. Existing sessions keep their saved titles, categories, and history.</p>
      <label>Task title<input required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label>Category<select value={categoryId} onChange={event => setCategoryId(event.target.value)}>{records.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Save task</button></div>
    </form>
  </dialog>;
}
