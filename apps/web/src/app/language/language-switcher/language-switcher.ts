import { Component, computed, inject } from '@angular/core';

import { Language } from '../../i18n/language.types';
import { LanguageService } from '../language.service';
import { LanguageToggleComponent } from '../language-toggle/language-toggle';

@Component({
  selector: 'app-language-switcher',
  imports: [LanguageToggleComponent],
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);

  protected readonly target = computed<Language>(() =>
    this.languageService.language() === 'en' ? 'pl' : 'en',
  );

  protected readonly busy = computed(() => this.languageService.switching());

  protected onLanguageChange(language: Language): void {
    this.languageService.setLanguage(language);
  }
}
