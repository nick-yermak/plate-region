import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import type { ReadingView } from '../plate.types';
import type { Language } from '../../i18n/language.types';
import { ResultReadingComponent } from './result-reading';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

const cityReading: ReadingView = {
  captionKey: undefined,
  powiat: { name: 'Wrocław', kindKey: 'plate.kind.city' },
  voivodeshipName: 'Lower Silesian',
  types: {
    labelKey: 'plate.reading.type',
    plateTypes: ['ordinary'],
  },
  districts: undefined,
  link: { slug: 'dolnoslaskie', fragment: 'DW' },
};

const voivodeshipOnlyReading: ReadingView = {
  captionKey: undefined,
  powiat: undefined,
  voivodeshipName: 'Masovian',
  types: {
    labelKey: 'plate.reading.possibleTypes',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
  },
  districts: undefined,
  link: { slug: 'mazowieckie', fragment: undefined },
};

const captionedReading: ReadingView = {
  captionKey: 'plate.reading.withCounty',
  powiat: { name: 'Ostrołęka', kindKey: 'plate.kind.city' },
  voivodeshipName: 'Masovian',
  types: {
    labelKey: 'plate.reading.type',
    plateTypes: ['vintage'],
  },
  districts: undefined,
  link: { slug: 'mazowieckie', fragment: 'WO' },
};

