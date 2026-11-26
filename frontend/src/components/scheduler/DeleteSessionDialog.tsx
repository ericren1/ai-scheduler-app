import { useEffect, useId, useRef, useState } from 'react';
import type { ScheduledSession } from '../../types/calendar.ts';
import { formatCalendarDate, formatTime, toLocalDate } from '../../utils/calendarDate.ts';

export default function DeleteSessionDialog({ session, onCancel, onDelete }: {
  session: ScheduledSession; onCancel: () => void; onDelete: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId(), descriptionId = useId();
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal(); cancel.current?.focus();
    return () => {
      element?.close();
      requestAnimationFrame(() => {
        if (element?.open) return;
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
        else document.getElementById('main-content')?.focus();
      });
    };
  }, []);
  const date = session.kind === 'untimed' ? session.date : toLocalDate(new Date(session.startAt));
  const endDate = session.kind === 'timed' ? toLocalDate(new Date(session.endAt)) : date;
  return <dialog ref={dialog} className="session-dialog delete-session-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={onCancel}>
    <h2 id={titleId}>Delete this session?</h2>
    <p><strong>{session.title}</strong></p>
    <p>{formatCalendarDate(date, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}{session.kind === 'timed' ? ` · ${formatTime(session.startAt)}–${formatTime(session.endAt)}${endDate !== date ? ` (ends ${formatCalendarDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' })})` : ''}` : ' · Untimed'}</p>
    <p id={descriptionId}>This removes only this session, including its completion, notes, and tracked time. The task and its other sessions stay unchanged. There is no undo; a saved backup can restore the earlier calendar.</p>
    {session.actualTrackedMinutes !== undefined && <p>Recorded time being removed: {session.actualTrackedMinutes} minutes.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button ref={cancel} type="button" onClick={onCancel}>Keep session</button><button type="button" className="danger-button" onClick={() => {
      try { onDelete(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not delete this session.'); }
    }}>Delete session</button></div>
  </dialog>;
}
