import { TranslocoTestingModule } from '@jsverse/transloco';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { requireElement } from '../home.testing';
import { HomeExamplesComponent } from './home-examples';
import { testingText, TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('HomeExamplesComponent', () => {
  async function render(
    examples: readonly string[],
  ): Promise<ComponentFixture<HomeExamplesComponent>> {
    await TestBed.configureTestingModule({
      imports: [
        HomeExamplesComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomeExamplesComponent);
    fixture.componentRef.setInput('examples', examples);
    await fixture.whenStable();
    return fixture;
  }

  it('renders one button per example', async () => {
    const fixture = await render(['DJ', 'DBL', 'DJ 00001']);
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(3);
  });

  it('emits the example on click', async () => {
    const fixture = await render(['DJ', 'DBL', 'DJ 00001']);
    const picked: string[] = [];
    fixture.componentInstance.pick.subscribe((value) => picked.push(value));
    requireElement<HTMLButtonElement>(fixture.nativeElement, 'button').click();
    await fixture.whenStable();
    expect(picked).toEqual(['DJ']);
  });

  it('labels the examples group', async () => {
    const fixture = await render(['DJ', 'DBL', 'DJ 00001']);
    const group = requireElement<HTMLElement>(
      fixture.nativeElement,
      '[role="group"]',
    );
    expect(group.getAttribute('aria-label')).toBe(
      testingText('en', 'home.examples.label'),
    );
  });
});
