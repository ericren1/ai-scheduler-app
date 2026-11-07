import { createContext, useContext } from 'react';
import type { Theme } from '../utils/theme.ts';

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  persistenceAvailable: boolean;
} | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider is required');
  return context;
}
