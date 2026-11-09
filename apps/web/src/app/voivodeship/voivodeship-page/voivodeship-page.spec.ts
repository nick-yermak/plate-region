import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { stableExamplePlateForCode } from '@plate-region/plate-domain';

import { VoivodeshipPage } from './voivodeship-page';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { LanguageService } from '../../language/language.service';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('VoivodeshipPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipPage,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(LanguageService).setLanguage('en');
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function renderPage(slug: string) {
    const fixture = TestBed.createComponent(VoivodeshipPage);
    fixture.componentRef.setInput('slug', slug);
    await fixture.whenStable();
    return fixture;
  }

  it('renders the stable example plate for #DW on dolnoslaskie', async () => {
    const fixture = await renderPage('dolnoslaskie');
    const row = fixture.nativeElement.querySelector(
      '#DW',
    ) as HTMLElement | null;
    expect(row).not.toBeNull();
    const plate = fixture.debugElement
      .query(By.css('#DW'))
      ?.query(By.directive(PlateComponent))
      ?.injector.get(PlateComponent);
    expect(plate?.plate()).toBe(stableExamplePlateForCode('DW'));
  });

  it('shows not-found heading and a home link for foo', async () => {
    const fixture = await renderPage('foo');
    const heading = fixture.nativeElement.querySelector(
      'h1',
    ) as HTMLElement | null;
    expect(heading?.textContent?.trim()).toBe(
      testingText('en', 'voivodeship.notFound.heading'),
    );
    const home = fixture.nativeElement.querySelector(
      'a[href="/"]',
    ) as HTMLAnchorElement | null;
    expect(home).not.toBeNull();
    expect(home?.textContent?.trim()).toBe(
      testingText('en', 'voivodeship.notFound.backHome'),
    );
  });

  it('shows the Polish counts line for opolskie', async () => {
    // Counts from registry source (not project code):
    // counties: grep -c "region1Letter: 'O'" libs/plate-data/src/lib/pl/registry.ts → 12
    // codes: awk over O suffix arrays → 13; pl many → "12 powiatów · 13 kodów"
    TestBed.inject(LanguageService).setLanguage('pl');
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = await renderPage('opolskie');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('12 powiatów · 13 kodów');
  });
});
