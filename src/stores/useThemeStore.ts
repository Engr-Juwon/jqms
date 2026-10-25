import { create } from 'zustand';
import { CompanyThemePalette } from '@/types';
import {
  applyCompanyTheme,
  getStoredCompanyTheme,
  DEFAULT_THEME_PALETTE,
} from '@/lib/theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  palette: CompanyThemePalette;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCompanyPalette: (palette: Partial<CompanyThemePalette>) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('jqms_theme_mode') as ThemeMode;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (e) {
    console.error('Failed reading theme preference:', e);
  }
  return 'light';
};

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }
};

// Initial DOM sync on script load
if (typeof window !== 'undefined') {
  applyThemeToDOM(getInitialTheme());
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  palette: getStoredCompanyTheme(),

  setTheme: (theme: ThemeMode) => {
    try {
      localStorage.setItem('jqms_theme_mode', theme);
    } catch (e) {
      console.error('Failed saving theme mode:', e);
    }
    applyThemeToDOM(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setCompanyPalette: (palette: Partial<CompanyThemePalette>) => {
    const merged = { ...get().palette, ...palette };
    applyCompanyTheme(merged);
    set({ palette: merged });
  },
}));

