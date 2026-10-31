import { TestBed } from '@angular/core/testing';

import { HomePage } from './home-page';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
    }).compileComponents();
  });

  it('renders the plate field', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Licence plate number"]',
    );
    expect(input).not.toBeNull();
  });
});