function dtTexts(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('dt')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

function ddTexts(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('dd')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

describe('ResultReadingComponent', () => {
  async function render(
    reading: ReadingView,
    language: Language = 'en',
  ): Promise<ComponentFixture<ResultReadingComponent>> {
    await TestBed.configureTestingModule({
      imports: [
        ResultReadingComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(TranslocoService).setActiveLang(language);
    const fixture = TestBed.createComponent(ResultReadingComponent);
    fixture.componentRef.setInput('reading', reading);
    fixture.componentRef.setInput('language', language);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the county name and kind', async () => {
    const fixture = await render(cityReading);
    expect(dtTexts(fixture.nativeElement)).toEqual([
      testingText('en', 'plate.reading.voivodeship'),
      testingText('en', 'plate.reading.county'),
      testingText('en', 'plate.reading.type'),
    ]);
    expect(ddTexts(fixture.nativeElement)[1]).toBe(
      testingText('en', 'plate.reading.countyValue', {
        name: 'Wrocław',
        kind: testingText('en', 'plate.kind.city'),
      }),
    );
  });

  it('omits the county line when there is no powiat', async () => {
    const fixture = await render(voivodeshipOnlyReading);
    expect(dtTexts(fixture.nativeElement)).toEqual([
      testingText('en', 'plate.reading.voivodeship'),
      testingText('en', 'plate.reading.possibleTypes'),
    ]);
  });

  it('omits the plate type row when types is undefined', async () => {
    const fixture = await render({
      ...cityReading,
      types: undefined,
    });
    expect(dtTexts(fixture.nativeElement)).toEqual([
      testingText('en', 'plate.reading.voivodeship'),
      testingText('en', 'plate.reading.county'),
    ]);
    expect(dtTexts(fixture.nativeElement)).not.toContain(
      testingText('en', 'plate.reading.type'),
    );
    expect(dtTexts(fixture.nativeElement)).not.toContain(
      testingText('en', 'plate.reading.possibleTypes'),
    );
  });

  it('labels a single plate type', async () => {
    const fixture = await render(cityReading);
    expect(ddTexts(fixture.nativeElement).at(-1)).toBe(
      testingText('en', 'plate.types.ordinary'),
    );
  });

  it('joins several plate types in English', async () => {
    const fixture = await render(voivodeshipOnlyReading);
    expect(ddTexts(fixture.nativeElement).at(-1)).toBe(
      'ordinary, vintage, or temporary',
    );
  });

  it('joins several plate types in Polish after a language switch', async () => {
    const fixture = await render(voivodeshipOnlyReading, 'en');
    TestBed.inject(TranslocoService).setActiveLang('pl');
    fixture.componentRef.setInput('language', 'pl');
    await fixture.whenStable();
    expect(ddTexts(fixture.nativeElement).at(-1)).toBe(
      'zwyczajna, zabytkowa lub tymczasowa',
    );
  });

  it('shows one aria-hidden icon per row', async () => {
    const fixture = await render(cityReading);
    const rows = fixture.nativeElement.querySelectorAll('dl > div');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const icon = row.querySelector('.anticon[aria-hidden="true"]');
      expect(icon).not.toBeNull();
    }
  });

  it('links with the codes button name and a fragment', async () => {
    const fixture = await render(cityReading);
    const root = fixture.nativeElement as HTMLElement;
    const link = root.querySelector<HTMLAnchorElement>('a.ant-btn');
    expect(link?.classList.contains('ant-btn')).toBe(true);
    expect(link?.getAttribute('href')).toBe('/voivodeship/dolnoslaskie#DW');
    expect(link?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      testingText('en', 'plate.reading.codesLink'),
    );
  });

  it('links without a fragment', async () => {
    const fixture = await render(voivodeshipOnlyReading);
    const root = fixture.nativeElement as HTMLElement;
    const link = root.querySelector<HTMLAnchorElement>('a.ant-btn');
    expect(link?.getAttribute('href')).toBe('/voivodeship/mazowieckie');
    expect(link?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      testingText('en', 'plate.reading.codesLink'),
    );
  });

  it('renders projected content before the codes link', async () => {
    @Component({
      imports: [ResultReadingComponent],
      template: `
        <app-result-reading [reading]="reading" [language]="'en'">
          <button type="button" class="projected">Map</button>
        </app-result-reading>
      `,
    })
    class HostComponent {
      readonly reading = cityReading;
    }

    await TestBed.configureTestingModule({
      imports: [
        HostComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const projected = root.querySelector('.projected');
    const link = root.querySelector('a.ant-btn');
    expect(projected).not.toBeNull();
    expect(link).not.toBeNull();
    if (!projected || !link) {
      return;
    }
    expect(
      projected.compareDocumentPosition(link) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the reading caption as an h2', async () => {
    const fixture = await render(captionedReading);
    const caption = fixture.nativeElement.querySelector('h2');
    expect(caption?.textContent?.trim()).toBe(
      testingText('en', 'plate.reading.withCounty'),
    );
  });

  it('orders dt as voivodeship, county, district, plate type for WE 12345', async () => {
    const fixture = await render({
      ...cityReading,
      powiat: { name: 'm.st. Warszawa', kindKey: 'plate.kind.city' },
      voivodeshipName: 'Masovian',
      link: { slug: 'mazowieckie', fragment: 'WE' },
      districts: ['Mokotów'],
    });
    expect(dtTexts(fixture.nativeElement)).toEqual([
      testingText('en', 'plate.reading.voivodeship'),
      testingText('en', 'plate.reading.county'),
      testingText('en', 'plate.reading.district'),
      testingText('en', 'plate.reading.type'),
    ]);
    expect(ddTexts(fixture.nativeElement)[2]).toBe('Mokotów');
  });

  it('joins several districts in English', async () => {
    const fixture = await render({
      ...cityReading,
      powiat: { name: 'm.st. Warszawa', kindKey: 'plate.kind.city' },
      voivodeshipName: 'Masovian',
      link: { slug: 'mazowieckie', fragment: 'WW' },
      districts: ['Rembertów', 'Wilanów', 'Włochy'],
    });
    expect(dtTexts(fixture.nativeElement)).toContain(
      testingText('en', 'plate.reading.possibleDistricts'),
    );
    const districtIndex = dtTexts(fixture.nativeElement).indexOf(
      testingText('en', 'plate.reading.possibleDistricts'),
    );
    expect(ddTexts(fixture.nativeElement)[districtIndex]).toBe(
      'Rembertów, Wilanów, or Włochy',
    );
  });

  it('joins several districts in Polish after a language switch', async () => {
    const fixture = await render(
      {
        ...cityReading,
        powiat: { name: 'm.st. Warszawa', kindKey: 'plate.kind.city' },
        voivodeshipName: 'mazowieckie',
        link: { slug: 'mazowieckie', fragment: 'WW' },
        districts: ['Rembertów', 'Wilanów', 'Włochy'],
      },
      'en',
    );
    TestBed.inject(TranslocoService).setActiveLang('pl');
    fixture.componentRef.setInput('language', 'pl');
    await fixture.whenStable();
    expect(dtTexts(fixture.nativeElement)).toContain(
      testingText('pl', 'plate.reading.possibleDistricts'),
    );
    const districtIndex = dtTexts(fixture.nativeElement).indexOf(
      testingText('pl', 'plate.reading.possibleDistricts'),
    );
    expect(ddTexts(fixture.nativeElement)[districtIndex]).toBe(
      'Rembertów, Wilanów lub Włochy',
    );
  });

  it('omits the district line when districts is undefined', async () => {
    const fixture = await render({
      ...cityReading,
      districts: undefined,
    });
    expect(dtTexts(fixture.nativeElement)).not.toContain(
      testingText('en', 'plate.reading.district'),
    );
    expect(dtTexts(fixture.nativeElement)).not.toContain(
      testingText('en', 'plate.reading.possibleDistricts'),
    );
  });
});
