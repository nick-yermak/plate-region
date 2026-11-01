import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import { Language } from '../../i18n/language.types';
import { LanguageToggleComponent } from './language-toggle';

describe('LanguageToggleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageToggleComponent],
    }).compileComponents();
  });

  it('shows Polski in an element with lang pl when the target is pl', async () => {
    const fixture = TestBed.createComponent(LanguageToggleComponent);
    fixture.componentRef.setInput('target', 'pl');
    await fixture.whenStable();

    const labelled = fixture.debugElement.query(By.css('[lang="pl"]'));
    expect(labelled).toBeTruthy();
    expect(labelled.nativeElement.textContent.trim()).toBe('Polski');
  });

  it('shows English in an element with lang en when the target is en', async () => {
    const fixture = TestBed.createComponent(LanguageToggleComponent);
    fixture.componentRef.setInput('target', 'en');
    await fixture.whenStable();

    const labelled = fixture.debugElement.query(By.css('[lang="en"]'));
    expect(labelled).toBeTruthy();
    expect(labelled.nativeElement.textContent.trim()).toBe('English');
  });

  it('emits the target when the button is clicked', async () => {
    const fixture = TestBed.createComponent(LanguageToggleComponent);
    fixture.componentRef.setInput('target', 'pl');
    await fixture.whenStable();

    const emissions: Language[] = [];
    fixture.componentInstance.languageChange.subscribe((language) => {
      emissions.push(language);
    });

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    button.nativeElement.click();
    await fixture.whenStable();
    expect(emissions).toEqual(['pl']);
  });

  it('sets disabled and aria-busy while busy', async () => {
    const fixture = TestBed.createComponent(LanguageToggleComponent);
    fixture.componentRef.setInput('target', 'pl');
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.disabled).toBe(true);
    expect(button.attributes['aria-busy']).toBe('true');
  });
});
