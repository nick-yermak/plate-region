import { resultMapTarget } from './result-map';
import { county, voivodeship } from './plate.testing';

describe('resultMapTarget', () => {
  it('fills Wrocław for DW12345', () => {
    expect(resultMapTarget('DW12345')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('D'),
      filled: county('DW'),
    });
  });

  it('shows the Warsaw districts for WE12345', () => {
    expect(resultMapTarget('WE12345')).toEqual({
      kind: 'warsaw',
      region1: voivodeship('W'),
      districts: ['Mokotów'],
      filled: county('WA'),
    });
  });

  it('fills Warszawa on the Masovian map without a district for WY1234V', () => {
    expect(resultMapTarget('WY1234V')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('W'),
      filled: county('WY'),
    });
  });

  it('draws the voivodeship without a fill for WA12', () => {
    expect(resultMapTarget('WA12')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('W'),
      filled: undefined,
    });
  });

  it('draws the voivodeship without a fill for DA12345', () => {
    expect(resultMapTarget('DA12345')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('D'),
      filled: undefined,
    });
  });

  it('draws the voivodeship without a fill for WOO1A', () => {
    expect(resultMapTarget('WOO1A')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('W'),
      filled: undefined,
    });
  });

  it('fills the answer county for GD', () => {
    expect(resultMapTarget('GD')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('G'),
      filled: county('GD'),
    });
  });

  it('draws the voivodeship without a fill for GK', () => {
    expect(resultMapTarget('GK')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('G'),
      filled: undefined,
    });
  });

  it('fills the single county for GMB3837', () => {
    expect(resultMapTarget('GMB3837')).toEqual({
      kind: 'voivodeship',
      region1: voivodeship('G'),
      filled: county('GMB'),
    });
  });

  it('shows no map for 2A12345', () => {
    expect(resultMapTarget('2A12345')).toBeUndefined();
  });

  it('shows no map for HA12345', () => {
    expect(resultMapTarget('HA12345')).toBeUndefined();
  });

  it('shows no map for an empty plate', () => {
    expect(resultMapTarget('')).toBeUndefined();
  });
});
