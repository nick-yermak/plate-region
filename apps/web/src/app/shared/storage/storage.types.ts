import { LOCAL_STORAGE_KEYS } from './storage.constants';

export type LocalStorageKey =
  (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];
