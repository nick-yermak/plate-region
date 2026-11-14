import type { Region1 } from '@plate-region/plate-data';
import { voivodeshipSlug } from '@plate-region/plate-domain';

import type { VoivodeshipLink } from './plate.types';
import type { Language } from '../i18n/language.types';
import type { TranslatableMessage } from '../i18n/i18n.types';
import { voivodeshipMainCodes } from './voivodeship-main-codes';

export type VoivodeshipCardCode = {
  readonly code: string;
  readonly name: TranslatableMessage;
  readonly link: VoivodeshipLink;
};

export type VoivodeshipCardView = {
  readonly heading: TranslatableMessage;
  readonly codes: readonly VoivodeshipCardCode[];
};

/** Every main code of `region1` as a voivodeship-page `#CODE` link (D-54 Update #176). */
export function voivodeshipCardView(
  region1: Region1,
  language: Language,
): VoivodeshipCardView {
  const name = language === 'pl' ? region1.name : region1.nameEn.value;
  const slug = voivodeshipSlug(region1);
  return {
    heading: { key: 'plate.heading.voivodeship', params: { name } },
    codes: voivodeshipMainCodes(region1).map((row) => ({
      code: row.code,
      name: row.name,
      link: { slug, fragment: row.code },
    })),
  };
}
