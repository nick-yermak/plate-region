import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';

import type { MapArea, MapView } from '../map.types';
import { CountyMapSeatsComponent } from '../county-map-seats/county-map-seats';

@Component({
  selector: 'app-county-map',
  imports: [CountyMapSeatsComponent, RouterLink, TranslocoPipe],
  templateUrl: './county-map.html',
  styleUrl: './county-map.less',
  host: {
    '[style.width]': 'hostWidth()',
    '[style.aspect-ratio]': 'aspectRatio()',
    '[class.faint-county-lines]': 'interaction() === "none"',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(document:keydown.escape)': 'closeTooltip()',
  },
})
export class CountyMapComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly view = input.required<MapView>();
  readonly interaction = input<'tooltip' | 'select' | 'none'>('tooltip');
  readonly selectedId = input<string | undefined>(undefined);
  readonly areaSelect = output<string>();
  readonly openDialog = output<void>();

  protected readonly tooltipSelectedId = linkedSignal({
    source: this.view,
    computation: (): string | undefined => undefined,
  });

  protected readonly hoveredId = linkedSignal({
    source: this.view,
    computation: (): string | undefined => undefined,
  });

  protected readonly selectedArea = computed((): MapArea | undefined => {
    if (this.interaction() === 'none') {
      return undefined;
    }
    if (this.interaction() === 'select') {
      const id = this.selectedId();
      if (id === undefined) {
        return undefined;
      }
      return this.view().areas.find((area) => area.id === id);
    }
    const id = this.tooltipSelectedId();
    if (id === undefined) {
      return undefined;
    }
    return this.view().areas.find((area) => area.id === id);
  });

  protected readonly hoveredArea = computed((): MapArea | undefined => {
    if (this.interaction() !== 'tooltip') {
      return undefined;
    }
    const id = this.hoveredId();
    if (id === undefined) {
      return undefined;
    }
    return this.view().areas.find((area) => area.id === id);
  });

  protected readonly filledAreas = computed(() =>
    this.view().areas.filter((area) => area.filled),
  );

  protected readonly overlayLabels = computed(() => {
    const { width, height } = this.view().viewBox;
    return this.view()
      .areas.filter((area) => area.label.visible)
      .map((area) => ({
        id: area.id,
        text: area.label.text,
        x: `${(area.label.x / width) * 100}%`,
        y: `${(area.label.y / height) * 100}%`,
        filled: area.filled,
        wideOnly: area.label.wideOnly,
        aboveMarker: area.label.aboveMarker,
      }));
  });

  protected readonly markerPosition = computed(() => {
    const marker = this.view().marker;
    if (marker === undefined) {
      return undefined;
    }
    const { width, height } = this.view().viewBox;
    return {
      cx: `${(marker.x / width) * 100}%`,
      cy: `${(marker.y / height) * 100}%`,
    };
  });

  protected readonly capitalMarkerPositions = computed(() => {
    const markers = this.view().capitalMarkers;
    if (markers === undefined) {
      return [];
    }
    const { width, height } = this.view().viewBox;
    return markers.map((marker) => ({
      cx: `${(marker.x / width) * 100}%`,
      cy: `${(marker.y / height) * 100}%`,
    }));
  });

  protected readonly voivodeshipButton = computed(
    () => this.view().voivodeshipButton,
  );

  protected readonly hostWidth = computed(() => {
    const { width, height } = this.view().viewBox;
    return `${Math.min(100, (100 * width) / height)}%`;
  });

  protected readonly aspectRatio = computed(() => {
    const { width, height } = this.view().viewBox;
    return `${width} / ${height}`;
  });

  protected readonly tooltipStyle = computed(() => {
    const area = this.selectedArea();
    if (area === undefined) {
      return {};
    }
    const { width, height } = this.view().viewBox;
    return {
      '--x': `${(area.anchor.x / width) * 100}%`,
      '--y': `${(area.anchor.y / height) * 100}%`,
    };
  });

  protected readonly tooltipAbove = computed(() => {
    const area = this.selectedArea();
    if (area === undefined) {
      return false;
    }
    return area.anchor.y > this.view().viewBox.height / 2;
  });

  protected readonly showTooltip = computed(
    () => this.interaction() === 'tooltip' && this.selectedArea() !== undefined,
  );

  protected toggleSelection(id: string, event: Event): void {
    event.stopPropagation();
    if (this.interaction() === 'none') {
      return;
    }
    if (this.interaction() === 'select') {
      this.areaSelect.emit(id);
      return;
    }
    this.tooltipSelectedId.update((current) =>
      current === id ? undefined : id,
    );
  }

  protected setHovered(id: string | undefined): void {
    if (this.interaction() !== 'tooltip') {
      return;
    }
    this.hoveredId.set(id);
  }

  protected onDocumentPointerDown(event: Event): void {
    if (this.interaction() !== 'tooltip') {
      return;
    }
    const target = event.target;
    if (
      !(target instanceof Node) ||
      !this.host.nativeElement.contains(target)
    ) {
      this.closeTooltip();
    }
  }

  protected closeTooltip(): void {
    if (this.interaction() !== 'tooltip') {
      return;
    }
    this.tooltipSelectedId.set(undefined);
  }

  protected onSvgClick(event: MouseEvent): void {
    if (this.interaction() !== 'tooltip') {
      return;
    }
    if (event.target === event.currentTarget) {
      this.closeTooltip();
    }
  }

  protected onVoivodeshipActivate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.openDialog.emit();
  }
}
