import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  countyMapLoaders,
  loadCountryMap,
  registry,
  type Region2,
} from '@plate-region/plate-data';

import type { MapView } from '../map.types';
import { CountyMapComponent } from './county-map';
import { voivodeshipDialogMapView } from '../dialog-map-view';
import { TRANSLOCO_TESTING } from '../../../i18n/testing-langs';
import { countryMapView, voivodeshipMapView } from '../map-view';

function region2ByName(name: string, region1Letter: string): Region2 {
  const found = registry.region2.find(
    (region) => region.name === name && region.region1Letter === region1Letter,
  );
  if (found === undefined) {
    throw new Error(`no region2 ${name} under ${region1Letter}`);
  }
  return found;
}

describe('CountyMapComponent', () => {
  async function render(): Promise<{
    root: HTMLElement;
    fixture: ComponentFixture<CountyMapComponent>;
  }> {
    const map = await countyMapLoaders['D']();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    const view: MapView = voivodeshipMapView(
      map,
      region1,
      region2ByName('Wrocław', 'D'),
      'en',
    );
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CountyMapComponent);
    fixture.componentRef.setInput('view', view);
    await fixture.whenStable();
    return { root: fixture.nativeElement as HTMLElement, fixture };
  }

  it('exposes the map as one image with the aria label', async () => {
    const { root } = await render();
    const images = root.querySelectorAll('svg[role="img"]');
    expect(images).toHaveLength(1);
    expect(images[0]?.getAttribute('aria-label')).toBe(
      'Map: Lower Silesian Voivodeship. Highlighted: Wrocław',
    );
  });

  it('marks one area as filled', async () => {
    const { root } = await render();
    expect(root.querySelectorAll('path.area-filled')).toHaveLength(1);
  });

  it('opens the tooltip for the clicked area', async () => {
    const { root, fixture } = await render();
    const area = root.querySelector(
      'path.area[data-id="DW"]',
    ) as HTMLElement | null;
    area?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const tooltip = root.querySelector('.map-tooltip');
    expect(tooltip?.textContent).toContain('Wrocław');
    expect(tooltip?.textContent).toContain('DW, DX, VW, VX');
    const link = tooltip?.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/voivodeship/dolnoslaskie#DW');
  });

  it('closes the tooltip on Escape', async () => {
    const { root, fixture } = await render();
    const area = root.querySelector(
      'path.area[data-id="DW"]',
    ) as HTMLElement | null;
    area?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelectorAll('.map-tooltip')).toHaveLength(0);
  });

  it('keeps the areas out of the tab order', async () => {
    const { root } = await render();
    expect(root.querySelectorAll('svg [tabindex]')).toHaveLength(0);
    expect(root.querySelectorAll('svg a')).toHaveLength(0);
  });

  it('draws the labels in an overlay in percent of the view box', async () => {
    const { root, fixture } = await render();
    const view = fixture.componentInstance.view();
    const visible = view.areas.filter((area) => area.label.visible);
    const texts = root.querySelectorAll('svg.labels text');
    expect(texts).toHaveLength(visible.length);
    const dol = [...texts].find((node) => node.textContent?.trim() === 'DOL');
    expect(dol?.getAttribute('x')).toBe('87.52000000000001%');
  });

  it('marks the overlay for a halo on the country map', async () => {
    const { root } = await render();
    expect(root.querySelector('svg.labels.halo')).toBeNull();

    const country = await loadCountryMap();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    const countryView = countryMapView(
      country,
      region1,
      region2ByName('Wrocław', 'D'),
      'en',
    );
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const countryFixture = TestBed.createComponent(CountyMapComponent);
    countryFixture.componentRef.setInput('view', countryView);
    await countryFixture.whenStable();
    expect(
      (countryFixture.nativeElement as HTMLElement).querySelector(
        'svg.labels.halo',
      ),
    ).not.toBeNull();
  });

  it('tints the voivodeship on the country map', async () => {
    const country = await loadCountryMap();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CountyMapComponent);
    fixture.componentRef.setInput(
      'view',
      countryMapView(country, region1, region2ByName('Wrocław', 'D'), 'en'),
    );
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        'path.area-tinted',
      ),
    ).toHaveLength(30);
  });

  it('draws the voivodeship borders', async () => {
    const country = await loadCountryMap();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CountyMapComponent);
    fixture.componentRef.setInput(
      'view',
      countryMapView(country, region1, region2ByName('Wrocław', 'D'), 'en'),
    );
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('path.borders')
        ?.getAttribute('d'),
    ).toBe(country.borders);
  });

  it('marks wide-only labels', async () => {
    const country = await loadCountryMap();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CountyMapComponent);
    fixture.componentRef.setInput(
      'view',
      countryMapView(country, region1, region2ByName('Wrocław', 'D'), 'en'),
    );
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('text.wide-only'),
    ).toHaveLength(1);
  });

  it('draws the marker ring above the areas', async () => {
    const { root } = await render();
    expect(root.querySelectorAll('circle.marker')).toHaveLength(0);
    expect(root.querySelectorAll('circle.marker-halo')).toHaveLength(0);

    const country = await loadCountryMap();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CountyMapComponent);
    fixture.componentRef.setInput(
      'view',
      countryMapView(country, region1, region2ByName('Wrocław', 'D'), 'en'),
    );
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('circle.marker')).toHaveLength(1);
    expect(host.querySelectorAll('circle.marker-halo')).toHaveLength(1);
    const marker = host.querySelector('circle.marker');
    expect(marker?.getAttribute('r')).toBe('7');
    expect(marker?.getAttribute('cx')).toBe('29.5%');
  });

  it('in select mode emits areaSelect and shows no tooltip', async () => {
    const map = await countyMapLoaders['D']();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    const country = await loadCountryMap();
    const view = voivodeshipDialogMapView(
      map,
      region1,
      region2ByName('Wrocław', 'D'),
      'DW',
      'en',
      country,
    );
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CountyMapComponent);
    fixture.componentRef.setInput('view', view);
    fixture.componentRef.setInput('interaction', 'select');
    const emitted: string[] = [];
    fixture.componentInstance.areaSelect.subscribe((id) => emitted.push(id));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const area = root.querySelector(
      'path.area[data-id="DW"]',
    ) as HTMLElement | null;
    area?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(emitted).toEqual(['DW']);
    expect(root.querySelectorAll('.map-tooltip')).toHaveLength(0);
  });

  it('draws one seat dot per area when view.dots is true', async () => {
    const map = await countyMapLoaders['D']();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'D',
    );
    if (region1 === undefined) {
      throw new Error('no region1 D');
    }
    const country = await loadCountryMap();
    const view = voivodeshipDialogMapView(
      map,
      region1,
      region2ByName('Wrocław', 'D'),
      'DW',
      'en',
      country,
    );
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        CountyMapComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CountyMapComponent);
    fixture.componentRef.setInput('view', view);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('circle.seat-dot')).toHaveLength(
      view.areas.length,
    );
  });
});
