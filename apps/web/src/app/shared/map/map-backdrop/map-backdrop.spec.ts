import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapBackdrop } from './map-backdrop';

describe('MapBackdrop', () => {
  async function render(): Promise<ComponentFixture<MapBackdrop>> {
    await TestBed.configureTestingModule({
      imports: [MapBackdrop],
    }).compileComponents();
    const fixture = TestBed.createComponent(MapBackdrop);
    fixture.componentRef.setInput('regionPath', 'M2 2L8 2L8 8L2 8Z');
    fixture.componentRef.setInput('countyBorders', 'M3 3L7 3L7 7L3 7Z');
    fixture.componentRef.setInput('borders', 'M0 0L10 0L10 10L0 10Z');
    fixture.componentRef.setInput('viewBox', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    await fixture.whenStable();
    return fixture;
  }

  it('is aria-hidden and draws region, county and voivodeship paths', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-hidden')).toBe('true');
    const paths = host.querySelectorAll('svg path');
    expect(paths).toHaveLength(3);
    expect(paths[0]?.getAttribute('d')).toBe('M2 2L8 2L8 8L2 8Z');
    expect(paths[1]?.getAttribute('d')).toBe('M3 3L7 3L7 7L3 7Z');
    expect(paths[2]?.getAttribute('d')).toBe('M0 0L10 0L10 10L0 10Z');
  });
});
