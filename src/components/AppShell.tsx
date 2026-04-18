import type { ReactElement } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BackArrowIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';
import { saveCurrentListIdToStorage } from '../storage';

export function AppShell(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const showBack =
    location.pathname.startsWith('/lists/') ||
    location.pathname.startsWith('/templates') ||
    location.pathname.startsWith('/groupings');

  const goHome = (): void => {
    saveCurrentListIdToStorage(null);
    navigate('/');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-start">
          {showBack ? (
            <button type="button" className="back-btn" onClick={goHome} aria-label="Back to lists">
              <BackArrowIcon size={20} />
            </button>
          ) : (
            <span className="app-header-spacer" aria-hidden />
          )}
        </div>
        <h1 className="app-title">Tododos</h1>
        <div className="app-header-end">
          <ThemeToggle />
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
