import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CardComponent } from './card';

@Component({
  imports: [CardComponent],
  template: `<app-card>projected</app-card>`,
})
class DefaultHostComponent {}

@Component({
  imports: [CardComponent],
  template: `<app-card tone="info">projected</app-card>`,
})
class InfoHostComponent {}

describe('CardComponent', () => {
  it('projects its content', async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DefaultHostComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('projected');
  });

  it('sets a class for tone="info"', async () => {
    await TestBed.configureTestingModule({
      imports: [InfoHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InfoHostComponent);
    await fixture.whenStable();
    const card = fixture.nativeElement.querySelector('app-card');
    expect(card?.classList.contains('card-info')).toBe(true);
  });
});
