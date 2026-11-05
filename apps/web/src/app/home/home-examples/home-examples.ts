import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-home-examples',
  imports: [],
  templateUrl: './home-examples.html',
  styleUrl: './home-examples.less',
})
export class HomeExamplesComponent {
  readonly examples = input.required<readonly string[]>();
  readonly pick = output<string>();
}
