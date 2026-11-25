import { useState } from 'react';
import { useSchedulingPreferences } from '../../state/SchedulingPreferencesContext.ts';
import type { DailyScheduleOverride, SchedulingPreferences, WorkHours } from '../../types/preferences.ts';
import type { Weekday } from '../../types/calendar.ts';
import { addCalendarDays, formatCalendarDate, toLocalDate } from '../../utils/calendarDate.ts';
import { displayPreferenceTime, workCutoffTime } from '../../utils/schedulingPreferences.ts';
import { resolveDailySchedule } from '../../utils/dailySchedule.ts';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function WorkFields({ work, onChange }: { work: WorkHours; onChange: (value: WorkHours) => void }) {
  return <div className="form-two-columns"><label>Work starts<input type="time" required step="60" value={work.start} onChange={event => onChange({ ...work, start: event.target.value })} /></label>
    <label>Work ends<input type="time" required step="60" value={work.end} onChange={event => onChange({ ...work, end: event.target.value })} /></label></div>;
}

function DefaultWorkHours() {
  const { preferences, updatePreferences } = useSchedulingPreferences();
  const [enabled, setEnabled] = useState(Boolean(preferences.workHours));
  const [work, setWork] = useState<WorkHours>(preferences.workHours ?? { start: '', end: '' });
  const [message, setMessage] = useState('');
  return <form className="schedule-form" onSubmit={event => {
    event.preventDefault();
    const result = updatePreferences({ ...preferences, workHours: enabled ? work : null });
    setMessage(result.ok ? 'Default work hours applied.' : result.error ?? 'Could not save.');
  }}><h3>Default work hours</h3><p>No work times are assumed. This default applies to all seven days unless overridden below.</p>
    <label className="checkbox-field"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Use default work hours</label>
    {enabled && <WorkFields work={work} onChange={setWork} />}
    <p>End before start means an overnight shift. Equal start/end times are not allowed.</p>
    <button type="submit">Save work defaults</button><p role="status">{message}</p>
  </form>;
}

function OverrideForm({ scope, target }: { scope: 'weekday' | 'date'; target: string }) {
  const { preferences, updatePreferences } = useSchedulingPreferences();
  const rule = scope === 'date' ? preferences.dateOverrides?.[target] : preferences.weekdayOverrides?.[Number(target) as Weekday];
  let inherited = { bedtime: preferences.bedtime, wakeTime: preferences.wakeTime, workHours: preferences.workHours };
  try {
    inherited = resolveDailySchedule(scope === 'weekday' ? { ...preferences, dateOverrides: {} } : preferences,
      scope === 'date' ? target : addCalendarDays('2026-11-02', Number(target) - 1));
  } catch { /* invalid/incomplete date input is rejected on save */ }
  const [sleep, setSleep] = useState(Boolean(rule?.bedtime || rule?.wakeTime));
  const [bedtime, setBedtime] = useState(rule?.bedtime ?? inherited.bedtime);
  const [wakeTime, setWakeTime] = useState(rule?.wakeTime ?? inherited.wakeTime);
  const [workMode, setWorkMode] = useState(rule?.workHours === null ? 'off' : rule?.workHours ? 'hours' : 'inherit');
  const [work, setWork] = useState<WorkHours>(rule?.workHours ?? inherited.workHours ?? { start: '', end: '' });
  const [message, setMessage] = useState('');
  function save(ruleToSave?: DailyScheduleOverride) {
    let next: SchedulingPreferences;
    if (scope === 'date') {
      const overrides = { ...preferences.dateOverrides };
      if (ruleToSave) overrides[target] = ruleToSave; else delete overrides[target];
      next = { ...preferences, dateOverrides: overrides };
    } else {
      const overrides = { ...preferences.weekdayOverrides };
      if (ruleToSave) overrides[Number(target) as Weekday] = ruleToSave; else delete overrides[Number(target) as Weekday];
      next = { ...preferences, weekdayOverrides: overrides };
    }
    const result = updatePreferences(next);
    setMessage(result.ok ? (ruleToSave ? 'Override applied.' : 'Override removed; inherited values apply.') : result.error ?? 'Could not save.');
    if (result.ok && !ruleToSave) { setSleep(false); setWorkMode('inherit'); }
  }
  return <form className="schedule-form" onSubmit={event => {
    event.preventDefault();
    if (!sleep && workMode === 'inherit') { setMessage('Choose a sleep or work override, or remove the existing rule.'); return; }
    save({ ...(sleep ? { bedtime, wakeTime } : {}), ...(workMode === 'off' ? { workHours: null } : workMode === 'hours' ? { workHours: work } : {}) });
  }}>
    <p>Sleep belongs to the night starting {scope === 'weekday' ? `each ${weekdays[Number(target) - 1]}` : `on ${target}`}. Wake-up is the following morning.</p>
    <label className="checkbox-field"><input type="checkbox" checked={sleep} onChange={event => setSleep(event.target.checked)} />Override sleep for this night</label>
    {sleep && <div className="form-two-columns"><label>Night bedtime<input type="time" required min="20:00" max="21:00" step="60" value={bedtime} onChange={event => setBedtime(event.target.value)} /></label>
      <label>Following morning wake-up<input type="time" required step="60" value={wakeTime} onChange={event => setWakeTime(event.target.value)} /></label></div>}
    <label>Work for this day<select value={workMode} onChange={event => setWorkMode(event.target.value)}><option value="inherit">Inherit work hours</option><option value="off">No work / day off</option><option value="hours">Different work hours</option></select></label>
    {workMode === 'hours' && <WorkFields work={work} onChange={setWork} />}
    <div className="form-actions"><button type="button" disabled={!rule} onClick={() => save()}>Remove override</button><button type="submit">Save override</button></div>
    <p role="status">{message}</p>
  </form>;
}

