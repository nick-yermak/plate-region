import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-voivodeship-page',
  imports: [TranslocoPipe],
  template: `<h1>{{ 'voivodeship.title' | transloco }}</h1>`,
})
export class VoivodeshipPage {}
