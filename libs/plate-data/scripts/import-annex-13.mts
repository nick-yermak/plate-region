/**
 * Import Annex 13 (Dz.U. 2024 poz. 1709) from pdftotext -layout output into
 * libs/plate-data/src/lib/pl/registry.ts. Amendments are applied as an
 * explicit typed patch list (D-26).
 *
 * Usage:
 *   pdftotext -layout D20241709.pdf tmp/D20241709.txt
 *   node libs/plate-data/scripts/import-annex-13.mts tmp/D20241709.txt
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { readFileSync, writeFileSync } from 'node:fs';

import type {
  Provenance,
  Region1,
  Region2,
  Registry,
} from '../src/lib/pl/model.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(SCRIPT_DIR, '../src/lib/pl/registry.ts');

const FOOTER_RE = /^Dziennik Ustaw\s+–\s+\d+\s+–\s+Poz\.\s+1709$/;
const COLUMN_HEADER_RE = /^\s*1\s+2\s+3\s+4\s+5\s+6\s*$/;
const ANNEX_14_RE = /Załącznik nr 14/;
const COL6_RANGE_RE = /^([A-Z])0[–-]([A-Z])9$/;

/** Conventional English adjectival / common forms; not taken from the act (D-26). */
const ENGLISH_NAMES: Readonly<Record<string, string>> = {
  dolnośląskie: 'Lower Silesian',
  'kujawsko-pomorskie': 'Kuyavian-Pomeranian',
  lubelskie: 'Lublin',
  lubuskie: 'Lubusz',
  łódzkie: 'Łódź',
  małopolskie: 'Lesser Poland',
  mazowieckie: 'Masovian',
  opolskie: 'Opole',
  podkarpackie: 'Subcarpathian',
  podlaskie: 'Podlaskie',
  pomorskie: 'Pomeranian',
  śląskie: 'Silesian',
  świętokrzyskie: 'Świętokrzyskie',
  'warmińsko-mazurskie': 'Warmian-Masurian',
  wielkopolskie: 'Greater Poland',
  zachodniopomorskie: 'West Pomeranian',
};

interface Patch {
  readonly act: string;
  readonly provision: string;
  readonly ordinal: number;
  readonly region2: string;
  readonly after: string;
  readonly add: readonly [string, ...string[]];
}

const PATCHES: readonly Patch[] = [
  {
    act: 'Dz.U. 2025 poz. 939',
    provision: '§ 1 pkt 4 lit. a',
    ordinal: 1,
    region2: 'wrocławski',
    after: 'WR',
    add: ['WW'],
  },
  {
    act: 'Dz.U. 2025 poz. 939',
    provision: '§ 1 pkt 4 lit. b',
    ordinal: 3,
    region2: 'lubelski',
    after: 'UB',
    add: ['VB'],
  },
  {
    act: 'Dz.U. 2025 poz. 939',
    provision: '§ 1 pkt 4 lit. c',
    ordinal: 8,
    region2: 'nyski',
    after: 'NY',
    add: ['NX'],
  },
  {
    act: 'Dz.U. 2026 poz. 891',
    provision: '§ 1 pkt 9 lit. a',
    ordinal: 2,
    region2: 'chełmiński',
    after: 'CH',
    add: ['CE', 'CM'],
  },
  {
    act: 'Dz.U. 2026 poz. 891',
    provision: '§ 1 pkt 9 lit. b',
    ordinal: 12,
    region2: 'tarnogórski',
    after: 'TA',
    add: ['TR', 'TN'],
  },
  {
    act: 'Dz.U. 2026 poz. 891',
    provision: '§ 1 pkt 9 lit. c',
    ordinal: 14,
    region2: 'olsztyński',
    after: 'OL',
    add: ['OZ', 'OP'],
  },
];

const PROVENANCE: Provenance = {
  legalStateDate: '2026-10-05',
  sources: [
    { act: 'Dz.U. 2024 poz. 1709', provision: 'załącznik nr 13' },
    { act: 'Dz.U. 2025 poz. 939', provision: '§ 1 pkt 4' },
    { act: 'Dz.U. 2026 poz. 891', provision: '§ 1 pkt 9' },
  ],
};

interface MutableRegion1 {
  country: 'PL';
  ordinal: number;
  name: string;
  nameEn: { value: string; origin: 'unofficial' };
  letters: string[];
  letterDigitCodes: string[];
  /** Column-4 text as printed, e.g. "D, V" or "C". */
  column4Text: string;
}

