import { Component, computed, input } from '@angular/core';

import { DOT_RADIUS_PX } from '../map-labels';
import { seatLabelSvgAttrs } from '../seat-labels';
import type { MapArea, MapView, SeatLabelVisibility } from '../map.types';

@Component({
  selector: 'app-county-map-seats',
  templateUrl: './county-map-seats.html',
  styleUrl: './county-map-seats.less',
})
export class CountyMapSeatsComponent {
  readonly view = input.required<MapView>();

  protected readonly seatOverlay = computed(() => {
    const { width, height } = this.view().viewBox;
    const showDots = this.view().capitalMarkers === undefined;
    return this.view()
      .areas.filter(
        (area) =>
          area.label.tiers.narrow !== 'none' ||
          area.label.tiers.wide !== 'none',
      )
      .map((area) => ({
        id: area.id,
        x: `${(area.label.x / width) * 100}%`,
        y: `${(area.label.y / height) * 100}%`,
        showDot: showDots,
        narrowText: seatTierText(area.label.tiers.narrow, area),
        wideText: seatTierText(area.label.tiers.wide, area),
        narrowForced: area.label.forced.narrow,
        wideForced: area.label.forced.wide,
        narrowSvg: seatLabelSvgAttrs(
          area.label.positions.narrow,
          area.label.markerExtent,
          area.label.slideDx.narrow,
        ),
        wideSvg: seatLabelSvgAttrs(
          area.label.positions.wide,
          area.label.markerExtent,
          area.label.slideDx.wide,
        ),
      }));
  });

  protected readonly labelHalo = computed(() => this.view().labelHalo);
  protected readonly dotRadius = DOT_RADIUS_PX;
}

function seatTierText(
  tier: SeatLabelVisibility,
  area: MapArea,
): string | undefined {
  if (tier === 'full') {
    return area.label.text;
  }
  if (tier === 'code') {
    return area.label.codeText;
  }
  return undefined;
}
