import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import type { LoadedMap } from '../plate.types';
import { plateDisplayText, resultView } from '../result-view';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { LanguageService } from '../../language/language.service';
import { RESULT_MAP_LOADER, resultMapTarget } from '../result-map';
import { ResultReadingComponent } from '../result-reading/result-reading';
import { CountyMapComponent } from '../../shared/map/county-map/county-map';
import { CandidatesListComponent } from '../candidates-list/candidates-list';
import { CarIllustrationComponent } from '../car-illustration/car-illustration';
import {
  countryMapView,
  voivodeshipMapView,
  warsawMapView,
} from '../../shared/map/map-view';

function isWarsawLoaded(
  loaded: LoadedMap,
): loaded is Extract<LoadedMap, { target: { kind: 'warsaw' } }> {
  return loaded.target.kind === 'warsaw';
}

@Component({
  selector: 'app-plate-page',
  imports: [
    CandidatesListComponent,
    CarIllustrationComponent,
    CountyMapComponent,
    NzFlexDirective,
    PlateComponent,
    ResultReadingComponent,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './plate-page.html',
  styleUrl: './plate-page.less',
})
export class PlatePage {
  private readonly languageService = inject(LanguageService);
  private readonly loadMap = inject(RESULT_MAP_LOADER);

  readonly plate = input.required<string>();

  protected readonly language = this.languageService.language;

  protected readonly view = computed(() =>
    resultView(this.plate(), this.language()),
  );

  protected readonly plateText = computed(() => plateDisplayText(this.plate()));

  protected readonly mapTarget = computed(() => resultMapTarget(this.plate()));

  protected readonly mapView = computed(() => {
    const loaded = this.loadedMap();
    if (loaded === undefined || loaded.target !== this.mapTarget()) {
      return undefined;
    }
    if (isWarsawLoaded(loaded)) {
      return warsawMapView(
        loaded.map,
        loaded.target.region1,
        loaded.target.districts,
        this.language(),
      );
    }
    return voivodeshipMapView(
      loaded.map,
      loaded.target.region1,
      loaded.target.filled,
      this.language(),
    );
  });

  protected readonly countryView = computed(() => {
    const loaded = this.loadedMap();
    if (loaded === undefined || loaded.target !== this.mapTarget()) {
      return undefined;
    }
    return countryMapView(
      loaded.country,
      loaded.target.region1,
      loaded.target.filled,
      this.language(),
    );
  });

  private readonly loadedMap = signal<LoadedMap | undefined>(undefined);

  constructor() {
    // Not resource(): its runtime joined a shared @angular/core chunk and grew the initial bundle (D-61).
    effect((onCleanup) => {
      const target = this.mapTarget();
      if (target === undefined) {
        return;
      }
      let current = true;
      onCleanup(() => {
        current = false;
      });
      this.loadMap(target).then(
        (loaded) => {
          if (current) {
            this.loadedMap.set(loaded);
          }
        },
        () => undefined,
      );
    });
  }
}
