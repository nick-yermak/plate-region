import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import type { Language } from '../../i18n/language.types';
import { VoivodeshipCardComponent } from './voivodeship-card';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('VoivodeshipCardComponent', () => {
  async function render(
    language: Language,
  ): Promise<ComponentFixture<VoivodeshipCardComponent>> {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipCardComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();
    TestBed.inject(TranslocoService).setActiveLang(language);
    const fixture = TestBed.createComponent(VoivodeshipCardComponent);
    fixture.componentRef.setInput('heading', {
      key: 'plate.heading.voivodeship',
      params: { name: language === 'en' ? 'Pomeranian' : 'pomorskie' },
    });
    fixture.componentRef.setInput('codes', ['GMB', 'GD', 'GA', 'GS', 'GSP']);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the h2 and the codes line in English', async () => {
    const fixture = await render('en');
    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      testingText('en', 'plate.heading.voivodeship', { name: 'Pomeranian' }),
    );
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'plate.voivodeshipCard.codes', {
        codes: 'GMB, GD, GA, GS, GSP',
      }),
    );
  });

  it('shows the h2 and the codes line in Polish', async () => {
    const fixture = await render('pl');
    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      testingText('pl', 'plate.heading.voivodeship', { name: 'pomorskie' }),
    );
    expect(fixture.nativeElement.textContent).toContain(
      testingText('pl', 'plate.voivodeshipCard.codes', {
        codes: 'GMB, GD, GA, GS, GSP',
      }),
    );
  });
});
