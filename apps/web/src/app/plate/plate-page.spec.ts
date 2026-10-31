import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoTestingModule, TranslocoService } from '@jsverse/transloco';

import { PlatePage } from './plate-page';
import { appConfig } from '../app.config';
import { TRANSLOCO_TESTING } from '../i18n/testing-langs';

describe('PlatePage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the given plate', async () => {
    await TestBed.configureTestingModule({
      imports: [PlatePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlatePage);
    fixture.componentRef.setInput('plate', 'wa12345');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('wa12345');
  });

  it('reads the plate from the route', async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers],
    });

    const harness = await RouterTestingHarness.create('/plate/wa12345');

    expect(harness.routeNativeElement?.textContent).toContain('wa12345');
  });

  it('renders the translated heading', async () => {
    await TestBed.configureTestingModule({
      imports: [PlatePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
    }).compileComponents();
    TestBed.inject(TranslocoService).setActiveLang('pl');

    const fixture = TestBed.createComponent(PlatePage);
    fixture.componentRef.setInput('plate', 'wa12345');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'Tablica rejestracyjna',
    );
  });
});
