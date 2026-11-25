import { useState } from 'react';
import type { ReactNode } from 'react';
import { SchedulingPreferencesContext } from './SchedulingPreferencesContext.ts';
import { initialSchedulingPreferences, isAllowedBedtime } from '../utils/schedulingPreferences.ts';
import { loadSchedule, saveSchedule, validateSchedulePreferences } from '../utils/dailySchedule.ts';
import type { SchedulingPreferences } from '../types/preferences.ts';

export default function SchedulingPreferencesProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try { return loadSchedule(window.localStorage); }
    catch { return { preferences: { ...initialSchedulingPreferences }, writable: false, warning: 'Browser storage is unavailable. Schedule preferences stay in memory.' }; }
  });
  const [preferences, setPreferences] = useState<SchedulingPreferences>(initial.preferences);
  const [warning, setWarning] = useState(initial.warning);
  function updatePreferences(next: SchedulingPreferences) {
    try { validateSchedulePreferences(next); }
    catch (failure) { return { ok: false, error: failure instanceof Error ? failure.message : 'Invalid preferences.' }; }
    setPreferences(next);
    if (initial.writable) {
      try { setWarning(saveSchedule(window.localStorage, next) ? '' : 'Schedule preferences could not be saved. Changes are in memory only.'); }
      catch { setWarning('Schedule preferences are in memory only; storage is unavailable.'); }
    }
    return { ok: true };
  }
  function setBedtime(bedtime: string) {
    if (!isAllowedBedtime(bedtime)) return false;
    return updatePreferences({ ...preferences, bedtime }).ok;
  }
  return <SchedulingPreferencesContext.Provider value={{ preferences, setBedtime, updatePreferences, warning }}>{children}</SchedulingPreferencesContext.Provider>;
}
