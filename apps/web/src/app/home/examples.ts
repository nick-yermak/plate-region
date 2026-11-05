import { fullCodes, registry } from '@plate-region/plate-data';
import {
  examplePlateForCode,
  type RandomSource,
} from '@plate-region/plate-domain';

const { two, three, all } = (() => {
  const twoCodes: string[] = [];
  const threeCodes: string[] = [];
  const allCodes: string[] = [];
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      for (const code of fullCodes(region1, region2)) {
        allCodes.push(code);
        if (code.length === 2) {
          twoCodes.push(code);
        } else if (code.length === 3) {
          threeCodes.push(code);
        }
      }
    }
  }
  return { two: twoCodes, three: threeCodes, all: allCodes };
})();

function pick(codes: readonly string[], random: RandomSource): string {
  const r = random();
  if (!(r >= 0 && r < 1)) {
    throw new RangeError('random must return a value in [0, 1)');
  }
  const code = codes[Math.floor(r * codes.length)];
  if (code === undefined) {
    throw new Error('homeExamples code list is empty');
  }
  return code;
}

export function homeExamples(
  random: RandomSource,
): readonly [string, string, string] {
  const twoChar = pick(two, random);
  const threeChar = pick(three, random);
  const plateCode = pick(all, random);
  const plate = examplePlateForCode(plateCode, random);
  if (plate === undefined) {
    throw new Error(`examplePlateForCode returned undefined for ${plateCode}`);
  }
  return [twoChar, threeChar, plate];
}
