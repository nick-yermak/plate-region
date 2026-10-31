import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-charts-page',
  imports: [TranslocoPipe],
  template: `<h1>{{ 'charts.title' | transloco }}</h1>`,
})
export class ChartsPage {}
