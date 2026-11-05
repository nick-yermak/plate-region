import type { PlateSeries } from '@plate-region/plate-domain';

export const SERIES_HEADING_KEYS = {
  'armed-forces': 'plate.series.armedForces',
  'state-protection-service': 'plate.series.stateProtectionService',
  police: 'plate.series.police',
  'abw-aw': 'plate.series.abwAw',
  cba: 'plate.series.cba',
  'border-guard': 'plate.series.borderGuard',
  'customs-and-tax-service': 'plate.series.customsAndTaxService',
  'skw-sww': 'plate.series.skwSww',
} as const satisfies Record<PlateSeries, string>;
