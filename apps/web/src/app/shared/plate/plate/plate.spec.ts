import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PlateComponent } from './plate';

@Component({
  imports: [PlateComponent],
  template: `<app-plate [plate]="plate" />`,
})
class PlateHostComponent {
  readonly plate = 'wa 12345';
}

describe('PlateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlateHostComponent],
    }).compileComponents();
  });

  it('renders the given string as plain text', async () => {
    const fixture = TestBed.createComponent(PlateHostComponent);
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('wa 12345');
    expect(root.querySelector('[role="img"]')).toBeNull();
    expect(root.querySelector('[aria-label]')).toBeNull();
  });
});
