import { provideRouter } from '@angular/router';
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
      providers: [provideRouter([])],
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
        link: { slug: 'pomorskie', fragment: 'GD' },
      },
      {
        code: 'GS',
        name: {
          key: 'county.heading.cityShared',
          params: { seat: 'Słupsk' },
        },
        link: { slug: 'pomorskie', fragment: 'GS' },
      },
    ]);
    await fixture.whenStable();
    return fixture;
  }

  it('links each code with accessible name, title and href', async () => {
    const fixture = await render('en');
    const gdName = testingText('en', 'county.heading.city', { seat: 'Gdańsk' });
    const link = fixture.nativeElement.querySelector(
      'a[href="/voivodeship/pomorskie#GD"]',
    ) as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link?.getAttribute('title')).toBe(gdName);
    expect(link?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      `GD — ${gdName}`,
    );
  });
});
