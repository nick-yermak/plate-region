import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePage } from './home-page';
import { requireElement } from '../home.testing';
import { LanguageService } from '../../language/language.service';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

@Component({ template: '' })
class PlateStub {}

describe('HomePage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
      providers: [
        provideRouter([{ path: 'plate/:plate', component: PlateStub }]),
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
      'Rozszyfruj polską tablicę',
    );
  });

  it('does not search while typing', async () => {
    const { fixture, input } = await createPage();
    input.value = 'DW 1234Q';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

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

  it.each([
    ['GD', '/plate/GD'],
    ['2A12345', '/plate/2A12345'],
    ['H', '/plate/H'],
  ] as const)('navigates on Search for %j', async (value, url) => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, value);
    expect(TestBed.inject(Router).url).toBe(url);
  });

  it.each([
    ['', 'home.errors.empty', {}],
    ['DW 1234Q', 'home.errors.invalidCharacters', { characters: 'Q' }],
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

  it('renders Search as an outlined icon button named by home.search', async () => {
    const { fixture } = await createPage();
    const button = requireElement<HTMLButtonElement>(
      fixture.nativeElement,
      'button[type="submit"]',
    );
    expect(button.getAttribute('aria-label')).toBe(
      testingText('en', 'home.search'),
    );
    expect(button.classList.contains('ant-btn-primary')).toBe(true);
    expect(button.querySelector('span[nz-icon], span.anticon')).not.toBeNull();
    expect(button.textContent?.trim()).toBe('');
  });

  it('puts the hint after the row and before the error inside the form control', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, '');
    const content = requireElement<HTMLElement>(
      fixture.nativeElement,
      '.ant-form-item-control-input-content',
    );
    const hint = requireElement<HTMLElement>(content, '#home-plate-hint');
    const row = requireElement<HTMLElement>(content, '.search-row');
    expect(
      row.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const explain = requireElement<HTMLElement>(
      fixture.nativeElement,
      '.ant-form-item-explain',
    );
    expect(
      hint.compareDocumentPosition(explain) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
