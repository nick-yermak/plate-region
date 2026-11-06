import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { candidatesView } from '../candidates-view';
import type { CandidatesView } from '../plate.types';
import type { Language } from '../../i18n/language.types';
import { CandidatesListComponent } from './candidates-list';
import { compactOf, county, found, voivodeship } from '../plate.testing';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

function view(input: string): CandidatesView {
  return candidatesView(found(input), compactOf(input));
}

describe('CandidatesListComponent', () => {
  async function render(
    input: string,
    language: Language = 'en',
    link?: { slug: string; fragment: string | undefined },
  ): Promise<ComponentFixture<CandidatesListComponent>> {
    await TestBed.configureTestingModule({
      imports: [
        CandidatesListComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();
    TestBed.inject(TranslocoService).setActiveLang(language);
    const fixture = TestBed.createComponent(CandidatesListComponent);
    fixture.componentRef.setInput('result', view(input));
    fixture.componentRef.setInput('language', language);
    if (link !== undefined) {
      fixture.componentRef.setInput('link', link);
    }
    await fixture.whenStable();
    return fixture;
  }

  it('counts only counties in the heading', async () => {
    // Załącznik 13 lines 3647–3650: kartuski KA,KY,KZ; kościerski KS; kwidzyński KW.
    const fixture = await render('GK');
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe(
      testingText('en', 'plate.candidates.heading.other', { count: 3 }),
    );
  });

  it('lists code, name and kind per county', async () => {
    const fixture = await render('GK');
    const landKind = testingText('en', 'plate.kind.land');
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>,
    );
    const kartuski = items.find((li) =>
      li.textContent?.includes(county('GKA').name),
    );
    expect(kartuski?.textContent).toContain('GKA, GKY, GKZ');
    expect(kartuski?.textContent).toContain(landKind);
    // Załącznik 13 line 3649: kościerski G, X KS.
    const koscierski = items.find((li) =>
      li.textContent?.includes(county('GKS').name),
    );
    expect(koscierski?.textContent).toContain('GKS');
    expect(koscierski?.textContent).toContain(landKind);
  });

  it('lists every county without a more line', async () => {
    const fixture = await render('O');
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(12);
    expect(fixture.nativeElement.querySelector('.candidates-more')).toBeNull();
  });

  it('shows the without-county line and no counted heading when there are no counties', async () => {
    const fixture = await render('DA');
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'plate.candidates.withoutRegion2'),
    );
  });

  it('shows the not-in-registry line', async () => {
    const fixture = await render('DAB');
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'plate.candidates.notInRegistry'),
    );
  });

  it('uses Polish plural forms', async () => {
    const fixture = await render('O', 'pl');
    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      testingText('pl', 'plate.candidates.heading.many', { count: 12 }),
    );
  });

  it('names the voivodeship in the active language', async () => {
    const en = await render('DW', 'en', {
      slug: 'dolnoslaskie',
      fragment: 'DW',
    });
    expect(en.nativeElement.textContent).toContain(
      testingText('en', 'plate.candidates.voivodeship', {
        name: voivodeship('D').nameEn.value,
      }),
    );
    TestBed.resetTestingModule();
    const pl = await render('DW', 'pl', {
      slug: 'dolnoslaskie',
      fragment: 'DW',
    });
    expect(pl.nativeElement.textContent).toContain(
      testingText('pl', 'plate.candidates.voivodeship', {
        name: voivodeship('D').name,
      }),
    );
  });

  it('lists the other counties under Other possible counties', async () => {
    const fixture = await render('GD', 'en', {
      slug: 'pomorskie',
      fragment: 'GD',
    });
    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('h2') as NodeListOf<HTMLElement>,
    ).map((heading) => heading.textContent?.trim());
    expect(headings).toEqual([testingText('en', 'plate.candidates.others')]);
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('li')?.textContent).toContain(
      'GDA',
    );
  });

  it('shows no Other possible counties heading for a sole county', async () => {
    const fixture = await render('VX', 'en', {
      slug: 'dolnoslaskie',
      fragment: 'DW',
    });
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'plate.candidates.withoutRegion2'),
    );
  });

  it('links the answer county to its voivodeship anchor', async () => {
    const fixture = await render('GD', 'en', {
      slug: 'pomorskie',
      fragment: 'GD',
    });
    const link = fixture.nativeElement.querySelector(
      'a[href="/voivodeship/pomorskie#GD"]',
    );
    expect(link).not.toBeNull();
    expect(link?.textContent?.trim()).toBe(
      testingText('en', 'plate.reading.countyLink', {
        name: county('GD').name,
      }),
    );
  });

  it('shows no voivodeship line without an answer', async () => {
    const fixture = await render('GK');
    expect(fixture.nativeElement.textContent).not.toContain(
      testingText('en', 'plate.candidates.voivodeship', {
        name: voivodeship('G').nameEn.value,
      }),
    );
  });
});
