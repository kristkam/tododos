import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TodoListsProvider } from './contexts/TodoListsContext';
import { AppShell } from './components/AppShell';
import { ListsRoute } from './routes/ListsRoute';
import { ListRoute } from './routes/ListRoute';
import './App.css';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function App(): ReactElement {
  return (
    <ToastProvider>
      <ThemeProvider>
        <TodoListsProvider>
          <BrowserRouter basename={routerBasename}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<ListsRoute />} />
                <Route path="/lists/:listId" element={<ListRoute />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TodoListsProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
