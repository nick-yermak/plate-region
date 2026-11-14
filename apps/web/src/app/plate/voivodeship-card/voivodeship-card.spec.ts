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
    fixture.componentRef.setInput('borders', 'M0 0L10 0L10 10L0 10Z');
    fixture.componentRef.setInput('regionPath', 'M2 2L8 2L8 8L2 8Z');
    fixture.componentRef.setInput('viewBox', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
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

  it('marks the map backdrop as aria-hidden', async () => {
    const fixture = await render('en');
    const backdrop = fixture.nativeElement.querySelector('app-map-backdrop');
    expect(backdrop).not.toBeNull();
    expect(backdrop?.getAttribute('aria-hidden')).toBe('true');
  });
});
