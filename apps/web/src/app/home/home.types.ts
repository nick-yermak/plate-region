import type { ValidationError } from '@angular/forms/signals';

import type { ParseResult as PlateParseResult } from '@plate-region/plate-domain';

import type { CandidatesView } from '../plate/plate.types';

type InvalidCharacters = Extract<
  PlateParseResult,
  { reason: 'invalid-characters' }
>['invalidCharacters'];

export type SearchError =
  | (ValidationError.WithoutFieldTree & { readonly kind: 'empty' })
  | (ValidationError.WithoutFieldTree & {
      readonly kind: 'no-matching-format';
    })
  | (ValidationError.WithoutFieldTree & {
      readonly kind: 'not-in-registry';
    })
  | (ValidationError.WithoutFieldTree & {
      readonly kind: 'invalid-characters';
      readonly characters: InvalidCharacters;
    });

export type { CandidatesView };

export type SearchOutcome =
  | { readonly kind: 'navigate'; readonly plate: string }
  | { readonly kind: 'candidates'; readonly view: CandidatesView }
  | { readonly kind: 'error'; readonly error: SearchError };
