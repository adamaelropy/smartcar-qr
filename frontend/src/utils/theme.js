export const THEME_KEY = 'theme';

export function resolveTheme(stored) {
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'dark';
}

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore storage errors
  }
}
