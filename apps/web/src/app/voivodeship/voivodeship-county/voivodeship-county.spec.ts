import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { county } from '../../plate/plate.testing';
import { VoivodeshipCounty } from './voivodeship-county';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';
import { PlateComponent } from '../../shared/plate/plate/plate';

describe('VoivodeshipCounty', () => {
  it('renders the county heading and a code row with a plate', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipCounty,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();

    const region2 = county('DW');
    const fixture = TestBed.createComponent(VoivodeshipCounty);
    fixture.componentRef.setInput('county', {
      region2,
      codes: [{ code: 'DW', plate: 'DW 12345' }],
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      region2.name,
    );
    expect(fixture.nativeElement.querySelector('#DW')).not.toBeNull();
    const plate = fixture.debugElement
      .query(By.directive(PlateComponent))
      .injector.get(PlateComponent);
    expect(plate.plate()).toBe('DW 12345');
  });
});
