import { formatDistrictList } from './voivodeship-messages';

describe('formatDistrictList', () => {
  it('joins districts with Intl.ListFormat conjunction in en and pl', () => {
    expect(formatDistrictList('en', ['Rembertów', 'Wilanów', 'Włochy'])).toBe(
      'Rembertów, Wilanów, and Włochy',
    );
    expect(formatDistrictList('pl', ['Rembertów', 'Wilanów', 'Włochy'])).toBe(
      'Rembertów, Wilanów i Włochy',
    );
  });
});
