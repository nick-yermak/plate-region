import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzI18nService, en_US, pl_PL } from 'ng-zorro-antd/i18n';
import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';

import { resolveLanguage } from './language';
import { Language } from '../i18n/language.types';
import { LOCAL_STORAGE_KEYS } from '../shared/storage/storage.constants';
import { LocalStorageService } from '../shared/storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(LocalStorageService);
  private readonly transloco = inject(TranslocoService);
  private readonly nzI18n = inject(NzI18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly language: Signal<Language>;
  readonly dictionaryReady: Signal<boolean>;
  readonly switching: Signal<boolean>;
  readonly loadFailed: Signal<boolean>;

  private readonly languageState = signal<Language>(this.resolveInitial());
  private readonly dictionaryReadyState = signal(false);
  private readonly switchingState = signal(false);
  private readonly loadFailedState = signal(false);

  constructor() {
    this.language = this.languageState.asReadonly();
    this.dictionaryReady = this.dictionaryReadyState.asReadonly();
    this.switching = this.switchingState.asReadonly();
    this.loadFailed = this.loadFailedState.asReadonly();

    const lang = this.languageState();
    this.document.documentElement.lang = lang;
    this.applyNzLocale(lang);
    this.transloco.setActiveLang(lang);
    this.subscribeLoad(lang, { markSwitching: false });
  }

  setLanguage(language: Language): void {
    if (language === this.languageState()) {
      return;
    }
    this.languageState.set(language);
    this.storage.set(LOCAL_STORAGE_KEYS.language, language);
    this.transloco.setActiveLang(language);
    this.subscribeLoad(language, { markSwitching: true });
    this.applyNzLocale(language);
    this.document.documentElement.lang = language;
  }

  private resolveInitial(): Language {
    return resolveLanguage(
      this.storage.get(LOCAL_STORAGE_KEYS.language),
      this.document.defaultView?.navigator.language ?? '',
    );
  }

  private subscribeLoad(
    lang: Language,
    options: { markSwitching: boolean },
  ): void {
    if (options.markSwitching) {
      this.switchingState.set(true);
      this.loadFailedState.set(false);
    }
    this.transloco
      .load(lang)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (lang !== this.languageState()) {
            return;
          }
          this.dictionaryReadyState.set(true);
          this.switchingState.set(false);
          this.loadFailedState.set(false);
        },
        error: () => {
          if (lang !== this.languageState()) {
            return;
          }
          this.loadFailedState.set(true);
          this.switchingState.set(false);
        },
      });
  }

  private applyNzLocale(language: Language): void {
    this.nzI18n.setLocale(language === 'pl' ? pl_PL : en_US);
  }
}
