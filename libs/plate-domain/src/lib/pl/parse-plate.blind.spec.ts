// Written by an agent that saw only the public JSDoc of plate-domain, the
// plate-data registry and excerpts of Dz.U. 2024 poz. 1709 (#41). Kept as
// written so they show what a reader of the contract alone expects: do not
// rewrite them to testing.mdc conventions (D-45).

import { describe, it, expect } from 'vitest';

import { registry } from '@plate-region/plate-data';

import { parsePlate } from '../../index';

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`Registry record not found: ${what}`);
  }
  return value;
}

const dolnoslaskie = required(
  registry.region1.find((r) => r.ordinal === 1),
  'region1 ordinal 1',
);
const mazowieckie = required(
  registry.region1.find((r) => r.ordinal === 7),
  'region1 ordinal 7',
);
const opolskie = required(
  registry.region1.find((r) => r.ordinal === 8),
  'region1 ordinal 8',
);

const wroclaw = required(
  registry.region2.find((r) => r.region1Letter === 'D' && r.name === 'Wrocław'),
  'region2 Wrocław',
);
const boleslawiecki = required(
  registry.region2.find(
    (r) => r.region1Letter === 'D' && r.name === 'bolesławiecki',
  ),
  'region2 bolesławiecki',
);
const warszawa = required(
  registry.region2.find(
    (r) => r.region1Letter === 'W' && r.name === 'm.st. Warszawa',
  ),
  'region2 m.st. Warszawa',
);
const ostroleka = required(
  registry.region2.find(
    (r) => r.region1Letter === 'W' && r.name === 'Ostrołęka',
  ),
  'region2 Ostrołęka',
);
const opole = required(
  registry.region2.find((r) => r.region1Letter === 'O' && r.name === 'Opole'),
  'region2 Opole',
);

