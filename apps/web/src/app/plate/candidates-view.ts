import type {
  AnswerCandidate,
  CandidatesFound,
  CandidatesView,
  CountyCandidate,
} from './plate.types';

/** The sole county when there is no answer and exactly one county candidate. */
export function singleCounty(
  view: CandidatesView,
): CountyCandidate | undefined {
  if (view.answer === undefined && view.counties.length === 1) {
    return view.counties[0];
  }
  return undefined;
}

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
          const matched: AnswerCandidate = { ...entry, code: compact };
          answer = matched;
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