interface MutableRegion2 {
  country: 'PL';
  region1Letter: string;
  name: string;
  kind: 'city' | 'land';
  suffixes: string[];
  ordinal: number;
}

type Pending =
  | { kind: 'region1Name'; r1: MutableRegion1; startLine: number }
  | { kind: 'region1Col6'; r1: MutableRegion1; startLine: number }
  | { kind: 'region2Name'; r2: MutableRegion2; startLine: number }
  | { kind: 'region2Suffixes'; r2: MutableRegion2; startLine: number };

function fail(message: string): never {
  throw new Error(message);
}

/** Narrow a possibly-undefined value or throw with context (no non-null assertions). */
function expectDefined<T>(
  value: T | undefined | null,
  expected: string,
  lineNo?: number,
): T {
  if (value === undefined || value === null) {
    const where = lineNo === undefined ? '' : `line ${lineNo}: `;
    fail(`${where}expected ${expected}, got ${String(value)}`);
  }
  return value;
}

function column4Text(letters: readonly string[]): string {
  return letters.join(', ');
}

function parseLetters(text: string): string[] {
  const parts = text.split(',').map((p) => p.trim());
  if (parts.length < 1 || parts.length > 2) {
    fail(`expected 1 or 2 letters, got "${text}"`);
  }
  for (const p of parts) {
    if (!/^[A-Z]$/.test(p)) {
      fail(`invalid letter "${p}" in "${text}"`);
    }
  }
  return parts;
}

function parseSuffixList(text: string): {
  suffixes: string[];
  trailingComma: boolean;
} {
  const trimmed = text.trim();
  const trailingComma = trimmed.endsWith(',');
  const body = trailingComma ? trimmed.slice(0, -1).trim() : trimmed;
  if (body.length === 0) {
    fail(`empty suffix list: "${text}"`);
  }
  const suffixes = body.split(',').map((s) => s.trim());
  for (const s of suffixes) {
    if (!/^[A-Z]{1,2}$/.test(s)) {
      fail(`invalid suffix "${s}" in "${text}"`);
    }
  }
  return { suffixes, trailingComma };
}

function expandCol6(
  text: string,
  letters: readonly string[],
  lineNo: number,
): { codes: string[]; trailingComma: boolean } {
  const trimmed = text.trim();
  const trailingComma = trimmed.endsWith(',');
  const body = trailingComma ? trimmed.slice(0, -1).trim() : trimmed;
  const ranges = body
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  const codes: string[] = [];
  for (const range of ranges) {
    const m = COL6_RANGE_RE.exec(range);
    if (m === null) {
      fail(`line ${lineNo}: column-6 range is not X0–X9: "${range}"`);
    }
    const start = expectDefined(
      m[1],
      `start letter in column-6 range "${range}"`,
      lineNo,
    );
    const end = expectDefined(
      m[2],
      `end letter in column-6 range "${range}"`,
      lineNo,
    );
    if (start !== end) {
      fail(`line ${lineNo}: column-6 range letters differ: "${range}"`);
    }
    if (!letters.includes(start)) {
      fail(
        `line ${lineNo}: column-6 letter ${start} is not among voivodeship letters ${letters.join(',')}`,
      );
    }
    for (let d = 0; d <= 9; d++) {
      codes.push(`${start}${d}`);
    }
  }
  return { codes, trailingComma };
}

function kindOf(name: string): 'city' | 'land' {
  // Annex 13 capitalises cities with powiat rights; m.st. (miasto stołeczne) is
  // the lowercase abbreviation in the capital's official name. Position in the
  // block is not used — m.st. Warszawa is listed among the powiats.
  if (name.startsWith('m.st. ') || /^\p{Lu}/u.test(name)) {
    return 'city';
  }
  return 'land';
}

function stripColumn4(
  remainder: string,
  letters: readonly string[],
  column4: string,
): string {
  const spaced = column4;
  if (remainder === spaced || remainder.startsWith(spaced + ' ')) {
    return remainder === spaced
      ? ''
      : remainder.slice(spaced.length).trimStart();
  }
  // Single-letter voivodeship: region1 letter and one-letter suffix printed
  // without a space (Opole OP, brzeski OB, Bydgoszcz CB).
  if (letters.length === 1) {
    const letter = expectDefined(
      letters[0],
      'primary letter of a single-letter voivodeship',
    );
    if (remainder.startsWith(letter) && remainder.length > letter.length) {
      const rest = remainder.slice(letter.length);
      // Merged only when the next character is a letter (suffix), not a space
      // or comma (those belong to the spaced form, already handled above).
      if (/^[A-Z]/.test(rest)) {
        return rest;
      }
    }
  }
  fail(
    `column-4 text "${column4}" (letters ${letters.join(',')}) does not match remainder "${remainder}"`,
  );
}

