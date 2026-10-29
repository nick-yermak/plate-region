import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region2 } from '@plate-region/plate-data';
import { describe, expect, it } from 'vitest';

import { examplePlateForCode } from './example-plate';
import { parsePlate } from './parse-plate';

function plateOrThrow(plate: string | undefined): string {
  if (plate === undefined) {
    throw new Error('expected a plate');
  }
  return plate;
}

const LETTERS = 20;
const LETTERS2 = LETTERS * LETTERS;
const D1 = 9;
const D2 = 99;
const D3 = 999;
const D4 = 9_999;
const D5 = 99_999;

const LAST = 1 - 2 ** -53;

/** § 30 ust. 2 pkt 1 lit. a tiret 1 (R-24) — DDDDD capacity. */
const LEN2_DDDDD = D5;
/** § 30 ust. 2 pkt 1 lit. a tiret 2 (R-24) — DDDDL capacity. */
const LEN2_DDDDL = D4 * LETTERS;
/** § 30 ust. 2 pkt 1 lit. a tiret 3 (R-24) — DDDLL capacity. */
const LEN2_DDDLL = D3 * LETTERS2;
/** § 30 ust. 2 pkt 1 lit. a tiret 4 (R-24) — DLDDD capacity. */
const LEN2_DLDDD = D1 * LETTERS * D3;
/** § 30 ust. 2 pkt 1 lit. a tiret 5 (R-24) — DLLDD capacity. */
const LEN2_DLLDD = D1 * LETTERS2 * D2;
/** § 30 ust. 2 pkt 3 lit. a tiret 1 (R-27) — DDDD capacity. */
const LEN2_DDDD = D4;
/** § 30 ust. 2 pkt 3 lit. a tiret 2 (R-27) — DDDL capacity. */
const LEN2_DDDL = D3 * LETTERS;
/** § 30 ust. 2 pkt 3 lit. a tiret 3 (R-27) — DDLD capacity. */
const LEN2_DDLD = D2 * LETTERS * D1;
/** § 30 ust. 2 pkt 3 lit. a tiret 4 (R-27) — DLDD capacity. */
const LEN2_DLDD = D1 * LETTERS * D2;
/** § 30 ust. 2 pkt 3 lit. a tiret 5 (R-27) — LDDD capacity. */
const LEN2_LDDD = LETTERS * D3;
/** § 30 ust. 2 pkt 3 lit. a tiret 6 (R-27) — DDLL capacity. */
const LEN2_DDLL = D2 * LETTERS2;
/** § 30 ust. 2 pkt 3 lit. a tiret 7 (R-27) — DLLD capacity. */
const LEN2_DLLD = D1 * LETTERS2 * D1;
/** § 30 ust. 2 pkt 3 lit. a tiret 8 (R-27) — LLDD capacity. */
const LEN2_LLDD = LETTERS2 * D2;
/** § 30 ust. 2 pkt 5 lit. a tiret 1 (R-30, R-45) — DDL capacity. */
const LEN2_DDL = D2 * LETTERS;
/** § 30 ust. 2 pkt 5 lit. a tiret 2 (R-30, R-45) — DDD capacity. */
const LEN2_DDD = D3;

/** Distinct layout capacities for a two-character code, source-table order. */
const LEN2_CAPS = [
  LEN2_DDDDD,
  LEN2_DDDDL,
  LEN2_DDDLL,
  LEN2_DLDDD,
  LEN2_DLLDD,
  LEN2_DDDD,
  LEN2_DDDL,
  LEN2_DDLD,
  LEN2_DLDD,
  LEN2_LDDD,
  LEN2_DDLL,
  LEN2_DLLD,
  LEN2_LLDD,
  LEN2_DDL,
  LEN2_DDD,
] as const;

