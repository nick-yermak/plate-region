import { candidatesFor, normalisePlateInput } from '@plate-region/plate-domain';
import {
  fullCodes,
  registry,
  type Region1,
  type Region2,
} from '@plate-region/plate-data';

import type { CandidatesFound } from '../plate/plate.types';

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

export function found(input: string): CandidatesFound {
  const result = candidatesFor(input);
  if (result.status !== 'candidates') {
    throw new Error(`expected candidates for ${input}, got ${result.status}`);
  }
  return result;
}

export function compactOf(input: string): string {
  const normalised = normalisePlateInput(input);
  if (normalised.status === 'invalid') {
    throw new Error(`expected valid input for ${input}`);
  }
  return normalised.compact;
}

export function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`missing ${selector}`);
  }
  return element;
}
