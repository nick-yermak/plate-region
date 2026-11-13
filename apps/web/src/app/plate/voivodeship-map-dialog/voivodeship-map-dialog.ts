import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective,
  NzModalService,
  NzModalTitleDirective,
} from 'ng-zorro-antd/modal';

import type { LoadedMap } from '../plate.types';
import type { Language } from '../../i18n/language.types';
import type { TranslatableMessage } from '../../i18n/i18n.types';
import { CountyMapComponent } from '../../shared/map/county-map/county-map';
import {
  voivodeshipDialogMapView,
  warsawDialogMapView,
} from '../../shared/map/dialog-map-view';

@Component({
  selector: 'app-voivodeship-map-dialog',
  imports: [
    CountyMapComponent,
    NzButtonComponent,
    NzModalComponent,
    NzModalContentDirective,
    NzModalFooterDirective,
    NzModalTitleDirective,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './voivodeship-map-dialog.html',
  styleUrl: './voivodeship-map-dialog.less',
  providers: [NzModalService],
})
export class VoivodeshipMapDialogComponent {
  private readonly injector = inject(Injector);

  readonly open = input.required<boolean>();
  readonly loaded = input.required<LoadedMap>();
  readonly plateCode = input<string | undefined>(undefined);
  readonly language = input.required<Language>();
  readonly title = input.required<TranslatableMessage>();
  readonly voivodeshipLabel = input.required<string>();
  readonly selectedId = input<string | undefined>(undefined);

  readonly closed = output<void>();
  readonly areaSelect = output<string>();

  protected readonly modalPresent = signal(false);
  protected readonly modalVisible = signal(false);

  protected readonly view = computed(() => {
    const loaded = this.loaded();
    const language = this.language();
    const plateCode = this.plateCode();
    const selectedId = this.selectedId();
    if (loaded.target.kind === 'warsaw') {
      return warsawDialogMapView(
        loaded.map as Extract<LoadedMap, { target: { kind: 'warsaw' } }>['map'],
        loaded.target.region1,
        loaded.target.districts,
        plateCode,
        language,
        selectedId,
      );
    }
    return voivodeshipDialogMapView(
      loaded.map as Extract<
        LoadedMap,
        { target: { kind: 'voivodeship' } }
      >['map'],
      loaded.target.region1,
      loaded.target.filled,
      plateCode,
      language,
      loaded.country,
      selectedId,
    );
  });

  protected readonly panelArea = computed(() => {
    const id = this.selectedId();
    if (id === undefined) {
      return undefined;
    }
    return this.view().areas.find((area) => area.id === id);
  });
  private readonly modal = viewChild(NzModalComponent);

  private readonly reopenAfterClose = signal(false);

  constructor() {
    effect((onCleanup) => {
      const modal = this.modal();
      if (!modal) {
        return;
      }
      const sub = modal.afterClose.subscribe(() => this.onModalAfterClose());
      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      if (this.open()) {
        this.openModal();
      } else {
        this.requestClose();
      }
    });
  }

  protected onAreaSelect(id: string): void {
    this.areaSelect.emit(id);
  }

  protected requestClose(): void {
    if (!this.modalVisible() && !this.modalPresent()) {
      return;
    }
    this.modalVisible.set(false);
    // nzNoAnimation can skip afterClose; unmount on the next render either way.
    afterNextRender(() => this.onModalAfterClose(), {
      injector: this.injector,
    });
  }

  protected onVisibleChange(visible: boolean): void {
    this.modalVisible.set(visible);
    if (!visible) {
      afterNextRender(() => this.onModalAfterClose(), {
        injector: this.injector,
      });
    }
  }

  private openModal(): void {
    if (this.modalVisible()) {
      return;
    }
    if (this.modalPresent()) {
      this.reopenAfterClose.set(true);
      return;
    }
    this.modalPresent.set(true);
    this.modalVisible.set(true);
  }

  private onModalAfterClose(): void {
    if (!this.modalPresent()) {
      return;
    }
    this.modalPresent.set(false);
    this.modalVisible.set(false);
    this.closed.emit();
    if (this.reopenAfterClose()) {
      this.reopenAfterClose.set(false);
      afterNextRender(
        () => {
          this.modalPresent.set(true);
          this.modalVisible.set(true);
        },
        { injector: this.injector },
      );
    }
  }
}
