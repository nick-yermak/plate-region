import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { VoivodeshipTabs } from './voivodeship-tabs';

describe('VoivodeshipTabs', () => {
  it('marks the current link with aria-current="page"', async () => {
    await TestBed.configureTestingModule({
      imports: [VoivodeshipTabs],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(VoivodeshipTabs);
    fixture.componentRef.setInput('links', [
      { slug: 'dolnoslaskie', label: 'Lower Silesian' },
      { slug: 'lubuskie', label: 'Lubusz' },
    ]);
    fixture.componentRef.setInput('currentSlug', 'lubuskie');
    await fixture.whenStable();

    const links = fixture.nativeElement.querySelectorAll(
      'a[nz-tab-link]',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(links[1].textContent?.trim()).toBe('Lubusz');
  });
});
