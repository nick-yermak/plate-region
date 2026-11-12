import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import {
  countyMapLoaders,
  loadCountryMap,
  registry,
  type Region2,
} from '@plate-region/plate-data';

import type { LoadedMap } from '../plate.types';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';
import { VoivodeshipMapDialogComponent } from './voivodeship-map-dialog';

function region2ByName(name: string, region1Letter: string): Region2 {
  const found = registry.region2.find(
    (region) => region.name === name && region.region1Letter === region1Letter,
  );
  if (found === undefined) {
    throw new Error(`no region2 ${name} under ${region1Letter}`);
  }
  return found;
}

describe('VoivodeshipMapDialogComponent', () => {
  async function render(open: boolean, selectedId = 'GMB') {
    const map = await countyMapLoaders['G']();
    const country = await loadCountryMap();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'G',
    );
    if (region1 === undefined) {
      throw new Error('no region1 G');
    }
    const loaded: LoadedMap = {
      target: {
        kind: 'voivodeship',
        region1,
        filled: region2ByName('malborski', 'G'),
      },
      map,
      country,
    };
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipMapDialogComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(VoivodeshipMapDialogComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('loaded', loaded);
    fixture.componentRef.setInput('plateCode', 'GMB');
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('title', {
      key: 'map.dialogTitle',
      params: { name: 'Pomeranian' },
    });
    fixture.componentRef.setInput('subtitle', {
      key: 'map.dialogSubtitle',
      params: {},
    });
    fixture.componentRef.setInput('voivodeshipLabel', 'Pomeranian');
    fixture.componentRef.setInput('selectedId', selectedId);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, root: fixture.nativeElement as HTMLElement, loaded };
  }

  it('keeps nz-modal out of the DOM when closed', async () => {
    const { root } = await render(false);
    expect(root.querySelector('nz-modal')).toBeNull();
    expect(document.querySelector('.ant-modal')).toBeNull();
  });

  it('opens with title, subtitle, map and panel', async () => {
    const { root } = await render(true);
    await fixtureWhenModal();
    const modal = document.querySelector('.ant-modal') ?? root;
    expect(modal.textContent).toContain('Pomeranian Voivodeship');
    expect(modal.textContent).toContain('Counties and registration codes');
    expect(
      document.querySelector('app-county-map') ??
        root.querySelector('app-county-map'),
    ).not.toBeNull();
    expect(
      document.querySelector('.map-dialog-panel') ??
        root.querySelector('.map-dialog-panel'),
    ).not.toBeNull();
  });

  it('updates the panel heading after areaSelect', async () => {
    const { fixture, root } = await render(true);
    await fixtureWhenModal();
    const selected: string[] = [];
    fixture.componentInstance.areaSelect.subscribe((id) => selected.push(id));
    const map =
      document.querySelector('app-county-map') ??
      root.querySelector('app-county-map');
    const area = map?.querySelector(
      'path.area[data-id="GDA"]',
    ) as HTMLElement | null;
    area?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(selected).toEqual(['GDA']);
    fixture.componentRef.setInput('selectedId', 'GDA');
    fixture.detectChanges();
    await fixture.whenStable();
    const panel =
      document.querySelector('.map-dialog-panel') ??
      root.querySelector('.map-dialog-panel');
    expect(panel?.textContent).toContain('gdański');
  });

  it('emits closed from Zamknij / Close', async () => {
    const { fixture } = await render(true);
    await fixtureWhenModal();
    const closed: boolean[] = [];
    fixture.componentInstance.closed.subscribe(() => closed.push(true));
    const button = [...document.querySelectorAll('button')].find((node) =>
      node.textContent?.includes('Close'),
    ) as HTMLButtonElement | undefined;
    button?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => {
      expect(closed.length).toBeGreaterThanOrEqual(1);
    });
    expect(closed[0]).toBe(true);
  });
});

async function fixtureWhenModal(): Promise<void> {
  await vi.waitFor(() => {
    expect(document.querySelector('.ant-modal')).not.toBeNull();
  });
}