function joinHyphen(
  head: string,
  continuation: string,
): { joined: string; keptHyphen: boolean } {
  if (!head.endsWith('-')) {
    fail(`joinHyphen called on name that does not end with -: "${head}"`);
  }
  if (continuation.startsWith('-')) {
    return { joined: head + continuation.slice(1), keptHyphen: true };
  }
  // Soft line break: drop the trailing hyphen (ZACHODNIO- / POMORSKIE).
  return { joined: head.slice(0, -1) + continuation, keptHyphen: false };
}

function logJoin(message: string): void {
  process.stderr.write(message + '\n');
}

function parseAnnex(text: string): {
  region1: MutableRegion1[];
  region2: MutableRegion2[];
} {
  const rawLines = text.split(/\r?\n/);
  // 1-based line numbers matching pdftotext output.
  const lines = rawLines.map((line, i) => ({
    no: i + 1,
    // Strip BOM that poppler emits on page-break lines.
    text: line.replace(/^\uFEFF/, ''),
  }));

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = expectDefined(lines[i], `input line at index ${i}`);
    if (COLUMN_HEADER_RE.test(line.text)) {
      startIdx = i + 1;
      break;
    }
  }
  if (startIdx < 0) {
    fail('column header row (1 2 3 4 5 6) not found');
  }

  let endIdx = -1;
  for (let i = startIdx; i < lines.length; i++) {
    const line = expectDefined(lines[i], `input line at index ${i}`);
    if (ANNEX_14_RE.test(line.text)) {
      endIdx = i;
      break;
    }
  }
  if (endIdx < 0) {
    fail('Załącznik nr 14 marker not found');
  }

  const region1: MutableRegion1[] = [];
  const region2: MutableRegion2[] = [];
  let pending: Pending | null = null;
  let current: MutableRegion1 | null = null;

  const VOIV_RE =
    /^(\d{1,2})\s+([A-ZĄĆĘŁŃÓŚŹŻ]+-?)\s+([A-Z](?:, [A-Z])?)\s+(.+)$/;

  for (let i = startIdx; i < endIdx; i++) {
    const { no, text } = expectDefined(lines[i], `input line at index ${i}`);
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      continue;
    }
    if (FOOTER_RE.test(trimmed)) {
      continue;
    }

    // Continuations first — a new row must not start while a join is open.
    if (pending !== null) {
      if (pending.kind === 'region1Name') {
        const cont = trimmed;
        if (!/^[A-ZĄĆĘŁŃÓŚŹŻ-]/.test(cont)) {
          fail(
            `line ${no}: cannot classify (expected region1 name continuation): "${text}"`,
          );
        }
        // Name-only continuation may still carry column 4/6 on the same line
        // in principle; in this PDF it never does. Reject extras loudly.
        if (/\s{2,}/.test(cont)) {
          fail(
            `line ${no}: unexpected fields on region1 name continuation: "${text}"`,
          );
        }
        const { joined, keptHyphen } = joinHyphen(pending.r1.name, cont);
        logJoin(
          `join region1 name lines ${pending.startLine}-${no}: "${pending.r1.name}" + "${cont}" → "${joined}" (hyphen ${keptHyphen ? 'kept' : 'dropped'})`,
        );
        pending.r1.name = joined;
        pending = null;
        continue;
      }

      if (pending.kind === 'region1Col6') {
        const { codes, trailingComma } = expandCol6(
          trimmed,
          pending.r1.letters,
          no,
        );
        logJoin(
          `join region1 column-6 lines ${pending.startLine}-${no}: appended ${codes.join(',')} → [${pending.r1.letterDigitCodes.concat(codes).join(', ')}]`,
        );
        pending.r1.letterDigitCodes.push(...codes);
        if (trailingComma) {
          pending = {
            kind: 'region1Col6',
            r1: pending.r1,
            startLine: pending.startLine,
          };
        } else {
          pending = null;
        }
        continue;
      }

      if (pending.kind === 'region2Name') {
        const cont = trimmed;
        // Soft-break region2 names without a leading hyphen do not occur;
        // require a leading hyphen so a misclassified line fails loudly.
        if (!cont.startsWith('-')) {
          fail(
            `line ${no}: cannot classify (expected region2 name continuation starting with -): "${text}"`,
          );
        }
        // Continuation is name-only in this PDF (suffixes already captured).
        if (/\s{2,}/.test(cont)) {
          fail(
            `line ${no}: unexpected fields on region2 name continuation: "${text}"`,
          );
        }
        const { joined, keptHyphen } = joinHyphen(pending.r2.name, cont);
        logJoin(
          `join region2 name lines ${pending.startLine}-${no}: "${pending.r2.name}" + "${cont}" → "${joined}" (hyphen ${keptHyphen ? 'kept' : 'dropped'})`,
        );
        pending.r2.name = joined;
        pending.r2.kind = kindOf(joined);
        pending = null;
        continue;
      }

      if (pending.kind === 'region2Suffixes') {
        const { suffixes, trailingComma } = parseSuffixList(trimmed);
        logJoin(
          `join region2 suffixes lines ${pending.startLine}-${no}: appended ${suffixes.join(',')} → [${pending.r2.suffixes.concat(suffixes).join(', ')}]`,
        );
        pending.r2.suffixes.push(...suffixes);
        if (trailingComma) {
          pending = {
            kind: 'region2Suffixes',
            r2: pending.r2,
            startLine: pending.startLine,
          };
        } else {
          pending = null;
        }
        continue;
      }
    }

    // Voivodeship header row.
    const voivMatch = VOIV_RE.exec(trimmed);
    if (voivMatch !== null) {
      const ordinal = Number(
        expectDefined(voivMatch[1], 'voivodeship ordinal', no),
      );
      const namePart = expectDefined(voivMatch[2], 'voivodeship name', no);
      const lettersText = expectDefined(
        voivMatch[3],
        'voivodeship column-4 letters',
        no,
      );
      const col6Text = expectDefined(
        voivMatch[4],
        'voivodeship column-6 codes',
        no,
      );
      const letters = parseLetters(lettersText);
      const { codes, trailingComma } = expandCol6(col6Text, letters, no);
      const r1: MutableRegion1 = {
        country: 'PL',
        ordinal,
        name: namePart,
        nameEn: { value: '', origin: 'unofficial' },
        letters,
        letterDigitCodes: codes,
        column4Text: column4Text(letters),
      };
      region1.push(r1);
      current = r1;
      if (namePart.endsWith('-')) {
        pending = { kind: 'region1Name', r1, startLine: no };
      } else if (trailingComma) {
        pending = { kind: 'region1Col6', r1, startLine: no };
      }
      continue;
    }

    // Region2 row: name + 2+ spaces + column-4/suffixes.
    if (current === null) {
      fail(`line ${no}: cannot classify (no current voivodeship): "${text}"`);
    }
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length !== 2) {
      fail(`line ${no}: cannot classify: "${text}"`);
    }
    const name = expectDefined(parts[0], 'region2 name', no);
    const remainder = expectDefined(
      parts[1],
      'region2 column-4/suffixes remainder',
      no,
    );
    let suffixText: string;
    try {
      suffixText = stripColumn4(
        remainder,
        current.letters,
        current.column4Text,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fail(`line ${no}: ${msg}`);
    }
    if (suffixText.length === 0) {
      fail(`line ${no}: missing suffixes after column 4: "${text}"`);
    }
    const { suffixes, trailingComma } = parseSuffixList(suffixText);
    const r2: MutableRegion2 = {
      country: 'PL',
      region1Letter: expectDefined(
        current.letters[0],
        'primary letter of current voivodeship',
        no,
      ),
      name,
      kind: kindOf(name),
      suffixes,
      ordinal: current.ordinal,
    };
    region2.push(r2);
    if (name.endsWith('-')) {
      pending = { kind: 'region2Name', r2, startLine: no };
    } else if (trailingComma) {
      pending = { kind: 'region2Suffixes', r2, startLine: no };
    }
  }

  if (pending !== null) {
    fail(`unfinished continuation at end of Annex 13 (${pending.kind})`);
  }

  return { region1, region2 };
}

