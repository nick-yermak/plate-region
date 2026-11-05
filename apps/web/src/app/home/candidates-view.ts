import type { CandidatesFound, CandidatesView } from './home.types';

export function candidatesView(
  result: CandidatesFound,
  compact: string,
): CandidatesView {
  void compact;
  return {
    region1: result.region1,
    answer: undefined,
    counties: [],
    withoutRegion2: false,
    notInRegistry: false,
  };
}
