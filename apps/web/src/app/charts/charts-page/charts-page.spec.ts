import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule, TranslocoService } from '@jsverse/transloco';

import { ChartsPage } from './charts-page';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('ChartsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartsPage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
    }).compileComponents();
  });

  it('renders the translated heading', async () => {
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = TestBed.createComponent(ChartsPage);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'Wykresy',
    );
  });
});
