import { PLATE_ALPHABET } from './alphabet';

/**
 * Vehicle-part (serial) templates from § 30 ust. 2 Dz.U. 2024 poz. 1709.
 * Layout notation: D = digit, L = letter.
 * Plate type / family is internal (#38 decides the public type).
 */

export type PlateFamily =
  | 'ordinary'
  | 'motorcycle-moped'
  | 'vintage'
  | 'reduced'
  | 'diplomatic'
  | 'temporary'
  | 'individual';

export interface VehiclePartTemplate {
  readonly family: PlateFamily;
  /** D = digit, L = letter. */
  readonly layout: string;
  readonly source: string;
}

/** After a column-4 letter only (reduced, diplomatic). */
export const COLUMN_4_TEMPLATES: readonly VehiclePartTemplate[] = [
  { family: 'reduced', layout: 'DDD', source: '§ 30 ust. 2 pkt 2 lit. a' },
  { family: 'reduced', layout: 'DDL', source: '§ 30 ust. 2 pkt 2 lit. b' },
  { family: 'reduced', layout: 'DLD', source: '§ 30 ust. 2 pkt 2 lit. c' },
  { family: 'reduced', layout: 'LDD', source: '§ 30 ust. 2 pkt 2 lit. d' },
  { family: 'reduced', layout: 'DLL', source: '§ 30 ust. 2 pkt 2 lit. e' },
  { family: 'reduced', layout: 'LLD', source: '§ 30 ust. 2 pkt 2 lit. f' },
  { family: 'reduced', layout: 'LDL', source: '§ 30 ust. 2 pkt 2 lit. g' },
  { family: 'diplomatic', layout: 'DDDDDD', source: '§ 30 ust. 2 pkt 7' },
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
      family: 'ordinary',
      layout: 'DDDDD',
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 1',
    },
    {
      family: 'ordinary',
      layout: 'DDDDL',
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 2',
    },
    {
      family: 'ordinary',
      layout: 'DDDLL',
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 3',
    },
    {
      family: 'ordinary',
      layout: 'DLDDD',
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 4',
    },
    {
      family: 'ordinary',
      layout: 'DLLDD',
      source: '§ 30 ust. 2 pkt 1 lit. a tiret 5',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DDDD',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 1',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DDDL',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 2',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DDLD',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 3',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DLDD',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 4',
    },
    {
      family: 'motorcycle-moped',
      layout: 'LDDD',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 5',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DDLL',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 6',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DLLD',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 7',
    },
    {
      family: 'motorcycle-moped',
      layout: 'LLDD',
      source: '§ 30 ust. 2 pkt 3 lit. a tiret 8',
    },
    {
      family: 'vintage',
      layout: 'DDL',
      source: '§ 30 ust. 2 pkt 5 lit. a tiret 1',
    },
    {
      family: 'vintage',
      layout: 'DDD',
      source: '§ 30 ust. 2 pkt 5 lit. a tiret 2',
    },
  ],
  2: [
    {
      family: 'ordinary',
      layout: 'LDDD',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 1',
    },
    {
      family: 'ordinary',
      layout: 'DDLL',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 2',
    },
    {
      family: 'ordinary',
      layout: 'DLDD',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 3',
    },
    {
      family: 'ordinary',
      layout: 'DDLD',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 4',
    },
    {
      family: 'ordinary',
      layout: 'DLLD',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 5',
    },
    {
      family: 'ordinary',
      layout: 'LLDD',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 6',
    },
    {
      family: 'ordinary',
      layout: 'DDDDD',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 7',
    },
    {
      family: 'ordinary',
      layout: 'DDDDL',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 8',
    },
    {
      family: 'ordinary',
      layout: 'DDDLL',
      source: '§ 30 ust. 2 pkt 1 lit. b tiret 9',
    },
    {
      family: 'motorcycle-moped',
      layout: 'LDDD',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 1',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DDLL',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 2',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DLDD',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 3',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DDLD',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 4',
    },
    {
      family: 'motorcycle-moped',
      layout: 'DLLD',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 5',
    },
    {
      family: 'motorcycle-moped',
      layout: 'LLDD',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 6',
    },
    {
      family: 'motorcycle-moped',
      layout: 'LDDL',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 7',
    },
    {
      family: 'motorcycle-moped',
      layout: 'LDLL',
      source: '§ 30 ust. 2 pkt 3 lit. b tiret 8',
    },
    {
      family: 'vintage',
      layout: 'DL',
      source: '§ 30 ust. 2 pkt 5 lit. b tiret 1',
    },
    {
      family: 'vintage',
      layout: 'DD',
      source: '§ 30 ust. 2 pkt 5 lit. b tiret 2',
    },
    {
      family: 'vintage',
      layout: 'LD',
      source: '§ 30 ust. 2 pkt 5 lit. b tiret 3',
    },
  ],
};

/** After a column-6 letter+digit code (temporary, individual). */
export const COLUMN_6_TEMPLATES: readonly VehiclePartTemplate[] = [
  { family: 'temporary', layout: 'DDDD', source: '§ 30 ust. 2 pkt 6' },
  {
    family: 'temporary',
    layout: 'DDDL',
    source: '§ 30 ust. 2 pkt 6 — po wyczerpaniu',
  },
  {
    family: 'individual',
    layout: 'LLLLL',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 1',
  },
  {
    family: 'individual',
    layout: 'LLLLD',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 2',
  },
  {
    family: 'individual',
    layout: 'LLLDL',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 3',
  },
  {
    family: 'individual',
    layout: 'LLLDD',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 4',
  },
  {
    family: 'individual',
    layout: 'LLLL',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 5',
  },
  {
    family: 'individual',
    layout: 'LLLD',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 6',
  },
  {
    family: 'individual',
    layout: 'LLDL',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 7',
  },
  {
    family: 'individual',
    layout: 'LLDD',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 8',
  },
  {
    family: 'individual',
    layout: 'LLL',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 9',
  },
  {
    family: 'individual',
    layout: 'LLD',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 10',
  },
  {
    family: 'individual',
    layout: 'LDL',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 11',
  },
  {
    family: 'individual',
    layout: 'LDD',
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 12',
  },
];

// § 31 ust. 1 excludes B, D, I, O, Z from the vehicle part; § 32 ust. 2
// (as amended by Dz.U. 2025 poz. 939 § 1 pkt 3) lifts that for individual plates.
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
      // Ranges «od 0…01» — a digit group may not be all zeros (except individuals).
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
): readonly RegExp[] {
  return templates.map((template) =>
    compileLayout(template.layout, template.family === 'individual'),
  );
}

export const COLUMN_4_PATTERNS: readonly RegExp[] =
  compileGroup(COLUMN_4_TEMPLATES);

export const COLUMN_4_5_PATTERNS: {
  readonly 1: readonly RegExp[];
  readonly 2: readonly RegExp[];
} = {
  1: compileGroup(COLUMN_4_5_TEMPLATES[1]),
  2: compileGroup(COLUMN_4_5_TEMPLATES[2]),
};

export const COLUMN_6_PATTERNS: readonly RegExp[] =
  compileGroup(COLUMN_6_TEMPLATES);

export function matchesTemplate(
  patterns: readonly RegExp[],
  vehiclePart: string,
): boolean {
  return patterns.some((pattern) => pattern.test(vehiclePart));
}
