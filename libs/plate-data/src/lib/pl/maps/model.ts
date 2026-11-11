/** A label anchor and the radius of the largest circle inside the shape around it, in view box units. */
export interface MapLabel {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/** View box `0 0 width height`. */
export interface MapViewBox {
  readonly width: number;
  readonly height: number;
}

/** One county of a voivodeship map. */
export interface CountyMapCounty {
  /** Registry identity (D-07): the region1 primary letter and the first suffix. */
  readonly region1Letter: string;
  readonly firstSuffix: string;
  /** PRG `JPT_KOD_JE`, four digits. */
  readonly teryt: string;
  /** SVG path data in view box units. */
  readonly path: string;
  readonly label: MapLabel;
}

/** Map of one voivodeship with its counties. */
export interface CountyMap {
  readonly viewBox: MapViewBox;
  /** Outline of the voivodeship. */
  readonly outline: string;
  /** In registry order. */
  readonly counties: readonly CountyMapCounty[];
  /** Neighbouring voivodeships clipped to the view box, in TERYT order. */
  readonly neighbours: readonly string[];
}

/** One district of the Warsaw map. */
export interface WarsawDistrictMapDistrict {
  /** PRG name without " - dzielnica"; equals a district name of D-57. */
  readonly name: string;
  /** PRG `JPT_KOD_JE`, for example `146502_8`. */
  readonly teryt: string;
  readonly path: string;
  readonly label: MapLabel;
}

/** Map of Warsaw with its districts. */
export interface WarsawDistrictMap {
  readonly viewBox: MapViewBox;
  readonly outline: string;
  /** In TERYT order. */
  readonly districts: readonly WarsawDistrictMapDistrict[];
  /** Surrounding counties clipped to the view box, in TERYT order. */
  readonly neighbours: readonly string[];
}

/** Source archive of the map geometry. */
export interface CountyMapProvenance {
  readonly title: string;
  readonly url: string;
  /** ISO `YYYY-MM-DD`. */
  readonly downloaded: string;
  readonly sha256: string;
}
