import { PLATE_ALPHABET } from './alphabet';
import { mergePlateTypes, type PlateTypes } from './plate-type';

/**
 * Vehicle-part (serial) templates from § 30 ust. 2 Dz.U. 2024 poz. 1709 (R-24–R-33).
 * Layout notation: D = digit, L = letter.
 */

/** Row ID in docs/pl-plate-rules.md (D-33). */
export type RuleRowId = `R-${string}`;

export interface VehiclePartTemplate {
  /** D = digit, L = letter. */
  readonly layout: string;
  /** § 25 types a plate with this layout can be (D-34). */
  readonly plateTypes: PlateTypes;
  readonly source: string;
  readonly rows: readonly [RuleRowId, ...RuleRowId[]];
}

export interface CompiledTemplate {
  readonly template: VehiclePartTemplate;
  readonly pattern: RegExp;
}

/** After a column-4 letter only (reduced, diplomatic). */
export const COLUMN_4_TEMPLATES: readonly VehiclePartTemplate[] = [
  {
    layout: 'DDD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. a',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DDL',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. b',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DLD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. c',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'LDD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. d',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DLL',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. e',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'LLD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. f',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'LDL',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. g',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DDDDDD',
    plateTypes: ['diplomatic'],
    source: '§ 30 ust. 2 pkt 7',
    rows: ['R-33'],
  },
];

/**
 * After a column-4 letter + column-5 suffix.
 * Index 1 = one-letter suffix (full code length 2); index 2 = two-letter suffix (full code length 3).
 */
export const COLUMN_4_5_TEMPLATES: {
  readonly 1: readonly VehiclePartTemplate[];
  readonly 2: readonly VehiclePartTemplate[];
} = {
  1: [
    {
      layout: 'DDDDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 1',
      rows: ['R-24'],
    },
    {
      layout: 'DDDDL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 2',
      rows: ['R-24'],
    },
    {
      layout: 'DDDLL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 3',
      rows: ['R-24'],
    },
    {
      layout: 'DLDDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 4',
      rows: ['R-24'],
    },
    {
      layout: 'DLLDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 5',
      rows: ['R-24'],
    },
    {
      layout: 'DDDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 1',
      rows: ['R-27'],
    },
    {
      layout: 'DDDL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 2',
      rows: ['R-27'],
    },
    {
      layout: 'DDLD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 3',
      rows: ['R-27'],
    },
    {
      layout: 'DLDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 4',
      rows: ['R-27'],
    },
    {
      layout: 'LDDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 5',
      rows: ['R-27'],
    },
    {
      layout: 'DDLL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 6',
      rows: ['R-27'],
    },
    {
      layout: 'DLLD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 7',
      rows: ['R-27'],
    },
    {
      layout: 'LLDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 8',
      rows: ['R-27'],
    },
    {
      layout: 'DDL',
      plateTypes: ['vintage'],
      source: '§ 30 ust. 2 pkt 5 lit. a tiret 1',
      rows: ['R-30', 'R-45'],
    },
    {
      layout: 'DDD',
      plateTypes: ['vintage'],
      source: '§ 30 ust. 2 pkt 5 lit. a tiret 2',
      rows: ['R-30', 'R-45'],
    },
  ],
  2: [
    {
      layout: 'LDDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 1',
      rows: ['R-25'],
    },
    {
      layout: 'DDLL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 2',
      rows: ['R-25'],
    },
    {
      layout: 'DLDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 3',
      rows: ['R-25'],
    },
    {
      layout: 'DDLD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 4',
      rows: ['R-25'],
    },
    {
      layout: 'DLLD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 5',
      rows: ['R-25'],
    },
    {
      layout: 'LLDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 6',
      rows: ['R-25'],
    },
    {
      layout: 'DDDDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 7',
      rows: ['R-25'],
    },
    {
      layout: 'DDDDL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 8',
      rows: ['R-25'],
    },
    {
      layout: 'DDDLL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 9',
      rows: ['R-25'],
    },
    {
      layout: 'LDDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 1',
      rows: ['R-28'],
    },
    {
      layout: 'DDLL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 2',
      rows: ['R-28'],
    },
    {
      layout: 'DLDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 3',
      rows: ['R-28'],
    },
    {
      layout: 'DDLD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 4',
      rows: ['R-28'],
    },
    {
      layout: 'DLLD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 5',
      rows: ['R-28'],
    },
    {
      layout: 'LLDD',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 6',
      rows: ['R-28'],
    },
    {
      layout: 'LDDL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 7',
      rows: ['R-28'],
    },
    {
      layout: 'LDLL',
      plateTypes: ['ordinary'],
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 8',
      rows: ['R-28'],
    },
    {
      layout: 'DL',
      plateTypes: ['vintage'],
      source: '§ 30 ust. 2 pkt 5 lit. b tiret 1',
      rows: ['R-31', 'R-45'],
    },
    {
      layout: 'DD',
      plateTypes: ['vintage'],
      source: '§ 30 ust. 2 pkt 5 lit. b tiret 2',
      rows: ['R-31', 'R-45'],
    },
    {
      layout: 'LD',
      plateTypes: ['vintage'],
      source: '§ 30 ust. 2 pkt 5 lit. b tiret 3',
      rows: ['R-31', 'R-45'],
    },
  ],
};

