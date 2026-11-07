export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'personal-hub.theme';

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

/** Missing/invalid preferences and blocked storage always fall back to dark. */
export function readTheme(storage: Pick<ThemeStorage, 'getItem'>): Theme {
  try {
    const saved = storage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : 'dark';
  } catch { return 'dark'; }
}

/** A blocked/private storage write must not prevent an in-session theme change. */
export function saveTheme(storage: Pick<ThemeStorage, 'setItem'>, theme: Theme): boolean {
  try { storage.setItem(THEME_STORAGE_KEY, theme); return true; }
  catch { return false; }
}
