import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { VoivodeshipCodesTable } from './voivodeship-codes-table';

describe('VoivodeshipCodesTable', () => {
  it('renders multi-code links, county and one plate', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipCodesTable,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipCodesTable);
    fixture.componentRef.setInput('rows', [
      {
        codes: ['DW', 'DX'] as const,
        county: {
          key: 'county.heading.cityShared',
          params: { seat: 'Wrocław' },
        },
        districts: null,
        plate: 'DW 12345',
      },
    ]);
    await fixture.whenStable();

    const dw = fixture.nativeElement.querySelector(
      'a#DW',
    ) as HTMLAnchorElement | null;
    const dx = fixture.nativeElement.querySelector(
      'a#DX',
    ) as HTMLAnchorElement | null;
    expect(dw).not.toBeNull();
    expect(dx).not.toBeNull();
    expect(dw?.getAttribute('href')).toBe('/plate/DW');
    expect(dx?.getAttribute('href')).toBe('/plate/DX');
    const codesCell = dw?.closest('td');
    expect(codesCell?.textContent?.replace(/\s+/g, ' ').trim()).toBe('DW, DX');
    expect(fixture.nativeElement.textContent).toContain('Wrocław');
    const plate = fixture.debugElement
      .query(By.directive(PlateComponent))
      .injector.get(PlateComponent);
    expect(plate.plate()).toBe('DW 12345');
  });

  it('marks only the row whose codes include targetCode', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipCodesTable,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipCodesTable);
    fixture.componentRef.setInput('rows', [
      {
        codes: ['DW', 'DX'] as const,
        county: {
          key: 'county.heading.cityShared',
          params: { seat: 'Wrocław' },
        },
        districts: null,
        plate: 'DW 12345',
      },
      {
        codes: ['DWR'] as const,
        county: {
          key: 'county.heading.landShared',
          params: { seat: 'Wrocław' },
        },
        districts: null,
        plate: 'DWR 12345',
      },
    ]);
    fixture.componentRef.setInput('targetCode', 'DX');
    await fixture.whenStable();

    const dxRow = fixture.nativeElement
      .querySelector('a#DX')
      ?.closest('tr') as HTMLElement | null;
    const dwrRow = fixture.nativeElement
      .querySelector('a#DWR')
      ?.closest('tr') as HTMLElement | null;
    expect(dxRow?.classList.contains('pr-row-target')).toBe(true);
    expect(dwrRow?.classList.contains('pr-row-target')).toBe(false);
  });

  it('renders county with districts in en', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipCodesTable,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipCodesTable);
    fixture.componentRef.setInput('rows', [
      {
        codes: ['WW', 'AW'] as const,
        county: {
          key: 'county.heading.city',
          params: { seat: 'Warszawa' },
        },
        districts: 'Rembertów, Wilanów, and Włochy',
        plate: 'WW 4PN15',
      },
    ]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'Warszawa — Rembertów, Wilanów, and Włochy',
    );
  });
});
