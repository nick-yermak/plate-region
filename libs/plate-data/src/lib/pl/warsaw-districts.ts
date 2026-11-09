import type { UnofficialName } from './model';

// Unofficial mapping of m.st. Warszawa codes to districts; not from the act (D-57).

/** Provenance of one unofficial Warsaw-district source (D-57). */
export interface WarsawDistrictSource {
  readonly title: string;
  readonly url: string;
  /** ISO `YYYY-MM-DD`. */
  readonly checked: string;
}

/** District names for one Annex 13 suffix of m.st. Warszawa (D-57). */
export interface WarsawDistrictRow {
  /** Annex 13 column-5 suffix of m.st. Warszawa; applies after W and after A. */
  readonly suffix: string;
  readonly districts: readonly [UnofficialName, ...UnofficialName[]];
}

/** First-match rule that splits a shared Warsaw code by vehicle part (D-57). */
export interface WarsawDistrictRule {
  /** Full code with the primary letter only. */
  readonly code: 'WW' | 'WX' | 'WY';
  /** Anchored pattern on the five-character vehicle part. */
  readonly vehiclePart: RegExp;
  /** undefined: the series belongs to no district. */
  readonly district: UnofficialName | undefined;
}

/** Unofficial Warsaw district table: sources, suffix rows and ordered rules (D-57). */
export interface WarsawDistricts {
  readonly sources: readonly [WarsawDistrictSource, ...WarsawDistrictSource[]];
  readonly rows: readonly WarsawDistrictRow[];
  /** First match wins. */
  readonly rules: readonly WarsawDistrictRule[];
}

function unofficial(value: string): UnofficialName {
  return { value, origin: 'unofficial' };
}

/**
 * Unofficial Warsaw district data for m.st. Warszawa plate codes (D-57).
 * Kept apart from the Annex 13 registry.
 */
export const warsawDistricts: WarsawDistricts = {
  sources: [
    {
      title:
        'Tablice rejestracyjne w Polsce — Tablice rejestracyjne Warszawy (Wikipedia, revision 80939616; cites wptr.pl, accessed 2016-03-09)',
      url: 'https://pl.wikipedia.org/w/index.php?title=Tablice_rejestracyjne_w_Polsce&oldid=80939616',
      checked: '2026-11-09',
    },
    {
      title:
        'Co to za rejestracja? Skróty, oznaczenia i rodzaje tablic rejestracyjnych (cuk.pl)',
      url: 'https://cuk.pl/porady/co-to-za-rejestracja-skroty-oznaczenia-i-rodzaje-tablic-rejestracyjnych',
      checked: '2026-11-09',
    },
  ],
  rows: [
    { suffix: 'A', districts: [unofficial('Białołęka')] },
    { suffix: 'B', districts: [unofficial('Bemowo')] },
    { suffix: 'D', districts: [unofficial('Bielany')] },
    { suffix: 'E', districts: [unofficial('Mokotów')] },
    { suffix: 'F', districts: [unofficial('Praga-Południe')] },
    { suffix: 'H', districts: [unofficial('Praga-Północ')] },
    { suffix: 'I', districts: [unofficial('Śródmieście')] },
    { suffix: 'J', districts: [unofficial('Targówek')] },
    { suffix: 'K', districts: [unofficial('Ursus')] },
    { suffix: 'N', districts: [unofficial('Ursynów')] },
    { suffix: 'T', districts: [unofficial('Wawer')] },
    { suffix: 'U', districts: [unofficial('Ochota')] },
    {
      suffix: 'W',
      districts: [
        unofficial('Rembertów'),
        unofficial('Wilanów'),
        unofficial('Włochy'),
      ],
    },
    {
      suffix: 'X',
      districts: [unofficial('Wesoła'), unofficial('Żoliborz')],
    },
    { suffix: 'Y', districts: [unofficial('Wola')] },
  ],
  rules: [
    {
      code: 'WW',
      vehiclePart: /^\d{4}[ACEXY]$/,
      district: unofficial('Rembertów'),
    },
    {
      code: 'WW',
      vehiclePart: /^\d{4}[FGHJW]$/,
      district: unofficial('Wilanów'),
    },
    {
      code: 'WW',
      vehiclePart: /^\d{4}[KLMNPRSTUV]$/,
      district: unofficial('Włochy'),
    },
    {
      code: 'WW',
      vehiclePart: /^\d{3}A[A-Z]$/,
      district: unofficial('Rembertów'),
    },
    {
      code: 'WW',
      vehiclePart: /^\d{3}G[A-Z]$/,
      district: unofficial('Wilanów'),
    },
    {
      code: 'WW',
      vehiclePart: /^\d{3}[STVWXY][A-Z]$/,
      district: unofficial('Włochy'),
    },
    {
      code: 'WX',
      vehiclePart: /^\d{3}[XY][A-Z]$/,
      district: unofficial('Wesoła'),
    },
    {
      code: 'WX',
      vehiclePart: /^[0-9A-Z]{5}$/,
      district: unofficial('Żoliborz'),
    },
    {
      code: 'WY',
      vehiclePart: /^\d{4}[VWXY]$/,
      district: undefined,
    },
    {
      code: 'WY',
      vehiclePart: /^\d{3}[VWXY][A-Z]$/,
      district: undefined,
    },
  ],
};
