import {
  assertMatchingKeySets,
  mergeDictionaryFiles,
} from './merge-dictionaries';

describe('mergeDictionaryFiles', () => {
  it('fails when a top-level key is duplicated across files', () => {
    expect(() =>
      mergeDictionaryFiles([
        { name: 'home', content: { home: { title: 'Home' } } },
        { name: 'home', content: { home: { title: 'Other' } } },
      ]),
    ).toThrow(/Duplicate top-level dictionary key "home"/);
  });

  it('fails when the top-level key differs from the feature folder name', () => {
    expect(() =>
      mergeDictionaryFiles([
        { name: 'home', content: { layout: { title: 'Home' } } },
      ]),
    ).toThrow(
      /Dictionary for feature "home" top-level key must be "home", found "layout"/,
    );
  });

  it('merges feature dictionaries under their top-level keys', () => {
    expect(
      mergeDictionaryFiles([
        { name: 'home', content: { home: { title: 'Home' } } },
        { name: 'layout', content: { layout: { menu: 'Menu' } } },
      ]),
    ).toEqual({
      home: { title: 'Home' },
      layout: { menu: 'Menu' },
    });
  });
});

describe('assertMatchingKeySets', () => {
  it('fails when en and pl flattened key sets differ', () => {
    expect(() =>
      assertMatchingKeySets(
        { home: { title: 'Home', extra: 'x' } },
        { home: { title: 'Strona' } },
      ),
    ).toThrow(/en and pl flattened key sets differ/);
  });
});
