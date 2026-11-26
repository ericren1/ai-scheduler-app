import { useState } from 'react';
import type { ReactNode } from 'react';
import { SchedulingPreferencesContext } from './SchedulingPreferencesContext.ts';
import { initialSchedulingPreferences, isAllowedBedtime } from '../utils/schedulingPreferences.ts';
import { loadSchedule, saveSchedule, validateSchedulePreferences } from '../utils/dailySchedule.ts';
import type { SchedulingPreferences } from '../types/preferences.ts';
import { recoverBackupRestore } from '../utils/backupStorage.ts';

export default function SchedulingPreferencesProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try { recoverBackupRestore(window.localStorage); return loadSchedule(window.localStorage); }
    catch { return { preferences: { ...initialSchedulingPreferences }, writable: false, warning: 'Schedule storage could not be read or recovered. Existing saved preferences are protected; changes stay in memory.' }; }
  });
  const [preferences, setPreferences] = useState<SchedulingPreferences>(initial.preferences);
  const [warning, setWarning] = useState(initial.warning);
  const [writable, setWritable] = useState(initial.writable);
  function updatePreferences(next: SchedulingPreferences) {
    try { validateSchedulePreferences(next); }
    catch (failure) { return { ok: false, error: failure instanceof Error ? failure.message : 'Invalid preferences.' }; }
    setPreferences(next);
    if (writable) {
      try { recoverBackupRestore(window.localStorage); setWarning(saveSchedule(window.localStorage, next) ? '' : 'Schedule preferences could not be saved. Changes are in memory only.'); }
      catch { setWarning('Schedule preferences are in memory only; storage could not be accessed or recovered.'); }
    }
    return { ok: true };
  }
  function setBedtime(bedtime: string) {
    if (!isAllowedBedtime(bedtime)) return false;
    return updatePreferences({ ...preferences, bedtime }).ok;
  }
  function acceptRestoredPreferences(next: SchedulingPreferences) { setPreferences(next); setWritable(true); setWarning(''); }
  return <SchedulingPreferencesContext.Provider value={{ preferences, setBedtime, updatePreferences, warning, acceptRestoredPreferences }}>{children}</SchedulingPreferencesContext.Provider>;
}
