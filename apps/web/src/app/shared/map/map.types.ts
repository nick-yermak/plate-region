import type { MapViewBox } from '@plate-region/plate-data';

import type { TranslatableMessage } from '../../i18n/i18n.types';

export interface MapLink {
  readonly slug: string;
  readonly fragment: string;
}

export type SeatLabelVisibility = 'full' | 'code' | 'none';

export type SeatLabelPosition = 'above' | 'below' | 'right' | 'left';

export interface MapAreaLabel {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  /** Short code-only text when the tier falls back from the full seat label. */
  readonly codeText: string;
  readonly visible: boolean;
  readonly wideOnly: boolean;
  readonly aboveMarker: boolean;
  readonly tiers: {
    readonly narrow: SeatLabelVisibility;
    readonly wide: SeatLabelVisibility;
  };
  readonly positions: {
    readonly narrow: SeatLabelPosition;
    readonly wide: SeatLabelPosition;
  };
  /** Selected code that was forced over another area's tip at that tier. */
  readonly forced: {
    readonly narrow: boolean;
    readonly wide: boolean;
  };
}

export interface MapArea {
  /** First code of a county; district name on the Warsaw map. */
  readonly id: string;
  readonly path: string;
  readonly filled: boolean;
  readonly tinted: boolean;
  /** Label point and tooltip anchor. */
  readonly anchor: { readonly x: number; readonly y: number };
  readonly label: MapAreaLabel;
  readonly heading: TranslatableMessage;
  readonly codes: readonly [string, ...string[]];
  readonly link: MapLink;
}

export interface MapView {
  readonly viewBox: MapViewBox;
  /** Voivodeship / Warsaw outer path; omitted on the map of Poland. */
  readonly outline?: string;
  readonly neighbours: readonly string[];
  readonly areas: readonly MapArea[];
  /** Voivodeship borders (country: all 16 outlines as one path). */
  readonly borders?: string;
  readonly labelHalo: boolean;
  /** Seat/district dots for the dialog map. */
  readonly dots: boolean;
  readonly marker?: { readonly x: number; readonly y: number };
  readonly ariaLabel: TranslatableMessage;
}
