import type { Region2 } from '@plate-region/plate-data';

import type { TranslatableMessage } from '../../i18n/i18n.types';

export function countyHeading(region2: Region2): TranslatableMessage {
  return {
    key:
      region2.kind === 'city' ? 'county.heading.city' : 'county.heading.land',
    params: { name: region2.name },
  };
}
