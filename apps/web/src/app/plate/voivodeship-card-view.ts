import type { Region1 } from '@plate-region/plate-data';

import type { Language } from '../i18n/language.types';
import type { TranslatableMessage } from '../i18n/i18n.types';
import { voivodeshipMainCodes } from './voivodeship-main-codes';

/** How many main codes the voivodeship card shows (D-54 Update #169). */
/** How many main codes the voivodeship card shows (D-54 Update #169). */
export const VOIVODESHIP_CARD_MAIN_CODES_COUNT = 10;

export type VoivodeshipCardCode = {
  readonly code: string;
  readonly name: TranslatableMessage;
};

export type VoivodeshipCardView = {
  readonly heading: TranslatableMessage;
  readonly codes: readonly VoivodeshipCardCode[];
};

export function voivodeshipCardView(
  region1: Region1,
  language: Language,
): VoivodeshipCardView {
  const name = language === 'pl' ? region1.name : region1.nameEn.value;
  const all = voivodeshipMainCodes(region1);
  return {
    heading: { key: 'plate.heading.voivodeship', params: { name } },
    codes: all.slice(
      0,
      Math.min(VOIVODESHIP_CARD_MAIN_CODES_COUNT, all.length),
    ),
  };
}
