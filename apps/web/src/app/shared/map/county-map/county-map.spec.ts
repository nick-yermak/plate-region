import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  countyMapLoaders,
  registry,
  type Region2,
} from '@plate-region/plate-data';

import type { MapView } from '../map.types';
import { voivodeshipMapView } from '../map-view';
import { CountyMapComponent } from './county-map';
import { TRANSLOCO_TESTING } from '../../../i18n/testing-langs';

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
});
