import { Injectable } from '@angular/core';
import { StorageKey } from './storage.types';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get(key: StorageKey): string | null {
    void key;
    return null;
  }

  set(key: StorageKey, value: string): void {
    void key;
    void value;
  }

  remove(key: StorageKey): void {
    void key;
  }
}
