import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { PlatePage } from './plate-page';
import { appConfig } from '../app.config';

describe('PlatePage', () => {
  it('renders the given plate', async () => {
    await TestBed.configureTestingModule({
      imports: [PlatePage],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlatePage);
    fixture.componentRef.setInput('plate', 'wa12345');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('wa12345');
  });

  it('reads the plate from the route', async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers],
    });

    const harness = await RouterTestingHarness.create('/plate/wa12345');

    expect(harness.routeNativeElement?.textContent).toContain('wa12345');
  });
});
