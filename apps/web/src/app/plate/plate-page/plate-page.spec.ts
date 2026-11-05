import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { parsePlate } from '@plate-region/plate-domain';

import { PlatePage } from './plate-page';
import { resultView } from '../result-view';
import { appConfig } from '../../app.config';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { LanguageService } from '../../language/language.service';
import { ResultReadingComponent } from '../result-reading/result-reading';
import {
  TESTING_LANGS,
  testingText,
  TRANSLOCO_TESTING,
} from '../../i18n/testing-langs';

describe('PlatePage', () => {
  beforeEach(() => {
    // Route test boots appConfig (real TranslocoFetchLoader); without a stub,
    // load('en') rejects and Vitest reports an unhandled TranslationLoadError.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => TESTING_LANGS.en,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function renderPage(plate: string) {
    await TestBed.configureTestingModule({
      imports: [PlatePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
    }).compileComponents();
    const fixture = TestBed.createComponent(PlatePage);
    fixture.componentRef.setInput('plate', plate);
    await fixture.whenStable();
    return fixture;
  }

  it('normalises the plate on the car for dw-12345', async () => {
    const fixture = await renderPage('dw-12345');
    const plate = fixture.debugElement
      .query(By.directive(PlateComponent))
      .injector.get(PlateComponent);
    expect(plate.plate()).toBe('DW 12345');
  });

  it('keeps an invalid plate string on the car', async () => {
    const fixture = await renderPage('DW 1234Q');
    const plate = fixture.debugElement
      .query(By.directive(PlateComponent))
      .injector.get(PlateComponent);
    expect(plate.plate()).toBe('DW 1234Q');
  });

  it('reads the plate from the route', async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers],
    });

    const harness = await RouterTestingHarness.create('/plate/DW%2012345');
    const plate = harness.routeDebugElement
      ?.query(By.directive(PlateComponent))
      ?.injector.get(PlateComponent);
    expect(plate?.plate()).toBe('DW 12345');
  });

  it('passes the resolved reading to one ResultReading', async () => {
    const fixture = await renderPage('DW 12345');
    const readings = fixture.debugElement.queryAll(
      By.directive(ResultReadingComponent),
    );
    expect(readings).toHaveLength(1);
    const view = resultView(parsePlate('DW 12345'), 'en');
    if (view.kind !== 'readings') {
      throw new Error('expected readings view');
    }
    expect(readings[0]?.injector.get(ResultReadingComponent).reading()).toEqual(
      view.readings[0],
    );
  });

  it('passes both ambiguous readings to ResultReading', async () => {
    const fixture = await renderPage('WOO1A');
    const readings = fixture.debugElement.queryAll(
      By.directive(ResultReadingComponent),
    );
    expect(readings).toHaveLength(2);
  });

  it('renders Wrocław as the heading for a resolved city plate', async () => {
    const fixture = await renderPage('DW 12345');
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'Wrocław',
    );
  });

  it('shows the not-in-registry message and a home link', async () => {
    const fixture = await renderPage('HA12345');
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      testingText('en', 'plate.messages.notInRegistry'),
    );
    const root = fixture.nativeElement as HTMLElement;
    const home = root.querySelector<HTMLAnchorElement>('a[href="/"]');
    expect(home).not.toBeNull();
    expect(
      fixture.debugElement.queryAll(By.directive(ResultReadingComponent)),
    ).toHaveLength(0);
  });

  it('uses the LanguageService language for the heading', async () => {
    await TestBed.configureTestingModule({
      imports: [PlatePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
      providers: [
        {
          provide: LanguageService,
          useValue: { language: signal('pl' as const) },
        },
      ],
    }).compileComponents();
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = TestBed.createComponent(PlatePage);
    fixture.componentRef.setInput('plate', 'WA12');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      testingText('pl', 'plate.heading.voivodeship', { name: 'mazowieckie' }),
    );
  });
});
