export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'tododos-theme';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Read persisted theme; migrate legacy `system` to light or dark and rewrite storage. */
export function loadThemeFromStorage(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') {
      return raw;
    }
    if (raw === 'system') {
      const next: ThemeMode = systemPrefersDark() ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    }
  } catch {
    // ignore
  }
  return 'light';
}

export function writeStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}

export function cycleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'light' ? 'dark' : 'light';
}

export function themeModeLabel(mode: ThemeMode): string {
  return mode === 'light' ? 'Light' : 'Dark';
}
