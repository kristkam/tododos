import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { THEME_STORAGE_KEY } from '../theme/theme';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('toggles light and dark on documentElement before paint', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.dataset.theme).toBe('light');

    const btn = screen.getByRole('button', { name: /theme/i });
    await user.click(btn);
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    await user.click(btn);
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });
});
