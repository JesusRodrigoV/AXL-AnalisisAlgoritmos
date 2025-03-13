import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private currentTheme = signal<Theme>('light');
  THEME_KEY = 'app_theme';
  isDarkMode = computed(() => this.currentTheme() === 'dark');

  constructor() {
    this.setTheme(this.getThemeFromLocalStorage());
  }

  toggleTheme() {
    if (this.currentTheme() === 'light') {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
    if (theme === 'dark') {
      this.document.documentElement.classList.add('dark-mode');
    } else {
      this.document.documentElement.classList.remove('dark-mode');
    }
    this.setThemeInLocalStorage(theme);
  }

  setThemeInLocalStorage(theme: Theme) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.THEME_KEY, theme);
    }
  }

  getThemeFromLocalStorage(): Theme {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
      if (storedTheme) {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    // Default theme for server-side rendering
    return 'light';
  }
}