function finaliseRegion1(r1: MutableRegion1): Region1 {
  const name = r1.name.toLocaleLowerCase('pl') as Lowercase<string>;
  const en = ENGLISH_NAMES[name];
  if (en === undefined) {
    fail(`no English name for voivodeship "${name}"`);
  }
  const primary = expectDefined(
    r1.letters[0],
    `primary letter for voivodeship ordinal ${r1.ordinal}`,
  );
  const letters: Region1['letters'] =
    r1.letters.length === 1
      ? [primary]
      : [
          primary,
          expectDefined(
            r1.letters[1],
            `secondary letter for voivodeship ordinal ${r1.ordinal}`,
          ),
        ];
  return {
    country: 'PL',
    ordinal: r1.ordinal,
    name,
    nameEn: { value: en, origin: 'unofficial' },
    letters,
    letterDigitCodes: r1.letterDigitCodes,
  };
}

function finaliseRegion2(r2: MutableRegion2): Region2 {
  if (r2.suffixes.length < 1) {
    fail(`region2 ${r2.region1Letter}:${r2.name} has no suffixes`);
  }
  return {
    country: 'PL',
    region1Letter: r2.region1Letter,
    name: r2.name,
    kind: r2.kind,
    suffixes: r2.suffixes as [string, ...string[]],
  };
}

