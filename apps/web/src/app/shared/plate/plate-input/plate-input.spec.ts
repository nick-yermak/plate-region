import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlateInputComponent } from './plate-input';

@Component({
  imports: [PlateInputComponent],
  template: `<app-plate-input
    [(value)]="value"
    label="Licence plate number"
  />`,
})
class PlateInputHostComponent {
  readonly value = signal('');
}

@Component({
  imports: [FormField, PlateInputComponent],
  template: `<app-plate-input
    [formField]="plateForm.plate"
    label="Licence plate number"
  />`,
})
class PlateInputFormHostComponent {
  readonly model = signal({ plate: '' });
  readonly plateForm = form(this.model);
}

function queryInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
  const root: HTMLElement = fixture.nativeElement;
  const input: HTMLInputElement | null = root.querySelector('input');
  if (input === null) {
    throw new Error('plate input not rendered');
  }
  return input;
}

describe('PlateInputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlateInputHostComponent, PlateInputFormHostComponent],
    }).compileComponents();
  });

  it('names the field and sets the typing attributes', async () => {
    const fixture = TestBed.createComponent(PlateInputHostComponent);
    await fixture.whenStable();

    const input = queryInput(fixture);
    expect(input.getAttribute('aria-label')).toBe('Licence plate number');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('autocapitalize')).toBe('characters');
    expect(input.getAttribute('spellcheck')).toBe('false');
    expect(input.getAttribute('enterkeyhint')).toBe('search');
    expect(input.hasAttribute('maxlength')).toBe(false);
  });

  it('reports typed text through the value model', async () => {
    const fixture = TestBed.createComponent(PlateInputHostComponent);
    await fixture.whenStable();

    const input = queryInput(fixture);
    input.value = 'wa 12345';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe('wa 12345');
  });

  it('shows the model value in the field', async () => {
    const fixture = TestBed.createComponent(PlateInputHostComponent);
    await fixture.whenStable();

    fixture.componentInstance.value.set('KR 1');
    await fixture.whenStable();

    expect(queryInput(fixture).value).toBe('KR 1');
  });

  it('syncs both ways through a Signal Form', async () => {
    const fixture = TestBed.createComponent(PlateInputFormHostComponent);
    await fixture.whenStable();

    const input = queryInput(fixture);
    input.value = 'wa 1';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.model().plate).toBe('wa 1');

    fixture.componentInstance.model.set({ plate: 'KR 9' });
    await fixture.whenStable();

    expect(input.value).toBe('KR 9');
  });
});
