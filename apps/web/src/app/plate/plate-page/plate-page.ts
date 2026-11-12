import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { parsePlate } from '@plate-region/plate-domain';

import type { LoadedMap } from '../plate.types';
import { countryMapView } from '../../shared/map/map-view';
import { plateDisplayText, resultView } from '../result-view';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { LanguageService } from '../../language/language.service';
import { RESULT_MAP_LOADER, resultMapTarget } from '../result-map';
import { ResultReadingComponent } from '../result-reading/result-reading';
import { CountyMapComponent } from '../../shared/map/county-map/county-map';
import { CandidatesListComponent } from '../candidates-list/candidates-list';
import { CarIllustrationComponent } from '../car-illustration/car-illustration';
import { VoivodeshipMapDialogComponent } from '../voivodeship-map-dialog/voivodeship-map-dialog';

function isWarsawLoaded(
  loaded: LoadedMap,
): loaded is Extract<LoadedMap, { target: { kind: 'warsaw' } }> {
  return loaded.target.kind === 'warsaw';
}

function plateCodeOf(plate: string): string | undefined {
  const result = parsePlate(plate);
  return result.status === 'resolved' ? result.code : undefined;
}

@Component({
  selector: 'app-plate-page',
  imports: [
    CandidatesListComponent,
    CarIllustrationComponent,
    CountyMapComponent,
    NzButtonComponent,
    NzFlexDirective,
    PlateComponent,
    ResultReadingComponent,
    RouterLink,
    TranslocoPipe,
    // Listed for the @defer block; the bundler loads it only when deferred.
    VoivodeshipMapDialogComponent,
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

  protected readonly dialogOpen = signal(false);
  protected readonly dialogRequested = signal(false);
  protected readonly dialogSelectedId = signal<string | undefined>(undefined);

  protected readonly dialogLoaded = computed(() => {
    const loaded = this.loadedMap();
    if (loaded === undefined || loaded.target !== this.mapTarget()) {
      return undefined;
    }
    return loaded;
  });

  protected readonly dialogPlateCode = computed(() =>
    plateCodeOf(this.plate()),
  );

  protected readonly dialogTitle = computed(() => {
    const target = this.mapTarget();
    if (target === undefined) {
      return { key: 'map.dialogTitle', params: { name: '' } };
    }
    const name =
      this.language() === 'pl'
        ? target.region1.name
        : target.region1.nameEn.value;
    return { key: 'map.dialogTitle', params: { name } };
  });

  protected readonly dialogSubtitle = computed(() => ({
    key: 'map.dialogSubtitle',
    params: {},
  }));

  protected readonly dialogVoivodeshipLabel = computed(() => {
    const target = this.mapTarget();
    if (target === undefined) {
      return '';
    }
    return this.language() === 'pl'
      ? target.region1.name
      : target.region1.nameEn.value;
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

  private readonly mapDialogButton =
    viewChild<HTMLButtonElement>('mapDialogButton');

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

  protected openMapDialog(): void {
    const loaded = this.dialogLoaded();
    if (loaded === undefined) {
      return;
    }
    if (isWarsawLoaded(loaded)) {
      this.dialogSelectedId.set(loaded.target.districts[0]);
    } else {
      const filled = loaded.target.filled;
      const first = loaded.map.counties[0];
      this.dialogSelectedId.set(
        filled !== undefined
          ? `${filled.region1Letter}${filled.suffixes[0]}`
          : first !== undefined
            ? `${loaded.target.region1.letters[0]}${first.firstSuffix}`
            : undefined,
      );
    }
    this.dialogRequested.set(true);
    this.dialogOpen.set(true);
  }

  protected onDialogAreaSelect(id: string): void {
    this.dialogSelectedId.set(id);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
    this.mapDialogButton()?.focus();
  }
}
