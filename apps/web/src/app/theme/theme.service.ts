import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Theme } from './theme.types';
import { DARK_SCHEME_QUERY, THEME_LINK_IDS } from './theme.constants';
import { LOCAL_STORAGE_KEYS } from '../shared/storage/storage.constants';
import { LocalStorageService } from '../shared/storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(LocalStorageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly theme: Signal<Theme> = computed(
    () => this.choice() ?? this.system(),
  );

  private readonly choice = signal<Theme | null>(this.readChoice());
  private readonly system = signal<Theme>(this.readSystem());

  constructor() {
    const media = this.document.defaultView?.matchMedia?.(DARK_SCHEME_QUERY);
    if (!media) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => {
      this.system.set(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => {
      media.removeEventListener('change', onChange);
    });
  }

  setTheme(theme: Theme): void {
    const light = this.link(THEME_LINK_IDS.light);
    const dark = this.link(THEME_LINK_IDS.dark);
    if (light && dark) {
      if (theme === 'dark') {
        dark.media = 'all';
        light.media = 'not all';
      } else {
        light.media = 'all';
        dark.media = 'not all';
      }
    }
    this.storage.set(LOCAL_STORAGE_KEYS.theme, theme);
    this.choice.set(theme);
  }

  private link(id: string): HTMLLinkElement | null {
    const element = this.document.getElementById(id);
    return element instanceof HTMLLinkElement ? element : null;
  }

  private readChoice(): Theme | null {
    const stored = this.storage.get(LOCAL_STORAGE_KEYS.theme);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }

  private readSystem(): Theme {
    const matches =
      this.document.defaultView?.matchMedia?.(DARK_SCHEME_QUERY).matches ??
      false;
    return matches ? 'dark' : 'light';
  }
}
