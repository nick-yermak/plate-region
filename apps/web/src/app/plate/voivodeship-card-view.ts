import {
  fullCodes,
  registry,
  type Region1,
  type Region2,
} from '@plate-region/plate-data';

import type { Language } from '../i18n/language.types';
import type { TranslatableMessage } from '../i18n/i18n.types';

export type VoivodeshipCardView = {
  readonly heading: TranslatableMessage;
  readonly codes: readonly string[];
};

export function voivodeshipCardView(
  region1: Region1,
  filled: Region2 | undefined,
  code: string | undefined,
  language: Language,
): VoivodeshipCardView {
  const name = language === 'pl' ? region1.name : region1.nameEn.value;
  const codes: string[] = [];
  if (code !== undefined) {
    codes.push(code);
  }
  const letter = region1.letters[0];
  for (const region2 of registry.region2) {
    if (region2.region1Letter !== letter) {
      continue;
    }
    if (filled !== undefined && region2 === filled) {
      continue;
    }
    if (
      filled !== undefined &&
      region2.name === filled.name &&
      region2.region1Letter === filled.region1Letter
    ) {
      continue;
    }
    const first = fullCodes(region1, region2)[0];
    if (first === undefined) {
      continue;
    }
    if (codes.includes(first)) {
      continue;
    }
    codes.push(first);
    if (codes.length >= 5) {
      break;
    }
  }
  return {
    heading: { key: 'plate.heading.voivodeship', params: { name } },
    codes,
  };
}