function applyPatches(region1: readonly Region1[], region2: Region2[]): void {
  const amendmentActs = PROVENANCE.sources.slice(1).map((s) => s.act);
  let patchActIndex = 0;

  for (const patch of PATCHES) {
    while (
      patchActIndex < amendmentActs.length &&
      amendmentActs[patchActIndex] !== patch.act
    ) {
      patchActIndex++;
    }
    if (amendmentActs[patchActIndex] !== patch.act) {
      fail(
        `patch act ${patch.act} is not among provenance amendment sources or is out of order`,
      );
    }

    const r1 = region1.find((r) => r.ordinal === patch.ordinal);
    if (r1 === undefined) {
      fail(
        `patch ${patch.provision}: no region1 with ordinal ${patch.ordinal}`,
      );
    }
    const matches = region2.filter(
      (r) => r.region1Letter === r1.letters[0] && r.name === patch.region2,
    );
    if (matches.length !== 1) {
      fail(
        `patch ${patch.provision}: expected exactly one row ${r1.letters[0]}:${patch.region2}, found ${matches.length}`,
      );
    }
    const row = expectDefined(
      matches[0],
      `region2 row ${r1.letters[0]}:${patch.region2} for patch ${patch.provision}`,
    );
    const last = expectDefined(
      row.suffixes[row.suffixes.length - 1],
      `last suffix of ${row.region1Letter}:${row.name} for patch ${patch.provision}`,
    );
    if (last !== patch.after) {
      fail(
        `patch ${patch.provision}: anchor "${patch.after}" is not the last suffix of ${row.region1Letter}:${row.name} (last is "${last}")`,
      );
    }
    for (const s of patch.add) {
      if (row.suffixes.includes(s)) {
        fail(
          `patch ${patch.provision}: suffix "${s}" already present on ${row.region1Letter}:${row.name}`,
        );
      }
    }
    // Rebuild the tuple so the type stays a non-empty suffix list.
    const next = [...row.suffixes, ...patch.add] as [string, ...string[]];
    const idx = region2.indexOf(row);
    region2[idx] = { ...row, suffixes: next };
  }
}

function assertTotals(
  region1: readonly Region1[],
  region2: readonly Region2[],
): void {
  if (region1.length !== 16) {
    fail(`expected 16 region1, got ${region1.length}`);
  }
  if (region2.length !== 380) {
    fail(`expected 380 region2, got ${region2.length}`);
  }
  for (let i = 0; i < 16; i++) {
    const r1 = expectDefined(region1[i], `region1 at index ${i}`);
    if (r1.ordinal !== i + 1) {
      fail(`region1[${i}] ordinal is ${r1.ordinal}, expected ${i + 1}`);
    }
  }
  const usedEn = new Set(region1.map((r) => r.name));
  for (const key of Object.keys(ENGLISH_NAMES)) {
    if (!usedEn.has(key as Lowercase<string>)) {
      fail(`unused English name entry: "${key}"`);
    }
  }
}

