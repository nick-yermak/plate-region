import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NxWelcome } from './nx-welcome';
import { ThemeSwitcherComponent } from './theme/theme-switcher';

@Component({
  imports: [NxWelcome, RouterModule, ThemeSwitcherComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App {
  protected title = 'web';
}
