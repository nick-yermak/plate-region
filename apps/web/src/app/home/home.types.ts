import type { ValidationError } from '@angular/forms/signals';

import type { Region1 } from '@plate-region/plate-data';
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

export type CandidatesFound = Extract<
  CandidatesResult,
  { status: 'candidates' }
>;

export type CountyCandidate = Extract<
  CandidatesFound['candidates'][number],
  { kind: 'region2' }
>;

export type CandidatesView = {
  readonly region1: Region1;
  readonly answer: CountyCandidate | undefined;
  readonly counties: readonly CountyCandidate[];
  readonly withoutRegion2: boolean;
  readonly notInRegistry: boolean;
};

export type SearchOutcome =
  | { readonly kind: 'navigate'; readonly plate: string }
  | { readonly kind: 'candidates'; readonly view: CandidatesView }
  | { readonly kind: 'error'; readonly error: SearchError };
