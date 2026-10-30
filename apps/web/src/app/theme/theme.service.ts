import { Injectable, Signal, signal } from '@angular/core';
import { Theme } from './theme.types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme: Signal<Theme> = signal<Theme>('light').asReadonly();

  setTheme(_theme: Theme): void {
    void _theme;
  }

  toggle(): void {
    return;
  }
}
