import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ThemeSwitcherComponent } from './theme/theme-switcher';

@Component({
  imports: [RouterModule, ThemeSwitcherComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
