import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormField, FormRoot, form } from '@angular/forms/signals';

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

@Component({
  imports: [PlateInputComponent],
  template: `<app-plate-input
    [(value)]="value"
    label="Licence plate number"
    [invalid]="invalid()"
    [describedBy]="describedBy()"
  />`,
})
class PlateInputA11yHostComponent {
  readonly value = signal('');
  readonly invalid = signal(false);
  readonly describedBy = signal<string | undefined>(undefined);
}

@Component({
  imports: [FormField, FormRoot, PlateInputComponent],
  template: `
    <form [formRoot]="plateForm">
      <app-plate-input [formField]="plateForm" label="Licence plate number" />
      <button type="submit">Go</button>
    </form>
  `,
})
class PlateInputSubmissionHostComponent {
  readonly plate = signal('');
  readonly plateForm = form(this.plate, {
    submission: {
      action: async () => ({ kind: 'empty' as const }),
    },
  });
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
      imports: [
        PlateInputHostComponent,
        PlateInputFormHostComponent,
        PlateInputA11yHostComponent,
        PlateInputSubmissionHostComponent,
      ],
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

  it('sets aria-invalid and the error class only while invalid', async () => {
    const fixture = TestBed.createComponent(PlateInputA11yHostComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector(
      'app-plate-input',
    ) as HTMLElement;
    const input = queryInput(fixture);

    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(host.classList.contains('pr-invalid')).toBe(false);

    fixture.componentInstance.invalid.set(true);
    await fixture.whenStable();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(host.classList.contains('pr-invalid')).toBe(true);

    fixture.componentInstance.invalid.set(false);
    await fixture.whenStable();

    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(host.classList.contains('pr-invalid')).toBe(false);
  });

  it('receives invalid from a Signal Form submission error', async () => {
    const fixture = TestBed.createComponent(PlateInputSubmissionHostComponent);
    await fixture.whenStable();
    const input = queryInput(fixture);
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('references its description by id only when given', async () => {
    const fixture = TestBed.createComponent(PlateInputA11yHostComponent);
    await fixture.whenStable();
    const input = queryInput(fixture);

    expect(input.getAttribute('aria-describedby')).toBeNull();

    fixture.componentInstance.describedBy.set('home-plate-error');
    await fixture.whenStable();
    expect(input.getAttribute('aria-describedby')).toBe('home-plate-error');

    fixture.componentInstance.describedBy.set(undefined);
    await fixture.whenStable();
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });
});