function serializeRegistry(registry: Registry): string {
  // Build the object literal by hand so key order is fixed and deterministic.
  const lines: string[] = [];
  lines.push('{');
  lines.push('  provenance: {');
  lines.push(
    `    legalStateDate: ${JSON.stringify(registry.provenance.legalStateDate)},`,
  );
  lines.push('    sources: [');
  for (const s of registry.provenance.sources) {
    lines.push(
      `      { act: ${JSON.stringify(s.act)}, provision: ${JSON.stringify(s.provision)} },`,
    );
  }
  lines.push('    ],');
  lines.push('  },');
  lines.push('  region1: [');
  for (const r of registry.region1) {
    const letters =
      r.letters.length === 1
        ? `[${JSON.stringify(r.letters[0])}]`
        : `[${JSON.stringify(r.letters[0])}, ${JSON.stringify(r.letters[1])}]`;
    const codes = `[${r.letterDigitCodes.map((c) => JSON.stringify(c)).join(', ')}]`;
    lines.push('    {');
    lines.push(`      country: 'PL',`);
    lines.push(`      ordinal: ${r.ordinal},`);
    lines.push(`      name: ${JSON.stringify(r.name)},`);
    lines.push(
      `      nameEn: { value: ${JSON.stringify(r.nameEn.value)}, origin: 'unofficial' },`,
    );
    lines.push(`      letters: ${letters},`);
    lines.push(`      letterDigitCodes: ${codes},`);
    lines.push('    },');
  }
  lines.push('  ],');
  lines.push('  region2: [');
  for (const r of registry.region2) {
    const suffixes = `[${r.suffixes.map((s) => JSON.stringify(s)).join(', ')}]`;
    lines.push('    {');
    lines.push(`      country: 'PL',`);
    lines.push(`      region1Letter: ${JSON.stringify(r.region1Letter)},`);
    lines.push(`      name: ${JSON.stringify(r.name)},`);
    lines.push(`      kind: ${JSON.stringify(r.kind)},`);
    lines.push(`      suffixes: ${suffixes},`);
    lines.push('    },');
  }
  lines.push('  ],');
  lines.push('}');
  return lines.join('\n');
}

async function writeRegistry(registry: Registry): Promise<void> {
  // Blank line after the header so perfectionist/sort-imports does not treat it as
  // a leading comment of the first import (D-49).
  const header =
    [
      '// Generated by libs/plate-data/scripts/import-annex-13.mts — do not edit by hand.',
      '// Source: Annex 13 to Dz.U. 2024 poz. 1709 with the amendments listed in provenance.sources (D-26).',
      '// Regenerate:',
      '//   pdftotext -layout D20241709.pdf tmp/D20241709.txt',
      '//   node libs/plate-data/scripts/import-annex-13.mts tmp/D20241709.txt',
    ].join('\n') + '\n\n';

  const body =
    `import type { Registry } from './model';\n\n` +
    `/**\n` +
    ` * Current Annex 13 registration codes for Poland (Dz.U. 2024 poz. 1709 as amended).\n` +
    ` * Generated; do not edit by hand. \`provenance.sources\` is the base act then amendments\n` +
    ` * in apply order (D-26). Distinguishers: § 31 ust. 2 (R-37). Column roles:\n` +
    ` * Annex 13 table header (R-48).\n` +
    ` */\n` +
    `export const registry = ${serializeRegistry(registry)} as const satisfies Registry;\n`;

  const source = header + body;
  const config = await resolveConfig(OUT_PATH, { editorconfig: true });
  const formatted = await format(source, {
    ...config,
    filepath: OUT_PATH,
  });
  writeFileSync(OUT_PATH, formatted, 'utf8');
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (inputPath === undefined) {
    fail(
      'usage: node libs/plate-data/scripts/import-annex-13.mts <pdftotext-layout.txt>',
    );
  }
  const text = readFileSync(resolve(inputPath), 'utf8');
  const parsed = parseAnnex(text);
  const region1 = parsed.region1.map(finaliseRegion1);
  // Keep mutable copies for patching (suffixes are rebuilt in place).
  const region2Mutable: Region2[] = parsed.region2.map(finaliseRegion2);
  applyPatches(region1, region2Mutable);
  assertTotals(region1, region2Mutable);

  const registry: Registry = {
    provenance: PROVENANCE,
    region1,
    region2: region2Mutable,
  };
  await writeRegistry(registry);
  process.stderr.write(
    `wrote ${region1.length} region1 and ${region2Mutable.length} region2 to ${OUT_PATH}\n`,
  );
}

await main();
