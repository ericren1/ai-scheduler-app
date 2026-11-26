import SchedulingSettings from '../components/scheduler/SchedulingSettings.tsx';
import { useTheme } from '../state/ThemeContext.ts';
import { isTheme } from '../utils/theme.ts';
import { useState } from 'react';
import BackupSettings from '../components/scheduler/BackupSettings.tsx';

export default function SettingsPage() {
  const { theme, setTheme, persistenceAvailable } = useTheme();
  const [scheduleRevision, setScheduleRevision] = useState(0);
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p className="settings-description">Make this workspace your own.</p>
      <nav className="settings-sections" aria-label="Settings sections"><a href="#appearance">Appearance</a><a href="#daily-rhythm">Sleep &amp; work</a><a href="#schedule-overrides">Exceptions</a><a href="#effective-schedule">Preview</a><a href="#backup">Backup</a></nav>
      <section id="appearance" className="preferences-card appearance-card" aria-labelledby="appearance-title">
        <h2 id="appearance-title">Appearance</h2>
        <p>Choose a theme for your workspace. Your selection is saved on this device.</p>
        <label htmlFor="workspace-theme">Theme</label>
        <select id="workspace-theme" value={theme} aria-describedby="theme-status" onChange={event => {
          if (isTheme(event.target.value)) setTheme(event.target.value);
        }}><option value="dark">Dark · Deep Indigo</option><option value="light">Light</option></select>
        <p id="theme-status" role="status">{persistenceAvailable ? `${theme === 'dark' ? 'Dark' : 'Light'} theme selected. Saved locally.` : 'Theme applied for this session. Browser storage is unavailable, so it may reset on refresh.'}</p>
      </section>
      <SchedulingSettings key={scheduleRevision} />
      <BackupSettings onRestored={() => setScheduleRevision(value => value + 1)} />
    </div>
  );
}
