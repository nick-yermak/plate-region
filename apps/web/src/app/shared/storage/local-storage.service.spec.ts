import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';
import { LOCAL_STORAGE_KEYS } from './storage.constants';

describe('LocalStorageService', () => {
  let getItem: ReturnType<typeof vi.spyOn>;
  let setItem: ReturnType<typeof vi.spyOn>;
  let removeItem: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getItem = vi.spyOn(Storage.prototype, 'getItem');
    setItem = vi.spyOn(Storage.prototype, 'setItem');
    removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('get returns a stored value', () => {
    getItem.mockReturnValue('dark');
    const service = TestBed.inject(LocalStorageService);
    expect(service.get(LOCAL_STORAGE_KEYS.theme)).toBe('dark');
  });

  it('get of an absent key returns null', () => {
    getItem.mockReturnValue(null);
    const service = TestBed.inject(LocalStorageService);
    expect(service.get(LOCAL_STORAGE_KEYS.theme)).toBeNull();
  });

  it('set writes the value', () => {
    const service = TestBed.inject(LocalStorageService);
    service.set(LOCAL_STORAGE_KEYS.theme, 'dark');
    expect(setItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.theme, 'dark');
  });

  it('get returns null when getItem throws', () => {
    getItem.mockImplementation(() => {
      throw new Error('denied');
    });
    const service = TestBed.inject(LocalStorageService);
    expect(service.get(LOCAL_STORAGE_KEYS.theme)).toBeNull();
  });

  it('set does not throw when setItem throws', () => {
    setItem.mockImplementation(() => {
      throw new Error('denied');
    });
    const service = TestBed.inject(LocalStorageService);
    expect(() => service.set(LOCAL_STORAGE_KEYS.theme, 'dark')).not.toThrow();
  });

  it('remove deletes the key', () => {
    const service = TestBed.inject(LocalStorageService);
    service.remove(LOCAL_STORAGE_KEYS.theme);
    expect(removeItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.theme);
  });

  it('remove does not throw when removeItem throws', () => {
    removeItem.mockImplementation(() => {
      throw new Error('denied');
    });
    const service = TestBed.inject(LocalStorageService);
    expect(() => service.remove(LOCAL_STORAGE_KEYS.theme)).not.toThrow();
  });

  it('returns fallbacks when the localStorage getter throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    if (!descriptor?.configurable) {
      throw new Error(
        'jsdom does not allow redefining window.localStorage; cannot run S8',
      );
    }
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      const service = TestBed.inject(LocalStorageService);
      expect(service.get(LOCAL_STORAGE_KEYS.theme)).toBeNull();
      expect(() => service.set(LOCAL_STORAGE_KEYS.theme, 'dark')).not.toThrow();
      expect(() => service.remove(LOCAL_STORAGE_KEYS.theme)).not.toThrow();
    } finally {
      if (descriptor) {
        Object.defineProperty(window, 'localStorage', descriptor);
      }
    }
  });
});
