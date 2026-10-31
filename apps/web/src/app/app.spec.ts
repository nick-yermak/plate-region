import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { App } from './app';
import { appRoutes } from './app.routes';
import { TRANSLOCO_TESTING } from './i18n/testing-langs';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, TranslocoTestingModule.forRoot(TRANSLOCO_TESTING)],
      providers: [provideRouter(appRoutes)],
    }).compileComponents();
  });

  it('renders the shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-shell')).not.toBeNull();
  });
});
