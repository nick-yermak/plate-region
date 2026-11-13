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
    fixture.componentRef.setInput('codes', [
      {
        code: 'GD',
        name: {
          key: 'county.heading.city',
          params: { seat: 'Gdańsk' },
        },
      },
      {
        code: 'GS',
        name: {
          key: 'county.heading.cityShared',
          params: { seat: 'Słupsk' },
        },
      },
      {
        code: 'GSL',
        name: {
          key: 'county.heading.landShared',
          params: { seat: 'Słupsk' },
        },
      },
      {
        code: 'GDA',
        name: {
          key: 'county.heading.land',
          params: { seat: 'Pruszcz Gdański', name: 'gdański' },
        },
      },
    ]);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the h2, caption and list in English', async () => {
    const fixture = await render('en');
    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      testingText('en', 'plate.heading.voivodeship', { name: 'Pomeranian' }),
    );
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'plate.voivodeshipCard.mainCodes'),
    );
    const items = [...fixture.nativeElement.querySelectorAll('ul li')].map(
      (node) => node.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(items).toEqual([
      `GD — ${testingText('en', 'county.heading.city', { seat: 'Gdańsk' })}`,
      `GS — ${testingText('en', 'county.heading.cityShared', { seat: 'Słupsk' })}`,
      `GSL — ${testingText('en', 'county.heading.landShared', { seat: 'Słupsk' })}`,
      `GDA — ${testingText('en', 'county.heading.land', { seat: 'Pruszcz Gdański', name: 'gdański' })}`,
    ]);
  });

  it('shows the h2, caption and list in Polish', async () => {
    const fixture = await render('pl');
    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      testingText('pl', 'plate.heading.voivodeship', { name: 'pomorskie' }),
    );
    expect(fixture.nativeElement.textContent).toContain(
      testingText('pl', 'plate.voivodeshipCard.mainCodes'),
    );
    const items = [...fixture.nativeElement.querySelectorAll('ul li')].map(
      (node) => node.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(items).toEqual([
      `GD — ${testingText('pl', 'county.heading.city', { seat: 'Gdańsk' })}`,
      `GS — ${testingText('pl', 'county.heading.cityShared', { seat: 'Słupsk' })}`,
      `GSL — ${testingText('pl', 'county.heading.landShared', { seat: 'Słupsk' })}`,
      `GDA — ${testingText('pl', 'county.heading.land', { seat: 'Pruszcz Gdański', name: 'gdański' })}`,
    ]);
  });
});
