import { normalisePlateInput, parsePlate } from '@plate-region/plate-domain';

import type { SearchOutcome } from './home.types';

export function search(input: string): SearchOutcome {
  const parsed = parsePlate(input);
  switch (parsed.status) {
    case 'empty':
      return { kind: 'error', error: { kind: 'empty' } };
    case 'invalid-input':
      if (parsed.reason === 'invalid-characters') {
        return {
          kind: 'error',
          error: {
            kind: 'invalid-characters',
            characters: parsed.invalidCharacters,
          },
        };
      }
      return { kind: 'navigate', plate: routePlate(input) };
    case 'resolved':
    case 'region1-only':
    case 'ambiguous':
    case 'region2-not-in-registry':
    case 'not-in-registry':
      return { kind: 'navigate', plate: routePlate(input) };
  }
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
