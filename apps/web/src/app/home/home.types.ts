import type { ValidationError } from '@angular/forms/signals';

import type { ParseResult as PlateParseResult } from '@plate-region/plate-domain';

type InvalidCharacters = Extract<
  PlateParseResult,
  { reason: 'invalid-characters' }
>['invalidCharacters'];

export type SearchError =
  | (ValidationError.WithoutFieldTree & { readonly kind: 'empty' })
  | (ValidationError.WithoutFieldTree & {
      readonly kind: 'invalid-characters';
      readonly characters: InvalidCharacters;
    });

export type SearchOutcome =
  | { readonly kind: 'navigate'; readonly plate: string }
  | { readonly kind: 'error'; readonly error: SearchError };
