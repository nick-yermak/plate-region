import {
  COLUMN_4_5_TEMPLATES,
  COLUMN_4_TEMPLATES,
  COLUMN_6_TEMPLATES,
  type VehiclePartTemplate,
} from './vehicle-part-templates';

/** Literal table in plan §3 order, grouped by distinguisher. */
const EXPECTED_TEMPLATES: readonly VehiclePartTemplate[] = [
  // Column 4
  { family: 'reduced', layout: 'DDD', source: '§ 30 ust. 2 pkt 2 lit. a' },
  { family: 'reduced', layout: 'DDL', source: '§ 30 ust. 2 pkt 2 lit. b' },
  { family: 'reduced', layout: 'DLD', source: '§ 30 ust. 2 pkt 2 lit. c' },
  { family: 'reduced', layout: 'LDD', source: '§ 30 ust. 2 pkt 2 lit. d' },
  { family: 'reduced', layout: 'DLL', source: '§ 30 ust. 2 pkt 2 lit. e' },
  { family: 'reduced', layout: 'LLD', source: '§ 30 ust. 2 pkt 2 lit. f' },
  { family: 'reduced', layout: 'LDL', source: '§ 30 ust. 2 pkt 2 lit. g' },
  { family: 'diplomatic', layout: 'DDDDDD', source: '§ 30 ust. 2 pkt 7' },
  // Full code length 2
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
  // Full code length 3
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
  // Column 6
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

describe('vehicle-part-templates', () => {
  it('has exactly 57 templates matching the § 30 ust. 2 table in plan order', () => {
    const all = [
      ...COLUMN_4_TEMPLATES,
      ...COLUMN_4_5_TEMPLATES[1],
      ...COLUMN_4_5_TEMPLATES[2],
      ...COLUMN_6_TEMPLATES,
    ];

    expect(all).toHaveLength(57);
    expect(all).toEqual(EXPECTED_TEMPLATES);
  });
});
