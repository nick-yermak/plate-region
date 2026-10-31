import { TestBed } from '@angular/core/testing';

import { TranslocoFetchLoader } from './transloco-fetch.loader';

describe('TranslocoFetchLoader', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests i18n/en.json without overriding fetch options', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: 'world' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const loader = TestBed.inject(TranslocoFetchLoader);
    await loader.getTranslation('en');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('i18n/en.json');
    expect(fetchMock.mock.calls[0]?.[1]).toBeUndefined();
  });

  it('rejects when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      }),
    );

    const loader = TestBed.inject(TranslocoFetchLoader);
    await expect(loader.getTranslation('en')).rejects.toThrow();
  });
});
