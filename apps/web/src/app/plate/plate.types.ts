import type { Region1 } from '@plate-region/plate-data';
import type { CandidatesResult, PlateType } from '@plate-region/plate-domain';

import type { TranslatableMessage } from '../i18n/i18n.types';

export interface VoivodeshipLink {
  readonly slug: string;
  readonly fragment: string | undefined;
}

export interface PowiatView {
  readonly name: string;
  readonly kindKey: 'plate.kind.city' | 'plate.kind.land';
}

export interface ReadingView {
  readonly captionKey:
    | 'plate.reading.withCounty'
    | 'plate.reading.withoutCounty'
    | undefined;
  readonly powiat: PowiatView | undefined;
  readonly voivodeshipName: string;
  readonly typesLabelKey: 'plate.reading.type' | 'plate.reading.possibleTypes';
  readonly plateTypes: readonly [PlateType, ...PlateType[]];
  readonly link: VoivodeshipLink;
}

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

export type ResultView =
  | {
      readonly kind: 'readings';
      readonly heading: TranslatableMessage;
      readonly noteKey:
        | 'plate.notes.region1Only'
        | 'plate.notes.region2NotInRegistry'
        | 'plate.notes.ambiguous'
        | undefined;
      readonly readings:
        | readonly [ReadingView]
        | readonly [ReadingView, ReadingView];
    }
  | {
      readonly kind: 'candidates';
      readonly heading: TranslatableMessage;
      readonly candidates: CandidatesView;
      readonly link: VoivodeshipLink | undefined;
    }
  | {
      readonly kind: 'message';
      readonly heading: TranslatableMessage;
    };
