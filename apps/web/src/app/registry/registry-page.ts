import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-registry-page',
  imports: [TranslocoPipe],
  template: `<h1>{{ 'registry.title' | transloco }}</h1>`,
})
export class RegistryPage {}
