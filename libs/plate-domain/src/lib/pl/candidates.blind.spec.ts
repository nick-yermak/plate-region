// Written by an agent that saw only the public JSDoc of plate-domain, the
// plate-data registry and excerpts of Dz.U. 2024 poz. 1709 (#41). Kept as
// written so they show what a reader of the contract alone expects: do not
// rewrite them to testing.mdc conventions (D-45).

import { describe, it, expect } from 'vitest';

import { fullCodes, registry } from '@plate-region/plate-data';

import { candidatesFor } from '../../index';
import type { Candidate } from '../../index';

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

function region2Candidate(
  candidates: readonly Candidate[],
  name: string,
): Extract<Candidate, { kind: 'region2' }> | undefined {
  return candidates.find(
    (c): c is Extract<Candidate, { kind: 'region2' }> =>
      c.kind === 'region2' && c.region2.name === name,
  );
}

function withoutRegion2Candidates(
  candidates: readonly Candidate[],
): Extract<Candidate, { kind: 'without-region2' }>[] {
  return candidates.filter(
    (c): c is Extract<Candidate, { kind: 'without-region2' }> =>
      c.kind === 'without-region2',
  );
}

function candidateFingerprint(c: Candidate): string {
  if (c.kind === 'region2') {
    return [
      'region2',
      c.region2.name,
      [...c.codes].join('|'),
      [...c.plateTypes].join(','),
      [...c.completeAs].join(','),
    ].join('::');
  }
  if (c.kind === 'without-region2') {
    return [
      'without-region2',
      [...c.plateTypes].join(','),
      [...c.completeAs].join(','),
    ].join('::');
  }
  return [
    'region2-not-in-registry',
    [...c.plateTypes].join(','),
    [...c.completeAs].join(','),
  ].join('::');
}

