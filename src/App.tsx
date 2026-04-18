import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TodoListsProvider } from './contexts/TodoListsContext';
import { TemplatesProvider } from './contexts/TemplatesContext';
import { AppShell } from './components/AppShell';
import { ListsRoute } from './routes/ListsRoute';
import { ListRoute } from './routes/ListRoute';
import { TemplatesRoute } from './routes/TemplatesRoute';
import { TemplateEditRoute } from './routes/TemplateEditRoute';
import './App.css';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function App(): ReactElement {
  return (
    <ToastProvider>
      <ThemeProvider>
        <TodoListsProvider>
          <TemplatesProvider>
            <BrowserRouter basename={routerBasename}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<ListsRoute />} />
                  <Route path="/lists/:listId" element={<ListRoute />} />
                  <Route path="/templates" element={<TemplatesRoute />} />
                  <Route path="/templates/new" element={<TemplateEditRoute />} />
                  <Route path="/templates/:templateId/edit" element={<TemplateEditRoute />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TemplatesProvider>
        </TodoListsProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
