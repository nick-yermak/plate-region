import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import { LanguageService } from './language.service';
import { LanguageToggleComponent } from './language-toggle';
import { LanguageSwitcherComponent } from './language-switcher';

describe('LanguageSwitcherComponent', () => {
  async function createSwitcher(
    language: 'en' | 'pl' = 'en',
    setLanguage = vi.fn(),
  ) {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        {
          provide: LanguageService,
          useValue: {
            language: signal(language).asReadonly(),
            switching: signal(false).asReadonly(),
            dictionaryReady: signal(true).asReadonly(),
            loadFailed: signal(false).asReadonly(),
            setLanguage,
          },
        },
      ],
    }).compileComponents();
    return {
      fixture: TestBed.createComponent(LanguageSwitcherComponent),
      setLanguage,
    };
  }

  it('passes target pl to the toggle when the active language is en', async () => {
    const { fixture } = await createSwitcher('en');
    await fixture.whenStable();

    const toggle = fixture.debugElement.query(
      By.directive(LanguageToggleComponent),
    );
    expect(toggle).toBeTruthy();
    expect(toggle.componentInstance.target()).toBe('pl');
  });

  it('calls setLanguage with the language the toggle emits', async () => {
    const { fixture, setLanguage } = await createSwitcher('en');
    await fixture.whenStable();

    const toggle = fixture.debugElement.query(
      By.directive(LanguageToggleComponent),
    );
    toggle.componentInstance.languageChange.emit('pl');
    await fixture.whenStable();
    expect(setLanguage).toHaveBeenCalledTimes(1);
    expect(setLanguage).toHaveBeenCalledWith('pl');
  });
});
