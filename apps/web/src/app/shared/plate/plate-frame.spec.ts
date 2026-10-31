import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlateFrameComponent } from './plate-frame';

@Component({
  imports: [PlateFrameComponent],
  template: `<app-plate-frame>WA 12345</app-plate-frame>`,
})
class PlateFrameHostComponent {}

function queryEuBand(fixture: ComponentFixture<unknown>): SVGSVGElement {
  const root: HTMLElement = fixture.nativeElement;
  const svg: SVGSVGElement | null = root.querySelector(
    'svg[aria-hidden="true"]',
  );
  if (svg === null) {
    throw new Error('EU band not rendered');
  }
  return svg;
}

describe('PlateFrameComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlateFrameHostComponent],
    }).compileComponents();
  });

  it('projects its content', async () => {
    const fixture = TestBed.createComponent(PlateFrameHostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('WA 12345');
  });

  it('draws the EU band hidden from assistive tech', async () => {
    const fixture = TestBed.createComponent(PlateFrameHostComponent);
    await fixture.whenStable();

    expect(queryEuBand(fixture).querySelectorAll('polygon').length).toBe(12);
  });
});
