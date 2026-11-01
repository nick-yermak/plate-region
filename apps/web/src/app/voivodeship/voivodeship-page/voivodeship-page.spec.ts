import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule, TranslocoService } from '@jsverse/transloco';

import { VoivodeshipPage } from './voivodeship-page';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('VoivodeshipPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipPage,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();
  });

  it('renders the translated heading', async () => {
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = TestBed.createComponent(VoivodeshipPage);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'Województwo',
    );
  });
});