export default function SchedulingSettings() {
  const { preferences, updatePreferences, warning } = useSchedulingPreferences();
  const [error, setError] = useState('');
  const [scope, setScope] = useState<'weekday' | 'date'>('weekday');
  const [day, setDay] = useState('1');
  const [date, setDate] = useState(() => toLocalDate(new Date()));
  const [previewDate, setPreviewDate] = useState(() => toLocalDate(new Date()));
  function update(next: SchedulingPreferences) {
    const result = updatePreferences(next); setError(result.ok ? '' : result.error ?? 'Invalid settings.');
  }
  let preview: ReturnType<typeof resolveDailySchedule> | null = null;
  try { preview = resolveDailySchedule(preferences, previewDate); } catch { /* cleared/invalid date input */ }
  const target = scope === 'weekday' ? day : date;
  return <>
    {warning && <p className="storage-warning" role="status">{warning}</p>}
    <section id="daily-rhythm" className="preferences-card" aria-labelledby="daily-rhythm-title">
      <h2 id="daily-rhythm-title">Sleep &amp; work schedule</h2><p>Daily defaults → weekday patterns → date exceptions. All times are local. These are plans, not restrictions on manual activities.</p>
      <div className="form-two-columns"><label htmlFor="target-bedtime">Default bedtime<input id="target-bedtime" type="time" min="20:00" max="21:00" step="60" value={preferences.bedtime}
        aria-describedby="bedtime-help schedule-error" onChange={event => update({ ...preferences, bedtime: event.target.value })} /></label>
        <label>Wake the following morning<input type="time" step="60" value={preferences.wakeTime} onChange={event => update({ ...preferences, wakeTime: event.target.value })} /></label></div>
      <p id="bedtime-help">Bedtime is configurable between 8–9 PM. Sleep starts that evening and ends the next morning.</p>
      <label>Stop work before bed (minutes)<input type="number" min="0" max="180" step="1" value={preferences.stopWorkMinutesBeforeBed} onChange={event => update({ ...preferences, stopWorkMinutesBeforeBed: Number(event.target.value) })} /></label>
      <p>Default work cutoff: {displayPreferenceTime(workCutoffTime(preferences))}. It follows each night's effective bedtime automatically.</p>
      <p id="schedule-error" className="form-error" role="status">{error}</p>
      <DefaultWorkHours />
    </section>
    <section id="schedule-overrides" className="preferences-card" aria-labelledby="schedule-overrides-title"><h2 id="schedule-overrides-title">Patterns &amp; exceptions</h2>
      <div className="form-two-columns"><label>Override type<select value={scope} onChange={event => setScope(event.target.value as 'weekday' | 'date')}><option value="weekday">Weekly pattern</option><option value="date">Specific date</option></select></label>
        {scope === 'weekday' ? <label>Weekday / night starting<select value={day} onChange={event => setDay(event.target.value)}>{weekdays.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
          : <label>Date / night starting<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>}</div>
      {target && <OverrideForm key={`${scope}-${target}`} scope={scope} target={target} />}
      <h3>Saved overrides</h3><ul className="schedule-rule-list">
        {Object.keys(preferences.weekdayOverrides ?? {}).map(key => <li key={`weekday-${key}`}>Every {weekdays[Number(key) - 1]}<button type="button" onClick={() => { setScope('weekday'); setDay(key); }}>Edit</button></li>)}
        {Object.keys(preferences.dateOverrides ?? {}).sort().map(key => <li key={key}>{key}<button type="button" onClick={() => { setScope('date'); setDate(key); }}>Edit</button></li>)}
      </ul>
      {!Object.keys(preferences.weekdayOverrides ?? {}).length && !Object.keys(preferences.dateOverrides ?? {}).length && <p>No overrides. Daily defaults apply seven days a week.</p>}
    </section>
    <section id="effective-schedule" className="preferences-card" aria-labelledby="effective-schedule-title"><h2 id="effective-schedule-title">Check a day</h2>
      <label>Preview date<input type="date" value={previewDate} onChange={event => setPreviewDate(event.target.value)} /></label>
      {preview && <div className="schedule-preview"><p>{formatCalendarDate(previewDate, { weekday: 'long', month: 'short', day: 'numeric' })} · {preview.source}</p>
        <p>Sleep: {displayPreferenceTime(preview.bedtime)} → {displayPreferenceTime(preview.wakeTime)} on {addCalendarDays(previewDate, 1)}.</p>
        <p>Work cutoff: {displayPreferenceTime(preview.cutoff)}.</p>
        <p>Work: {preview.workHours ? `${displayPreferenceTime(preview.workHours.start)}–${displayPreferenceTime(preview.workHours.end)}${preview.workHours.end < preview.workHours.start ? ' (ends next day)' : ''}` : 'No work hours set / day off'}.</p></div>}
      <div className="preference-note">Saved in this browser, separately from calendar records. Date exceptions override only the fields they specify. Planned sleep/work never marks activity complete, tracks actual time, or moves manual sessions. On DST changes, plan boundaries use the earlier repeated hour or shift a missing hour forward.</div>
    </section>
  </>;
}
