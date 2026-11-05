import type { ValidationError } from '@angular/forms/signals';

import type { SearchError } from './home.types';
import type { TranslatableMessage } from '../i18n/i18n.types';

const SEARCH_ERROR_KINDS = new Set([
  'empty',
  'no-matching-format',
  'not-in-registry',
  'invalid-characters',
]);

/** Field-state shape of a search error: same payload as {@link SearchError}, possibly with `fieldTree`. */
export type SearchErrorOnField = ValidationError.WithOptionalFieldTree & {
  readonly kind: SearchError['kind'];
  readonly characters?: Extract<
    SearchError,
    { kind: 'invalid-characters' }
  >['characters'];
};

export function isSearchError(
  error: ValidationError.WithOptionalFieldTree,
): error is SearchErrorOnField {
  return SEARCH_ERROR_KINDS.has(error.kind);
}

export function searchErrorMessage(
  error: SearchError | SearchErrorOnField,
): TranslatableMessage {
  switch (error.kind) {
    case 'empty':
      return { key: 'home.errors.empty' };
    case 'no-matching-format':
      return { key: 'home.errors.noMatchingFormat' };
    case 'not-in-registry':
      return { key: 'home.errors.notInRegistry' };
    case 'invalid-characters': {
      if (!('characters' in error) || error.characters === undefined) {
        throw new Error('invalid-characters error without characters');
      }
      return {
        key: 'home.errors.invalidCharacters',
        params: { characters: error.characters.join(', ') },
      };
    }
  }
}
