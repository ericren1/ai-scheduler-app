import { useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarContext } from './CalendarContext.ts';
import { emptyCalendar } from '../data/calendarDefaults.ts';
import { loadCalendar, saveCalendar } from '../utils/calendarStorage.ts';
import { createSession, createTask, editSession as updateSession, setSessionCompleted, editTask as updateTask, setTaskCompleted, deleteSession } from '../utils/manualScheduler.ts';
import type { SessionInput } from '../utils/manualScheduler.ts';
import type { CalendarRecords } from '../utils/calendarView.ts';
import SessionDialog from '../components/scheduler/SessionDialog.tsx';
import { toLocalDate } from '../utils/calendarDate.ts';
import { recoverBackupRestore } from '../utils/backupStorage.ts';
import DeleteSessionDialog from '../components/scheduler/DeleteSessionDialog.tsx';

export default function CalendarProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try { recoverBackupRestore(window.localStorage); return loadCalendar(window.localStorage); }
    catch { return { records: emptyCalendar(), writable: false, warning: 'Calendar storage could not be read or recovered. Existing saved data is protected; changes will stay in memory.' }; }
  });
  const [records, setRecords] = useState(initial.records);
  const [warning, setWarning] = useState(initial.warning);
  const [writable, setWritable] = useState(initial.writable);
  const [editor, setEditor] = useState<{ id: string; onSaved?: (date: string) => void } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  function update(next: CalendarRecords) {
    setRecords(next);
    if (!writable) return;
    try { recoverBackupRestore(window.localStorage); setWarning(saveCalendar(window.localStorage, next) ? '' : 'Calendar changes could not be saved. Keep this page open; changes are currently in memory only.'); }
    catch { setWarning('Calendar changes are in memory only; browser storage could not be accessed or recovered.'); }
  }
  function addTask(title: string, categoryId: string) { update({ ...records, tasks: [...records.tasks, createTask(records, crypto.randomUUID(), title, categoryId)] }); }
  function addSession(input: SessionInput) { update({ ...records, sessions: [...records.sessions, createSession(records, crypto.randomUUID(), input)] }); }
  function completeSession(id: string, completed: boolean) { update(setSessionCompleted(records, id, completed)); }
  function editSession(id: string, input: SessionInput) { update(updateSession(records, id, input)); }
  function editTask(id: string, title: string, categoryId: string) { update(updateTask(records, id, title, categoryId)); }
  function completeTask(id: string, completed: boolean) { update(setTaskCompleted(records, id, completed)); }
  function requestSessionEdit(id: string, onSaved?: (date: string) => void) {
    if (records.sessions.some(session => session.id === id)) setEditor({ id, onSaved });
  }
  function requestSessionDelete(id: string) {
    if (records.sessions.some(session => session.id === id)) { setEditor(null); setDeletingId(id); }
  }
  // Called only after a validated backup has been persisted successfully.
  function acceptRestoredCalendar(next: CalendarRecords) { setEditor(null); setDeletingId(null); setRecords(next); setWritable(true); setWarning(''); }
  const editingSession = editor ? records.sessions.find(session => session.id === editor.id) : undefined;
  const deletingSession = records.sessions.find(session => session.id === deletingId);
  return <CalendarContext.Provider value={{ records, warning, addTask, addSession, completeSession, editSession, requestSessionEdit, acceptRestoredCalendar, editTask, completeTask, requestSessionDelete }}>
    {children}
    {editingSession && <SessionDialog key={editingSession.id} session={editingSession}
      initialDate={editingSession.kind === 'untimed' ? editingSession.date : toLocalDate(new Date(editingSession.startAt))}
      onClose={() => setEditor(null)} onSaved={date => { editor?.onSaved?.(date); setEditor(null); }} />}
    {deletingSession && <DeleteSessionDialog key={deletingSession.id} session={deletingSession} onCancel={() => setDeletingId(null)} onDelete={() => { update(deleteSession(records, deletingSession.id)); setDeletingId(null); }} />}
  </CalendarContext.Provider>;
}
