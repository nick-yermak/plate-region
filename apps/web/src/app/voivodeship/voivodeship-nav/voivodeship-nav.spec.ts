import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { VoivodeshipNav } from './voivodeship-nav';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';

describe('VoivodeshipNav', () => {
  it('marks the current voivodeship link with aria-current=page', async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoivodeshipNav,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [
        provideRouter([
          { path: 'voivodeship/:slug', component: VoivodeshipNav },
        ]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipNav);
    fixture.componentRef.setInput('links', [
      { slug: 'dolnoslaskie', name: 'Lower Silesian' },
      { slug: 'mazowieckie', name: 'Masovian' },
    ]);
    await fixture.whenStable();

    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBeTruthy();
    expect(nav.querySelectorAll('a')).toHaveLength(2);
  });
});