/** After a column-6 letter+digit code (temporary, individual). */
export const COLUMN_6_TEMPLATES: readonly VehiclePartTemplate[] = [
  {
    layout: 'DDDD',
    plateTypes: ['temporary'],
    source: '§ 30 ust. 2 pkt 6',
    rows: ['R-32', 'R-46'],
  },
  {
    layout: 'DDDL',
    plateTypes: ['temporary'],
    source: '§ 30 ust. 2 pkt 6 — po wyczerpaniu',
    rows: ['R-32', 'R-46'],
  },
  {
    layout: 'LLLLL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 1',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLLD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 2',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLDL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 3',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLDD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 4',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 5',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 6',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLDL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 7',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLDD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 8',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 9',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 10',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LDL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 11',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LDD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 12',
    rows: ['R-29', 'R-44'],
  },
];

// § 31 ust. 1 (R-36) excludes B, D, I, O, Z from the vehicle part «z zastrzeżeniem § 32 ust. 2» (R-39): individual plates are exempt.
const EXCLUDED_VEHICLE_LETTERS = new Set(['B', 'D', 'I', 'O', 'Z']);
const ALL_LETTERS = [...PLATE_ALPHABET].filter((c) => /[A-Z]/.test(c));
const STANDARD_LETTERS = ALL_LETTERS.filter(
  (c) => !EXCLUDED_VEHICLE_LETTERS.has(c),
);

function compileLayout(layout: string, individual: boolean): RegExp {
  const letterClass = `[${(individual ? ALL_LETTERS : STANDARD_LETTERS).join('')}]`;
  // Always an array (unlike match); layouts are non-empty D/L runs.
  const runs = layout.split(/(?<=D)(?=L)|(?<=L)(?=D)/);
  let pattern = '^';
  for (const run of runs) {
    const length = run.length;
    if (run.startsWith('D')) {
      // Ranges «od 0…01» in § 30 ust. 2 (R-34) — a digit group may not be all zeros (except individuals).
      pattern += individual
        ? `\\d{${length}}`
        : `(?!0{${length}})\\d{${length}}`;
    } else {
      pattern += `${letterClass}{${length}}`;
    }
  }
  return new RegExp(`${pattern}$`);
}

function compileGroup(
  templates: readonly VehiclePartTemplate[],
): readonly CompiledTemplate[] {
  return templates.map((template) => ({
    template,
    pattern: compileLayout(
      template.layout,
      template.plateTypes.includes('individual'),
    ),
  }));
}

export const COLUMN_4_GROUP: readonly CompiledTemplate[] =
  compileGroup(COLUMN_4_TEMPLATES);

export const COLUMN_4_5_GROUPS: {
  readonly 1: readonly CompiledTemplate[];
  readonly 2: readonly CompiledTemplate[];
} = {
  1: compileGroup(COLUMN_4_5_TEMPLATES[1]),
  2: compileGroup(COLUMN_4_5_TEMPLATES[2]),
};

export const COLUMN_6_GROUP: readonly CompiledTemplate[] =
  compileGroup(COLUMN_6_TEMPLATES);

/** Plate types of every template in `group` matching `vehiclePart`, or undefined when none matches. */
export function plateTypesOf(
  group: readonly CompiledTemplate[],
  vehiclePart: string,
): PlateTypes | undefined {
  const matched = group
    .filter(({ pattern }) => pattern.test(vehiclePart))
    .map(({ template }) => template.plateTypes);
  if (matched.length === 0) {
    return undefined;
  }
  const [first, ...rest] = matched;
  return mergePlateTypes(first, ...rest);
}
