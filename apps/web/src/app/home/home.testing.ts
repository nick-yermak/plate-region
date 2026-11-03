import {
  fullCodes,
  registry,
  type Region1,
  type Region2,
} from '@plate-region/plate-data';

export function voivodeship(letter: string): Region1 {
  const found = registry.region1.find((region) =>
    region.letters.some((value) => value === letter),
  );
  if (found === undefined) {
    throw new Error(`no region1 with letter ${letter}`);
  }
  return found;
}

export function county(code: string): Region2 {
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      if (fullCodes(region1, region2).includes(code)) {
        return region2;
      }
    }
  }
  throw new Error(`no county with code ${code}`);
}
