import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import {
  countyMapLoaders,
  loadCountryMap,
  registry,
  type Region2,
} from '@plate-region/plate-data';

import { county } from '../plate.testing';
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

type SeatLabelShot = {
  readonly id: string | null;
  readonly text: string;
  readonly x: string | null;
  readonly y: string | null;
  readonly forced: string | null;
  readonly display: string;
};

function seatLabelSnapshot(root: ParentNode): SeatLabelShot[] {
  return [...root.querySelectorAll('svg.labels text[data-area-id]')].map(
    (el) => ({
      id: el.getAttribute('data-area-id'),
      text: el.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      x: el.getAttribute('x'),
      y: el.getAttribute('y'),
      forced: el.getAttribute('data-forced'),
      display: getComputedStyle(el).display,
    }),
  );
}

describe('VoivodeshipMapDialogComponent', () => {
  async function render(
    open: boolean,
    selectedId = 'GMB',
    options?: { filled?: Region2; plateCode?: string },
  ) {
    const map = await countyMapLoaders['G']();
    const country = await loadCountryMap();
    const region1 = registry.region1.find(
      (region) => region.letters[0] === 'G',
    );
    if (region1 === undefined) {
      throw new Error('no region1 G');
    }
    const filled = options?.filled ?? region2ByName('malborski', 'G');
    const plateCode = options?.plateCode ?? 'GMB';
    const loaded: LoadedMap = {
      target: {
        kind: 'voivodeship',
        region1,
        filled,
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
    fixture.componentRef.setInput('plateCode', plateCode);
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('title', {
      key: 'map.dialogTitle',
      params: { name: 'Pomeranian' },
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

  it('opens with the title only, map and panel', async () => {
    const { root } = await render(true);
    await fixtureWhenModal();
    const modal = document.querySelector('.ant-modal') ?? root;
    const titleText = (
      modal.querySelector('.ant-modal-title')?.textContent ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    expect(titleText).toBe('Pomeranian Voivodeship');
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

  it('keeps every label in place when any county is selected', async () => {
    const filled = county('GD');
    const { fixture, root, loaded } = await render(true, 'GD', {
      filled,
      plateCode: 'GD',
    });
    await fixtureWhenModal();
    const map =
      document.querySelector('app-county-map') ??
      root.querySelector('app-county-map');
    expect(map).not.toBeNull();
    await vi.waitFor(() => {
      expect(
        (map ?? document).querySelectorAll('svg.labels text[data-area-id]')
          .length,
      ).toBeGreaterThan(0);
    });
    const host = map ?? document;
    const baseline = seatLabelSnapshot(host);
    expect(baseline.length).toBeGreaterThan(0);
    const countyIds = loaded.map.counties.map(
      (entry) => `${loaded.target.region1.letters[0]}${entry.firstSuffix}`,
    );
    expect(countyIds).toContain('GTC');
    expect(countyIds).toContain('GSZ');
    expect(countyIds).toContain('GST');
    for (const id of countyIds) {
      fixture.componentRef.setInput('selectedId', id);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(seatLabelSnapshot(host)).toEqual(baseline);
    }
  });
});

async function fixtureWhenModal(): Promise<void> {
  await vi.waitFor(() => {
    expect(document.querySelector('.ant-modal')).not.toBeNull();
  });
}