describe('candidatesFor', () => {
  it('returns empty for empty input', () => {
    // CandidatesResult status 'empty' — plate-domain/src/lib/pl/candidates.d.ts
    expect(candidatesFor('')).toEqual({ status: 'empty', country: 'PL' });
  });

  it('returns empty for separator-only input', () => {
    // CandidatesResult status 'empty' — candidates.d.ts
    expect(candidatesFor('-')).toEqual({ status: 'empty', country: 'PL' });
  });

  it('rejects Q as an invalid character', () => {
    // § 30 ust. 1 (R-23); candidatesFor JSDoc / invalid-characters variant
    expect(candidatesFor('Q12345')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'invalid-characters',
      invalidCharacters: ['Q'],
    });
  });

  it('returns not-in-registry for leading H', () => {
    // § 31 ust. 2 (R-37), Annex 13 table header (R-48); CandidatesResult not-in-registry
    expect(candidatesFor('H')).toEqual({
      status: 'not-in-registry',
      country: 'PL',
    });
  });

  it('returns not-in-registry for leading U', () => {
    // § 31 ust. 2 (R-37), Annex 13 table header (R-48); CandidatesResult not-in-registry
    expect(candidatesFor('U')).toEqual({
      status: 'not-in-registry',
      country: 'PL',
    });
  });

  it('rejects a leading digit other than 0 or 1 as no-matching-format', () => {
    // candidatesFor JSDoc: “including a leading digit”; same normalisation as parsePlate
    expect(candidatesFor('2')).toEqual({
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    });
  });

  it('lists candidates under dolnośląskie for input D', () => {
    // candidatesFor JSDoc (D-39): region1 fixed by the first letter; status candidates
    // Annex 13 / registry: D is primary letter of dolnośląskie (ordinal 1)
    expect(candidatesFor('D')).toMatchObject({
      status: 'candidates',
      country: 'PL',
      region1: dolnoslaskie,
    });
  });

  it('includes Wrocław among D candidates with ordinary and vintage still possible', () => {
    // Annex 13 / registry: Wrocław suffixes W,X under dolnośląskie D,V
    // fullCodes JSDoc: primary×suffixes then secondary×suffixes; first element DW
    expect(fullCodes(dolnoslaskie, wroclaw)[0]).toBe('DW');
    // Input "D" matches only primary-letter codes DW, DX (not VW/VX) — Candidate.codes
    // region2 types: ordinary (§ 30 ust. 2 pkt 1 & 3) and vintage (pkt 5); § 25 order (R-01)
    // completeAs empty while incomplete — candidates.d.ts
    const result = candidatesFor('D');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    expect(region2Candidate(result.candidates, 'Wrocław')).toEqual({
      kind: 'region2',
      region2: wroclaw,
      codes: ['DW', 'DX'],
      plateTypes: ['ordinary', 'vintage'],
      completeAs: [],
    });
  });

  it('puts the region2 whose code equals the typed group first for DW', () => {
    // CandidatesResult JSDoc (D-39): “region2 whose code equals the first typed group first”
    const result = candidatesFor('DW');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    expect(result.candidates[0]).toMatchObject({
      kind: 'region2',
      region2: wroclaw,
    });
    const first = result.candidates[0];
    if (first.kind === 'region2') {
      // codes include the typed group DW — fullCodes / Annex 13 Wrocław W
      expect(first.codes).toContain('DW');
    }
  });

  it('marks DW12345 complete as ordinary on the Wrocław candidate', () => {
    // candidatesFor JSDoc: completeAs agrees with parsePlate; § 30 ust. 2 pkt 1 lit. a (5 digits)
    const result = candidatesFor('DW12345');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    const w = region2Candidate(result.candidates, 'Wrocław');
    expect(w?.completeAs).toEqual(['ordinary']);
  });

  it('keeps the same candidate set when separators are added to DW12345', () => {
    // candidatesFor JSDoc: “Separators change only candidate order, not the set.”
    const plain = candidatesFor('DW12345');
    const spaced = candidatesFor('DW 12345');
    expect(plain.status).toBe('candidates');
    expect(spaced.status).toBe('candidates');
    if (plain.status !== 'candidates' || spaced.status !== 'candidates') return;
    const plainKeys = plain.candidates.map(candidateFingerprint).sort();
    const spacedKeys = spaced.candidates.map(candidateFingerprint).sort();
    expect(spacedKeys).toEqual(plainKeys);
  });

  it('leaves completeAs empty on the Wrocław candidate for incomplete DW', () => {
    // candidates.d.ts: completeAs “empty while the input is not complete for that entry”
    const result = candidatesFor('DW');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    const w = region2Candidate(result.candidates, 'Wrocław');
    expect(w?.completeAs).toEqual([]);
  });

  it('includes Warszawa for input WA', () => {
    // Annex 13 / registry: m.st. Warszawa suffixes include A → code WA
    const result = candidatesFor('WA');
    expect(result).toMatchObject({
      status: 'candidates',
      country: 'PL',
      region1: mazowieckie,
    });
    if (result.status !== 'candidates') return;
    const w = region2Candidate(result.candidates, 'm.st. Warszawa');
    expect(w?.codes).toContain('WA');
  });

  it('fixes region1 to dolnośląskie for secondary letter V', () => {
    // Annex 13 / registry region1 letters ['D','V']; candidatesFor JSDoc: region1 by first letter
    expect(candidatesFor('V')).toMatchObject({
      status: 'candidates',
      country: 'PL',
      region1: dolnoslaskie,
    });
  });

  it('marks W01234 complete as temporary', () => {
    // § 30 ust. 2 pkt 6 (R-32); candidatesFor JSDoc: completeAs agrees with parsePlate
    const result = candidatesFor('W01234');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    const match = withoutRegion2Candidates(result.candidates).find((c) =>
      c.completeAs.includes('temporary'),
    );
    expect(match?.completeAs).toEqual(['temporary']);
  });

  it('marks W0ABC complete as individual', () => {
    // § 30 ust. 2 pkt 4 (R-29); completeAs agrees with parsePlate — candidatesFor JSDoc
    const result = candidatesFor('W0ABC');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    const match = withoutRegion2Candidates(result.candidates).find((c) =>
      c.completeAs.includes('individual'),
    );
    expect(match?.completeAs).toEqual(['individual']);
  });

  it('marks W123456 complete as diplomatic', () => {
    // § 30 ust. 2 pkt 7 (R-33); completeAs agrees with parsePlate — candidatesFor JSDoc
    const result = candidatesFor('W123456');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    const match = withoutRegion2Candidates(result.candidates).find((c) =>
      c.completeAs.includes('diplomatic'),
    );
    expect(match?.completeAs).toEqual(['diplomatic']);
  });

  it('marks W123 complete as ordinary, vintage and temporary', () => {
    // § 30 ust. 2 pkt 2 lit. a (R-26); § 30 ust. 3 (R-35); § 25 order (D-34)
    // completeAs agrees with parsePlate — candidatesFor JSDoc
    const result = candidatesFor('W123');
    expect(result.status).toBe('candidates');
    if (result.status !== 'candidates') return;
    const match = withoutRegion2Candidates(result.candidates).find(
      (c) =>
        c.completeAs.length === 3 &&
        c.completeAs[0] === 'ordinary' &&
        c.completeAs[1] === 'vintage' &&
        c.completeAs[2] === 'temporary',
    );
    expect(match?.completeAs).toEqual(['ordinary', 'vintage', 'temporary']);
  });

  it('reads leading 0 as O and lists Opole under 0P', () => {
    // candidatesFor JSDoc: same input normalisation as parsePlate (leading 0 → O)
    // Annex 13 / registry: Opole OP; region1 opolskie
    const result = candidatesFor('0P');
    expect(result).toMatchObject({
      status: 'candidates',
      country: 'PL',
      region1: opolskie,
    });
    if (result.status !== 'candidates') return;
    const o = region2Candidate(result.candidates, 'Opole');
    expect(o?.codes).toContain('OP');
  });
});
