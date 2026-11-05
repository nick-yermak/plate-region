import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePage } from './home-page';
import { HOME_RANDOM } from '../home.constants';
import { county, requireElement } from '../home.testing';
import { LanguageService } from '../../language/language.service';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

@Component({ template: '' })
class PlateStub {}

function scripted(values: readonly number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index];
    if (value === undefined) {
      throw new Error('scripted random exhausted');
    }
    index += 1;
    return value;
  };
}

describe('HomePage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
      providers: [
        provideRouter([{ path: 'plate/:plate', component: PlateStub }]),
        { provide: HOME_RANDOM, useValue: scripted([0, 0, 0, 0]) },
      ],
    }).compileComponents();
    TestBed.inject(LanguageService).setLanguage('en');
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function createPage(): Promise<{
    fixture: ComponentFixture<HomePage>;
    input: HTMLInputElement;
  }> {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    return {
      fixture,
      input: requireElement<HTMLInputElement>(fixture.nativeElement, 'input'),
    };
  }

  async function submit(
    fixture: ComponentFixture<HomePage>,
    input: HTMLInputElement,
    value: string,
  ): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    requireElement<HTMLButtonElement>(
      fixture.nativeElement,
      'button[type="submit"]',
    ).click();
    await fixture.whenStable();
  }

  it('renders the plate field', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Licence plate number"]',
    );
    expect(input).not.toBeNull();
  });

  it('renders the translated heading', async () => {
    TestBed.inject(LanguageService).setLanguage('pl');
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'Skąd jest ta tablica?',
    );
  });

  it('does not search while typing', async () => {
    const { fixture, input } = await createPage();
    input.value = 'DW 1234Q';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('app-candidates-list'),
    ).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe('home-plate-hint');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('navigates on Search for a complete plate', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'dw-12345');
    expect(TestBed.inject(Router).url).toBe('/plate/DW%2012345');
  });

  it('navigates on Search for a service plate', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'HPN 12AA');
    expect(TestBed.inject(Router).url).toBe('/plate/HPN%2012AA');
  });

  it('lists candidates for an incomplete plate and stays on home', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'DW');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(
      fixture.nativeElement.querySelector('app-candidates-list'),
    ).not.toBeNull();
  });

  it('announces the answer heading', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'DW');
    const live = requireElement<HTMLElement>(
      fixture.nativeElement,
      '[aria-live="polite"]',
    );
    expect(live.textContent?.trim()).toBe(county('DW').name);
  });

  it('announces the counted heading without an answer', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'GK');
    const live = requireElement<HTMLElement>(
      fixture.nativeElement,
      '[aria-live="polite"]',
    );
    expect(live.textContent?.trim()).toBe(
      testingText('en', 'home.candidates.heading.other', { count: 3 }),
    );
  });

  it('clears the candidates when the value changes', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'DW');
    expect(
      fixture.nativeElement.querySelector('app-candidates-list'),
    ).not.toBeNull();
    input.value = 'DWW';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('app-candidates-list'),
    ).toBeNull();
  });

  it.each([
    ['', 'home.errors.empty', {}],
    ['DW 1234Q', 'home.errors.invalidCharacters', { characters: 'Q' }],
    ['2A12345', 'home.errors.noMatchingFormat', {}],
    ['H', 'home.errors.notInRegistry', {}],
  ] as const)(
    'shows the domain error under the plate for %j',
    async (value, key, params) => {
      const { fixture, input } = await createPage();
      await submit(fixture, input, value);
      const expected = testingText('en', key, params);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBe('home-plate-error home-plate-hint');
      const errorId = describedBy?.split(' ')[0];
      if (errorId === undefined) {
        throw new Error('missing error id in aria-describedby');
      }
      const description = requireElement<HTMLElement>(
        fixture.nativeElement,
        `#${errorId}`,
      );
      expect(description.textContent?.trim()).toBe(expected);
    },
  );

  it('clears the error when the value changes', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, '');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    input.value = 'D';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe('home-plate-hint');
  });

  it('translates the error into Polish', async () => {
    TestBed.inject(LanguageService).setLanguage('pl');
    const { fixture, input } = await createPage();
    await submit(fixture, input, '');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBe('home-plate-error home-plate-hint');
    const errorId = describedBy?.split(' ')[0];
    if (errorId === undefined) {
      throw new Error('missing error id in aria-describedby');
    }
    const description = requireElement<HTMLElement>(
      fixture.nativeElement,
      `#${errorId}`,
    );
    expect(description.textContent?.trim()).toBe(
      testingText('pl', 'home.errors.empty'),
    );
  });

  it('renders three examples from the random source', async () => {
    const { fixture } = await createPage();
    const buttons = fixture.nativeElement.querySelectorAll(
      'app-home-examples button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons).toHaveLength(3);
    expect([...buttons].map((button) => button.textContent?.trim())).toEqual([
      'DJ',
      'DBL',
      'DJ 00001',
    ]);
  });

  it('fills the field and submits on an example tap', async () => {
    const { fixture, input } = await createPage();
    requireElement<HTMLButtonElement>(
      fixture.nativeElement,
      'app-home-examples button',
    ).click();
    await fixture.whenStable();
    expect(input.value).toBe('DJ');
    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe(
      county('DJ').name,
    );
  });

  it('navigates on a full-plate example tap', async () => {
    const { fixture } = await createPage();
    const buttons = fixture.nativeElement.querySelectorAll(
      'app-home-examples button',
    );
    const fullPlate = buttons.item(2);
    if (fullPlate === null) {
      throw new Error('missing full-plate example button');
    }
    (fullPlate as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/plate/DJ%2000001');
  });

  it('describes the field with the hint', async () => {
    const { input } = await createPage();
    expect(input.getAttribute('aria-describedby')).toBe('home-plate-hint');
  });

  it('renders the hint text', async () => {
    const { fixture } = await createPage();
    expect(fixture.nativeElement.textContent).toContain(
      testingText('en', 'home.hint'),
    );
  });
});
