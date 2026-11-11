import { labelFits, labelFontSize } from './map-labels';

describe('map-labels', () => {
  it('labelFontSize gives 11 px at the reference size for a view box 923 high', () => {
    expect(labelFontSize(923)).toBeCloseTo(33.536585, 6);
  });

  it('labelFontSize keeps the width as the limit at a view box 1000 high', () => {
    expect(labelFontSize(1000)).toBeCloseTo(33.536585, 6);
  });

  it('labelFontSize grows with a view box taller than wide', () => {
    expect(labelFontSize(1495)).toBeCloseTo(50.137195, 6);
  });

  it('labelFits rejects DW at radius 29.2', () => {
    expect(labelFits('DW', 29.2, 33.536585)).toBe(false);
  });

  it('labelFits accepts DOL at radius 57.5', () => {
    expect(labelFits('DOL', 57.5, 33.536585)).toBe(true);
  });

  it('labelFits rejects FWS at radius 59', () => {
    expect(labelFits('FWS', 59, 50.137195)).toBe(false);
  });

  it('labelFits accepts FSU at radius 68.3', () => {
    expect(labelFits('FSU', 68.3, 50.137195)).toBe(true);
  });

  it('labelFits accepts WX at radius 38 on the Warsaw map', () => {
    expect(labelFits('WX', 38, 34.911585)).toBe(true);
  });

  it('labelFits throws on a character without an advance', () => {
    expect(() => labelFits('D1', 100, 33.536585)).toThrow('no advance for 1');
  });
});
