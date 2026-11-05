import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CarIllustrationComponent } from './car-illustration';

@Component({
  imports: [CarIllustrationComponent],
  template: `
    <app-car-illustration>
      <span id="projected">plate</span>
    </app-car-illustration>
  `,
})
class HostComponent {}

describe('CarIllustrationComponent', () => {
  it('marks the svg as aria-hidden', async () => {
    await TestBed.configureTestingModule({
      imports: [CarIllustrationComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(CarIllustrationComponent);
    await fixture.whenStable();

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('projects content into the plate slot', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const slot = fixture.nativeElement.querySelector('.plate-slot');
    expect(slot?.querySelector('#projected')?.textContent).toBe('plate');
  });
});
