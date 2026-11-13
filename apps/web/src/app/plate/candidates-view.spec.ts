import { compactOf, county, found } from './plate.testing';
import { candidatesView, singleCounty } from './candidates-view';
import type { CandidatesFound, CandidatesView } from './plate.types';

function view(input: string): CandidatesView {
  return candidatesView(found(input), compactOf(input));
}

describe('singleCounty', () => {
  it('GMB3837 → malborski', () => {
    expect(singleCounty(view('GMB3837'))?.region2.name).toBe(
      county('GMB').name,
    );
  });

  it('GMB (answer) → undefined', () => {
    expect(singleCounty(view('GMB'))).toBeUndefined();
  });

  it('GK (3 counties) → undefined', () => {
    expect(singleCounty(view('GK'))).toBeUndefined();
  });
});

describe('candidatesView', () => {
  it('answers with the county whose code equals the compact input', () => {
    const result = view('GD');
    expect(result.answer?.region2.name).toBe(county('GD').name);
    expect(result.answer?.codes).toEqual(['GD']);
    expect(result.counties.map((entry) => entry.region2.name)).toEqual([
      county('GDA').name,
    ]);
  });

  it('finds the answer in any position', () => {
    const source = found('GD');
    const [head, ...tail] = [...source.candidates].reverse();
    if (head === undefined) {
      throw new Error('expected candidates for GD');
    }
    const reversed: CandidatesFound = {
      ...source,
      candidates: [head, ...tail],
    };
    const result = candidatesView(reversed, 'GD');
    expect(result.answer?.region2.name).toBe(county('GD').name);
    expect(result.answer?.codes).toEqual(['GD']);
  });

  it('has no answer when the input is longer than every code', () => {
    // Załącznik 13 lines 3635 and 3646: Gdańsk D; gdański DA.
    // Compact GD1 matches neither full code as an equal code.
    const result = view('GD 1');
    expect(result.answer).toBeUndefined();
    expect(result.counties).toHaveLength(1);
    expect(result.counties[0]?.codes).toEqual(['GD']);
  });

  it('has no answer for a voivodeship letter', () => {
    // Załącznik 13 lines 3635–3659, pomorskie: 4 cities + 16 counties = 20.
    const result = view('G');
    expect(result.answer).toBeUndefined();
    expect(result.counties).toHaveLength(20);
  });

  it('keeps the domain order for the other counties', () => {
    const result = view('DW');
    expect(result.answer?.region2.name).toBe(county('DW').name);
    expect(result.counties.map((entry) => entry.region2.name)).toEqual([
      county('DWL').name,
      county('DWR').name,
    ]);
  });

  it('flags a without-county reading', () => {
    expect(view('DW').withoutRegion2).toBe(true);
    expect(view('GD').withoutRegion2).toBe(false);
  });

  it('flags a code not in the registry', () => {
    expect(view('DAB').notInRegistry).toBe(true);
    expect(view('GD').notInRegistry).toBe(false);
  });

  it('carries the compact that selected the answer as answer.code', () => {
    // XMB reaches candidates-with-answer (codes ['XMB']; county also has GMB in the table).
    expect(view('XMB').answer?.code).toBe('XMB');
  });
});
