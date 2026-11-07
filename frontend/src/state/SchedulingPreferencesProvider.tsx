import { useState } from 'react';
import type { ReactNode } from 'react';
import { SchedulingPreferencesContext } from './SchedulingPreferencesContext.ts';
import { initialSchedulingPreferences, isAllowedBedtime } from '../utils/schedulingPreferences.ts';

export default function SchedulingPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => ({ ...initialSchedulingPreferences }));
  function setBedtime(bedtime: string) {
    if (!isAllowedBedtime(bedtime)) return false;
    setPreferences(current => ({ ...current, bedtime }));
    return true;
  }
  return <SchedulingPreferencesContext.Provider value={{ preferences, setBedtime }}>{children}</SchedulingPreferencesContext.Provider>;
}
