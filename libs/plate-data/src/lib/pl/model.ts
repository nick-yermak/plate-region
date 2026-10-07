export type Country = 'PL';

/** A name not taken from the act, so it carries no legal force (D-26). */
export interface UnofficialName {
  readonly value: string;
  readonly origin: 'unofficial';
}

/** Voivodeship (województwo). */
export interface Region1 {
  readonly country: Country;
  /** Lp. in Annex 13. */
  readonly ordinal: number;
  /** Lowercase official form; the uppercase in Annex 13 is table typography (D-26). */
  readonly name: Lowercase<string>;
  readonly nameEn: UnofficialName;
  /** Annex 13 column 4, primary letter first. */
  readonly letters:
    | readonly [primary: string]
    | readonly [primary: string, secondary: string];
  /** Annex 13 column 6, used by individual and temporary plates (§ 30 ust. 2 pkt 4 and 6). */
  readonly letterDigitCodes: readonly string[];
}

/** Powiat or city with powiat rights. */
export interface Region2 {
  readonly country: Country;
  /** Primary letter of the owning Region1; names repeat across voivodeships, so a name is not a key. */
  readonly region1Letter: string;
  readonly name: string;
  /**
   * `city` = miasto na prawach powiatu, `land` = powiat ziemski. Not `powiat`: a city with powiat
   * rights is a powiat too. Explicit because capitalisation is not a reliable signal (`m.st. Warszawa`).
   */
  readonly kind: 'city' | 'land';
  /** Annex 13 column 5, in Annex 13 order; the first suffix forms the stable identifier (D-07). */
  readonly suffixes: readonly [first: string, ...rest: string[]];
}

export interface Source {
  readonly act: string;
  readonly provision: string;
}

export interface Provenance {
  /** ISO `YYYY-MM-DD`; format and date validity are checked by the registry validator. */
  readonly legalStateDate: string;
  /** Base act first, then amendments in the order they apply (D-26). */
  readonly sources: readonly [base: Source, ...amendments: Source[]];
}

export interface Registry {
  readonly provenance: Provenance;
  readonly region1: readonly Region1[];
  readonly region2: readonly Region2[];
}
