import { STORAGE_KEYS } from './storage.constants';

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
