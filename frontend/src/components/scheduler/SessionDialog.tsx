import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCalendar } from '../../state/CalendarContext.ts';
import { localTimeChoices, sessionEndAfterMove } from '../../utils/manualScheduler.ts';
import { formatTime, plannedDurationMinutes, toLocalDate } from '../../utils/calendarDate.ts';
import type { ScheduledSession } from '../../types/calendar.ts';

function choices(date: string, time: string) {
  try { return date && time ? localTimeChoices(date, time) : []; } catch { return []; }
}

function localClock(timestamp: string): string {
  const value = new Date(timestamp);
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export default function SessionDialog({ initialDate, session, onClose, onSaved }: {
  initialDate: string; session?: ScheduledSession; onClose: () => void; onSaved: (date: string) => void;
}) {
  const { records, addSession, editSession } = useCalendar();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [taskId, setTaskId] = useState(session?.taskId ?? records.tasks.find(task => task.status === 'active')?.id ?? '');
  const [date, setDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(session?.kind === 'timed' ? toLocalDate(new Date(session.endAt)) : initialDate);
  const [untimed, setUntimed] = useState(session?.kind === 'untimed');
  const [placement, setPlacement] = useState<'fixed' | 'flexible'>(session?.placement ?? 'flexible');
  const [startTime, setStartTime] = useState(session?.kind === 'timed' ? localClock(session.startAt) : '');
  const [endTime, setEndTime] = useState(session?.kind === 'timed' ? localClock(session.endAt) : '');
  const [startOccurrence, setStartOccurrence] = useState(session?.kind === 'timed' ? new Date(session.startAt).toISOString() : '');
  const [endOccurrence, setEndOccurrence] = useState(session?.kind === 'timed' ? new Date(session.endAt).toISOString() : '');
  const [keepDuration, setKeepDuration] = useState(session?.kind === 'timed');
  const [keepOverlap, setKeepOverlap] = useState(false);
  const [error, setError] = useState('');
  const starts = choices(date, startTime), ends = choices(endDate, endTime);
  const lockedDuration = keepDuration && session?.kind === 'timed';
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => element?.close();
  }, []);
  const occurrenceLabel = (timestamp: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'shortOffset' }).format(new Date(timestamp));
  return <dialog ref={dialog} className="session-dialog" aria-labelledby={titleId} onCancel={onClose}>
    <form onSubmit={event => {
      event.preventDefault();
      try {
        if (!untimed && (!starts.length || (!lockedDuration && !ends.length))) throw new Error('These local times do not exist. Check the date/time, including daylight-saving changes.');
        const startAt = starts.length === 1 ? starts[0] : startOccurrence;
        const endAt = lockedDuration && startAt && session ? sessionEndAfterMove(session, startAt) : ends.length === 1 ? ends[0] : endOccurrence;
        if (!untimed && (!startAt || !endAt)) throw new Error('Choose which occurrence of the repeated hour you mean.');
        const input = { taskId, date, kind: untimed ? 'untimed' as const : 'timed' as const, placement, startAt, endAt, keepOverlap };
        if (session) editSession(session.id, input); else addSession(input);
        onSaved(date); onClose();
      } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save session.'); }
    }}>
      <h2 id={titleId}>{session ? 'Edit session' : 'Schedule a task'}</h2>
      <p>Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}. Scheduling a session never completes its task.</p>
      <label>Task<select required disabled={Boolean(session)} value={taskId} onChange={event => setTaskId(event.target.value)}><option value="" disabled>Choose a task</option>{records.tasks.filter(task => task.status === 'active' || task.id === session?.taskId).map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
      {session && <p>Only this session changes. Its linked task, completion, and tracked time are preserved.</p>}
      {!records.tasks.length && <p><Link to="/tasks" onClick={onClose}>Create a task first</Link></p>}
      <label>Date<input type="date" required value={date} onChange={event => { setDate(event.target.value); setEndDate(event.target.value); setStartOccurrence(''); setEndOccurrence(''); }} /></label>
      <label className="checkbox-field"><input type="checkbox" checked={untimed} onChange={event => setUntimed(event.target.checked)} />Assign to this day without a time</label>
      {!untimed && <>
        {session?.kind === 'timed' && <label className="checkbox-field"><input type="checkbox" checked={keepDuration} onChange={event => {
          const selectedStart = starts.length === 1 ? starts[0] : startOccurrence;
          if (!event.target.checked && selectedStart) {
            const end = sessionEndAfterMove(session, selectedStart);
            setEndDate(toLocalDate(new Date(end))); setEndTime(localClock(end)); setEndOccurrence(end);
          }
          setKeepDuration(event.target.checked);
        }} />Keep {plannedDurationMinutes(session.startAt, session.endAt)} minute duration when moving</label>}
        <div className="form-two-columns"><label>Start time<input type="time" required step="60" value={startTime} onChange={event => { setStartTime(event.target.value); setStartOccurrence(''); }} /></label>
          {!lockedDuration && <label>End time<input type="time" required step="60" value={endTime} onChange={event => { setEndTime(event.target.value); setEndOccurrence(''); }} /></label>}</div>
        {!lockedDuration && <label>End date<input type="date" required min={date} value={endDate} onChange={event => { setEndDate(event.target.value); setEndOccurrence(''); }} /></label>}
        {starts.length > 1 && <label>Start hour occurrence<select required value={startOccurrence} onChange={event => setStartOccurrence(event.target.value)}><option value="">Choose occurrence</option>{starts.map(value => <option key={value} value={value}>{occurrenceLabel(value)}</option>)}</select></label>}
        {!lockedDuration && ends.length > 1 && <label>End hour occurrence<select required value={endOccurrence} onChange={event => setEndOccurrence(event.target.value)}><option value="">Choose occurrence</option>{ends.map(value => <option key={value} value={value}>{occurrenceLabel(value)}</option>)}</select></label>}
        {lockedDuration && starts.length === 1 && session && <p>Ends {toLocalDate(new Date(sessionEndAfterMove(session, starts[0])))} at {formatTime(sessionEndAfterMove(session, starts[0]))}.</p>}
        <label className="checkbox-field"><input type="checkbox" checked={keepOverlap} onChange={event => setKeepOverlap(event.target.checked)} />Intentionally keep overlapping activities</label>
      </>}
      <label>Placement<select value={placement} onChange={event => setPlacement(event.target.value as 'fixed' | 'flexible')}><option value="flexible">Flexible work</option><option value="fixed">Fixed commitment</option></select></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" disabled={!taskId}>{session ? 'Save changes' : 'Create session'}</button></div>
    </form>
  </dialog>;
}
