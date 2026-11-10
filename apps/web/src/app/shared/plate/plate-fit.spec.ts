import { plateFit, plateTextWidthMm } from './plate-fit';

describe('plate-fit', () => {
  it('sums measured advances for NWE 383WR', () => {
    expect(plateTextWidthMm('NWE 383WR')).toBeCloseTo(507.1, 2);
  });

  it('leaves a fitting seven-character plate untouched', () => {
    expect(plateFit('GD 9N077')).toBe(1);
  });

  it('compresses NWE 383WR to fit the text box', () => {
    expect(plateFit('NWE 383WR')).toBeCloseTo(0.8992, 4);
  });

  it('compresses DWW 800WW to fit the text box', () => {
    expect(plateFit('DWW 800WW')).toBeCloseTo(0.8173, 4);
  });

  it('compresses VWW WV57 to fit the text box', () => {
    expect(plateFit('VWW WV57')).toBeCloseTo(0.968, 3);
  });

  it('measures lowercase input as uppercase', () => {
    expect(plateFit('nwe 383wr')).toBeCloseTo(0.8992, 4);
  });

  it('counts an unknown character as the widest glyph', () => {
    expect(plateTextWidthMm('Ż')).toBeCloseTo(80.61, 2);
  });
});
