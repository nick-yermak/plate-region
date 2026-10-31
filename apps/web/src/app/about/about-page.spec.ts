import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule, TranslocoService } from '@jsverse/transloco';

import { AboutPage } from './about-page';
import { TRANSLOCO_TESTING } from '../i18n/testing-langs';

describe('AboutPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
    }).compileComponents();
  });

  it('renders the translated heading', async () => {
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = TestBed.createComponent(AboutPage);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'O aplikacji',
    );
  });
});
