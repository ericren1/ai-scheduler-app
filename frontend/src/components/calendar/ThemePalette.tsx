import { Link } from 'react-router-dom';
import { useTheme } from '../../state/ThemeContext.ts';

/** A compact reference to the active palette, not an extra theme-control bar. */
export default function ThemePalette() {
  const { theme } = useTheme();
  return <footer className="theme-palette">
    <Link to="/settings" aria-label="Change workspace appearance in Settings">
      <span className="theme-indicator" aria-hidden="true" />
      <span>{theme === 'dark' ? 'Deep Indigo' : 'Light'} appearance</span>
    </Link>
    <span className="palette-caption">{Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_', ' ')} · Local time</span>
  </footer>;
}
