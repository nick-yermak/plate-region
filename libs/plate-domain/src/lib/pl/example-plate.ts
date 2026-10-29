import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1 } from '@plate-region/plate-data';

import {
  COLUMN_4_5_TEMPLATES,
  runCapacity,
  splitLayout,
  STANDARD_LETTERS,
  type LayoutRun,
  type VehiclePartTemplate,
} from './vehicle-part-templates';

/** A number in the half-open interval [0, 1). */
export type RandomSource = () => number;

const LETTER_CHARS = STANDARD_LETTERS.join('');

function distinctLayouts(
  templates: readonly [VehiclePartTemplate, ...VehiclePartTemplate[]],
): readonly [string, ...string[]] {
  const [head, ...tail] = templates;
  const seen = new Set<string>([head.layout]);
  const layouts: [string, ...string[]] = [head.layout];
  for (const template of tail) {
    if (seen.has(template.layout)) {
      continue;
    }
    seen.add(template.layout);
    layouts.push(template.layout);
  }
  return layouts;
}

function layoutCapacity(layout: string): number {
  let product = 1;
  for (const run of splitLayout(layout)) {
    product *= runCapacity(run, false);
  }
  return product;
}

function totalOf(layouts: readonly string[]): number {
  let total = 0;
  for (const layout of layouts) {
    total += layoutCapacity(layout);
  }
  return total;
}

const LAYOUTS_LEN2 = distinctLayouts(COLUMN_4_5_TEMPLATES[1]);
const LAYOUTS_LEN3 = distinctLayouts(COLUMN_4_5_TEMPLATES[2]);
const TOTAL_LEN2 = totalOf(LAYOUTS_LEN2);
const TOTAL_LEN3 = totalOf(LAYOUTS_LEN3);

function layoutsFor(code: string): readonly [string, ...string[]] {
  return code.length === 2 ? LAYOUTS_LEN2 : LAYOUTS_LEN3;
}

function totalFor(code: string): number {
  return code.length === 2 ? TOTAL_LEN2 : TOTAL_LEN3;
}

const FULL_CODES: ReadonlySet<string> = (() => {
  const codes = new Set<string>();
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      for (const code of fullCodes(region1, region2)) {
        codes.add(code);
      }
    }
  }
  return codes;
})();

function codesForRegion1(region1: Region1): readonly [string, ...string[]] {
  const codes: string[] = [];
  for (const region2 of registry.region2) {
    if (region2.region1Letter !== region1.letters[0]) {
      continue;
    }
    for (const code of fullCodes(region1, region2)) {
      codes.push(code);
    }
  }
  const [head, ...tail] = codes;
  if (head === undefined) {
    throw new RangeError(
      `region1 ${region1.name} has no full codes in the registry`,
    );
  }
  return [head, ...tail];
}

function takeItem<T>(
  items: readonly [T, ...T[]],
  index: number,
  spanOf: (item: T) => number,
): { readonly item: T; readonly local: number } {
  const [head] = items;
  let chosen = { item: head, local: index };
  let start = 0;
  for (const item of items) {
    if (start <= index) {
      chosen = { item, local: index - start };
    }
    start += spanOf(item);
  }
  return chosen;
}

function lettersFor(index: number, length: number): string {
  const base = STANDARD_LETTERS.length;
  let remaining = index;
  let text = '';
  for (let place = length - 1; place >= 0; place -= 1) {
    const weight = base ** place;
    const digit = Math.floor(remaining / weight);
    remaining -= digit * weight;
    text += LETTER_CHARS.charAt(digit);
  }
  return text;
}

function runText(run: LayoutRun, index: number): string {
  if (run.kind === 'D') {
    return String(index + 1).padStart(run.length, '0');
  }
  return lettersFor(index, run.length);
}

function characters(layout: string, index: number): string {
  const runs = splitLayout(layout);
  const weighted: { readonly run: LayoutRun; readonly place: number }[] = [];
  let place = 1;
  for (const run of [...runs].reverse()) {
    weighted.push({ run, place });
    place *= runCapacity(run, false);
  }
  weighted.reverse();
  let cursor = index;
  let text = '';
  for (const entry of weighted) {
    const runIndex = Math.floor(cursor / entry.place);
    cursor -= runIndex * entry.place;
    text += runText(entry.run, runIndex);
  }
  return text;
}

function requireUnitInterval(r: number): void {
  if (!(r >= 0 && r < 1)) {
    throw new RangeError('random must return a value in [0, 1)');
  }
}

function plateForCodeIndex(code: string, index: number): string {
  const { item: layout, local } = takeItem(
    layoutsFor(code),
    index,
    layoutCapacity,
  );
  return `${code} ${characters(layout, local)}`;
}

/**
 * Example ordinary or vintage plate for one Annex 13 full code.
 *
 * Two characters use § 30 ust. 2 pkt 1 lit. a (R-24), pkt 3 lit. a (R-27)
 * and pkt 5 lit. a (R-30). Three characters use pkt 1 lit. b (R-25),
 * pkt 3 lit. b (R-28) and pkt 5 lit. b (R-31). Vintage plates use the
 * pkt 5 layouts, Annex 12 Rys. 17–20 (R-45). A digit run takes the values
 * 1 … 10^k − 1 — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 *
 * `random` is called once when `code` is a full code of the current registry,
 * and not at all otherwise. A value outside [0, 1), including NaN, throws
 * `RangeError`. The result is `<full code> <vehicle part>` with one space.
 * Returns `undefined` when `code` is not a full code of the current registry.
 * Individual plates are not produced — § 32 ust. 3 (R-49).
 */
export function examplePlateForCode(
  code: string,
  random: RandomSource,
): string | undefined {
  if (!FULL_CODES.has(code)) {
    return undefined;
  }
  const r = random();
  requireUnitInterval(r);
  return plateForCodeIndex(code, Math.floor(r * totalFor(code)));
}

/**
 * Example ordinary or vintage plate under one voivodeship's full codes.
 *
 * The plate is one of the plates {@link examplePlateForCode} can return for
 * those codes: § 30 ust. 2 pkt 1 lit. a (R-24), pkt 1 lit. b (R-25),
 * pkt 3 lit. a (R-27), pkt 3 lit. b (R-28), pkt 5 lit. a (R-30),
 * pkt 5 lit. b (R-31), Annex 12 Rys. 17–20 (R-45). A digit run takes the
 * values 1 … 10^k − 1 — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 *
 * `region1` is a record from the plate-data registry. `random` is called
 * once when `region1` has full codes in the registry. A `region1` without
 * full codes throws `RangeError` without calling `random`. A value outside
 * [0, 1), including NaN, throws `RangeError`.
 * The result is `<full code> <vehicle part>` with one space.
 * Individual plates are not produced — § 32 ust. 3 (R-49).
 */
export function examplePlateForRegion1(
  region1: Region1,
  random: RandomSource,
): string {
  const codes = codesForRegion1(region1);
  const r = random();
  requireUnitInterval(r);
  let total = 0;
  for (const code of codes) {
    total += totalFor(code);
  }
  const { item: code, local } = takeItem(
    codes,
    Math.floor(r * total),
    totalFor,
  );
  return plateForCodeIndex(code, local);
}
