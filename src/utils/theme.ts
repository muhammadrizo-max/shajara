export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'myshajara_theme';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Default to dark mode for genealogy high-contrast aesthetic
    return 'dark';
  } catch (e) {
    return 'dark';
  }
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // ignore
  }
}
