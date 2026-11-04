import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { candidatesFor } from '@plate-region/plate-domain';

import type { CandidatesView } from '../home.types';
import { county, voivodeship } from '../home.testing';
import type { Language } from '../../i18n/language.types';
import { CandidatesListComponent } from './candidates-list';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

function candidatesView(input: string): CandidatesView {
  const result = candidatesFor(input);
  if (result.status !== 'candidates') {
    throw new Error(`expected candidates for ${input}, got ${result.status}`);
  }
  return result;
}

describe('CandidatesListComponent', () => {
  async function render(
    input: string,
    language: Language = 'en',
  ): Promise<ComponentFixture<CandidatesListComponent>> {
    await TestBed.configureTestingModule({
      imports: [
        CandidatesListComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();
    TestBed.inject(TranslocoService).setActiveLang(language);
    const fixture = TestBed.createComponent(CandidatesListComponent);
    fixture.componentRef.setInput('result', candidatesView(input));
    fixture.componentRef.setInput('language', language);
    await fixture.whenStable();
    return fixture;
  }

  it('counts only counties in the heading', async () => {
    const fixture = await render('DW');
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe(
      testingText('en', 'home.candidates.heading.other', { count: 3 }),
    );
  });

  it('lists code, name and kind per county', async () => {
    const fixture = await render('DW');
    const cityKind = testingText('en', 'home.candidates.kind.city');
    const landKind = testingText('en', 'home.candidates.kind.land');
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>,
    );
    const city = items.find((li) =>
      li.textContent?.includes(county('DW').name),
    );
    expect(city?.textContent).toContain('DW');
    expect(city?.textContent).toContain(cityKind);
    const landEntry = candidatesView('DW').candidates.find(
      (candidate) =>
        candidate.kind === 'region2' &&
        candidate.region2.name === county('DWR').name,
    );
    if (landEntry === undefined || landEntry.kind !== 'region2') {
      throw new Error('expected DWR county candidate');
    }
    const land = items.find((li) =>
      li.textContent?.includes(county('DWR').name),
    );
    expect(land?.textContent).toContain(landEntry.codes.join(', '));
    expect(land?.textContent).toContain(landKind);
  });

  it('shows at most 10 counties and a more line', async () => {
    const fixture = await render('O');
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(10);
    expect(
      fixture.nativeElement
        .querySelector('.candidates-more')
        ?.textContent?.trim(),
    ).toBe(testingText('en', 'home.candidates.more.other', { count: 2 }));
  });

  it('shows no more line for 10 or fewer', async () => {
    const fixture = await render('DW');
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('.candidates-more')).toBeNull();
  });

  it('shows the without-county line and no counted heading when there are no counties', async () => {
    const fixture = await render('DA');
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'home.candidates.withoutRegion2'),
    );
  });

  it('shows the not-in-registry line', async () => {
    const fixture = await render('DAB');
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'home.candidates.notInRegistry'),
    );
  });

  it('uses Polish plural forms', async () => {
    const fixture = await render('O', 'pl');
    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      testingText('pl', 'home.candidates.heading.many', { count: 12 }),
    );
    expect(fixture.nativeElement.textContent).toContain(
      testingText('pl', 'home.candidates.more.few', { count: 2 }),
    );
  });

  it('names the voivodeship in the active language', async () => {
    const en = await render('DW', 'en');
    expect(en.nativeElement.textContent).toContain(
      testingText('en', 'home.candidates.voivodeship', {
        name: voivodeship('D').nameEn.value,
      }),
    );
    TestBed.resetTestingModule();
    const pl = await render('DW', 'pl');
    expect(pl.nativeElement.textContent).toContain(
      testingText('pl', 'home.candidates.voivodeship', {
        name: voivodeship('D').name,
      }),
    );
  });
});
