import { TranslocoPipe } from '@jsverse/transloco';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-home-examples',
  imports: [NzButtonComponent, NzFlexDirective, TranslocoPipe],
  templateUrl: './home-examples.html',
  styleUrl: './home-examples.less',
})
export class HomeExamplesComponent {
  readonly examples = input.required<readonly string[]>();
  readonly pick = output<string>();
}
