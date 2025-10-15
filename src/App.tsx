import { ToastProvider } from './contexts/ToastContext';
import { AppContent } from './components/AppContent';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
