import {
  candidatesFor,
  normalisePlateInput,
  parsePlate,
} from '@plate-region/plate-domain';

import type { SearchOutcome } from './home.types';
import { candidatesView } from '../plate/candidates-view';

export function search(input: string): SearchOutcome {
  const parsed = parsePlate(input);
  switch (parsed.status) {
    case 'resolved':
    case 'region1-only':
    case 'ambiguous':
    case 'region2-not-in-registry':
      return { kind: 'navigate', plate: routePlate(input) };
    case 'invalid-input':
      return parsed.reason === 'invalid-characters'
        ? {
            kind: 'error',
            error: {
              kind: 'invalid-characters',
              characters: parsed.invalidCharacters,
            },
          }
        : candidatesOrDeadEnd(input);
    case 'empty':
      return { kind: 'error', error: { kind: 'empty' } };
    case 'not-in-registry':
      return parsed.series === undefined
        ? { kind: 'error', error: { kind: 'not-in-registry' } }
        : { kind: 'navigate', plate: routePlate(input) };
  }
}

function candidatesOrDeadEnd(input: string): SearchOutcome {
  const result = candidatesFor(input);
  if (result.status !== 'candidates') {
    return { kind: 'error', error: { kind: 'no-matching-format' } };
  }
  const normalised = normalisePlateInput(input);
  if (normalised.status === 'invalid') {
    throw new Error(
      'candidatesFor accepted input that normalisePlateInput rejects',
    );
  }
  return {
    kind: 'candidates',
    view: candidatesView(result, normalised.compact),
  };
}

function routePlate(input: string): string {
  const normalised = normalisePlateInput(input);
  if (normalised.status === 'invalid') {
    throw new Error(
      'parsePlate accepted input that normalisePlateInput rejects',
    );
  }
  return normalised.groups.join(' ');
}
