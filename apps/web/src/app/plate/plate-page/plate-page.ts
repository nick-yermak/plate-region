import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { parsePlate } from '@plate-region/plate-domain';

import type { LoadedMap } from '../plate.types';
import { countryMapView } from '../../shared/map/map-view';
import { CardComponent } from '../../shared/card/card/card';
import { plateDisplayText, resultView } from '../result-view';
import { voivodeshipCardView } from '../voivodeship-card-view';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { LanguageService } from '../../language/language.service';
import { RESULT_MAP_LOADER, resultMapTarget } from '../result-map';
import { ResultReadingComponent } from '../result-reading/result-reading';
import { CountyMapComponent } from '../../shared/map/county-map/county-map';
import { CandidatesListComponent } from '../candidates-list/candidates-list';
import { CarIllustrationComponent } from '../car-illustration/car-illustration';
import { VoivodeshipCardComponent } from '../voivodeship-card/voivodeship-card';
import { MapDialogOpenButtonComponent } from '../map-dialog-open-button/map-dialog-open-button';
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
    CardComponent,
    CountyMapComponent,
    MapDialogOpenButtonComponent,
    PlateComponent,
    ResultReadingComponent,
    RouterLink,
    TranslocoPipe,
    VoivodeshipCardComponent,
    // Listed for the @defer block; the bundler loads it only when deferred.
    VoivodeshipMapDialogComponent,
  ],
  templateUrl: './plate-page.html',
  styleUrl: './plate-page.less',
})
export class PlatePage {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly languageService = inject(LanguageService);
  private readonly loadMap = inject(RESULT_MAP_LOADER);

  readonly plate = input.required<string>();

  protected readonly language = this.languageService.language;

  protected readonly view = computed(() =>
    resultView(this.plate(), this.language()),
  );

  protected readonly plateText = computed(() => plateDisplayText(this.plate()));

  protected readonly mapTarget = computed(() => resultMapTarget(this.plate()));

  protected readonly voivodeshipCard = computed(() => {
    const target = this.mapTarget();
    if (target === undefined) {
      return undefined;
    }
    const page = this.view();
    let code: string | undefined;
    if (page.kind === 'readings') {
      code = page.readings[0]?.link.fragment;
    } else if (page.kind === 'candidates') {
      code = page.link?.fragment;
    }
    return voivodeshipCardView(
      target.region1,
      target.filled,
      code,
      this.language(),
    );
  });

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
      this.dialogPlateCode(),
    );
  });

  private readonly mapDialogButton = viewChild('mapDialogButton', {
    read: ElementRef,
  });

  private readonly mapDialogOpener = signal<'card' | 'map'>('card');

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

  protected openMapDialog(opener: 'card' | 'map' = 'card'): void {
    const loaded = this.dialogLoaded();
    if (loaded === undefined) {
      return;
    }
    this.mapDialogOpener.set(opener);
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
    if (this.mapDialogOpener() === 'map') {
      const path = (this.host.nativeElement as HTMLElement).querySelector(
        '.country-map-box svg.voivodeship-button path[role="button"]',
      ) as HTMLElement | null;
      path?.focus();
      return;
    }
    const host = this.mapDialogButton()?.nativeElement as
      | HTMLElement
      | undefined;
    host?.querySelector('button')?.focus();
  }
}
