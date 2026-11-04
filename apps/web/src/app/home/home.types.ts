import type { ValidationError } from '@angular/forms/signals';

import type {
  CandidatesResult,
  ParseResult as PlateParseResult,
} from '@plate-region/plate-domain';

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

export type CandidatesView = Extract<
  CandidatesResult,
  { status: 'candidates' }
>;

export type SearchOutcome =
  | { readonly kind: 'navigate'; readonly plate: string }
  | { readonly kind: 'candidates'; readonly result: CandidatesView }
  | { readonly kind: 'error'; readonly error: SearchError };

export interface TranslatableMessage {
  readonly key: string;
  readonly params?: Readonly<Record<string, string | number>>;
}
