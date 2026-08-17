import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { applyTheme, getStoredTheme, resolveTheme } from './utils/theme';
import './index.css';
import App from './App.jsx';

applyTheme(resolveTheme(getStoredTheme()));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
