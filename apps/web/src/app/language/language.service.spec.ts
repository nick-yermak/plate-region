import { DOCUMENT } from '@angular/common';
import { of, throwError, Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { NzI18nService } from 'ng-zorro-antd/i18n';
import { TranslocoService } from '@jsverse/transloco';

import { LanguageService } from './language.service';
import { LOCAL_STORAGE_KEYS } from '../shared/storage/storage.constants';
import { LocalStorageService } from '../shared/storage/local-storage.service';

describe('LanguageService', () => {
  let storage: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
  let transloco: {
    setActiveLang: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
  };
  let nz: { setLocale: ReturnType<typeof vi.fn> };
  let documentElement: { lang: string };

  beforeEach(() => {
    localStorage.clear();
    storage = {
      get: vi.fn(() => null),
      set: vi.fn(),
    };
    transloco = {
      setActiveLang: vi.fn(),
      load: vi.fn(() => of({})),
    };
    nz = { setLocale: vi.fn() };
    documentElement = { lang: 'en' };
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: LocalStorageService, useValue: storage },
        { provide: TranslocoService, useValue: transloco },
        { provide: NzI18nService, useValue: nz },
        {
          provide: DOCUMENT,
          useValue: {
            documentElement,
            defaultView: {
              navigator: { language: 'en-US' },
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('starts from stored pl and does not write storage', () => {
    storage.get.mockReturnValue('pl');
    const service = TestBed.inject(LanguageService);
    expect(service.language()).toBe('pl');
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('starts from navigator language pl-PL when storage is empty', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: LocalStorageService, useValue: storage },
        { provide: TranslocoService, useValue: transloco },
        { provide: NzI18nService, useValue: nz },
        {
          provide: DOCUMENT,
          useValue: {
            documentElement,
            defaultView: {
              navigator: { language: 'pl-PL' },
            },
          },
        },
      ],
    });
    const service = TestBed.inject(LanguageService);
    expect(service.language()).toBe('pl');
  });

  it('starts from en when the stored value is invalid', () => {
    storage.get.mockReturnValue('xx');
    const service = TestBed.inject(LanguageService);
    expect(service.language()).toBe('en');
  });

  it('setLanguage persists, calls setActiveLang, sets html lang, and updates the signal', () => {
    const service = TestBed.inject(LanguageService);
    service.setLanguage('pl');
    expect(service.language()).toBe('pl');
    expect(storage.set).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.language, 'pl');
    expect(transloco.setActiveLang).toHaveBeenCalledWith('pl');
    expect(documentElement.lang).toBe('pl');
  });

  it('setLanguage passes locale pl and then en to NzI18nService', () => {
    const service = TestBed.inject(LanguageService);
    service.setLanguage('pl');
    expect(nz.setLocale).toHaveBeenCalled();
    const plCall = nz.setLocale.mock.calls[nz.setLocale.mock.calls.length - 1];
    const plLocale = plCall?.[0] as { locale: string };
    expect(plLocale.locale).toBe('pl');

    service.setLanguage('en');
    expect(nz.setLocale).toHaveBeenCalled();
    const enCall = nz.setLocale.mock.calls[nz.setLocale.mock.calls.length - 1];
    const enLocale = enCall?.[0] as { locale: string };
    expect(enLocale.locale).toBe('en');
  });

  it('setLanguage of the current language does not persist again and does not set switching', () => {
    const service = TestBed.inject(LanguageService);
    service.setLanguage('en');
    expect(storage.set).not.toHaveBeenCalled();
    expect(service.switching()).toBe(false);
  });

  it('initial load leaves switching false and sets dictionaryReady on load success', () => {
    const load$ = new Subject<Record<string, unknown>>();
    transloco.load.mockReturnValue(load$.asObservable());
    const service = TestBed.inject(LanguageService);
    expect(service.switching()).toBe(false);
    load$.next({});
    load$.complete();
    expect(service.dictionaryReady()).toBe(true);
    expect(service.switching()).toBe(false);
  });

  it('setLanguage sets switching until the load of that language succeeds', () => {
    const load$ = new Subject<Record<string, unknown>>();
    transloco.load.mockReturnValue(load$.asObservable());
    const service = TestBed.inject(LanguageService);
    service.setLanguage('pl');
    expect(service.switching()).toBe(true);
    load$.next({});
    load$.complete();
    expect(service.switching()).toBe(false);
    expect(service.dictionaryReady()).toBe(true);
  });

  it('a rejected load sets loadFailed, clears switching, and leaves dictionaryReady false', () => {
    transloco.load.mockReturnValue(throwError(() => new Error('fail')));
    const service = TestBed.inject(LanguageService);
    service.setLanguage('pl');
    expect(service.loadFailed()).toBe(true);
    expect(service.switching()).toBe(false);
    expect(service.dictionaryReady()).toBe(false);
  });

  it('ignores the load result of a previous language', () => {
    const plLoad$ = new Subject<Record<string, unknown>>();
    const enLoad$ = new Subject<Record<string, unknown>>();
    transloco.load
      .mockReturnValueOnce(of({}))
      .mockReturnValueOnce(plLoad$.asObservable())
      .mockReturnValueOnce(enLoad$.asObservable());

    const service = TestBed.inject(LanguageService);
    expect(service.dictionaryReady()).toBe(true);

    service.setLanguage('pl');
    service.setLanguage('en');
    expect(service.switching()).toBe(true);
    const readyBeforeStale = service.dictionaryReady();

    plLoad$.next({});
    plLoad$.complete();
    expect(service.switching()).toBe(true);
    expect(service.dictionaryReady()).toBe(readyBeforeStale);

    enLoad$.next({});
    enLoad$.complete();
    expect(service.switching()).toBe(false);
    expect(service.dictionaryReady()).toBe(true);
  });
});