describe('parsePlate', () => {
  it('returns empty for empty input', () => {
    // ParseResult status 'empty' — plate-domain/src/lib/pl/parse-plate.d.ts
    expect(parsePlate('')).toEqual({ status: 'empty', country: 'PL' });
  });

  it('returns empty for separator-only input', () => {
    // ParseResult status 'empty' (“Empty or separator-only input”) — parse-plate.d.ts
    expect(parsePlate('-')).toEqual({ status: 'empty', country: 'PL' });
  });

  it('rejects Q as an invalid character', () => {
    // § 30 ust. 1 (R-23): 25 letters A–Z excluding Q; parsePlate JSDoc → invalid-characters
    expect(parsePlate('Q12345')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'invalid-characters',
      invalidCharacters: ['Q'],
    });
  });

  it('rejects @ as an invalid character', () => {
    // § 30 ust. 1 (R-23); parsePlate JSDoc → invalid-characters; typed offender listed
    expect(parsePlate('DW@01')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'invalid-characters',
      invalidCharacters: ['@'],
    });
  });

  it('treats a single voivodeship letter as no-matching-format', () => {
    // parsePlate JSDoc: incomplete input such as `D` → no-matching-format
    expect(parsePlate('D')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    });
  });

  it('treats a bare full code without a vehicle part as no-matching-format', () => {
    // parsePlate JSDoc: incomplete input such as `DW` → no-matching-format
    expect(parsePlate('DW')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    });
  });

  it('treats an incomplete vehicle part as no-matching-format', () => {
    // parsePlate JSDoc: incomplete input such as `WA1` → no-matching-format
    expect(parsePlate('WA1')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    });
  });

  it('rejects a leading digit other than 0 or 1 as no-matching-format', () => {
    // parsePlate JSDoc: “including a leading digit”; only 0/1 remap to O/I
    expect(parsePlate('2W12345')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    });
  });

  it('returns not-in-registry for leading H', () => {
    // § 31 ust. 2 (R-37), Annex 13 table header (R-48): H outside column 4 — ParseResult not-in-registry
    expect(parsePlate('H12345')).toEqual({
      status: 'not-in-registry',
      country: 'PL',
    });
  });

  it('returns not-in-registry for leading U', () => {
    // § 31 ust. 2 (R-37), Annex 13 table header (R-48): U outside column 4 — ParseResult not-in-registry
    expect(parsePlate('U12345')).toEqual({
      status: 'not-in-registry',
      country: 'PL',
    });
  });

  it('resolves DW12345 as Wrocław ordinary', () => {
    // Annex 13: Wrocław wyróżnik powiatu W under D,V; registry region2 Wrocław suffixes ['W','X']
    // § 30 ust. 2 pkt 1 lit. a: five digits 00001–99999 on 1-letter powiat ordinary car plates
    // plateTypes in § 25 order (D-34) — parse-plate.d.ts
    expect(parsePlate('DW12345')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: dolnoslaskie,
      region2: wroclaw,
      plateTypes: ['ordinary'],
    });
  });

  it('ignores separators when resolving DW12345', () => {
    // parsePlate JSDoc: “Separators do not change the result.”
    // Same act/registry sources as DW12345 → Wrocław ordinary
    expect(parsePlate('DW 12-345')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: dolnoslaskie,
      region2: wroclaw,
      plateTypes: ['ordinary'],
    });
  });

  it('resolves secondary voivodeship letter VW12345 as Wrocław ordinary', () => {
    // Annex 13 / registry: dolnośląskie letters ['D','V']; Wrocław suffixes include W
    // fullCodes JSDoc: secondary letter × each suffix; § 30 ust. 2 pkt 1 lit. a (5 digits)
    expect(parsePlate('VW12345')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: dolnoslaskie,
      region2: wroclaw,
      plateTypes: ['ordinary'],
    });
  });

  it('reads leading 0 as O for Opole ordinary OP12345', () => {
    // parsePlate JSDoc: leading 0 read as O (`0P12345`)
    // Annex 13: Opole OP; § 30 ust. 2 pkt 1 lit. a (5 digits)
    expect(parsePlate('0P12345')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: opolskie,
      region2: opole,
      plateTypes: ['ordinary'],
    });
  });

  it('rejects an all-zero five-digit vehicle part as no-matching-format', () => {
    // § 30 ust. 2 pkt 1–3, 5–7 (R-34); parsePlate JSDoc: all-zero digit groups → no-matching-format
    expect(parsePlate('DW00000')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    });
  });

  it('resolves DW01A as Wrocław vintage', () => {
    // Annex 13 / registry: DW = Wrocław; § 30 ust. 2 pkt 5 lit. a (R-30): 2 digits + letter
    expect(parsePlate('DW01A')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: dolnoslaskie,
      region2: wroclaw,
      plateTypes: ['vintage'],
    });
  });

  it('resolves DW001 as Wrocław vintage', () => {
    // Annex 13 / registry: DW = Wrocław; § 30 ust. 2 pkt 5 lit. a (R-30): 3 digits
    expect(parsePlate('DW001')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: dolnoslaskie,
      region2: wroclaw,
      plateTypes: ['vintage'],
    });
  });

  it('resolves DBL1A as bolesławiecki vintage', () => {
    // Annex 13 / registry: bolesławiecki suffixes ['BL'] → DBL; § 30 ust. 2 pkt 5 lit. b (R-31): digit + letter
    expect(parsePlate('DBL1A')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: dolnoslaskie,
      region2: boleslawiecki,
      plateTypes: ['vintage'],
    });
  });

  it('resolves WA1234 as Warszawa ordinary (motorcycle four digits)', () => {
    // Annex 13 / registry: m.st. Warszawa suffix A → WA
    // § 30 ust. 2 pkt 3 lit. a (R-27): four digits on 1-letter powiat motorcycle plates
    // § 25 pkt 1: motorcycle plates are zwyczajne → plate type ordinary (plate-type.d.ts)
    expect(parsePlate('WA1234')).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: mazowieckie,
      region2: warszawa,
      plateTypes: ['ordinary'],
    });
  });

  it('reads W123456 as region1-only diplomatic', () => {
    // § 30 ust. 2 pkt 7 (R-33): voivodeship letter + six digits 000001–999999
    // ParseResult region1-only — parse-plate.d.ts (no region2 on diplomatic)
    // Annex 13 / registry: W is primary letter of mazowieckie
    expect(parsePlate('W123456')).toEqual({
      status: 'region1-only',
      country: 'PL',
      region1: mazowieckie,
      plateTypes: ['diplomatic'],
    });
  });

  it('reads W01234 as region1-only temporary', () => {
    // Annex 13 col. 6 / registry letterDigitCodes: W0; § 30 ust. 2 pkt 6 (R-32): letter+digit + 4 digits
    // ParseResult region1-only — parse-plate.d.ts
    expect(parsePlate('W01234')).toEqual({
      status: 'region1-only',
      country: 'PL',
      region1: mazowieckie,
      plateTypes: ['temporary'],
    });
  });

  it('reads W0ABC as region1-only individual', () => {
    // § 30 ust. 2 pkt 4 (R-29): letter+digit + 3–5 letters; § 32 ust. 2 (R-39)
    // Annex 13 col. 6 W0; ParseResult region1-only — parse-plate.d.ts
    expect(parsePlate('W0ABC')).toEqual({
      status: 'region1-only',
      country: 'PL',
      region1: mazowieckie,
      plateTypes: ['individual'],
    });
  });

  it('reads W123 as region1-only reduced ordinary+vintage+temporary', () => {
    // § 30 ust. 2 pkt 2 lit. a (R-26): 3 digits after voivodeship letter (reduced)
    // § 30 ust. 3 (R-35): same number on reduced ordinary / temporary / vintage → types not unique
    // plateTypes in § 25 order (D-34): ordinary, vintage, temporary — parse-plate.d.ts / plate-type.d.ts
    expect(parsePlate('W123')).toEqual({
      status: 'region1-only',
      country: 'PL',
      region1: mazowieckie,
      plateTypes: ['ordinary', 'vintage', 'temporary'],
    });
  });

  it('returns region2-not-in-registry for WC12345', () => {
    // Valid column-4+5 shape (W + one letter); no WC suffix in Annex 13 / registry mazowieckie
    // ParseResult region2-not-in-registry (D-26) — parse-plate.d.ts
    // § 30 ust. 2 pkt 1 lit. a: five digits → ordinary only
    expect(parsePlate('WC12345')).toEqual({
      status: 'region2-not-in-registry',
      country: 'PL',
      region1: mazowieckie,
      plateTypes: ['ordinary'],
    });
  });

  it('returns ambiguous for WOO1A (Ostrołęka vintage vs individual)', () => {
    // ParseResult ambiguous example `WOO1A` — parse-plate.d.ts (look-alikes 0/O at positions 2–3)
    // withRegion2: Annex 13 / registry Ostrołęka suffix O → WO; pos3 as 0 → vehicle 01A
    //   § 30 ust. 2 pkt 5 lit. a (R-30): 2 digits + letter → vintage
    // withoutRegion2: pos2 as 0 → column-6 W0; vehicle O1A
    //   § 30 ust. 2 pkt 4 (R-29), § 32 ust. 2 (R-39): individual (O remains a letter)
    expect(parsePlate('WOO1A')).toEqual({
      status: 'ambiguous',
      country: 'PL',
      region1: mazowieckie,
      withRegion2: {
        region2: ostroleka,
        plateTypes: ['vintage'],
      },
      withoutRegion2: {
        plateTypes: ['individual'],
      },
    });
  });
});
