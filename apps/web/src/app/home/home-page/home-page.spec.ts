import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule, TranslocoService } from '@jsverse/transloco';

import { HomePage } from './home-page';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
    }).compileComponents();
  });

  it('renders the plate field', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Licence plate number"]',
    );
    expect(input).not.toBeNull();
  });

  it('renders the translated heading', async () => {
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'Strona główna',
    );
  });
});
