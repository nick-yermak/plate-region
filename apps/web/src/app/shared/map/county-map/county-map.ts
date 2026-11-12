import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
} from '@angular/core';

import type { MapArea, MapView } from '../map.types';

@Component({
  selector: 'app-county-map',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './county-map.html',
  styleUrl: './county-map.less',
  host: {
    '[style.width]': 'hostWidth()',
    '[style.aspect-ratio]': 'aspectRatio()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(document:keydown.escape)': 'closeTooltip()',
  },
})
export class CountyMapComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly view = input.required<MapView>();

  protected readonly selectedId = linkedSignal({
    source: this.view,
    computation: (): string | undefined => undefined,
  });

  protected readonly hoveredId = linkedSignal({
    source: this.view,
    computation: (): string | undefined => undefined,
  });

  protected readonly selectedArea = computed((): MapArea | undefined => {
    const id = this.selectedId();
    if (id === undefined) {
      return undefined;
    }
    return this.view().areas.find((area) => area.id === id);
  });

  protected readonly hoveredArea = computed((): MapArea | undefined => {
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

  protected toggleSelection(id: string, event: Event): void {
    event.stopPropagation();
    this.selectedId.update((current) => (current === id ? undefined : id));
  }

  protected setHovered(id: string | undefined): void {
    this.hoveredId.set(id);
  }

  protected onDocumentPointerDown(event: Event): void {
    const target = event.target;
    if (
      !(target instanceof Node) ||
      !this.host.nativeElement.contains(target)
    ) {
      this.closeTooltip();
    }
  }

  protected closeTooltip(): void {
    this.selectedId.set(undefined);
  }

  protected onSvgClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeTooltip();
    }
  }
}
