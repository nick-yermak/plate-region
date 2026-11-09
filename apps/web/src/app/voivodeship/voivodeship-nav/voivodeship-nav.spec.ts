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
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipNav);
    fixture.componentRef.setInput('links', [
      { slug: 'dolnoslaskie', name: 'Lower Silesian' },
      { slug: 'mazowieckie', name: 'Masovian' },
    ]);
    fixture.componentRef.setInput('currentSlug', 'dolnoslaskie');
    await fixture.whenStable();

    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBeTruthy();
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].getAttribute('aria-current')).toBeNull();
  });
});
