import { useSchedulingPreferences } from '../state/SchedulingPreferencesContext.ts';
import { displayPreferenceTime, workCutoffTime } from '../utils/schedulingPreferences.ts';
import { useState } from 'react';
import { useTheme } from '../state/ThemeContext.ts';
import { isTheme } from '../utils/theme.ts';

export default function SettingsPage() {
  const { preferences, setBedtime } = useSchedulingPreferences();
  const [error, setError] = useState('');
  const { theme, setTheme, persistenceAvailable } = useTheme();
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p className="settings-description">Make this workspace your own.</p>
      <section className="preferences-card appearance-card" aria-labelledby="appearance-title">
        <h2 id="appearance-title">Appearance</h2>
        <p>Choose a theme for your workspace. Your selection is saved on this device.</p>
        <label htmlFor="workspace-theme">Theme</label>
        <select id="workspace-theme" value={theme} aria-describedby="theme-status" onChange={event => {
          if (isTheme(event.target.value)) setTheme(event.target.value);
        }}><option value="dark">Dark · Deep Indigo</option><option value="light">Light</option></select>
        <p id="theme-status" role="status">{persistenceAvailable ? `${theme === 'dark' ? 'Dark' : 'Light'} theme selected. Saved locally.` : 'Theme applied for this session. Browser storage is unavailable, so it may reset on refresh.'}</p>
      </section>
      <section className="preferences-card" aria-labelledby="daily-rhythm-title">
        <h2 id="daily-rhythm-title">Daily rhythm</h2><p>Applies every day, Monday through Sunday. All times are local.</p>
        <dl><div><dt>Wake-up time</dt><dd>{displayPreferenceTime(preferences.wakeTime)}</dd></div>
          <div><dt>Wind-down period</dt><dd>{preferences.stopWorkMinutesBeforeBed} minutes before bed</dd></div>
          <div><dt>Target work cutoff</dt><dd>{displayPreferenceTime(workCutoffTime(preferences))}</dd></div></dl>
        <label htmlFor="target-bedtime">Target bedtime</label>
        <input id="target-bedtime" type="time" min="20:00" max="21:00" step="60" value={preferences.bedtime}
          aria-describedby="bedtime-help bedtime-error" aria-invalid={Boolean(error)}
          onChange={event => setError(setBedtime(event.target.value) ? '' : 'Choose a bedtime between 8:00 PM and 9:00 PM.')} />
        <p id="bedtime-help">Choose between 8:00 PM and 9:00 PM. Changes apply immediately in this browser session.</p>
        <p id="bedtime-error" role="status">{error}</p>
        <div className="preference-note">These are preferences, not scheduling restrictions. Manually scheduled activities remain unchanged. Settings reset on refresh.</div>
      </section>
    </div>
  );
}
