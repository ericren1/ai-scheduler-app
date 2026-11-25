import { useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarContext } from './CalendarContext.ts';
import { emptyCalendar } from '../data/calendarDefaults.ts';
import { loadCalendar, saveCalendar } from '../utils/calendarStorage.ts';
import { createSession, createTask, editSession as updateSession, setSessionCompleted } from '../utils/manualScheduler.ts';
import type { SessionInput } from '../utils/manualScheduler.ts';
import type { CalendarRecords } from '../utils/calendarView.ts';
import SessionDialog from '../components/scheduler/SessionDialog.tsx';
import { toLocalDate } from '../utils/calendarDate.ts';

export default function CalendarProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try { return loadCalendar(window.localStorage); }
    catch { return { records: emptyCalendar(), writable: false, warning: 'Browser storage is unavailable. Calendar changes will stay in memory.' }; }
  });
  const [records, setRecords] = useState(initial.records);
  const [warning, setWarning] = useState(initial.warning);
  const [editor, setEditor] = useState<{ id: string; onSaved?: (date: string) => void } | null>(null);
  function update(next: CalendarRecords) {
    setRecords(next);
    if (!initial.writable) return;
    try { setWarning(saveCalendar(window.localStorage, next) ? '' : 'Calendar changes could not be saved. Keep this page open; changes are currently in memory only.'); }
    catch { setWarning('Calendar changes are in memory only; browser storage is unavailable.'); }
  }
  function addTask(title: string, categoryId: string) { update({ ...records, tasks: [...records.tasks, createTask(records, crypto.randomUUID(), title, categoryId)] }); }
  function addSession(input: SessionInput) { update({ ...records, sessions: [...records.sessions, createSession(records, crypto.randomUUID(), input)] }); }
  function completeSession(id: string, completed: boolean) { update(setSessionCompleted(records, id, completed)); }
  function editSession(id: string, input: SessionInput) { update(updateSession(records, id, input)); }
  function requestSessionEdit(id: string, onSaved?: (date: string) => void) {
    if (records.sessions.some(session => session.id === id)) setEditor({ id, onSaved });
  }
  const editingSession = editor ? records.sessions.find(session => session.id === editor.id) : undefined;
  return <CalendarContext.Provider value={{ records, warning, addTask, addSession, completeSession, editSession, requestSessionEdit }}>
    {children}
    {editingSession && <SessionDialog key={editingSession.id} session={editingSession}
      initialDate={editingSession.kind === 'untimed' ? editingSession.date : toLocalDate(new Date(editingSession.startAt))}
      onClose={() => setEditor(null)} onSaved={date => { editor?.onSaved?.(date); setEditor(null); }} />}
  </CalendarContext.Provider>;
}
