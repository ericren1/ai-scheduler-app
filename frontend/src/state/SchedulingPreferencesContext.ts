import { createContext, useContext } from 'react';
import type { SchedulingPreferences } from '../types/preferences.ts';

export const SchedulingPreferencesContext = createContext<{
  preferences: SchedulingPreferences;
  setBedtime: (time: string) => boolean;
} | null>(null);

export function useSchedulingPreferences() {
  const value = useContext(SchedulingPreferencesContext);
  if (!value) throw new Error('SchedulingPreferencesProvider is required');
  return value;
}
