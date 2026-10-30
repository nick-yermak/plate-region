import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from './storage.constants';
import { StorageService } from './storage.service';

describe('StorageService', () => {
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
    const service = TestBed.inject(StorageService);
    expect(service.get(STORAGE_KEYS.theme)).toBe('dark');
  });

  it('get of an absent key returns null', () => {
    getItem.mockReturnValue(null);
    const service = TestBed.inject(StorageService);
    expect(service.get(STORAGE_KEYS.theme)).toBeNull();
  });

  it('set writes the value', () => {
    const service = TestBed.inject(StorageService);
    service.set(STORAGE_KEYS.theme, 'dark');
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEYS.theme, 'dark');
  });

  it('get returns null when getItem throws', () => {
    getItem.mockImplementation(() => {
      throw new Error('denied');
    });
    const service = TestBed.inject(StorageService);
    expect(service.get(STORAGE_KEYS.theme)).toBeNull();
  });

  it('set does not throw when setItem throws', () => {
    setItem.mockImplementation(() => {
      throw new Error('denied');
    });
    const service = TestBed.inject(StorageService);
    expect(() => service.set(STORAGE_KEYS.theme, 'dark')).not.toThrow();
  });

  it('remove deletes the key', () => {
    const service = TestBed.inject(StorageService);
    service.remove(STORAGE_KEYS.theme);
    expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.theme);
  });

  it('remove does not throw when removeItem throws', () => {
    removeItem.mockImplementation(() => {
      throw new Error('denied');
    });
    const service = TestBed.inject(StorageService);
    expect(() => service.remove(STORAGE_KEYS.theme)).not.toThrow();
  });
});
