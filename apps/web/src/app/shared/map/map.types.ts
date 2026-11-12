import type { MapViewBox } from '@plate-region/plate-data';

import type { TranslatableMessage } from '../../i18n/i18n.types';

export interface MapLink {
  readonly slug: string;
  readonly fragment: string;
}

export interface MapAreaLabel {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly visible: boolean;
  readonly wideOnly: boolean;
  readonly aboveMarker: boolean;
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
  readonly outline: string;
  readonly neighbours: readonly string[];
  readonly areas: readonly MapArea[];
  readonly borders?: string;
  readonly labelHalo: boolean;
  readonly marker?: { readonly x: number; readonly y: number };
  readonly ariaLabel: TranslatableMessage;
}
