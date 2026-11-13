import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, type Provider } from '@angular/core';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { PlatePage } from './plate-page';
import { resultView } from '../result-view';
import { appConfig } from '../../app.config';
import { county, voivodeship } from '../plate.testing';
import type { LoadedMap, MapTarget } from '../plate.types';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { loadResultMap, RESULT_MAP_LOADER } from '../result-map';
import { LanguageService } from '../../language/language.service';
import { ResultReadingComponent } from '../result-reading/result-reading';
import { CandidatesListComponent } from '../candidates-list/candidates-list';
import {
  TESTING_LANGS,
  testingText,
  TRANSLOCO_TESTING,
} from '../../i18n/testing-langs';

type DeferredLoad = {
  readonly target: MapTarget;
  readonly resolve: (value: LoadedMap) => void;
};

function deferredLoader(calls: DeferredLoad[]): typeof loadResultMap {
  return (target) =>
    new Promise((resolve) => {
      calls.push({ target, resolve });
    });
}

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

  async function renderPage(plate: string, providers: Provider[] = []) {
    await TestBed.configureTestingModule({
      imports: [PlatePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
      providers: [provideRouter([]), ...providers],
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
    const view = resultView('DW 12345', 'en');
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
      testingText('en', 'county.heading.cityShared', { seat: 'Wrocław' }),
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

  it('shows the series heading and a home link for HPN 12AA', async () => {
    const fixture = await renderPage('HPN 12AA');
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      testingText('en', 'plate.series.police'),
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
        provideRouter([]),
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

  it('renders the candidates list under the car for GD', async () => {
    const fixture = await renderPage('GD');
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      county('GD').name,
    );
    const car = fixture.debugElement.query(By.directive(PlateComponent)).parent;
    const list = fixture.debugElement.query(
      By.directive(CandidatesListComponent),
    );
    expect(list).not.toBeNull();
    expect(
      car?.nativeElement.compareDocumentPosition(list.nativeElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the incomplete note, reading and map button for GMB3837', async () => {
    const fixture = await renderPage('GMB3837');
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent?.trim()).toBe(
      testingText('en', 'county.heading.land', {
        seat: 'Malbork',
        name: county('GMB').name,
      }),
    );
    expect(root.querySelector('p.note')?.textContent?.trim()).toBe(
      testingText('en', 'plate.notes.incomplete'),
    );
    expect(
      fixture.debugElement.queryAll(By.directive(ResultReadingComponent)),
    ).toHaveLength(1);
    expect(root.querySelector('button.map-dialog-open')).not.toBeNull();
    expect(
      fixture.debugElement.query(By.directive(CandidatesListComponent)),
    ).toBeNull();
  });

  it('renders the withoutRegion2 line for incomplete GW', async () => {
    const fixture = await renderPage('GW');
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'plate.candidates.withoutRegion2'),
    );
  });

  it('renders the voivodeship heading for GK', async () => {
    const fixture = await renderPage('GK');
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      testingText('en', 'plate.heading.voivodeship', {
        name: voivodeship('G').nameEn.value,
      }),
    );
  });

  it('shows the map of Poland with Wrocław for DW 12345', async () => {
    const fixture = await renderPage('DW 12345');
    await vi.waitFor(() => {
      expect(
        fixture.nativeElement.querySelector(
          'svg[role="img"][aria-label="Map of Poland. Highlighted: Wrocław, Lower Silesian Voivodeship"]',
        ),
      ).not.toBeNull();
    });
  });

  it('drops a map load that finishes after the plate changed', async () => {
    const calls: DeferredLoad[] = [];
    const fixture = await renderPage('DW 12345', [
      { provide: RESULT_MAP_LOADER, useValue: deferredLoader(calls) },
    ]);
    await vi.waitFor(() => expect(calls.length).toBe(1));
    fixture.componentRef.setInput('plate', 'GD 12345');
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(calls.length).toBe(2));
    const dw = calls[0];
    const gd = calls[1];
    if (dw === undefined || gd === undefined) {
      throw new Error('expected deferred loads');
    }
    gd.resolve(await loadResultMap(gd.target));
    await Promise.resolve();
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => {
      const labels = [
        ...fixture.nativeElement.querySelectorAll('svg[role="img"]'),
      ].map((node) => (node as SVGElement).getAttribute('aria-label'));
      expect(labels).toHaveLength(1);
      expect(
        labels.every(
          (label) =>
            label !== null &&
            label.includes('Gdańsk') &&
            label.includes('Pomeranian'),
        ),
      ).toBe(true);
    });
    dw.resolve(await loadResultMap(dw.target));
    await Promise.resolve();
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => {
      const labels = [
        ...fixture.nativeElement.querySelectorAll('svg[role="img"]'),
      ].map((node) => (node as SVGElement).getAttribute('aria-label'));
      expect(labels).toHaveLength(1);
      expect(
        labels.every(
          (label) =>
            label !== null &&
            label.includes('Gdańsk') &&
            label.includes('Pomeranian') &&
            !label.includes('Wrocław'),
        ),
      ).toBe(true);
    });
  });

  it('lays out the car, voivodeship and map cards for DW 12345', async () => {
    const fixture = await renderPage('DW 12345');
    await vi.waitFor(() => {
      expect(
        fixture.nativeElement.querySelector('.country-map-box app-county-map'),
      ).not.toBeNull();
    });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent?.trim()).toBe(
      testingText('en', 'county.heading.cityShared', { seat: 'Wrocław' }),
    );
    const carCard = root.querySelector('app-card');
    expect(carCard?.querySelector('app-car-illustration')).not.toBeNull();
    expect(carCard?.querySelector('app-result-reading')).not.toBeNull();
    const mapButton = root.querySelector(
      'app-map-dialog-open-button button.map-dialog-open.ant-btn-primary',
    );
    expect(mapButton?.getAttribute('type')).toBe('button');
    expect(mapButton?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      'Show the county on the map',
    );
    const voivodeshipHeading = [
      ...root.querySelectorAll('app-voivodeship-card h2'),
    ].find((node) => node.textContent?.includes('Lower Silesian Voivodeship'));
    expect(voivodeshipHeading).not.toBeUndefined();
    expect(root.querySelector('app-card.card-info')).not.toBeNull();
    expect(root.querySelector('app-voivodeship-card')?.textContent).toContain(
      'DW',
    );
    expect(
      [...root.querySelectorAll('h2')].some(
        (node) => node.textContent?.trim() === 'Poland – voivodeships',
      ),
    ).toBe(true);
    expect(
      root
        .querySelector('.map-card .country-map-subtitle')
        ?.textContent?.trim(),
    ).toBe('Click the highlighted voivodeship to see its map.');
    expect(
      root.querySelector(
        '.country-map-box svg.voivodeship-button path[role="button"]',
      ),
    ).not.toBeNull();
  });

  it('hides the voivodeship card, map card and map button for HA 12345', async () => {
    const fixture = await renderPage('HA12345');
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('app-card')).toHaveLength(1);
    expect(root.querySelector('app-voivodeship-card')).toBeNull();
    expect(root.querySelector('.country-map-box')).toBeNull();
    expect(root.querySelector('.map-dialog-open')).toBeNull();
  });

  it('shows two reading links and one map button for the ambiguous example', async () => {
    const fixture = await renderPage('WOO1A');
    const root = fixture.nativeElement as HTMLElement;
    const links = root.querySelectorAll('app-result-reading a.ant-btn');
    expect(links).toHaveLength(2);
    expect(root.querySelectorAll('app-voivodeship-card')).toHaveLength(1);
    const mapButtons = root.querySelectorAll('app-map-dialog-open-button');
    expect(mapButtons).toHaveLength(1);
    const lastReading = root.querySelectorAll('app-result-reading')[1];
    const mapButton = mapButtons[0];
    expect(lastReading).toBeTruthy();
    expect(mapButton).toBeTruthy();
    if (!lastReading || !mapButton) {
      return;
    }
    expect(
      lastReading.compareDocumentPosition(mapButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the voivodeship card and map button for GD candidates', async () => {
    const fixture = await renderPage('GD');
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-voivodeship-card')).not.toBeNull();
    expect(root.querySelector('button.map-dialog-open')).not.toBeNull();
  });

  it('labels the map button for a voivodeship-only plate', async () => {
    const fixture = await renderPage('G 12345');
    await vi.waitFor(() => {
      expect(
        fixture.nativeElement.querySelector('.country-map-box app-county-map'),
      ).not.toBeNull();
    });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-voivodeship-card')).not.toBeNull();
    expect(
      root
        .querySelector('button.map-dialog-open')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim(),
    ).toContain('Show the voivodeship on the map');
  });

  it('renders no dialog component before the first map button press', async () => {
    const fixture = await renderPage('GMB 12345');
    await vi.waitFor(() => {
      expect(
        fixture.nativeElement.querySelector('.country-map-box app-county-map'),
      ).not.toBeNull();
    });
    expect(
      fixture.nativeElement.querySelector('app-voivodeship-map-dialog'),
    ).toBeNull();
    const button = fixture.nativeElement.querySelector(
      'button.map-dialog-open',
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    button?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => {
      expect(
        fixture.nativeElement.querySelector('app-voivodeship-map-dialog'),
      ).not.toBeNull();
    });
  });

  it("shows no map while the current plate's map is loading", async () => {
    const calls: DeferredLoad[] = [];
    const fixture = await renderPage('DW 12345', [
      { provide: RESULT_MAP_LOADER, useValue: deferredLoader(calls) },
    ]);
    await vi.waitFor(() => expect(calls.length).toBe(1));
    const dw = calls[0];
    if (dw === undefined) {
      throw new Error('expected DW load');
    }
    dw.resolve(await loadResultMap(dw.target));
    await fixture.whenStable();
    await vi.waitFor(() => {
      expect(
        fixture.nativeElement.querySelector('app-county-map'),
      ).not.toBeNull();
    });
    fixture.componentRef.setInput('plate', 'GD 12345');
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(calls.length).toBe(2));
    expect(fixture.nativeElement.querySelector('app-county-map')).toBeNull();
  });
});
