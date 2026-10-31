import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-about-page',
  imports: [TranslocoPipe],
  template: `<h1>{{ 'about.title' | transloco }}</h1>`,
})
export class AboutPage {}
