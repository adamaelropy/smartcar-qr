import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { applyTheme, getStoredTheme, resolveTheme } from './utils/theme';
import './index.css';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })
applyTheme(resolveTheme(getStoredTheme()));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
