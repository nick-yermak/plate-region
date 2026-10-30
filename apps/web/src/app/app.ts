import { Component } from '@angular/core';

import { ShellComponent } from './layout/shell';

@Component({
  imports: [ShellComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
