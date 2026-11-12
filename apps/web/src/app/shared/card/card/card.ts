import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.less',
  host: {
    '[class.card-info]': 'tone() === "info"',
  },
})
export class CardComponent {
  readonly tone = input<'default' | 'info'>('default');
}
