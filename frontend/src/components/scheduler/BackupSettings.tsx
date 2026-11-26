import { useId, useRef, useState } from 'react';
import { useCalendar } from '../../state/CalendarContext.ts';
import { useSchedulingPreferences } from '../../state/SchedulingPreferencesContext.ts';
import { createCalendarBackup, MAX_BACKUP_BYTES, parseCalendarBackup, restoreCalendarBackup } from '../../utils/calendarBackup.ts';
import type { BackupPreview } from '../../utils/calendarBackup.ts';

export default function BackupSettings({ onRestored }: { onRestored: () => void }) {
  const { records, warning: calendarWarning, acceptRestoredCalendar } = useCalendar();
  const { preferences, warning: scheduleWarning, acceptRestoredPreferences } = useSchedulingPreferences();
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const previewTitle = useRef<HTMLHeadingElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileId = useId();
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function exportBackup() {
    setError(''); setMessage('');
    try {
      const backup = createCalendarBackup(records, preferences, localZone);
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = `personal-hub-backup-${backup.exportedAt.slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove();
      // Defer revocation so the browser can start consuming the download URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Backup download requested. Check your downloads before relying on the copy.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not export the backup.'); }
  }

  return <section id="backup" className="preferences-card" aria-labelledby="backup-title">
    <h2 id="backup-title">Backup &amp; restore</h2>
    <p>Keep a copy of your tasks, sessions, and sleep/work preferences. Backups stay on your device; nothing is uploaded.</p>
    {(calendarWarning || scheduleWarning) && <p className="storage-warning" role="status">Some saved data could not be loaded or saved. Export includes only the data currently loaded in this tab, including unsaved changes.</p>}
    <button type="button" onClick={exportBackup}>Download JSON backup</button>
    <div className="schedule-form backup-import">
      <h3>Restore from a backup</h3>
      <p>Restore replaces all current tasks, sessions, and schedule preferences. It does not merge them. Download a backup first and close other Personal Hub tabs before restoring.</p>
      <label htmlFor={fileId}>Choose a Personal Hub backup</label>
      <input ref={fileInput} id={fileId} type="file" accept=".json,application/json" disabled={reading} aria-describedby={`${fileId}-help`} onChange={async event => {
        const file = event.target.files?.[0];
        setPreview(null); setConfirmed(false); setError(''); setMessage('');
        if (!file) return;
        setReading(true);
        try {
          if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a backup smaller than 5 MB.');
          const next = parseCalendarBackup(await file.text());
          setPreview(next);
          // Focus after React has mounted the preview; no automatic replacement.
          requestAnimationFrame(() => previewTitle.current?.focus());
        } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not read this backup.'); }
        finally { setReading(false); if (fileInput.current) fileInput.current.value = ''; }
      }} />
      <p id={`${fileId}-help`}>JSON, up to 5 MB. Choose a file to validate and preview it.</p>
      {reading && <p role="status">Reading backup…</p>}
      {preview && <div className="backup-preview">
        <h3 ref={previewTitle} tabIndex={-1}>Review replacement</h3>
        <dl><div><dt>Backup created</dt><dd>{new Date(preview.backup.exportedAt).toLocaleString()}</dd></div>
          <div><dt>Tasks</dt><dd>{records.tasks.length} current → {preview.records.tasks.length} in backup</dd></div>
          <div><dt>Sessions</dt><dd>{records.sessions.length} current → {preview.records.sessions.length} in backup</dd></div>
          <div><dt>Schedule preferences</dt><dd>Replace defaults and all overrides</dd></div>
          <div><dt>Original timezone</dt><dd>{preview.backup.timeZone}</dd></div></dl>
        <p>Timed sessions keep their exact instants and display in {localZone}. Untimed dates and preference clock times stay as written.{preview.backup.timeZone !== localZone && ' This backup was created in a different timezone; review your schedule after restoring.'}</p>
        <label className="checkbox-field"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Replace my current tasks, sessions, and schedule preferences with this backup</label>
        <div className="form-actions"><button type="button" onClick={() => { setPreview(null); setConfirmed(false); setError(''); fileInput.current?.focus(); }}>Cancel restore</button>
          <button type="button" className="primary-button" disabled={!confirmed} onClick={() => {
            setError(''); setMessage('');
            try {
              const restored = restoreCalendarBackup(window.localStorage, preview.backup);
              acceptRestoredCalendar(restored.records); acceptRestoredPreferences(restored.preferences);
              setPreview(null); setConfirmed(false); onRestored();
              setMessage('Backup restored and saved in this browser. Review your calendar in Planner.');
              fileInput.current?.focus();
            } catch (failure) { setError(failure instanceof Error ? failure.message : 'Restore failed. Current in-memory data has not changed.'); }
          }}>Replace with backup</button></div>
      </div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <p role="status">{message}</p>
      <p className="preference-note">Includes supported personal records only. Development samples, theme, and view settings are excluded. This is a manual backup, not cloud sync or an automatic backup service.</p>
    </div>
  </section>;
}
