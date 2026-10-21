import { fullCodes } from './full-codes';
import type { Registry, Region1, Region2 } from './model';
import { registry } from './registry';

const { region1, region2 }: Registry = registry;

function region1ByPrimary(letter: string): Region1 {
  const found = region1.find((r) => r.letters[0] === letter);
  if (found === undefined) {
    throw new Error(`no region1 with primary letter ${letter}`);
  }
  return found;
}

function region2By(region1Letter: string, name: string): Region2 {
  const found = region2.find(
    (r) => r.region1Letter === region1Letter && r.name === name,
  );
  if (found === undefined) {
    throw new Error(`no region2 ${region1Letter}:${name}`);
  }
  return found;
}

describe('fullCodes', () => {
  it('returns DW, DX, VW, VX for Wrocław', () => {
    expect([
      ...fullCodes(region1ByPrimary('D'), region2By('D', 'Wrocław')),
    ]).toEqual(['DW', 'DX', 'VW', 'VX']);
  });

  it('returns letters-outer Annex 13 order for pruszkowski', () => {
    expect([
      ...fullCodes(region1ByPrimary('W'), region2By('W', 'pruszkowski')),
    ]).toEqual(['WPR', 'WPP', 'WPS', 'APR', 'APP', 'APS']);
  });

  it('returns LUB, LVB for lubelski', () => {
    expect([
      ...fullCodes(region1ByPrimary('L'), region2By('L', 'lubelski')),
    ]).toEqual(['LUB', 'LVB']);
  });

  it('puts the primary letter and first suffix first', () => {
    expect(fullCodes(region1ByPrimary('D'), region2By('D', 'Wrocław'))[0]).toBe(
      'DW',
    );
  });

  it('throws when region1Letter does not match the region1 primary letter', () => {
    expect(() =>
      fullCodes(region1ByPrimary('K'), region2By('D', 'Wrocław')),
    ).toThrow(/region1Letter/);
  });
});
