import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { LocalStorageKey } from './storage.types';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly document = inject(DOCUMENT);

  get(key: LocalStorageKey): string | null {
    return this.attempt((storage) => storage.getItem(key), null);
  }

  set(key: LocalStorageKey, value: string): void {
    this.attempt((storage) => {
      storage.setItem(key, value);
    }, undefined);
  }

  remove(key: LocalStorageKey): void {
    this.attempt((storage) => {
      storage.removeItem(key);
    }, undefined);
  }

  private attempt<T>(action: (storage: Storage) => T, fallback: T): T {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (!storage) {
        return fallback;
      }
      return action(storage);
    } catch {
      // Reading localStorage throws when storage is blocked (cookies disabled, some private modes); callers fall back to defaults.
      return fallback;
    }
  }
}
