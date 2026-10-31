import { Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';

import { Language } from '../i18n/language.types';
import { LANGUAGE_ENDONYMS } from './language.constants';

@Component({
  selector: 'app-language-toggle',
  imports: [NzButtonComponent],
  templateUrl: './language-toggle.html',
})
export class LanguageToggleComponent {
  readonly target = input.required<Language>();
  readonly busy = input(false);
  readonly languageChange = output<Language>();

  protected readonly endonyms = LANGUAGE_ENDONYMS;

  protected emitTarget(): void {
    this.languageChange.emit(this.target());
  }
}
