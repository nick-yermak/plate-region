import { testingText } from '../i18n/testing-langs';
import { SERIES_HEADING_KEYS } from './plate.constants';

describe('SERIES_HEADING_KEYS', () => {
  it.each(Object.values(SERIES_HEADING_KEYS))(
    'heading key %s exists in en and pl',
    (key) => {
      const en = testingText('en', key);
      const pl = testingText('pl', key);
      expect(en.length).toBeGreaterThan(0);
      expect(pl.length).toBeGreaterThan(0);
    },
  );
});
