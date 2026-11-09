import { examplePlateForCode } from './example-plate';

/** @internal Exported for its unit spec only. */
export function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** @internal Exported for its unit spec only. */
export function fmix32(hash: number): number {
  let h = hash >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Deterministic example plate for a full registry code across builds and devices.
 * The MurmurHash3 finalizer spreads neighbouring codes over the whole [0, 1) range.
 */
export function stableExamplePlateForCode(code: string): string | undefined {
  return examplePlateForCode(code, () => fmix32(fnv1a32(code)) / 2 ** 32);
}
