import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { Theme } from '../theme.types';
import { ThemeToggleComponent } from './theme-toggle';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('ThemeToggleComponent', () => {
  async function createToggle() {
    await TestBed.configureTestingModule({
      imports: [
        ThemeToggleComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();
    return TestBed.createComponent(ThemeToggleComponent);
  }

  it('shows Switch to dark theme with the moon icon when theme is light', async () => {
    const fixture = await createToggle();
    fixture.componentRef.setInput('theme', 'light');
    await fixture.whenStable();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    expect(button.attributes['aria-label']).toBe('Switch to dark theme');
    expect(
      fixture.debugElement
        .query(By.directive(NzIconDirective))
        .injector.get(NzIconDirective)
        .nzType(),
    ).toBe('moon');
  });

  it('shows Switch to light theme with the sun icon when theme is dark', async () => {
    const fixture = await createToggle();
    fixture.componentRef.setInput('theme', 'dark');
    await fixture.whenStable();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    expect(button.attributes['aria-label']).toBe('Switch to light theme');
    expect(
      fixture.debugElement
        .query(By.directive(NzIconDirective))
        .injector.get(NzIconDirective)
        .nzType(),
    ).toBe('sun');
  });

  it('emits dark once when clicked while theme is light', async () => {
    const fixture = await createToggle();
    fixture.componentRef.setInput('theme', 'light');
    await fixture.whenStable();

    const emissions: Theme[] = [];
    fixture.componentInstance.themeChange.subscribe((theme) => {
      emissions.push(theme);
    });

    fixture.debugElement.query(By.css('button')).nativeElement.click();
    await fixture.whenStable();
    expect(emissions).toEqual(['dark']);
  });

  it('emits light once when clicked while theme is dark', async () => {
    const fixture = await createToggle();
    fixture.componentRef.setInput('theme', 'dark');
    await fixture.whenStable();

    const emissions: Theme[] = [];
    fixture.componentInstance.themeChange.subscribe((theme) => {
      emissions.push(theme);
    });

    fixture.debugElement.query(By.css('button')).nativeElement.click();
    await fixture.whenStable();
    expect(emissions).toEqual(['light']);
  });

  it('shows the Polish switch label when the active language is pl', async () => {
    const fixture = await createToggle();
    TestBed.inject(TranslocoService).setActiveLang('pl');
    fixture.componentRef.setInput('theme', 'light');
    await fixture.whenStable();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.attributes['aria-label']).toBe('Przełącz na ciemny motyw');
  });
});
