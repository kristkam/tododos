import { describe, expect, it } from 'vitest';
import {
  THEME_STORAGE_KEY,
  cycleThemeMode,
  loadThemeFromStorage,
  writeStoredThemeMode,
} from './theme';

describe('cycleThemeMode', () => {
  it('toggles light and dark', () => {
    expect(cycleThemeMode('light')).toBe('dark');
    expect(cycleThemeMode('dark')).toBe('light');
  });
});

describe('loadThemeFromStorage', () => {
  it('returns light when nothing stored', () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    expect(loadThemeFromStorage()).toBe('light');
  });

  it('returns stored light or dark', () => {
    writeStoredThemeMode('dark');
    expect(loadThemeFromStorage()).toBe('dark');
    writeStoredThemeMode('light');
    expect(loadThemeFromStorage()).toBe('light');
  });

  it('migrates legacy system to light or dark and rewrites storage', () => {
    const original = window.matchMedia;
    try {
      window.matchMedia = () =>
        ({
          matches: true,
          media: '(prefers-color-scheme: dark)',
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList;
      localStorage.setItem(THEME_STORAGE_KEY, 'system');
      expect(loadThemeFromStorage()).toBe('dark');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    } finally {
      window.matchMedia = original;
    }
  });
});
