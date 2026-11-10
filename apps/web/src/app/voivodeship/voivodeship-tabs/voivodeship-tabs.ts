import { RouterLink } from '@angular/router';
import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NzTabComponent,
  NzTabLinkDirective,
  NzTabLinkTemplateDirective,
  NzTabsComponent,
} from 'ng-zorro-antd/tabs';

export type VoivodeshipTabLink = {
  readonly slug: string;
  readonly label: string;
};

@Component({
  selector: 'app-voivodeship-tabs',
  imports: [
    NzTabComponent,
    NzTabLinkDirective,
    NzTabLinkTemplateDirective,
    NzTabsComponent,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './voivodeship-tabs.html',
  styleUrl: './voivodeship-tabs.less',
})
export class VoivodeshipTabs {
  readonly links = input.required<readonly VoivodeshipTabLink[]>();
  readonly currentSlug = input.required<string>();
}
