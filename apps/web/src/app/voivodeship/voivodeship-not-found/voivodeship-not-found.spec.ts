import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { VoivodeshipNotFound } from './voivodeship-not-found';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('VoivodeshipNotFound', () => {
  it('shows the not-found heading and a home link', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipNotFound,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipNotFound);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      testingText('en', 'voivodeship.notFound.heading'),
    );
    expect(
      fixture.nativeElement.querySelector('a[href="/"]')?.textContent?.trim(),
    ).toBe(testingText('en', 'voivodeship.notFound.backHome'));
  });
});
