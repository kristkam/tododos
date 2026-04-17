import type { ReactElement } from 'react';
import { MoonIcon, SunIcon } from './icons';
import { themeModeLabel, type ThemeMode } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

function modeIcon(mode: ThemeMode): ReactElement {
  switch (mode) {
    case 'light':
      return <SunIcon size={20} />;
    case 'dark':
      return <MoonIcon size={20} />;
  }
}

export function ThemeToggle(): ReactElement {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Theme: ${themeModeLabel(theme)}. Click to switch.`}
      aria-label={`Theme: ${themeModeLabel(theme)}. Click to switch between light and dark.`}
    >
      {modeIcon(theme)}
    </button>
  );
}
