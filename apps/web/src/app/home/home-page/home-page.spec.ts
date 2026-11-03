import { Component } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule, TranslocoService } from '@jsverse/transloco';

import { HomePage } from './home-page';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

@Component({ template: '' })
class PlateStub {}

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
      providers: [
        provideRouter([{ path: 'plate/:plate', component: PlateStub }]),
      ],
    }).compileComponents();
  });

  async function createPage(): Promise<{
    fixture: ComponentFixture<HomePage>;
    input: HTMLInputElement;
  }> {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement | null;
    if (input === null) {
      throw new Error('plate input not rendered');
    }
    return { fixture, input };
  }

  async function submit(
    fixture: ComponentFixture<HomePage>,
    input: HTMLInputElement,
    value: string,
  ): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    if (button === null) {
      throw new Error('search submit button not rendered');
    }
    button.click();
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
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(
      'Strona główna',
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
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('navigates on Search for a complete plate', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'dw-12345');
    expect(TestBed.inject(Router).url).toBe('/plate/DW%2012345');
  });

  it('lists candidates for an incomplete plate and stays on home', async () => {
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'DW');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(
      fixture.nativeElement.querySelector('app-candidates-list'),
    ).not.toBeNull();
  });

  it('announces the candidates summary', async () => {
    const announce = vi
      .spyOn(TestBed.inject(LiveAnnouncer), 'announce')
      .mockResolvedValue(undefined);
    const { fixture, input } = await createPage();
    await submit(fixture, input, 'DW');
    expect(announce).toHaveBeenCalledWith(
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
      expect(describedBy).toBeTruthy();
      const description = fixture.nativeElement.querySelector(
        `#${describedBy}`,
      ) as HTMLElement | null;
      expect(description?.textContent?.trim()).toBe(expected);
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
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });

  it('translates the error into Polish', async () => {
    TestBed.inject(TranslocoService).setActiveLang('pl');
    const { fixture, input } = await createPage();
    await submit(fixture, input, '');
    const describedBy = input.getAttribute('aria-describedby');
    const description = fixture.nativeElement.querySelector(
      `#${describedBy}`,
    ) as HTMLElement | null;
    expect(description?.textContent?.trim()).toBe(
      testingText('pl', 'home.errors.empty'),
    );
  });
});
