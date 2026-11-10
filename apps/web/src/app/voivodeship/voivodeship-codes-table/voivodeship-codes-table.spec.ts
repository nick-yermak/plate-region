import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { VoivodeshipCodesTable } from './voivodeship-codes-table';

describe('VoivodeshipCodesTable', () => {
  it('renders a code row with its county and plate', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipCodesTable,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipCodesTable);
    fixture.componentRef.setInput('rows', [
      {
        code: 'DW',
        county: { key: 'county.heading.city', params: { name: 'Wrocław' } },
        plate: 'DW 12345',
      },
    ]);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector(
      'tr#DW',
    ) as HTMLElement | null;
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain('DW');
    expect(row?.textContent).toContain('Wrocław');
    const plate = fixture.debugElement
      .query(By.directive(PlateComponent))
      .injector.get(PlateComponent);
    expect(plate.plate()).toBe('DW 12345');
  });

  it('marks only the targetCode row with pr-row-target', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipCodesTable,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipCodesTable);
    fixture.componentRef.setInput('rows', [
      {
        code: 'DW',
        county: { key: 'county.heading.city', params: { name: 'Wrocław' } },
        plate: 'DW 12345',
      },
      {
        code: 'DX',
        county: { key: 'county.heading.city', params: { name: 'Wrocław' } },
        plate: 'DX 12345',
      },
    ]);
    fixture.componentRef.setInput('targetCode', 'DX');
    await fixture.whenStable();

    const dw = fixture.nativeElement.querySelector(
      'tr#DW',
    ) as HTMLElement | null;
    const dx = fixture.nativeElement.querySelector(
      'tr#DX',
    ) as HTMLElement | null;
    expect(dw?.classList.contains('pr-row-target')).toBe(false);
    expect(dx?.classList.contains('pr-row-target')).toBe(true);
  });
});
