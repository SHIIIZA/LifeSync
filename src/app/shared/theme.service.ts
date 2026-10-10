import { Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'lifesync-dark-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly darkMode = signal(
    (localStorage.getItem(THEME_STORAGE_KEY) ??
      String(window.matchMedia('(prefers-color-scheme: dark)').matches)) === 'true',
  );

  constructor() {
    this.applyTheme(this.darkMode());
  }

  toggle() {
    const darkMode = !this.darkMode();
    this.darkMode.set(darkMode);
    this.applyTheme(darkMode);
    localStorage.setItem(THEME_STORAGE_KEY, String(darkMode));
  }

  private applyTheme(darkMode: boolean) {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('ion-palette-dark', darkMode);
  }
}
