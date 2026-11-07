import { useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './ThemeContext.ts';
import { isTheme, saveTheme } from '../utils/theme.ts';
import type { Theme } from '../utils/theme.ts';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = document.documentElement.dataset.theme;
    return isTheme(initial) ? initial : 'dark';
  });
  const [persistenceAvailable, setPersistenceAvailable] = useState(() => document.documentElement.dataset.themePersisted === 'true');
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  function setTheme(value: Theme) {
    if (!isTheme(value)) return;
    setThemeState(value);
    try { setPersistenceAvailable(saveTheme(window.localStorage, value)); }
    catch { setPersistenceAvailable(false); }
  }
  return <ThemeContext.Provider value={{ theme, setTheme, persistenceAvailable }}>{children}</ThemeContext.Provider>;
}