/** § 30 ust. 2 pkt 1 lit. b tiret 1 (R-25) — LDDD capacity. */
const LEN3_LDDD = LETTERS * D3;
/** § 30 ust. 2 pkt 1 lit. b tiret 2 (R-25) — DDLL capacity. */
const LEN3_DDLL = D2 * LETTERS2;
/** § 30 ust. 2 pkt 1 lit. b tiret 3 (R-25) — DLDD capacity. */
const LEN3_DLDD = D1 * LETTERS * D2;
/** § 30 ust. 2 pkt 1 lit. b tiret 4 (R-25) — DDLD capacity. */
const LEN3_DDLD = D2 * LETTERS * D1;
/** § 30 ust. 2 pkt 1 lit. b tiret 5 (R-25) — DLLD capacity. */
const LEN3_DLLD = D1 * LETTERS2 * D1;
/** § 30 ust. 2 pkt 1 lit. b tiret 6 (R-25) — LLDD capacity. */
const LEN3_LLDD = LETTERS2 * D2;
/** § 30 ust. 2 pkt 1 lit. b tiret 7 (R-25) — DDDDD capacity. */
const LEN3_DDDDD = D5;
/** § 30 ust. 2 pkt 1 lit. b tiret 8 (R-25) — DDDDL capacity. */
const LEN3_DDDDL = D4 * LETTERS;
/** § 30 ust. 2 pkt 1 lit. b tiret 9 (R-25) — DDDLL capacity. */
const LEN3_DDDLL = D3 * LETTERS2;
/** § 30 ust. 2 pkt 3 lit. b tiret 7 (R-28) — LDDL capacity. */
const LEN3_LDDL = LETTERS * D2 * LETTERS;
/** § 30 ust. 2 pkt 3 lit. b tiret 8 (R-28) — LDLL capacity. */
const LEN3_LDLL = LETTERS * D1 * LETTERS2;
/** § 30 ust. 2 pkt 5 lit. b tiret 1 (R-31, R-45) — DL capacity. */
const LEN3_DL = D1 * LETTERS;
/** § 30 ust. 2 pkt 5 lit. b tiret 2 (R-31, R-45) — DD capacity. */
const LEN3_DD = D2;
/** § 30 ust. 2 pkt 5 lit. b tiret 3 (R-31, R-45) — LD capacity. */
const LEN3_LD = LETTERS * D1;

/** Distinct layout capacities for a three-character code, source-table order. */
const LEN3_CAPS = [
  LEN3_LDDD,
  LEN3_DDLL,
  LEN3_DLDD,
  LEN3_DDLD,
  LEN3_DLLD,
  LEN3_LLDD,
  LEN3_DDDDD,
  LEN3_DDDDL,
  LEN3_DDDLL,
  LEN3_LDDL,
  LEN3_LDLL,
  LEN3_DL,
  LEN3_DD,
  LEN3_LD,
] as const;

type CodeEntry = {
  readonly code: string;
  readonly region2: Region2;
};

const CODES: readonly CodeEntry[] = (() => {
  const entries: CodeEntry[] = [];
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      for (const code of fullCodes(region1, region2)) {
        entries.push({ code, region2 });
      }
    }
  }
  return entries;
})();

function totalOf(caps: readonly number[]): number {
  let total = 0;
  for (const cap of caps) {
    total += cap;
  }
  return total;
}

function rFor(index: number, total: number): number {
  return index === total - 1 ? LAST : (index + 0.5) / total;
}

describe('examplePlateForCode round-trip', () => {
  for (const { code, region2 } of CODES) {
    it(code, () => {
      const caps = code.length === 2 ? LEN2_CAPS : LEN3_CAPS;
      const total = totalOf(caps);
      let start = 0;
      for (const cap of caps) {
        for (const index of [start, start + cap - 1]) {
          const plate = plateOrThrow(
            examplePlateForCode(code, () => rFor(index, total)),
          );
          const result = parsePlate(plate);
          expect(result.status).toBe('resolved');
          if (result.status === 'resolved') {
            expect(result.region2).toBe(region2);
          }
        }
        start += cap;
      }
    });
  }
});
