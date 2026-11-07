import { Link } from 'react-router-dom';
import { useTheme } from '../../state/ThemeContext.ts';

/** A compact reference to the active palette, not an extra theme-control bar. */
export default function ThemePalette() {
  const { theme } = useTheme();
  return <footer className="theme-palette">
    <Link to="/settings" aria-label="Change workspace appearance in Settings">
      <span className="palette-swatches" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
      <span>{theme === 'dark' ? 'Deep Indigo' : 'Light'}</span>
    </Link>
    <span className="palette-caption">Focus &amp; productivity</span>
  </footer>;
}
