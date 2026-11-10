import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-voivodeship-not-found',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './voivodeship-not-found.html',
  styleUrl: './voivodeship-not-found.less',
})
export class VoivodeshipNotFound {}
