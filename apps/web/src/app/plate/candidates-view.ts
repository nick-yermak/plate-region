import type { CandidatesFound, CandidatesView } from './plate.types';

export function candidatesView(
  result: CandidatesFound,
  compact: string,
): CandidatesView {
  let answer: CandidatesView['answer'];
  const counties: CandidatesView['counties'][number][] = [];
  let withoutRegion2 = false;
  let notInRegistry = false;

  for (const entry of result.candidates) {
    switch (entry.kind) {
      case 'region2':
        if (answer === undefined && entry.codes.includes(compact)) {
          answer = entry;
        } else {
          counties.push(entry);
        }
        break;
      case 'without-region2':
        withoutRegion2 = true;
        break;
      case 'region2-not-in-registry':
        notInRegistry = true;
        break;
    }
  }

  return {
    region1: result.region1,
    answer,
    counties,
    withoutRegion2,
    notInRegistry,
  };
}
