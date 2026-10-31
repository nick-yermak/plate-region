import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule, TranslocoService } from '@jsverse/transloco';

import { RegistryPage } from './registry-page';
import { TRANSLOCO_TESTING } from '../i18n/testing-langs';

describe('RegistryPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistryPage,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();
  });

  it('renders the translated heading', async () => {
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = TestBed.createComponent(RegistryPage);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'Rejestr',
    );
  });
});
